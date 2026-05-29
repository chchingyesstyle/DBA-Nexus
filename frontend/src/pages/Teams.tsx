import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeams, createTeam, updateTeam, deleteTeam } from "../api/teams";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useCanWrite } from "../hooks/usePermission";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Team } from "../types";

export function Teams() {
  const qc = useQueryClient();
  const canWrite = useCanWrite();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Team | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["teams", search],
    queryFn: () => getTeams(search || undefined).then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["teams"] }); setDeleteId(null); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Teams</h1>
        {canWrite && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors">
            <Plus size={15} /> Add Team
          </button>
        )}
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-gray-300 mb-4" />

      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Description</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Contact</th>
                {canWrite && <th className="px-4 py-2.5 w-16" />}
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{team.name}</td>
                  <td className="px-4 py-3 text-gray-600">{team.description ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{team.contact ?? "—"}</td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right flex gap-2 justify-end">
                      <button onClick={() => setEditing(team)} className="text-gray-300 hover:text-gray-700 transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(team.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {teams.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No teams found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {(showForm || editing) && (
        <TeamForm
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["teams"] }); setShowForm(false); setEditing(null); }}
        />
      )}
      {deleteId !== null && (
        <ConfirmDialog message="Delete this team?" onConfirm={() => deleteMut.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
}

function TeamForm({ initial, onClose, onSaved }: { initial?: Team; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: initial?.name ?? "", description: initial?.description ?? "", contact: initial?.contact ?? "", notes: initial?.notes ?? "" });
  const mut = useMutation({
    mutationFn: (data: typeof form) => initial ? updateTeam(initial.id, data).then((r) => r.data) : createTeam(data).then((r) => r.data),
    onSuccess: onSaved,
  });
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">{initial ? "Edit" : "Add"} Team</h2>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }} className="flex flex-col gap-3">
          {(["name", "description", "contact", "notes"] as const).map((k) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{k}{k === "name" ? " *" : ""}</label>
              <input value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} required={k === "name"} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
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
