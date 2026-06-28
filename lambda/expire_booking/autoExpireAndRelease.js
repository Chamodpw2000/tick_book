import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || "us-east-1" });


const EXPIRE_BOOKING_LAMBDA_ARN = process.env.EXPIRE_BOOKING_LAMBDA_ARN || "arn:aws:lambda:us-east-1:123456789012:function:expireBooking";
const GET_INVENTORY_HOLDS_LAMBDA_ARN = process.env.GET_INVENTORY_HOLDS_LAMBDA_ARN || "arn:aws:lambda:us-east-1:123456789012:function:getInventoryHolds";
const RELEASE_INVENTORY_LAMBDA_ARN = process.env.RELEASE_INVENTORY_LAMBDA_ARN || "arn:aws:lambda:us-east-1:123456789012:function:releaseInventory";

const invokeLambda = async (arn, payload) => {
  const command = new InvokeCommand({
    FunctionName: arn,
    Payload: Buffer.from(JSON.stringify(payload)),
  });

  const response = await lambdaClient.send(command);

  if (response.FunctionError) {
    throw new Error(`Lambda invocation failed with error: ${response.FunctionError}`);
  }

  if (response.Payload) {
    const resultString = Buffer.from(response.Payload).toString('utf-8');
    return JSON.parse(resultString);
  }

  return null;
};

/**
 * Auto Expire & Release Cron Lambda
 * 
 * To be triggered every minute (e.g. via AWS EventBridge Scheduled Rule).
 * 
 * Flow:
 * 1. Invokes the expireBooking Lambda via AWS SDK.
 * 2. For each expired booking, invokes the getInventoryHolds Lambda.
 * 3. For each booking's holds, invokes the releaseInventory Lambda.
 */
export const handler = async (event) => {
  try {
    // 1. Expire stale bookings
    let expireData;
    try {
      expireData = await invokeLambda(EXPIRE_BOOKING_LAMBDA_ARN, {});
    } catch (e) {
      throw new Error(`Failed to invoke expireBooking lambda: ${e.message}`);
    }

    const expiredBookingIds = expireData?.expiredBookingIds || [];

    if (expiredBookingIds.length === 0) {
      console.log("[AutoExpire] No stale bookings found to expire.");
      return { message: "No stale bookings found", expiredBookingsCount: 0, releasedHoldsCount: 0 };
    }

    console.log(`[AutoExpire] Successfully expired ${expiredBookingIds.length} bookings: [${expiredBookingIds.join(", ")}]`);

    let totalReleasedHolds = 0;

    // 2 & 3. Fetch and release inventory holds for each expired booking
    for (const bookingId of expiredBookingIds) {
      try {
        // Fetch holds
        const holdsData = await invokeLambda(GET_INVENTORY_HOLDS_LAMBDA_ARN, { bookingId });
        const holdIds = Array.isArray(holdsData?.holdIds) ? holdsData.holdIds : [];

        if (holdIds.length === 0) {
          console.log(`[AutoExpire] No active inventory holds found for booking ${bookingId}`);
          continue;
        }

        // Release holds
        console.log(`[AutoExpire] Releasing hold IDs [${holdIds.join(", ")}] for booking ${bookingId}`);
        const releaseData = await invokeLambda(RELEASE_INVENTORY_LAMBDA_ARN, { holdIds });

        const releasedCount = releaseData?.releasedCount ?? (releaseData?.holds ? releaseData.holds.length : 0);
        totalReleasedHolds += releasedCount;
        console.log(`[AutoExpire] Successfully released ${releasedCount} holds for booking ${bookingId}`);
      } catch (innerError) {
        console.error(`[AutoExpire] Unexpected error processing booking ${bookingId}: ${innerError.message}`);
      }
    }

    return {
      message: "Cron execution completed successfully via AWS Lambda invocations",
      expiredBookingsCount: expiredBookingIds.length,
      releasedHoldsCount: totalReleasedHolds,
    };
  } catch (error) {
    console.error(`[AutoExpire] Fatal Error: ${error.message}`);
    throw new Error(`[AutoExpire] ${error.message}`);
  }
};
