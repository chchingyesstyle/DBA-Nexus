import { apiClient } from "./client";
import type { Application } from "../types";

export const getApplications = (search?: string) =>
  apiClient.get<Application[]>("/applications", { params: search ? { search } : {} });

export const createApplication = (data: Record<string, unknown>) =>
  apiClient.post<Application>("/applications", data);

export const updateApplication = (id: number, data: Record<string, unknown>) =>
  apiClient.put<Application>(`/applications/${id}`, data);

export const deleteApplication = (id: number) =>
  apiClient.delete(`/applications/${id}`);
