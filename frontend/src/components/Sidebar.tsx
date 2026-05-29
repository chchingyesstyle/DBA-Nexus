import { NavLink } from "react-router-dom";
import { Database, Server, AppWindow, Users, Shield, LayoutDashboard, UsersRound } from "lucide-react";
import { useCanManageUsers } from "../hooks/usePermission";
import clsx from "clsx";

const navItem = (to: string, icon: React.ReactNode, label: string) => ({ to, icon, label });

const mainNav = [
  navItem("/", <LayoutDashboard size={16} />, "Dashboard"),
  navItem("/databases", <Database size={16} />, "Databases"),
  navItem("/ec2", <Server size={16} />, "EC2 Servers"),
  navItem("/applications", <AppWindow size={16} />, "Applications"),
  navItem("/teams", <UsersRound size={16} />, "Teams"),
];

const adminNav = [
  navItem("/admin/users", <Users size={16} />, "Users"),
  navItem("/admin/roles", <Shield size={16} />, "Roles"),
];

export function Sidebar() {
  const canManage = useCanManageUsers();

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col py-4 px-3">
      <div className="mb-6 px-2">
        <img
          src="https://s3-eu-west-1.amazonaws.com/tpd/logos/487cc75d000064000502f5d6/0x0.png"
          alt="YesStyle"
          className="h-8 w-auto mb-2"
        />
        <span className="font-semibold text-gray-900 text-sm tracking-tight">DBA-Nexus</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      {canManage && (
        <>
          <div className="mt-4 mb-1 px-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Admin</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </>
      )}
    </aside>
  );
}
