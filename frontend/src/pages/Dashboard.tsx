import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getDatabases } from "../api/databases";
import { getEC2List } from "../api/ec2";
import { getApplications } from "../api/applications";
import { getTeams } from "../api/teams";
import { Database, Server, AppWindow, UsersRound } from "lucide-react";

function StatCard({ label, count, to, icon }: { label: string; count: number; to: string; icon: React.ReactNode }) {
  return (
    <Link to={to} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3 mb-3 text-gray-500">{icon}<span className="text-sm font-medium">{label}</span></div>
      <p className="text-3xl font-semibold text-gray-900">{count}</p>
    </Link>
  );
}

export function Dashboard() {
  const { data: dbs } = useQuery({ queryKey: ["databases"], queryFn: () => getDatabases().then((r) => r.data) });
  const { data: ec2s } = useQuery({ queryKey: ["ec2"], queryFn: () => getEC2List().then((r) => r.data) });
  const { data: apps } = useQuery({ queryKey: ["applications"], queryFn: () => getApplications().then((r) => r.data) });
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: () => getTeams().then((r) => r.data) });

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Databases" count={dbs?.length ?? 0} to="/databases" icon={<Database size={18} />} />
        <StatCard label="EC2 Servers" count={ec2s?.length ?? 0} to="/ec2" icon={<Server size={18} />} />
        <StatCard label="Applications" count={apps?.length ?? 0} to="/applications" icon={<AppWindow size={18} />} />
        <StatCard label="Teams" count={teams?.length ?? 0} to="/teams" icon={<UsersRound size={18} />} />
      </div>
    </div>
  );
}
