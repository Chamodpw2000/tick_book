import express from "express";
import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "./lib/mongoClient.js";
import cors from "cors";
import venuesRouter from "./routes/venuesRoutes.js";

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
	res.status(200).json({ service: "venue_service", status: "ok" });
});

app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the Venue Service!" });
});

app.use("/venues", venuesRouter);




const startServer = async () => {
	try {
		console.log("Starting venue_service...");
		await connectDatabase();
		console.log("Database connected");

		app.listen(PORT, () => {
			console.log(`venue_service running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start venue_service", error);
		process.exit(1);
	}
};

startServer();
const shutdown = async () => {
	await disconnectDatabase();
    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

