import { apiClient } from "./client";
import type { User } from "../types";

export const login = (username: string, password: string) =>
  apiClient.post<{ access_token: string }>("/auth/login", { username, password });

export const getMe = () => apiClient.get<User>("/auth/me");

export const changePassword = (current_password: string, new_password: string) =>
  apiClient.post("/auth/change-password", { current_password, new_password });
