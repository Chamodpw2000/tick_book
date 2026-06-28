import { userApi } from "../api";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
  };
};

export type UserDetailsResponse = {
  id: string;
  email: string;
  userProfile?: {
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    birthday?: string | null;
  } | null;
};

export type RegisterRequest = {
  email: string;
  password: string;
  // Optional: backend supports profile + roleId + status.
  profile?: {
    firstName: string;
    lastName: string;
    bio?: string | null;
    birthday?: string | null;
  };
  roleId?: string;
  status?: string;
};

export type UpdateUserRequest = {
  password?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string | null;
    birthday?: string | null;
  };
};

export const userClient = {
  list: () => userApi.get("/users"),
  byId: (id: string) => userApi.get<UserDetailsResponse>(`/users/${encodeURIComponent(id)}`),
  register: (payload: RegisterRequest) => userApi.post("/users", payload),
  login: (payload: LoginRequest) => userApi.post<LoginResponse>("/users/login", payload),
  update: (id: string, payload: UpdateUserRequest) => userApi.put(`/users/${encodeURIComponent(id)}`, payload),
};
