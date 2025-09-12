import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, UserCog, Shield, ShieldOff, Check, X, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";

// Tipos
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string | null;
  createdAt: string;
}

const UsersAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  // Redirigir si no es administrador
  React.useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta página",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

  // Consulta para obtener todos los usuarios
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && user.role === "admin",
  });

  // Mutación para cambiar el rol de un usuario
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar el rol de usuario");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Rol actualizado",
        description: "El rol del usuario ha sido actualizado correctamente",
      });
      setRoleDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para cambiar el estado de un usuario
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar el estado de usuario");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del usuario ha sido actualizado correctamente",
      });
      setStatusDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Funciones para manejar los diálogos
  const handleRoleChange = (userId: number, currentRole: string) => {
    const user = users?.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setNewRole(currentRole);
      setRoleDialogOpen(true);
    }
  };

  const handleStatusChange = (userId: number, currentStatus: string) => {
    const user = users?.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setNewStatus(currentStatus);
      setStatusDialogOpen(true);
    }
  };

  // Función para renderizar el badge del rol
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500 hover:bg-red-600">Administrador</Badge>;
      case "technician":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Técnico</Badge>;
      case "manager":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Gerente</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">Usuario</Badge>;
    }
  };

  // Función para renderizar el badge del estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>;
      case "disabled":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Deshabilitado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendiente</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">Desconocido</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/")}
          className="flex items-center gap-1"
        >
          ← Volver al inicio
        </Button>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            Administración de Usuarios
          </CardTitle>
          <CardDescription>
            Gestiona los roles y estados de los usuarios del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Lista de usuarios registrados en el sistema</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Acciones
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Gestionar Usuario</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRoleChange(user.id, user.role)}>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Cambiar Rol</span>
                        </DropdownMenuItem>
                        {user.status === "active" ? (
                          <DropdownMenuItem onClick={() => handleStatusChange(user.id, "disabled")}>
                            <ShieldOff className="mr-2 h-4 w-4" />
                            <span>Deshabilitar Usuario</span>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleStatusChange(user.id, "active")}>
                            <Check className="mr-2 h-4 w-4" />
                            <span>Activar Usuario</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo para cambiar el rol */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo rol para {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="technician">Técnico</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {newRole === "admin" && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <span className="text-sm text-yellow-700">
                  Otorgar permisos de administrador permite al usuario gestionar todos los aspectos del sistema,
                  incluyendo otros usuarios. Asigna este rol con precaución.
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={updateRoleMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => selectedUser && updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole })}
              disabled={updateRoleMutation.isPending || newRole === selectedUser?.role}
            >
              {updateRoleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para cambiar el estado */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newStatus === "active" ? "Activar Usuario" : "Deshabilitar Usuario"}
            </DialogTitle>
            <DialogDescription>
              {newStatus === "active"
                ? `¿Estás seguro de que deseas activar al usuario ${selectedUser?.name}?`
                : `¿Estás seguro de que deseas deshabilitar al usuario ${selectedUser?.name}?`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {newStatus === "disabled" && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                <span className="text-sm text-yellow-700">
                  Al deshabilitar este usuario, no podrá iniciar sesión ni acceder al sistema hasta que se reactive su cuenta.
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => selectedUser && updateStatusMutation.mutate({ userId: selectedUser.id, status: newStatus })}
              disabled={updateStatusMutation.isPending}
              variant={newStatus === "active" ? "default" : "destructive"}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : newStatus === "active" ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Activar Usuario
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Deshabilitar Usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersAdminPage;