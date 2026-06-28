import { Router } from "express";
import {
	createPayment,
	getPayments,
	refundPayment,
	startMakePaymentSaga,
} from "../controllers/paymentsController.js";

const paymentsRouter = Router();

paymentsRouter.post("/", createPayment);
paymentsRouter.get("/", getPayments);
paymentsRouter.post("/saga", startMakePaymentSaga);
paymentsRouter.post("/:paymentId/refunds", refundPayment);


export default paymentsRouter;