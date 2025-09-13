import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { InsertUser, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { useLocation } from "wouter";

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<Response | null, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const hasSession = localStorage.getItem("demo-session");
        
        const res = await fetch("/api/user", {
          headers: {
            "x-demo-session": hasSession || "inactive"
          }
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("demo-session");
            return null;
          }
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('401')) {
          localStorage.removeItem("demo-session");
          return null;
        }
        throw error;
      }
    },
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al iniciar sesión");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      localStorage.setItem("demo-session", "active");
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Sesión iniciada",
        description: `Bienvenido, ${user.name}`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      localStorage.removeItem("demo-session");
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error en el registro");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada correctamente",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error en el registro",
        description: error.message || "No se pudo completar el registro",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/logout");
        return res;
      } catch (error) {
        console.log("Logout del servidor falló, procediendo localmente");
        return null;
      }
    },
    onMutate: () => {
      localStorage.removeItem("demo-session");
      queryClient.setQueryData(["/api/user"], null);
    },
    onSettled: () => {
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      
      try {
        setLocation("/auth");
      } catch {}
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };