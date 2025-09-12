import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PlusCircle, Search, Filter, UserPlus, Shield, UserCog, Mail, User as UserIcon, Key, X, ShieldOff, Check, AlertTriangle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InsertUser } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { User } from "@shared/schema";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function UsersPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estado para el modal de agregar nuevo empleado
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "user"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para administración de usuarios
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/users', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    }
  });

  // Mutación para crear un nuevo usuario
  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/users", userData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear el empleado");
      }
      return res.json();
    },
    onSuccess: () => {
      // Recargar la lista de usuarios
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Limpiar el formulario y cerrar el diálogo
      setNewUserData({
        name: "",
        email: "",
        username: "",
        password: "",
        role: "user"
      });
      setAddUserDialogOpen(false);
      
      toast({
        title: "Empleado creado exitosamente",
        description: "El nuevo empleado ha sido agregado al sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear el empleado",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutación para cambiar el rol de un usuario
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      // For demo, just show success message
      return new Promise(resolve => setTimeout(resolve, 1000));
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
        description: "Error al actualizar el rol de usuario (Demo)",
        variant: "destructive",
      });
    },
  });

  // Mutación para cambiar el estado de un usuario
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
      // For demo, just show success message
      return new Promise(resolve => setTimeout(resolve, 1000));
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
        description: "Error al actualizar el estado de usuario (Demo)",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    setAddUserDialogOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!newUserData.name || !newUserData.email || !newUserData.username || !newUserData.password) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }
    
    if (newUserData.password.length < 6) {
      toast({
        title: "Contraseña insegura",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createUserMutation.mutateAsync(newUserData as InsertUser);
    } catch (error) {
      console.error("Error creating user:", error);
      // El error ya es manejado por la mutación
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewUserRoleChange = (value: string) => {
    setNewUserData(prev => ({ ...prev, role: value }));
  };

  const handleEditUser = (id: number) => {
    toast({
      title: "Función en desarrollo",
      description: "La edición de empleados estará disponible próximamente",
    });
  };

  // Funciones para manejar los diálogos de administración
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
        return <Badge className="bg-gray-500 hover:bg-gray-600">Activo</Badge>;
    }
  };

  return (
    <Layout currentModule="empleados">
      <div className="container mx-auto py-6">
        {/* Modal para agregar nuevo empleado */}
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-teal-600" />
                Agregar Nuevo Empleado
              </DialogTitle>
              <DialogDescription>
                Complete el formulario para crear un nuevo empleado en el sistema.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateUser} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nombre Completo
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Nombre del empleado"
                    value={newUserData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={newUserData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Nombre de Usuario
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="username"
                    name="username"
                    placeholder="nombre.usuario"
                    value={newUserData.username}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Este será el identificador para iniciar sesión.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={newUserData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Mínimo 6 caracteres.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Rol en el Sistema
                </Label>
                <Select value={newUserData.role} onValueChange={handleNewUserRoleChange}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario Regular</SelectItem>
                    <SelectItem value="technician">Técnico</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Define los permisos del empleado en el sistema.</p>
              </div>
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddUserDialogOpen(false)}
                  className="mr-2"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-teal-600 hover:bg-teal-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Empleado'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
      
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios y Empleados</h1>
            <p className="text-gray-500 mt-1">
              Administre los usuarios del sistema, sus roles, permisos y estados
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleAddUser}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Empleado
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar empleados..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Empleados del Sistema</CardTitle>
            <CardDescription>
              Lista de todos los empleados registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Filter className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-600">No se encontraron empleados</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  {searchQuery 
                    ? "Intente modificar la búsqueda para encontrar lo que busca."
                    : "No hay empleados registrados en el sistema. Cree un nuevo empleado para comenzar."}
                </p>
                <Button 
                  onClick={handleAddUser}
                  className="mt-6 bg-teal-600 hover:bg-teal-700"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Empleado
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead className="w-[120px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatedTableRows 
                      users={filteredUsers} 
                      onEditUser={handleEditUser}
                      onRoleChange={handleRoleChange}
                      onStatusChange={handleStatusChange}
                      getRoleBadge={getRoleBadge}
                      getStatusBadge={getStatusBadge}
                    />
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Animated table rows component
function AnimatedTableRows({ 
  users, 
  onEditUser, 
  onRoleChange, 
  onStatusChange, 
  getRoleBadge, 
  getStatusBadge 
}: { 
  users: User[], 
  onEditUser: (id: number) => void,
  onRoleChange: (userId: number, currentRole: string) => void,
  onStatusChange: (userId: number, currentStatus: string) => void,
  getRoleBadge: (role: string) => JSX.Element,
  getStatusBadge: (status: string) => JSX.Element
}) {
  const { toast } = useToast();

  const handleUserAction = (action: string, userId: number) => {
    toast({
      title: "Función en desarrollo",
      description: `La acción ${action} estará disponible próximamente.`,
    });
  };

  return (
    <>
      {users.map((user, index) => (
        <motion.tr
          key={user.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="border-b border-gray-100 hover:bg-gray-50"
        >
          <TableCell className="py-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-teal-100 text-teal-600">
                  {user.name?.charAt(0) || user.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{user.name || user.username}</div>
                <div className="text-xs text-gray-500">@{user.username}</div>
              </div>
            </div>
          </TableCell>
          <TableCell>{user.email}</TableCell>
          <TableCell>
            {getRoleBadge(user.role)}
          </TableCell>
          <TableCell>
            {getStatusBadge(user.status || 'active')}
          </TableCell>
          <TableCell>
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <i className="ri-more-2-fill"></i>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Gestionar Usuario</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEditUser(user.id)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Editar Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRoleChange(user.id, user.role)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Cambiar Rol
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUserAction('reiniciar contraseña', user.id)}>
                  <Key className="mr-2 h-4 w-4" />
                  Reiniciar Contraseña
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user.status === "active" ? (
                  <DropdownMenuItem 
                    className="text-red-600" 
                    onClick={() => onStatusChange(user.id, "disabled")}
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Deshabilitar Usuario
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onStatusChange(user.id, "active")}>
                    <Check className="mr-2 h-4 w-4" />
                    Activar Usuario
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </motion.tr>
      ))}
    </>
  );
}