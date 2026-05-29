import { apiClient } from "./client";
import type { Team } from "../types";

export const getTeams = (search?: string) =>
  apiClient.get<Team[]>("/teams", { params: search ? { search } : {} });

export const createTeam = (data: Record<string, unknown>) =>
  apiClient.post<Team>("/teams", data);

export const updateTeam = (id: number, data: Record<string, unknown>) =>
  apiClient.put<Team>(`/teams/${id}`, data);

export const deleteTeam = (id: number) => apiClient.delete(`/teams/${id}`);
