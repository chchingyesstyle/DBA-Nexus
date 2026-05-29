import { apiClient } from "./client";
import type { Role, Permission } from "../types";

export const getRoles = () => apiClient.get<Role[]>("/roles");

export const getPermissions = () => apiClient.get<Permission[]>("/roles/permissions");

export const createRole = (data: Record<string, unknown>) =>
  apiClient.post<Role>("/roles", data);

export const updateRole = (id: number, data: Record<string, unknown>) =>
  apiClient.put<Role>(`/roles/${id}`, data);

export const deleteRole = (id: number) => apiClient.delete(`/roles/${id}`);
