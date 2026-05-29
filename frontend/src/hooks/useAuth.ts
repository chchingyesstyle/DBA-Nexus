import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { login as apiLogin, getMe } from "../api/auth";
import type { User } from "../types";

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: () => getMe().then((r) => r.data),
    enabled: !!localStorage.getItem("token"),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      apiLogin(username, password).then((r) => r.data),
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return () => {
    localStorage.removeItem("token");
    queryClient.clear();
    navigate("/login");
  };
}
