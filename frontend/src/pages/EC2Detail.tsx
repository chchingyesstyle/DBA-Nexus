import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEC2, getEC2Secret, updateEC2 } from "../api/ec2";
import { getApplications } from "../api/applications";
import { getTeams } from "../api/teams";
import { EnvironmentBadge } from "../components/EnvironmentBadge";
import { TagList } from "../components/TagList";
import { SecretField } from "../components/SecretField";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useCanWrite, useCanViewSecrets } from "../hooks/usePermission";
import { ArrowLeft, Pencil } from "lucide-react";
import type { Application, Team } from "../types";

const ENVS = ["production", "staging", "uat", "development", "test"];

export function EC2Detail() {
  const { id } = useParams<{ id: string }>();
  const ec2Id = Number(id);
  const qc = useQueryClient();
  const canWrite = useCanWrite();
  const canViewSecrets = useCanViewSecrets();
  const [editing, setEditing] = useState(false);

  const { data: ec2, isLoading } = useQuery({ queryKey: ["ec2", ec2Id], queryFn: () => getEC2(ec2Id).then((r) => r.data) });
  const { data: apps = [] } = useQuery<Application[]>({ queryKey: ["applications"], queryFn: () => getApplications().then((r) => r.data) });
  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["teams"], queryFn: () => getTeams().then((r) => r.data) });

  if (isLoading) return <LoadingSpinner />;
  if (!ec2) return <p className="text-gray-500 text-sm">EC2 server not found.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-5">
        <Link to="/ec2" className="text-gray-400 hover:text-gray-700"><ArrowLeft size={16} /></Link>
        <h1 className="text-xl font-semibold text-gray-900">{ec2.name}</h1>
        <EnvironmentBadge env={ec2.environment} />
        {canWrite && (
          <button onClick={() => setEditing(true)} className="ml-auto text-gray-400 hover:text-gray-700"><Pencil size={15} /></button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Details</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            ["Instance ID", ec2.instance_id],
            ["Environment", ec2.environment],
            ["Private IP", ec2.private_ip],
            ["Hostname", ec2.hostname],
            ["Region", ec2.region],
            ["Account", ec2.account],
            ["Operating System", ec2.operating_system],
            ["SSH Username", ec2.ssh_username],
          ].map(([k, v]) => v ? (
            <div key={k as string} className="flex gap-2">
              <dt className="text-gray-500 w-36 shrink-0">{k}</dt>
              <dd className="text-gray-900">{String(v)}</dd>
            </div>
          ) : null)}
        </dl>
        {ec2.ssh_username && (
          <div className="mt-3">
            <SecretField
              key={ec2.updated_at ?? ec2.created_at}
              label="SSH Private Key"
              fetchSecret={() => getEC2Secret(ec2Id).then((r) => r.data.ssh_private_key)}
              canReveal={canViewSecrets}
            />
          </div>
        )}
        {ec2.description && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700">{ec2.description}</p>
          </div>
        )}
        {ec2.notes && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{ec2.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Applications</h2>
          <TagList items={ec2.applications} color="blue" />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Teams</h2>
          <TagList items={ec2.teams} color="purple" />
        </div>
      </div>

      {editing && (
        <EditEC2Form
          ec2={ec2}
          apps={apps}
          teams={teams}
          onClose={() => setEditing(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["ec2", ec2Id] }); setEditing(false); }}
        />
      )}
    </div>
  );
}

function EditEC2Form({ ec2, apps, teams, onClose, onSaved }: { ec2: ReturnType<typeof useQuery<any>>["data"]; apps: Application[]; teams: Team[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: ec2.name ?? "", environment: ec2.environment ?? "production", instance_id: ec2.instance_id ?? "",
    private_ip: ec2.private_ip ?? "", hostname: ec2.hostname ?? "", region: ec2.region ?? "",
    account: ec2.account ?? "", operating_system: ec2.operating_system ?? "", ssh_username: ec2.ssh_username ?? "",
    ssh_private_key: "", description: ec2.description ?? "", notes: ec2.notes ?? "",
    application_ids: ec2.applications.map((a: Application) => a.id) as number[],
    team_ids: ec2.teams.map((t: Team) => t.id) as number[],
  });
  const mut = useMutation({ mutationFn: (data: typeof form) => updateEC2(ec2.id, data), onSuccess: onSaved });
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-start justify-center z-50 pt-16 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Edit EC2 Server</h2>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }} className="grid grid-cols-2 gap-3">
          {[["name", "Name *", true], ["instance_id", "Instance ID"], ["private_ip", "Private IP"], ["hostname", "Hostname"], ["region", "Region"], ["account", "Account"], ["operating_system", "OS"], ["ssh_username", "SSH Username"]].map(([key, label, req]) => (
            <div key={key as string} className={key === "name" ? "col-span-2" : ""}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label as string}</label>
              <input value={(form as Record<string, unknown>)[key as string] as string} onChange={(e) => set(key as string, e.target.value)} required={!!req} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Environment</label>
            <select value={form.environment} onChange={(e) => set("environment", e.target.value)} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none">
              {ENVS.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">New SSH Private Key (leave blank to keep current)</label>
            <textarea value={form.ssh_private_key} onChange={(e) => set("ssh_private_key", e.target.value)} rows={3} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-300" />
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
