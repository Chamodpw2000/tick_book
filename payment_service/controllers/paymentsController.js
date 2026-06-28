import { prisma } from "../lib/prismaClient.js";
import {
  SFNClient,
  StartExecutionCommand,
  StartSyncExecutionCommand,
} from "@aws-sdk/client-sfn";

const getAwsClientConfig = () => {
  const region = process.env.AWS_REGION || "us-east-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  return {
    region,
    ...(accessKeyId && secretAccessKey
      ? {
          credentials: {
            accessKeyId,
            secretAccessKey,
            ...(sessionToken ? { sessionToken } : {}),
          },
        }
      : {}),
  };
};

const sfnClient = new SFNClient(getAwsClientConfig());

const parsePositiveInt = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const isStepFunctionsStateMachineArn = (value) => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  // Expected: arn:aws:states:<region>:<accountId>:stateMachine:<name>
  // (also supports aws-us-gov / aws-cn partitions)
  const arnPattern = /^arn:(aws|aws-us-gov|aws-cn):states:[a-z0-9-]+:\d{12}:stateMachine:[A-Za-z0-9-_]+$/;
  return arnPattern.test(trimmed);
};

const isSyncExecutionNotSupportedError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  const name = String(error?.name || error?.Code || "");
  return (
    message.includes("operation is not supported") ||
    message.includes("not supported by this type of state machine") ||
    name.includes("StateMachineTypeNotSupported")
  );
};

const validateMakePaymentSagaPayload = (payload) => {
  const { bookingId, paymentMethod, providerName } = payload ?? {};

  const parsedBookingId = parsePositiveInt(bookingId);
  if (!parsedBookingId) return "bookingId must be a positive integer";

  if (!paymentMethod || typeof paymentMethod !== "string" || !paymentMethod.trim()) {
    return "paymentMethod is required";
  }

  if (!providerName || typeof providerName !== "string" || !providerName.trim()) {
    return "providerName is required";
  }

  return null;
};

const buildMakePaymentSagaInput = (payload) => {
  const {
    bookingId,
    paymentMethod,
    providerName,
    providerReference,
    transactionType,
  } = payload;

  return {
    bookingId: parsePositiveInt(bookingId),
    paymentMethod: paymentMethod.trim(),
    providerName: providerName.trim(),
    providerReference:
      typeof providerReference === "string" && providerReference.trim() ? providerReference.trim() : undefined,
    transactionType:
      typeof transactionType === "string" && transactionType.trim() ? transactionType.trim() : undefined,
  };
};

const startSagaAsync = async ({ stateMachineArn, sagaInput, executionName }) => {
  const command = new StartExecutionCommand({
    stateMachineArn,
    input: JSON.stringify(sagaInput),
    name: executionName,
  });

  return sfnClient.send(command);
};

const startSagaSync = async ({ stateMachineArn, sagaInput, executionName }) => {
  const command = new StartSyncExecutionCommand({
    stateMachineArn,
    input: JSON.stringify(sagaInput),
    name: executionName,
  });

  return sfnClient.send(command);
};


export const createPayment = async (req, res) => {
  const {
    bookingId,
    userId,
    eventId,
    amount,
    currency,
    paymentMethod,
    providerName,
    providerReference,
    transactionType,
  } = req.body;

  if (
    !bookingId ||
    !userId ||
    !eventId ||
    amount === undefined ||
    !currency ||
    !paymentMethod ||
    !providerName
  ) {
    return res.status(400).json({
      message:
        "bookingId, userId, eventId, amount, currency, paymentMethod, and providerName are required",
    });
  }

  const parsedBookingId = parsePositiveInt(bookingId);
  const parsedUserId = typeof userId === "string" && userId.trim().length > 0
    ? userId.trim()
    : (userId ? String(userId).trim() : null);
  const parsedEventId = parsePositiveInt(eventId);
  const parsedAmount = Number(amount);

  if (!parsedBookingId || !parsedUserId || !parsedEventId) {
    return res.status(400).json({
      message: "bookingId and eventId must be positive integers, and userId must be a non-empty string",
    });
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      message: "amount must be a positive number",
    });
  }

  try {
    const payment = await prisma.payment.create({
      data: {
        bookingId: parsedBookingId,
        userId: parsedUserId,
        eventId: parsedEventId,
        amount: parsedAmount,
        currency: currency.trim(),
        paymentMethod: paymentMethod.trim(),
        providerName: providerName.trim(),
        providerReference: providerReference?.trim() || null,
        status: "PAID",
        transactions: {
          create: {
            transactionType: transactionType?.trim() || "INITIATED",
            providerReference: providerReference?.trim() || null,
            status: "TRANSFERD",
          },
        },
      },
      include: {
        transactions: true,
        refunds: true,
      },
    });

    return res.status(201).json(payment);
  } catch (error) {
    console.error("Failed to create payment", error);
    return res.status(500).json({ message: "Failed to create payment" });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        transactions: true,
        refunds: true,
      },
    });

    return res.status(200).json(payments);
  } catch (error) {
    console.error("Failed to fetch payments", error);
    return res.status(500).json({ message: "Failed to fetch payments" });
  }
};

