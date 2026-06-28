import Venue from "../models/Venue.js";

export const createVenue = async (req, res) => {
  const {
    name,
    description,
    address,
    city,
    state,
    country,
    postalCode,
    capacity,
    phone,
    isActive,
  } = req.body;

  if (!name || !address || !city || !country || capacity === undefined) {
    return res.status(400).json({
      message: "name, address, city, country, and capacity are required",
    });
  }

  const venueCapacity = Number(capacity);
  if (!Number.isInteger(venueCapacity) || venueCapacity <= 0) {
    return res.status(400).json({
      message: "capacity must be a positive integer",
    });
  }

  try {
    const venue = await Venue.create({
      name,
      description,
      address,
      city,
      state,
      country,
      postalCode,
      capacity: venueCapacity,
      phone,
      isActive,
    });

    return res.status(201).json(venue);
  } catch (error) {
    console.error("Failed to create venue", error);
    return res.status(500).json({ message: "Failed to create venue" });
  }
};

export const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });

    return res.status(200).json(venues);
  } catch (error) {
    console.error("Failed to fetch venues", error);
    return res.status(500).json({ message: "Failed to fetch venues" });
  }
};

export const getVenueById = async (req, res) => {
  const { id } = req.params;

  try {
    const venue = await Venue.findById(id);

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    return res.status(200).json(venue);
  } catch (error) {
    console.error("Failed to fetch venue", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid venue id format" });
    }
    return res.status(500).json({ message: "Failed to fetch venue" });
  }
};