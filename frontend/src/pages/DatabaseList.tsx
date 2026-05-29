import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDatabases, createDatabase, deleteDatabase } from "../api/databases";
import { getApplications } from "../api/applications";
import { getTeams } from "../api/teams";
import { EnvironmentBadge } from "../components/EnvironmentBadge";
import { TagList } from "../components/TagList";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useCanWrite } from "../hooks/usePermission";
import { Plus, Trash2 } from "lucide-react";
import type { Application, Team } from "../types";

const ENGINES = ["PostgreSQL", "MySQL", "MariaDB", "Oracle", "SQL Server", "Other"];
const ENVS = ["production", "staging", "uat", "development", "test"];

export function DatabaseList() {
  const qc = useQueryClient();
  const canWrite = useCanWrite();
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("");
  const [appFilter, setAppFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: dbs, isLoading } = useQuery({
    queryKey: ["databases", search, envFilter, appFilter, teamFilter],
    queryFn: () => getDatabases({
      search: search || undefined,
      environment: envFilter || undefined,
      application_id: appFilter ? Number(appFilter) : undefined,
      team_id: teamFilter ? Number(teamFilter) : undefined,
    }).then((r) => r.data),
  });
  const { data: apps = [] } = useQuery<Application[]>({ queryKey: ["applications"], queryFn: () => getApplications().then((r) => r.data) });
  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["teams"], queryFn: () => getTeams().then((r) => r.data) });

  const deleteMut = useMutation({
    mutationFn: deleteDatabase,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["databases"] }); setDeleteId(null); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Databases</h1>
        {canWrite && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors">
            <Plus size={15} /> Add Database
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-gray-300" />
        <select value={envFilter} onChange={(e) => setEnvFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none">
          <option value="">All environments</option>
          {ENVS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={appFilter} onChange={(e) => setAppFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none">
          <option value="">All applications</option>
          {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none">
          <option value="">All teams</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Engine</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Environment</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Applications</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Teams</th>
                {canWrite && <th className="px-4 py-2.5 text-xs w-10" />}
              </tr>
            </thead>
            <tbody>
              {dbs?.map((db) => (
                <tr key={db.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/databases/${db.id}`} className="font-medium text-gray-900 hover:underline">{db.name}</Link>
                    {db.hostname && <p className="text-xs text-gray-400 mt-0.5">{db.hostname}{db.port ? `:${db.port}` : ""}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{db.engine}</td>
                  <td className="px-4 py-3"><EnvironmentBadge env={db.environment} /></td>
                  <td className="px-4 py-3"><TagList items={db.applications} color="blue" /></td>
                  <td className="px-4 py-3"><TagList items={db.teams} color="purple" /></td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDeleteId(db.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {dbs?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No databases found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <DatabaseForm apps={apps} teams={teams} onClose={() => setShowForm(false)} onSaved={() => { qc.invalidateQueries({ queryKey: ["databases"] }); setShowForm(false); }} />}
      {deleteId !== null && (
        <ConfirmDialog
          message="Delete this database record? This cannot be undone."
          onConfirm={() => deleteMut.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

function DatabaseForm({ apps, teams, onClose, onSaved }: { apps: Application[]; teams: Team[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", engine: "PostgreSQL", environment: "production", hostname: "", port: "", region: "", account: "", rds_instance_id: "", admin_username: "", admin_password: "", description: "", notes: "", application_ids: [] as number[], team_ids: [] as number[] });
  const mut = useMutation({ mutationFn: createDatabase, onSuccess: onSaved });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mut.mutate({ ...form, port: form.port ? Number(form.port) : undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 pt-16 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add Database</h2>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          {[
            ["name", "Name *", true],
            ["hostname", "Hostname"],
            ["port", "Port"],
            ["region", "Region"],
            ["account", "Account"],
            ["rds_instance_id", "RDS Instance ID"],
            ["admin_username", "Admin Username"],
          ].map(([key, label, required]) => (
            <div key={key as string} className={key === "name" ? "col-span-2" : ""}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label as string}</label>
              <input value={(form as Record<string, unknown>)[key as string] as string} onChange={(e) => set(key as string, e.target.value)} required={!!required} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Engine</label>
            <select value={form.engine} onChange={(e) => set("engine", e.target.value)} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none">
              {ENGINES.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Environment</label>
            <select value={form.environment} onChange={(e) => set("environment", e.target.value)} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none">
              {ENVS.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Admin Password</label>
            <input type="password" value={form.admin_password} onChange={(e) => set("admin_password", e.target.value)} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Applications</label>
            <select multiple value={form.application_ids.map(String)} onChange={(e) => set("application_ids", Array.from(e.target.selectedOptions, (o) => Number(o.value)))} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none h-20">
              {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Teams</label>
            <select multiple value={form.team_ids.map(String)} onChange={(e) => set("team_ids", Array.from(e.target.selectedOptions, (o) => Number(o.value)))} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none h-20">
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {mut.isError && <p className="col-span-2 text-xs text-red-600">Failed to save.</p>}
          <div className="col-span-2 flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Cancel</button>
            <button type="submit" disabled={mut.isPending} className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
