import { apiClient } from "./client";
import type { User } from "../types";

export const login = (username: string, password: string) =>
  apiClient.post<{ access_token: string }>("/auth/login", { username, password });

export const getMe = () => apiClient.get<User>("/auth/me");
