import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { LogOut } from "lucide-react";

export function Layout() {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

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
    </div>
  );
}
