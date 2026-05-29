export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  username: string;
  is_active: boolean;
  role?: Role;
}

export interface Application {
  id: number;
  name: string;
  description?: string;
  owner_team?: string;
  notes?: string;
  created_at?: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  contact?: string;
  notes?: string;
  created_at?: string;
}

export interface Database {
  id: number;
  name: string;
  engine: string;
  environment: string;
  hostname?: string;
  port?: number;
  region?: string;
  account?: string;
  rds_instance_id?: string;
  admin_username?: string;
  description?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  applications: Application[];
  teams: Team[];
}

export interface DatabaseUser {
  id: number;
  database_id: number;
  username: string;
  role_purpose?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EC2Server {
  id: number;
  name: string;
  instance_id?: string;
  environment: string;
  private_ip?: string;
  hostname?: string;
  region?: string;
  account?: string;
  operating_system?: string;
  ssh_username?: string;
  description?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  applications: Application[];
  teams: Team[];
}

export type Environment = "production" | "staging" | "development" | "test";
