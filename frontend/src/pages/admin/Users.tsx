import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser, updateUser, deleteUser } from "../../api/users";
import { getRoles } from "../../api/roles";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCanManageUsers } from "../../hooks/usePermission";
import { Navigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { User, Role } from "../../types";

export function Users() {
  const canManage = useCanManageUsers();
  if (!canManage) return <Navigate to="/" replace />;

  const qc = useQueryClient();
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({ queryKey: ["users"], queryFn: () => getUsers().then((r) => r.data) });
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ["roles"], queryFn: () => getRoles().then((r) => r.data) });

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setDeleteId(null); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors">
          <Plus size={15} /> Add User
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Username</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Role</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Status</th>
                <th className="px-4 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.username}</td>
                  <td className="px-4 py-3 text-gray-600">{user.role?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${user.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex gap-2 justify-end">
                    <button onClick={() => setEditing(user)} className="text-gray-300 hover:text-gray-700 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => setDeleteId(user.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showForm || editing) && (
        <UserForm
          initial={editing ?? undefined}
          roles={roles}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["users"] }); setShowForm(false); setEditing(null); }}
        />
      )}
      {deleteId !== null && (
        <ConfirmDialog message="Delete this user?" onConfirm={() => deleteMut.mutate(deleteId)} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
}

function UserForm({ initial, roles, onClose, onSaved }: { initial?: User; roles: Role[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ username: initial?.username ?? "", password: "", role_id: initial?.role?.id ?? (roles[0]?.id ?? 0), is_active: initial?.is_active ?? true });
  const mut = useMutation({
    mutationFn: (data: typeof form) => {
      const payload: Record<string, unknown> = { ...data };
      if (!data.password) delete payload.password;
      return initial ? updateUser(initial.id, payload).then((r) => r.data) : createUser(payload).then((r) => r.data);
    },
    onSuccess: onSaved,
  });
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">{initial ? "Edit" : "Add"} User</h2>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Username *</label>
            <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password {initial ? "(leave blank to keep)" : "*"}</label>
            <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required={!initial} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select value={form.role_id} onChange={(e) => setForm((f) => ({ ...f, role_id: Number(e.target.value) }))} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none">
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Active
          </label>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">Cancel</button>
            <button type="submit" disabled={mut.isPending} className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
