import { apiClient } from "./client";
import type { EC2Server } from "../types";

export interface EC2Filters {
  search?: string;
  environment?: string;
  application_id?: number;
  team_id?: number;
}

export const getEC2List = (filters: EC2Filters = {}) =>
  apiClient.get<EC2Server[]>("/ec2", { params: filters });

export const getEC2 = (id: number) => apiClient.get<EC2Server>(`/ec2/${id}`);

export const createEC2 = (data: Record<string, unknown>) =>
  apiClient.post<EC2Server>("/ec2", data);

export const updateEC2 = (id: number, data: Record<string, unknown>) =>
  apiClient.put<EC2Server>(`/ec2/${id}`, data);

export const deleteEC2 = (id: number) => apiClient.delete(`/ec2/${id}`);

export const getEC2Secret = (id: number) =>
  apiClient.get<{ ssh_private_key: string }>(`/ec2/${id}/secret`);
