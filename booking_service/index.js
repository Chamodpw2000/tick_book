import express from "express";
import "dotenv/config";
import { connectPrisma ,  disconnectPrisma } from "./lib/prismaClient.js";
import cors from "cors";
import ticketsRouter from "./routes/ticketsRoutes.js";
import bookingsRouter from "./routes/bookingsRoutes.js";
import bookingItemsRouter from "./routes/bookingItemsRoutes.js";

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
	res.status(200).json({ service: "booking_service", status: "ok" });
});

app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the Booking Service!" });
});

app.use("/tickets", ticketsRouter);
app.use("/bookings", bookingsRouter);
app.use("/booking-items", bookingItemsRouter);



const startServer = async () => {
	try {
		console.log("Starting booking_service...");
		await connectPrisma();
		console.log("Database connected");

		app.listen(PORT, () => {
			console.log(`booking_service running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start booking_service", error);
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

