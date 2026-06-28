import mongoose from "mongoose";
import "dotenv/config";

export const connectDatabase = async () => {
  await mongoose.connect(process.env.DATABASE_URL);
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
};
