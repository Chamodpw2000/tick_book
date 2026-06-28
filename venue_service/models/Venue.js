import mongoose from "mongoose";

const { Schema } = mongoose;

const venueSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      default: null,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    phone: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Venue", venueSchema);
