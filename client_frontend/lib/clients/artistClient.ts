import { artistApi } from "../api";

export type CreateArtistRequest = {
  name: string;
  email: string;
  bio?: string | null;
  genre?: string | null;
  profileImage: string; // base64 (prefer data URL)
  isActive?: boolean;
};

export const artistClient = {
  create: (payload: CreateArtistRequest) => artistApi.post("/artists", payload),
  list: () => artistApi.get("/artists"),
  byId: (id: string) => artistApi.get(`/artists/${encodeURIComponent(id)}`),
};
