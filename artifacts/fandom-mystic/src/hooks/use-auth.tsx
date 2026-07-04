import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { FMUser, authApi, getToken, setToken as setApiToken, clearToken } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface AuthContextType {
  user: FMUser | null;
  isLoading: boolean;
  login: typeof authApi.login;
  register: typeof authApi.register;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      setLocation("/login");
    } else {
      setApiToken(token);
    }
  }, [token, setLocation]);

  const logout = () => {
    setTokenState(null);
    clearToken();
    queryClient.clear();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: async (data) => {
          const res = await authApi.login(data);
          setTokenState(res.token);
          queryClient.setQueryData(["auth", "me"], res.user);
          return res;
        },
        register: async (data) => {
          const res = await authApi.register(data);
          setTokenState(res.token);
          queryClient.setQueryData(["auth", "me"], res.user);
          return res;
        },
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
