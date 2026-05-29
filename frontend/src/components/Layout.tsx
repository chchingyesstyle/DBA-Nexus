import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { changePassword } from "../api/auth";
import { LogOut, KeyRound } from "lucide-react";

export function Layout() {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();
  const [showPwModal, setShowPwModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <header className="h-12 border-b border-gray-200 bg-white flex items-center justify-end px-6 gap-3">
          <span className="text-sm text-gray-600">{user.username}</span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-500">
            {user.role?.name ?? "No role"}
          </span>
          <button
            onClick={() => setShowPwModal(true)}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="Change password"
          >
            <KeyRound size={16} />
          </button>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [validationError, setValidationError] = useState("");

  const mut = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => onClose(),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    if (next !== confirm) {
      setValidationError("New passwords do not match.");
      return;
    }
    if (next.length < 6) {
      setValidationError("New password must be at least 6 characters.");
      return;
    }
    mut.mutate();
  };

  const serverError = mut.isError
    ? ((mut.error as any)?.response?.data?.detail ?? "Failed to change password.")
    : null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoFocus
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          {(validationError || serverError) && (
            <p className="text-xs text-red-600">{validationError || serverError}</p>
          )}
          {mut.isSuccess && (
            <p className="text-xs text-green-600">Password changed successfully.</p>
          )}
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mut.isPending}
              className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {mut.isPending ? "Saving…" : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