export const refundPayment = async (req, res) => {
  const paymentId = parsePositiveInt(req.params.paymentId);
  if (!paymentId) {
    return res.status(400).json({ message: "paymentId must be a positive integer" });
  }

  const rawReason = req.body?.reason;

  const reason =
    typeof rawReason === "string" && rawReason.trim() ? rawReason.trim().slice(0, 255) : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { refunds: true, transactions: true },
      });

      if (!payment) {
        const error = new Error("PAYMENT_NOT_FOUND");
        error.code = "PAYMENT_NOT_FOUND";
        throw error;
      }

      if ((payment.refunds?.length ?? 0) > 0) {
        return {
          payment,
          refundCreated: false,
          message: "Payment already refunded",
        };
      }

      const refundAmount = Number(payment.amount);
      if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        return {
          payment,
          refundCreated: false,
          message: "Payment amount is not refundable",
        };
      }

      const refund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          bookingId: payment.bookingId,
          amount: refundAmount,
          reason,
          status: "REFUNDED",
        },
      });

      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          transactionType: "REFUND",
          providerReference: null,
          status: "REFUNDED",
        },
      });

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
        include: { refunds: true, transactions: true },
      });

      return {
        payment: updatedPayment,
        refund,
        refundCreated: true,
      };
    });

    return res.status(result.refundCreated ? 201 : 200).json(result);
  } catch (error) {
    if (error?.code === "PAYMENT_NOT_FOUND") {
      return res.status(404).json({ message: "Payment not found" });
    }

    // If two requests refund the same payment concurrently, the DB unique constraint can throw P2002.
    // Treat that as "already refunded" and return the current payment state.
    if (error?.code === "P2002") {
      try {
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: { refunds: true, transactions: true },
        });

        if (payment) {
          return res.status(200).json({
            payment,
            refundCreated: false,
            message: "Payment already refunded",
          });
        }
      } catch {
        // fall through to generic handler
      }
    }

    console.error("Failed to refund payment", error);
    return res.status(500).json({ message: "Failed to refund payment" });
  }
};

export const startMakePaymentSaga = async (req, res) => {
  // Default to synchronous execution for EXPRESS state machines.
  // Override to async by passing ?mode=async or waitForResult=false.
  const forceAsync =
    req.query.mode === "async" ||
    req.body?.mode === "async" ||
    req.query.waitForResult === "false" ||
    req.body?.waitForResult === false;

  const stateMachineArn = process.env.STATE_MACHINE_ARN_PAYMENT?.trim();
  if (!stateMachineArn) {
    return res.status(500).json({ message: "STATE_MACHINE_ARN_PAYMENT is not configured" });
  }

  if (!isStepFunctionsStateMachineArn(stateMachineArn)) {
    return res.status(500).json({
      message:
        "STATE_MACHINE_ARN_PAYMENT must be a Step Functions state machine ARN (arn:aws:states:...:stateMachine:...), not an IAM role ARN.",
      configuredValue: stateMachineArn,
    });
  }

  const validationError = validateMakePaymentSagaPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const sagaInput = buildMakePaymentSagaInput(req.body);
    const executionName = `payment-saga-${sagaInput.bookingId}-${Date.now()}`.slice(0, 80);

    if (forceAsync) {
      const result = await startSagaAsync({ stateMachineArn, sagaInput, executionName });
      return res.status(202).json({
        message: "Saga execution started",
        executionArn: result.executionArn,
        startDate: result.startDate,
        mode: "async",
      });
    }

    let syncResult;
    try {
      syncResult = await startSagaSync({ stateMachineArn, sagaInput, executionName });
    } catch (error) {
      if (isSyncExecutionNotSupportedError(error)) {
        const result = await startSagaAsync({ stateMachineArn, sagaInput, executionName });
        return res.status(202).json({
          message:
            "State machine does not support synchronous execution (StartSyncExecution). Started saga asynchronously instead.",
          executionArn: result.executionArn,
          startDate: result.startDate,
          mode: "async",
          note: "Deploy this workflow as EXPRESS to use waitForResult=true.",
        });
      }

      throw error;
    }

    const parsedOutput = syncResult.output ? JSON.parse(syncResult.output) : null;

    if (syncResult.status !== "SUCCEEDED") {
      return res.status(500).json({
        message: "Saga execution failed",
        executionArn: syncResult.executionArn,
        status: syncResult.status,
        error: syncResult.error,
        cause: syncResult.cause,
      });
    }

    return res.status(200).json({
      message: "Saga execution completed",
      executionArn: syncResult.executionArn,
      status: syncResult.status,
      paymentId: parsedOutput?.paymentId ?? null,
      result: parsedOutput,
      mode: "sync",
    });
  } catch (error) {
    console.error("Failed to start make payment saga", error);
    return res.status(500).json({
      message: "Failed to start make payment saga",
      error: error?.message,
    });
  }
};
