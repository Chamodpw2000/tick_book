import express from "express";
import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "./lib/mongoClient.js";
import cors from "cors";
import usersRouter from "./routes/usersRoutes.js";
import userRolesRouter from "./routes/userRolesRoutes.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
	res.status(200).json({ service: "user_service", status: "ok" });
});

app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the User Service!" });
});

app.use("/users", usersRouter);
app.use("/roles", userRolesRouter);

const startServer = async () => {
	try {
		console.log("Starting user_service...");
		await connectDatabase();
		console.log("Database connected");

		app.listen(PORT, () => {
			console.log(`user_service running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start user_service", error);
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

