import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "./lib/mongoClient.js";
import artistsRouter from "./routes/artistsRoutes.js";

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "10mb" }));

app.get("/health", (req, res) => {
	res.status(200).json({ service: "artist_service", status: "ok" });
});

app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the Artist Service!" });
});

app.use("/artists", artistsRouter);


const startServer = async () => {
	try {
		console.log("Starting artist_service...");
		await connectDatabase();
		console.log("Database connected");

		app.listen(PORT, () => {
			console.log(`artist_service running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start artist_service", error);
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

