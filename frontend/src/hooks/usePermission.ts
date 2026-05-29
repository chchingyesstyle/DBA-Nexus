import { useCurrentUser } from "./useAuth";

export function usePermission(permission: string): boolean {
  const { data: user } = useCurrentUser();
  if (!user?.role) return false;
  return user.role.permissions.some((p) => p.name === permission);
}

export function useCanViewSecrets() {
  return usePermission("can_view_secrets");
}

export function useCanWrite() {
  return usePermission("can_write_inventory");
}

export function useCanManageUsers() {
  return usePermission("can_manage_users");
}
