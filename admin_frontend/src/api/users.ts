import { userClient } from "./client";

export interface UserRole {
  id: string;
  name: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  birthday?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
  userProfile?: UserProfile;
  roles: UserRole[];
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await userClient.get("/users");
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await userClient.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<User> => {
    const response = await userClient.post("/users", data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<User> => {
    const response = await userClient.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await userClient.delete(`/users/${id}`);
  },

  getAllRoles: async (): Promise<UserRole[]> => {
    const response = await userClient.get("/roles");
    return response.data;
  },

  createRole: async (name: string): Promise<UserRole> => {
    const response = await userClient.post("/roles", { name });
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await userClient.delete(`/roles/${id}`);
  },
};
