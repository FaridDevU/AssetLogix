import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, ProjectMember } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeCheck, UserPlus, X, Edit2, Trash2, Shield, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface ManageProjectMembersDialogProps {
  projectId: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface AddMemberFormProps {
  projectId: number;
  onSuccess?: () => void;
}

interface MemberItemProps {
  member: ProjectMember & { userDetails: User | null };
  projectId: number;
  onUpdate: () => void;
  canEdit: boolean;
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800 border-red-300";
    case "manager":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "member":
      return "bg-green-100 text-green-800 border-green-300";
    case "guest":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "observer":
      return "bg-purple-100 text-purple-800 border-purple-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case "admin":
      return <Shield className="h-4 w-4 text-red-600" />;
    case "manager":
      return <BadgeCheck className="h-4 w-4 text-amber-600" />;
    case "member":
      return <UserIcon className="h-4 w-4 text-green-600" />;
    case "guest":
      return <UserIcon className="h-4 w-4 text-blue-600" />;
    case "observer":
      return <UserIcon className="h-4 w-4 text-purple-600" />;
    default:
      return <UserIcon className="h-4 w-4 text-gray-600" />;
  }
}

function MemberItem({ member, projectId, onUpdate, canEdit }: MemberItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member.role);

  const removeMemberMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/projects/members/${member.id}`);
      if (!res.ok) {
        throw new Error("No se pudo eliminar el miembro");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Miembro eliminado",
        description: "El miembro ha sido eliminado del proyecto",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/members`] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/projects/members/${member.id}`, {
        role: selectedRole,
      });
      if (!res.ok) {
        throw new Error("No se pudo actualizar el rol");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Rol actualizado",
        description: "El rol del miembro ha sido actualizado",
      });
      setEditingRole(false);
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/members`] });
      onUpdate();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSelectedRole(member.role);
    },
  });

  const handleRemoveMember = () => {
    removeMemberMutation.mutate();
    setShowDeleteDialog(false);
  };

  const handleSaveRole = () => {
    if (selectedRole !== member.role) {
      updateRoleMutation.mutate();
    } else {
      setEditingRole(false);
    }
  };

  return (
    <TableRow>
      <TableCell className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={member.userDetails?.avatar || ""} alt={member.userDetails?.name || ""} />
          <AvatarFallback className="text-xs">
            {member.userDetails?.name?.substring(0, 2).toUpperCase() || "??"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{member.userDetails?.name || "Usuario desconocido"}</div>
          <div className="text-xs text-muted-foreground">{member.userDetails?.email}</div>
        </div>
      </TableCell>
      <TableCell>
        {editingRole ? (
          <div className="flex items-center gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gestor</SelectItem>
                <SelectItem value="member">Miembro</SelectItem>
                <SelectItem value="guest">Invitado</SelectItem>
                <SelectItem value="observer">Observador</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={handleSaveRole}>
              Guardar
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                setSelectedRole(member.role);
                setEditingRole(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Badge 
            variant="outline" 
            className={cn("rounded-md gap-1 flex items-center", getRoleBadgeColor(member.role))}
          >
            {getRoleIcon(member.role)}
            {member.role === "admin" ? "Administrador" : 
             member.role === "manager" ? "Gestor" : 
             member.role === "member" ? "Miembro" : 
             member.role === "guest" ? "Invitado" : 
             member.role === "observer" ? "Observador" : member.role}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {canEdit && (
          <div className="flex space-x-2 justify-end">
            {!editingRole && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingRole(true)}
                disabled={removeMemberMutation.isPending}
              >
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Editar rol</span>
              </Button>
            )}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={removeMemberMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span className="sr-only">Eliminar miembro</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres eliminar a este miembro del proyecto? Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={e => {
                      e.preventDefault();
                      handleRemoveMember();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

function AddMemberForm({ projectId, onSuccess }: AddMemberFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("member");

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => fetch("/api/users").then(res => res.json()),
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) {
        throw new Error("Por favor selecciona un usuario");
      }
      
      const res = await apiRequest("POST", `/api/projects/${projectId}/members`, {
        userId: selectedUserId,
        role: selectedRole,
      });
      
      if (!res.ok) {
        throw new Error("No se pudo añadir el miembro");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Miembro añadido",
        description: "El miembro ha sido añadido al proyecto exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/members`] });
      if (onSuccess) onSuccess();
      setSelectedUserId(null);
      setSelectedRole("member");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    addMemberMutation.mutate();
  };

  return (
    <form onSubmit={handleAddMember} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="user">Usuario</Label>
        <Select
          value={selectedUserId?.toString() || ""}
          onValueChange={(value) => setSelectedUserId(parseInt(value))}
        >
          <SelectTrigger id="user">
            <SelectValue placeholder="Selecciona un usuario" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingUsers ? (
              <SelectItem value="loading" disabled>
                Cargando usuarios...
              </SelectItem>
            ) : (
              users?.map((user: User) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name} ({user.email})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Selecciona un rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="manager">Gestor</SelectItem>
            <SelectItem value="member">Miembro</SelectItem>
            <SelectItem value="guest">Invitado</SelectItem>
            <SelectItem value="observer">Observador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={!selectedUserId || addMemberMutation.isPending}
      >
        {addMemberMutation.isPending ? "Añadiendo..." : "Añadir miembro"}
      </Button>
    </form>
  );
}

export function ManageProjectMembersDialog({ 
  projectId,
  trigger,
  open,
  onOpenChange
}: ManageProjectMembersDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Usa el estado externo de open si se proporciona, de lo contrario usa el estado interno
  const isOpen = open !== undefined ? open : dialogOpen;
  const setIsOpen = onOpenChange || setDialogOpen;
  
  const { 
    data: members, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/projects/${projectId}/members`],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (!res.ok) {
        throw new Error("No se pudieron cargar los miembros del proyecto");
      }
      return res.json();
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Determinar si el usuario actual puede editar miembros (admins pueden editar)
  const canEditMembers = user?.role === "admin" || members?.some(
    (member: ProjectMember & { userDetails: User | null }) => 
      member.userDetails?.id === user?.id && 
      (member.role === "admin" || member.role === "manager")
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestión de miembros del proyecto</DialogTitle>
          <DialogDescription>
            Añade, edita o elimina miembros del proyecto. Los miembros pueden acceder al proyecto según los permisos asignados.
          </DialogDescription>
        </DialogHeader>

        {isAddingMember ? (
          <div className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Añadir nuevo miembro</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingMember(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AddMemberForm
              projectId={projectId}
              onSuccess={() => setIsAddingMember(false)}
            />
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="py-6 text-center">Cargando miembros...</div>
            ) : members?.length > 0 ? (
              <div className="max-h-[350px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member: ProjectMember & { userDetails: User | null }) => (
                      <MemberItem
                        key={member.id}
                        member={member}
                        projectId={projectId}
                        onUpdate={refetch}
                        canEdit={canEditMembers}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                No hay miembros en este proyecto. Añade miembros usando el botón de abajo.
              </div>
            )}

            {canEditMembers && (
              <div className="mt-4">
                <Button
                  onClick={() => setIsAddingMember(true)}
                  className="w-full"
                  variant="outline"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Añadir miembro
                </Button>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}