import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoles, getPermissions, createRole, updateRole, deleteRole } from "../../api/roles";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCanManageUsers } from "../../hooks/usePermission";
import { Navigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Role, Permission } from "../../types";

export function Roles() {
  const canManage = useCanManageUsers();
  if (!canManage) return <Navigate to="/" replace />;

  const qc = useQueryClient();
  const [editing, setEditing] = useState<Role | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: roles = [], isLoading } = useQuery<Role[]>({ queryKey: ["roles"], queryFn: () => getRoles().then((r) => r.data) });
  const { data: allPerms = [] } = useQuery<Permission[]>({ queryKey: ["permissions"], queryFn: () => getPermissions().then((r) => r.data) });

  const deleteMut = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["roles"] }); setDeleteId(null); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Roles</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors">
          <Plus size={15} /> Add Role
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Role</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Permissions</th>
                <th className="px-4 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{role.name}</p>
                    {role.description && <p className="text-xs text-gray-400">{role.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((p) => (
                        <span key={p.id} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{p.name}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right flex gap-2 justify-end">
                    <button onClick={() => setEditing(role)} className="text-gray-300 hover:text-gray-700 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteId(role.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showForm || editing) && (
        <RoleForm
          initial={editing ?? undefined}
          allPerms={allPerms}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["roles"] }); setShowForm(false); setEditing(null); }}
        />
      )}
      {deleteId !== null && (
        <ConfirmDialog message="Delete this role? Users with this role will lose their permissions." onConfirm={() => deleteMut.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
}

function RoleForm({ initial, allPerms, onClose, onSaved }: { initial?: Role; allPerms: Permission[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: initial?.name ?? "", description: initial?.description ?? "", permission_ids: initial?.permissions.map((p) => p.id) ?? [] as number[] });
  const mut = useMutation({
    mutationFn: (data: typeof form) => initial ? updateRole(initial.id, data).then((r) => r.data) : createRole(data).then((r) => r.data),
    onSuccess: onSaved,
  });
  const togglePerm = (id: number) => setForm((f) => ({
    ...f,
    permission_ids: f.permission_ids.includes(id) ? f.permission_ids.filter((x) => x !== id) : [...f.permission_ids, id],
  }));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">{initial ? "Edit" : "Add"} Role</h2>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Permissions</label>
            <div className="flex flex-col gap-1.5">
              {allPerms.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.permission_ids.includes(p.id)} onChange={() => togglePerm(p.id)} />
                  <span className="font-mono text-xs">{p.name}</span>
                  {p.description && <span className="text-gray-400 text-xs">— {p.description}</span>}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Cancel</button>
            <button type="submit" disabled={mut.isPending} className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
