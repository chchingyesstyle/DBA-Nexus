import { apiClient } from "./client";
import type { Database, DatabaseUser } from "../types";

export interface DatabaseFilters {
  search?: string;
  environment?: string;
  application_id?: number;
  team_id?: number;
}

export const getDatabases = (filters: DatabaseFilters = {}) =>
  apiClient.get<Database[]>("/databases", { params: filters });

export const getDatabase = (id: number) =>
  apiClient.get<Database>(`/databases/${id}`);

export const createDatabase = (data: Record<string, unknown>) =>
  apiClient.post<Database>("/databases", data);

export const updateDatabase = (id: number, data: Record<string, unknown>) =>
  apiClient.put<Database>(`/databases/${id}`, data);

export const deleteDatabase = (id: number) =>
  apiClient.delete(`/databases/${id}`);

export const getDatabaseSecret = (id: number) =>
  apiClient.get<{ admin_password: string }>(`/databases/${id}/secret`);

export const getDbUsers = (dbId: number) =>
  apiClient.get<DatabaseUser[]>(`/databases/${dbId}/users`);

export const createDbUser = (dbId: number, data: Record<string, unknown>) =>
  apiClient.post<DatabaseUser>(`/databases/${dbId}/users`, data);

export const updateDbUser = (dbId: number, userId: number, data: Record<string, unknown>) =>
  apiClient.put<DatabaseUser>(`/databases/${dbId}/users/${userId}`, data);

export const deleteDbUser = (dbId: number, userId: number) =>
  apiClient.delete(`/databases/${dbId}/users/${userId}`);

export const getDbUserSecret = (dbId: number, userId: number) =>
  apiClient.get<{ password: string }>(`/databases/${dbId}/users/${userId}/secret`);
