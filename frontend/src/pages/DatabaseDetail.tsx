import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDatabase, getDatabaseSecret, getDbUsers, createDbUser, deleteDbUser, getDbUserSecret, updateDatabase } from "../api/databases";
import { getApplications } from "../api/applications";
import { getTeams } from "../api/teams";
import { EnvironmentBadge } from "../components/EnvironmentBadge";
import { TagList } from "../components/TagList";
import { SecretField } from "../components/SecretField";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useCanWrite, useCanViewSecrets } from "../hooks/usePermission";
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import type { Application, Team } from "../types";

const ENGINES = ["PostgreSQL", "MySQL", "MariaDB", "Oracle", "SQL Server", "Other"];
const ENVS = ["production", "staging", "uat", "development", "test"];

export function DatabaseDetail() {
  const { id } = useParams<{ id: string }>();
  const dbId = Number(id);
  const qc = useQueryClient();
  const canWrite = useCanWrite();
  const canViewSecrets = useCanViewSecrets();
  const [showUserForm, setShowUserForm] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  const { data: db, isLoading } = useQuery({ queryKey: ["database", dbId], queryFn: () => getDatabase(dbId).then((r) => r.data) });
  const { data: users = [] } = useQuery({ queryKey: ["db-users", dbId], queryFn: () => getDbUsers(dbId).then((r) => r.data) });
  const { data: apps = [] } = useQuery<Application[]>({ queryKey: ["applications"], queryFn: () => getApplications().then((r) => r.data) });
  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["teams"], queryFn: () => getTeams().then((r) => r.data) });

  const deleteUserMut = useMutation({
    mutationFn: (userId: number) => deleteDbUser(dbId, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["db-users", dbId] }); setDeleteUserId(null); },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!db) return <p className="text-gray-500 text-sm">Database not found.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-5">
        <Link to="/databases" className="text-gray-400 hover:text-gray-700"><ArrowLeft size={16} /></Link>
        <h1 className="text-xl font-semibold text-gray-900">{db.name}</h1>
        <EnvironmentBadge env={db.environment} />
        {canWrite && (
          <button onClick={() => setEditing(true)} className="ml-auto text-gray-400 hover:text-gray-700"><Pencil size={15} /></button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Details</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ["Engine", db.engine],
            ["Environment", db.environment],
            ["Hostname", db.hostname],
            ["Port", db.port],
            ["Region", db.region],
            ["Account", db.account],
            ["RDS Instance", db.rds_instance_id],
            ["Admin Username", db.admin_username],
          ].map(([k, v]) => v ? (
            <div key={k as string} className="flex gap-2">
              <dt className="text-gray-500 w-32 shrink-0">{k}</dt>
              <dd className="text-gray-900">{String(v)}</dd>
            </div>
          ) : null)}
        </dl>
        {db.admin_username && (
          <div className="mt-3">
            <SecretField
              key={db.updated_at ?? db.created_at}
              label="Admin Password"
              fetchSecret={() => getDatabaseSecret(dbId).then((r) => r.data.admin_password)}
              canReveal={canViewSecrets}
            />
          </div>
        )}
        {db.description && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700">{db.description}</p>
          </div>
        )}
        {db.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{db.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Applications</h2>
          <TagList items={db.applications} color="blue" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Teams</h2>
          <TagList items={db.teams} color="purple" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Database Users</h2>
          {canWrite && (
            <button onClick={() => setShowUserForm(true)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900">
              <Plus size={13} /> Add User
            </button>
          )}
        </div>
        {users.length === 0 ? (
          <p className="text-sm text-gray-400">No users added yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{u.username}</p>
                  {u.role_purpose && <p className="text-xs text-gray-400">{u.role_purpose}</p>}
                </div>
                <SecretField
                  key={u.updated_at ?? u.created_at}
                  label="Password"
                  fetchSecret={() => getDbUserSecret(dbId, u.id).then((r) => r.data.password)}
                  canReveal={canViewSecrets}
                />
                {canWrite && (
                  <button onClick={() => setDeleteUserId(u.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-2">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showUserForm && (
        <DbUserForm
          dbId={dbId}
          onClose={() => setShowUserForm(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["db-users", dbId] }); setShowUserForm(false); }}
        />
      )}
      {deleteUserId !== null && (
        <ConfirmDialog
          message="Delete this database user?"
          onConfirm={() => deleteUserMut.mutate(deleteUserId)}
          onCancel={() => setDeleteUserId(null)}
        />
      )}
      {editing && (
        <EditDatabaseForm
          db={db}
          apps={apps}
          teams={teams}
          onClose={() => setEditing(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["database", dbId] }); setEditing(false); }}
        />
      )}
    </div>
  );
}

function DbUserForm({ dbId, onClose, onSaved }: { dbId: number; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ username: "", password: "", role_purpose: "", notes: "" });
  const mut = useMutation({ mutationFn: (data: typeof form) => createDbUser(dbId, data), onSuccess: onSaved });
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Add Database User</h2>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }} className="flex flex-col gap-3">
          {(["username", "password", "role_purpose", "notes"] as const).map((k) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{k.replace("_", " ")}{k === "username" ? " *" : ""}</label>
              <input type={k === "password" ? "password" : "text"} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} required={k === "username"} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
            </div>
          ))}
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Cancel</button>
            <button type="submit" disabled={mut.isPending} className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditDatabaseForm({ db, apps, teams, onClose, onSaved }: { db: ReturnType<typeof useQuery<any>>["data"]; apps: Application[]; teams: Team[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: db.name ?? "", engine: db.engine ?? "PostgreSQL", environment: db.environment ?? "production",
    hostname: db.hostname ?? "", port: db.port ? String(db.port) : "", region: db.region ?? "",
    account: db.account ?? "", rds_instance_id: db.rds_instance_id ?? "", admin_username: db.admin_username ?? "",
    admin_password: "", description: db.description ?? "", notes: db.notes ?? "",
    application_ids: db.applications.map((a: Application) => a.id) as number[],
    team_ids: db.teams.map((t: Team) => t.id) as number[],
  });
  const mut = useMutation({ mutationFn: (data: typeof form) => updateDatabase(db.id, { ...data, port: data.port ? Number(data.port) : undefined }), onSuccess: onSaved });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 pt-16 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Edit Database</h2>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }} className="grid grid-cols-2 gap-3">
          {[["name", "Name *", true], ["hostname", "Hostname"], ["port", "Port"], ["region", "Region"], ["account", "Account"], ["rds_instance_id", "RDS Instance ID"], ["admin_username", "Admin Username"]].map(([key, label, req]) => (
            <div key={key as string} className={key === "name" ? "col-span-2" : ""}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label as string}</label>
              <input value={(form as Record<string, unknown>)[key as string] as string} onChange={(e) => set(key as string, e.target.value)} required={!!req} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
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
            <label className="block text-xs font-medium text-gray-600 mb-1">New Admin Password (leave blank to keep current)</label>
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
          <div className="col-span-2 flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Cancel</button>
            <button type="submit" disabled={mut.isPending} className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
