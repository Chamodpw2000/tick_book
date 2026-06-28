import express from "express";
import "dotenv/config";
import { connectPrisma ,  disconnectPrisma } from "./lib/prismaClient.js";
import cors from "cors";
import paymentsRouter from "./routes/paymentsRoutes.js";

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
	res.status(200).json({ service: "payment_service", status: "ok" });
});

app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the Payment Service!" });
});

app.use("/payments", paymentsRouter);






const startServer = async () => {
	try {
		console.log("Starting payment_service...");
		await connectPrisma();
		console.log("Database connected");

		app.listen(PORT, () => {
			console.log(`payment_service running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start payment_service", error);
		process.exit(1);
	}
};

startServer();
const shutdown = async () => {
    await disconnectPrisma();
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

