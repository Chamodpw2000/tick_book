import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Role from "../models/Role.js";
import UserProfile from "../models/UserProfile.js";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const hashPassword = (password) => {
  return createHash("sha256").update(password).digest("hex");
};

const parseObjectId = (rawId) => {
  const id = String(rawId ?? "").trim();
  return OBJECT_ID_REGEX.test(id) ? id : null;
};



const signToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    jwtSecret,
    { expiresIn: "1h" },
  );
};

const mapRole = (role) => ({
  id: String(role._id),
  name: role.name,
});

const mapProfile = (profile) =>
  profile
    ? {
        id: String(profile._id),
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        birthday: profile.birthday,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }
    : null;

const mapUser = (user, profile, role) => ({
  id: String(user._id),
  email: user.email,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  userProfile: mapProfile(profile),
  role,
});

const getApiUserById = async (userId) => {
  const [user, profile] = await Promise.all([
    User.findById(userId).populate("role", "name").lean(),
    UserProfile.findOne({ userId }).lean(),
  ]);

  if (!user) {
    return null;
  }

  const role = user.role ? mapRole(user.role) : null;

  return mapUser(user, profile, role);
};

export const createUser = async (req, res) => {
  const { email, password, status, profile, roleId } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required",
    });
  }

  const parsedRoleId = parseObjectId(roleId);

  if (roleId !== undefined && !parsedRoleId) {
    return res.status(400).json({
      message: "roleId must be a valid id",
    });
  }

  if (profile !== undefined && profile !== null && typeof profile !== "object") {
    return res.status(400).json({
      message: "profile must be an object",
    });
  }

  if (
    profile &&
    (!profile.firstName ||
      !profile.lastName ||
      typeof profile.firstName !== "string" ||
      typeof profile.lastName !== "string")
  ) {
    return res.status(400).json({
      message: "profile.firstName and profile.lastName are required",
    });
  }

  if (
    profile?.birthday !== undefined &&
    profile?.birthday !== null &&
    Number.isNaN(Date.parse(profile.birthday))
  ) {
    return res.status(400).json({
      message: "profile.birthday must be a valid date",
    });
  }

  try {
    if (parsedRoleId) {
      const roleExists = await Role.exists({ _id: parsedRoleId });
      if (!roleExists) {
        return res.status(400).json({
          message: "roleId does not exist",
        });
      }
    }

    const createdUser = await User.create({
      email: String(email).trim().toLowerCase(),
      password: hashPassword(password),
      status: status && typeof status === "string" ? status : "active",
      ...(parsedRoleId ? { role: parsedRoleId } : {}),
    });

    if (profile) {
      await UserProfile.create({
        userId: createdUser._id,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        bio: profile.bio ?? null,
        birthday: profile.birthday ? new Date(profile.birthday) : null,
      });
    }

    const apiUser = await getApiUserById(createdUser._id);
    return res.status(201).json(apiUser);
  } catch (error) {
    console.error("Failed to create user", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        message: "email already exists",
      });
    }

    return res.status(500).json({ message: "Failed to create user" });
  }
};

