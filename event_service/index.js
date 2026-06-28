import express from "express";
import "dotenv/config";
import cors from "cors";
import eventsRouter from "./routes/eventsRoutes.js";
import { connectPrisma, disconnectPrisma } from "./lib/prismaClient.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "10mb" }));

app.get("/health", (req, res) => {
	res.status(200).json({ service: "event_service", status: "ok" });
});

app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the Event Service!" });
});

app.use("/events", eventsRouter);

const startServer = async () => {
	try {
		console.log("Starting event_service...");
		await connectPrisma();
		console.log("Database connected");

		app.listen(PORT, () => {
			console.log(`event_service running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start event_service", error);
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
