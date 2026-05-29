import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { DatabaseList } from "./pages/DatabaseList";
import { DatabaseDetail } from "./pages/DatabaseDetail";
import { EC2List } from "./pages/EC2List";
import { EC2Detail } from "./pages/EC2Detail";
import { Applications } from "./pages/Applications";
import { Teams } from "./pages/Teams";
import { Users } from "./pages/admin/Users";
import { Roles } from "./pages/admin/Roles";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "databases", element: <DatabaseList /> },
      { path: "databases/:id", element: <DatabaseDetail /> },
      { path: "ec2", element: <EC2List /> },
      { path: "ec2/:id", element: <EC2Detail /> },
      { path: "applications", element: <Applications /> },
      { path: "teams", element: <Teams /> },
      { path: "admin/users", element: <Users /> },
      { path: "admin/roles", element: <Roles /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