export const getUsers = async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const apiUsers = await Promise.all(users.map((user) => getApiUserById(user._id)));

    return res.status(200).json(apiUsers.filter(Boolean));
  } catch (error) {
    console.error("Failed to fetch users", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getUserById = async (req, res) => {
  const userId = parseObjectId(req.params.id);

  if (!userId) {
    return res.status(400).json({ message: "invalid user id" });
  }

  try {
    const user = await getApiUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Failed to fetch user", error);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const updateUser = async (req, res) => {
  const userId = parseObjectId(req.params.id);
  const { email, password, status, profile, roleId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "invalid user id" });
  }

  if (
    email === undefined &&
    password === undefined &&
    status === undefined &&
    profile === undefined &&
    roleId === undefined
  ) {
    return res.status(400).json({ message: "no fields provided to update" });
  }

  let parsedRoleId;
  if (roleId !== undefined && roleId !== null) {
    parsedRoleId = parseObjectId(roleId);
    if (!parsedRoleId) {
      return res.status(400).json({ message: "roleId must be a valid id" });
    }
  }

  if (profile !== undefined && profile !== null && typeof profile !== "object") {
    return res.status(400).json({ message: "profile must be an object or null" });
  }

  if (
    profile &&
    ((profile.firstName !== undefined && typeof profile.firstName !== "string") ||
      (profile.lastName !== undefined && typeof profile.lastName !== "string"))
  ) {
    return res.status(400).json({
      message: "profile.firstName and profile.lastName must be strings",
    });
  }

  if (
    profile?.birthday !== undefined &&
    profile?.birthday !== null &&
    Number.isNaN(Date.parse(profile.birthday))
  ) {
    return res.status(400).json({
      message: "profile.birthday must be a valid date",
    });
  }

  try {
    const existingUser = await User.findById(userId).lean();

    if (!existingUser) {
      return res.status(404).json({ message: "user not found" });
    }

    if (parsedRoleId) {
      const roleExists = await Role.exists({ _id: parsedRoleId });
      if (!roleExists) {
        return res.status(400).json({ message: "roleId does not exist" });
      }
    }

    const updateData = {};

    if (email !== undefined) {
      updateData.email = String(email).trim().toLowerCase();
    }

    if (password !== undefined) {
      updateData.password = hashPassword(String(password));
    }

    if (status !== undefined) {
      updateData.status = String(status);
    }

    if (roleId !== undefined) {
      updateData.role = parsedRoleId || null;
    }

    if (Object.keys(updateData).length > 0) {
      await User.updateOne({ _id: userId }, { $set: updateData });
    }

    if (profile !== undefined) {
      const existingProfile = await UserProfile.findOne({ userId }).lean();

      if (profile === null) {
        await UserProfile.deleteOne({ userId });
      } else if (existingProfile) {
        const profileUpdate = {};

        if (profile.firstName !== undefined) {
          profileUpdate.firstName = profile.firstName.trim();
        }

        if (profile.lastName !== undefined) {
          profileUpdate.lastName = profile.lastName.trim();
        }

        if (profile.bio !== undefined) {
          profileUpdate.bio = profile.bio;
        }

        if (profile.birthday !== undefined) {
          profileUpdate.birthday = profile.birthday ? new Date(profile.birthday) : null;
        }

        if (Object.keys(profileUpdate).length > 0) {
          await UserProfile.updateOne({ userId }, { $set: profileUpdate });
        }
      } else {
        if (!profile.firstName || !profile.lastName) {
          return res.status(400).json({
            message: "profile.firstName and profile.lastName are required when creating profile",
          });
        }

        await UserProfile.create({
          userId,
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          bio: profile.bio ?? null,
          birthday: profile.birthday ? new Date(profile.birthday) : null,
        });
      }
    }



    const updatedUser = await getApiUserById(userId);
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Failed to update user", error);

    if (error?.code === 11000) {
      return res.status(409).json({ message: "email already exists" });
    }

    return res.status(500).json({ message: "Failed to update user" });
  }
};

export const deleteUser = async (req, res) => {
  const userId = parseObjectId(req.params.id);

  if (!userId) {
    return res.status(400).json({ message: "invalid user id" });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "user not found" });
    }

    await UserProfile.deleteMany({ userId });

    return res.status(200).json({ message: "user deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required",
    });
  }

  try {
    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).lean();
    const hashedPassword = hashPassword(password);

    if (!user || user.password !== hashedPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const userProfile = await UserProfile.findOne({ userId: user._id }).lean();
    const displayName = [userProfile?.firstName?.trim(), userProfile?.lastName?.trim()]
      .filter(Boolean)
      .join(" ") || null;

    const token = signToken({ id: String(user._id), email: user.email });

    return res.status(200).json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        displayName,
      },
    });
  } catch (error) {
    console.error("Failed to login user", error);
    return res.status(500).json({ message: "Failed to login user" });
  }
};
