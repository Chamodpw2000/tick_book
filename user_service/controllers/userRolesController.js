import Role from "../models/Role.js";


const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const parseRoleId = (rawId) => {
  const roleId = String(rawId ?? "").trim();
  if (!OBJECT_ID_REGEX.test(roleId)) {
    return null;
  }

  return roleId;
};

const mapRole = (role) => ({
  id: String(role._id),
  name: role.name,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

export const createRole = async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "role name is required" });
  }

  try {
    const role = await Role.create({ name: name.trim() });
    return res.status(201).json(mapRole(role));
  } catch (error) {
    console.error("Failed to create role", error);

    if (error?.code === 11000) {
      return res.status(409).json({ message: "role already exists" });
    }

    return res.status(500).json({ message: "Failed to create role" });
  }
};

export const getRoles = async (_req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json(roles.map(mapRole));
  } catch (error) {
    console.error("Failed to fetch roles", error);
    return res.status(500).json({ message: "Failed to fetch roles" });
  }
};

export const getRoleById = async (req, res) => {
  const roleId = parseRoleId(req.params.id);

  if (!roleId) {
    return res.status(400).json({ message: "invalid role id" });
  }

  try {
    const role = await Role.findById(roleId).lean();

    if (!role) {
      return res.status(404).json({ message: "role not found" });
    }

    return res.status(200).json(mapRole(role));
  } catch (error) {
    console.error("Failed to fetch role", error);
    return res.status(500).json({ message: "Failed to fetch role" });
  }
};

export const updateRole = async (req, res) => {
  const roleId = parseRoleId(req.params.id);
  const { name } = req.body;

  if (!roleId) {
    return res.status(400).json({ message: "invalid role id" });
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "role name is required" });
  }

  try {
    const role = await Role.findByIdAndUpdate(
      roleId,
      { name: name.trim() },
      { new: true, runValidators: true },
    ).lean();

    if (!role) {
      return res.status(404).json({ message: "role not found" });
    }

    return res.status(200).json(mapRole(role));
  } catch (error) {
    console.error("Failed to update role", error);

    if (error?.code === 11000) {
      return res.status(409).json({ message: "role already exists" });
    }

    return res.status(500).json({ message: "Failed to update role" });
  }
};

export const deleteRole = async (req, res) => {
  const roleId = parseRoleId(req.params.id);

  if (!roleId) {
    return res.status(400).json({ message: "invalid role id" });
  }

  try {
    const role = await Role.findByIdAndDelete(roleId).lean();

    if (!role) {
      return res.status(404).json({ message: "role not found" });
    }



    return res.status(200).json({ message: "role deleted successfully" });
  } catch (error) {
    console.error("Failed to delete role", error);
    return res.status(500).json({ message: "Failed to delete role" });
  }
};
