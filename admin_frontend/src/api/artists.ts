import { artistClient } from "./client";

export interface Artist {
  _id: string;
  name: string;
  email: string;
  bio?: string;
  genre?: string;
  profileImageUrl?: string;
  profileImage?: string; // Base64 for creation
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const artistService = {
  getAll: async (): Promise<Artist[]> => {
    const response = await artistClient.get("/artists");
    return response.data;
  },

  create: async (data: any): Promise<Artist> => {
    const response = await artistClient.post("/artists", data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await artistClient.delete(`/artists/${id}`);
    return response.data;
  },
};
