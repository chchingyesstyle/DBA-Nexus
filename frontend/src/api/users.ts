import { apiClient } from "./client";
import type { User } from "../types";

export const getUsers = () => apiClient.get<User[]>("/users");

export const createUser = (data: Record<string, unknown>) =>
  apiClient.post<User>("/users", data);

export const updateUser = (id: number, data: Record<string, unknown>) =>
  apiClient.put<User>(`/users/${id}`, data);

export const deleteUser = (id: number) => apiClient.delete(`/users/${id}`);
