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

// Tipos
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

// Contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Provider
function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Estado real de autenticación consultando el backend
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        // Check if we have a demo session
        const hasSession = localStorage.getItem("demo-session");
        
        const res = await fetch("/api/user", {
          headers: {
            "x-demo-session": hasSession || "inactive"
          }
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            // Clear any invalid session data
            localStorage.removeItem("demo-session");
            return null; // No hay usuario autenticado
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
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // No reintentar en errores 401 (no autenticado)
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
      // Establecer sesión demo en localStorage
      localStorage.setItem("demo-session", "active");
      
      // Guardar usuario en cache y navegar
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Sesión iniciada",
        description: `Bienvenido, ${user.name}`,
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      // Limpiar cualquier sesión inválida
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
        // Incluso si falla, proceder con logout local
        console.log("Logout del servidor falló, procediendo localmente");
        return null;
      }
    },
    onMutate: () => {
      // Limpiar inmediatamente el estado del usuario y la sesión demo
      localStorage.removeItem("demo-session");
      queryClient.setQueryData(["/api/user"], null);
    },
    onSettled: () => {
      // Se ejecuta siempre, sin importar si fue exitoso o falló
      
      // Limpiar completamente todo el cache y storage
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      
      // Asegurarse de que el usuario esté null
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      
      // Navegar a /auth mediante wouter si es necesario
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

// Hook
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}

// Exportaciones
export { AuthProvider, useAuth };