import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Folder, User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trash2, UserPlus } from 'lucide-react';

interface Permission {
  id: number;
  userId: number;
  folderId: number;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  } | null;
}

interface ShareFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
}

const ShareFolderDialog: React.FC<ShareFolderDialogProps> = ({
  isOpen,
  onClose,
  folder,
}) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [permissionsToAdd, setPermissionsToAdd] = useState({
    canView: true,
    canEdit: false,
    canDelete: false,
    canShare: false,
    isOwner: false,
  });

  // Fetch users
  const {
    data: users,
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ['/api/users'],
    enabled: isOpen,
  });

  // Fetch folder permissions
  const {
    data: permissions,
    isLoading: isLoadingPermissions,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ['/api/folders', folder?.id, 'permissions'],
    queryFn: async () => {
      if (!folder) return [];
      
      try {
        const res = await apiRequest('GET', `/api/folders/${folder.id}/permissions`);
        return await res.json();
      } catch (error) {
        console.error('Error cargando permisos:', error);
        return [];
      }
    },
    enabled: isOpen && !!folder,
  });

  // Reset selected user when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedUserId('');
      setPermissionsToAdd({
        canView: true,
        canEdit: false,
        canDelete: false,
        canShare: false,
        isOwner: false,
      });
    }
  }, [isOpen]);

  // Add permission mutation
  const addPermissionMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!folder) throw new Error('Carpeta no seleccionada');
      
      const res = await apiRequest('POST', `/api/folders/${folder.id}/permissions`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Permiso añadido',
        description: 'Se ha compartido la carpeta con el usuario seleccionado.',
      });
      setSelectedUserId('');
      refetchPermissions();
      queryClient.invalidateQueries({ queryKey: ['/api/folders', folder?.id, 'permissions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo añadir el permiso',
        variant: 'destructive',
      });
    },
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ permissionId, userId, data }: any) => {
      if (!folder) throw new Error('Carpeta no seleccionada');
      
      const res = await apiRequest('PUT', `/api/folders/${folder.id}/permissions/${userId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Permiso actualizado',
        description: 'Se han actualizado los permisos del usuario.',
      });
      refetchPermissions();
      queryClient.invalidateQueries({ queryKey: ['/api/folders', folder?.id, 'permissions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el permiso',
        variant: 'destructive',
      });
    },
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!folder) throw new Error('Carpeta no seleccionada');
      
      await apiRequest('DELETE', `/api/folders/${folder.id}/permissions/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Permiso eliminado',
        description: 'Se ha eliminado el acceso del usuario a la carpeta.',
      });
      refetchPermissions();
      queryClient.invalidateQueries({ queryKey: ['/api/folders', folder?.id, 'permissions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el permiso',
        variant: 'destructive',
      });
    },
  });

  const handleAddPermission = () => {
    if (!selectedUserId) {
      toast({
        title: 'Usuario requerido',
        description: 'Selecciona un usuario para compartir la carpeta',
        variant: 'destructive',
      });
      return;
    }

    addPermissionMutation.mutate({
      userId: Number(selectedUserId),
      ...permissionsToAdd,
    });
  };

  const handleUpdatePermission = (permission: Permission, field: string, value: boolean) => {
    const data = { ...permission, [field]: value };
    delete data.user; // Remove user object before sending
    delete data.createdAt;
    delete data.updatedAt;
    
    updatePermissionMutation.mutate({
      permissionId: permission.id,
      userId: permission.userId,
      data,
    });
  };

  const handleDeletePermission = (permission: Permission) => {
    if (permission.isOwner) {
      toast({
        title: 'Acción no permitida',
        description: 'No puedes eliminar los permisos de un propietario',
        variant: 'destructive',
      });
      return;
    }
    
    deletePermissionMutation.mutate(permission.userId);
  };

  // Filter out users who already have permissions and current user
  const availableUsers = users?.filter(u => 
    !permissions?.some(p => p.userId === u.id) && u.id !== currentUser?.id
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartir carpeta</DialogTitle>
          <DialogDescription>
            Gestiona el acceso y los permisos para la carpeta {folder?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Add new user form */}
          <div className="flex flex-col space-y-4 p-4 border rounded-md bg-slate-50">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <UserPlus size={16} />
              Añadir usuario
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Select
                  value={selectedUserId.toString()}
                  onValueChange={(value) => setSelectedUserId(Number(value))}
                  disabled={isLoadingUsers || addPermissionMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No hay usuarios disponibles
                      </div>
                    ) : (
                      availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar || undefined} alt={user.name} />
                              <AvatarFallback>
                                {user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {user.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleAddPermission} 
                disabled={!selectedUserId || addPermissionMutation.isPending}
                className="shrink-0"
              >
                {addPermissionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Añadir
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canView"
                  checked={permissionsToAdd.canView}
                  onCheckedChange={(checked) =>
                    setPermissionsToAdd({ ...permissionsToAdd, canView: checked as boolean })
                  }
                />
                <Label htmlFor="canView">Ver</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canEdit"
                  checked={permissionsToAdd.canEdit}
                  onCheckedChange={(checked) =>
                    setPermissionsToAdd({ ...permissionsToAdd, canEdit: checked as boolean })
                  }
                />
                <Label htmlFor="canEdit">Editar</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canDelete"
                  checked={permissionsToAdd.canDelete}
                  onCheckedChange={(checked) =>
                    setPermissionsToAdd({ ...permissionsToAdd, canDelete: checked as boolean })
                  }
                />
                <Label htmlFor="canDelete">Eliminar</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canShare"
                  checked={permissionsToAdd.canShare}
                  onCheckedChange={(checked) =>
                    setPermissionsToAdd({ ...permissionsToAdd, canShare: checked as boolean })
                  }
                />
                <Label htmlFor="canShare">Compartir</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isOwner"
                  checked={permissionsToAdd.isOwner}
                  onCheckedChange={(checked) =>
                    setPermissionsToAdd({ ...permissionsToAdd, isOwner: checked as boolean })
                  }
                />
                <Label htmlFor="isOwner">Propietario</Label>
              </div>
            </div>
          </div>

          {/* Current permissions list */}
          <div>
            <h3 className="font-medium mb-3">Usuarios con acceso</h3>
            
            {isLoadingPermissions ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : permissions?.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No hay permisos configurados para esta carpeta
              </div>
            ) : (
              <div className="space-y-3">
                {permissions?.map((permission: Permission) => (
                  <div 
                    key={permission.id}
                    className="p-3 border rounded-md flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar>
                        <AvatarImage src={permission.user?.avatar || undefined} alt={permission.user?.name} />
                        <AvatarFallback>
                          {permission.user?.name?.substring(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{permission.user?.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {permission.user?.email}
                          {permission.isOwner && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              Propietario
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Only show permissions if not current user and not the owner */}
                      {(!permission.isOwner || currentUser?.role === 'admin') && (
                        <>
                          <div className="flex items-center space-x-1 text-xs">
                            <Checkbox
                              id={`view-${permission.id}`}
                              checked={permission.canView}
                              onCheckedChange={(checked) =>
                                handleUpdatePermission(permission, 'canView', checked as boolean)
                              }
                              disabled={updatePermissionMutation.isPending}
                            />
                            <Label htmlFor={`view-${permission.id}`}>Ver</Label>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs">
                            <Checkbox
                              id={`edit-${permission.id}`}
                              checked={permission.canEdit}
                              onCheckedChange={(checked) =>
                                handleUpdatePermission(permission, 'canEdit', checked as boolean)
                              }
                              disabled={updatePermissionMutation.isPending}
                            />
                            <Label htmlFor={`edit-${permission.id}`}>Editar</Label>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs">
                            <Checkbox
                              id={`delete-${permission.id}`}
                              checked={permission.canDelete}
                              onCheckedChange={(checked) =>
                                handleUpdatePermission(permission, 'canDelete', checked as boolean)
                              }
                              disabled={updatePermissionMutation.isPending}
                            />
                            <Label htmlFor={`delete-${permission.id}`}>Eliminar</Label>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-xs">
                            <Checkbox
                              id={`share-${permission.id}`}
                              checked={permission.canShare}
                              onCheckedChange={(checked) =>
                                handleUpdatePermission(permission, 'canShare', checked as boolean)
                              }
                              disabled={updatePermissionMutation.isPending}
                            />
                            <Label htmlFor={`share-${permission.id}`}>Compartir</Label>
                          </div>
                          
                          {currentUser?.role === 'admin' && (
                            <div className="flex items-center space-x-1 text-xs">
                              <Checkbox
                                id={`owner-${permission.id}`}
                                checked={permission.isOwner}
                                onCheckedChange={(checked) =>
                                  handleUpdatePermission(permission, 'isOwner', checked as boolean)
                                }
                                disabled={updatePermissionMutation.isPending}
                              />
                              <Label htmlFor={`owner-${permission.id}`}>Propietario</Label>
                            </div>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => handleDeletePermission(permission)}
                            disabled={deletePermissionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFolderDialog;