import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Loader2,
  Search,
  AlertTriangle,
  Laptop,
  Wrench,
  MoreHorizontal,
  Plus,
  Calendar,
  ChevronRight,
} from 'lucide-react';

interface Equipment {
  id: number;
  name: string;
  code: string;
  typeId: number;
  status: string;
  location: string;
  installationDate: string | null;
  specifications: any;
  photo: string | null;
  notes: string | null;
  typeName?: string;
}

interface AssignEquipmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

const AssignEquipmentDialog: React.FC<AssignEquipmentDialogProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
  const [isShared, setIsShared] = useState(false);
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch available equipment (equipment not assigned to any project or with shared status)
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery<Equipment[]>({
    queryKey: ['/api/equipment/available'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/equipment/available');
      return await res.json();
    },
    enabled: isOpen,
  });

  // Fetch equipment already assigned to this project
  const { data: assignedEquipment, isLoading: isLoadingAssigned, refetch: refetchAssigned } = useQuery<any[]>({
    queryKey: ['/api/projects', projectId, 'equipment'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/projects/${projectId}/equipment`);
      return await res.json();
    },
    enabled: isOpen && !!projectId,
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedEquipment(null);
      setIsShared(false);
      setAuthorizationCode('');
      setReturnDate('');
      setNotes('');
      setShowAuthModal(false);
    }
  }, [isOpen]);

  const [currentAssignment, setCurrentAssignment] = useState<any>(null);

  // Check if equipment is already assigned to another project
  const checkEquipmentAssignment = async (equipmentId: number) => {
    try {
      const res = await apiRequest('GET', `/api/equipment/${equipmentId}/assignment`);
      const data = await res.json();
      
      if (data.isAssigned && data.projectId !== projectId) {
        // Equipment is assigned to another project
        setCurrentAssignment(data);
        setShowAuthModal(true);
        return true;
      }
      
      setCurrentAssignment(null);
      return false;
    } catch (error) {
      console.error('Error checking equipment assignment:', error);
      return false;
    }
  };

  // Assign equipment mutation
  const assignEquipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', `/api/projects/${projectId}/equipment`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Maquinaria asignada',
        description: 'La maquinaria ha sido asignada al proyecto correctamente',
      });
      refetchAssigned();
      queryClient.invalidateQueries({ queryKey: ['/api/equipment/available'] });
      
      // Reset form
      setSelectedEquipment(null);
      setIsShared(false);
      setAuthorizationCode('');
      setReturnDate('');
      setNotes('');
      setShowAuthModal(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo asignar la maquinaria al proyecto',
        variant: 'destructive',
      });
    },
  });

  // Remove assignment mutation
  const removeAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      await apiRequest('DELETE', `/api/projects/equipment/${assignmentId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Maquinaria removida',
        description: 'La maquinaria ha sido removida del proyecto',
      });
      refetchAssigned();
      queryClient.invalidateQueries({ queryKey: ['/api/equipment/available'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo remover la maquinaria del proyecto',
        variant: 'destructive',
      });
    },
  });

  const handleAssignEquipment = async () => {
    if (!selectedEquipment) {
      toast({
        title: 'Selección requerida',
        description: 'Seleccione una maquinaria para asignar al proyecto',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Error de autenticación',
        description: 'Debe iniciar sesión para realizar esta acción',
        variant: 'destructive',
      });
      return;
    }

    // Check if equipment is already assigned
    const isAssigned = await checkEquipmentAssignment(selectedEquipment);
    
    if (isAssigned && !isShared) {
      // Show authorization modal
      setShowAuthModal(true);
      return;
    }

    // If shared, authorization code is required
    if (isShared && !authorizationCode) {
      toast({
        title: 'Código requerido',
        description: 'Debe proporcionar un código de autorización para compartir la maquinaria',
        variant: 'destructive',
      });
      return;
    }

    const assignmentData = {
      equipmentId: selectedEquipment,
      assignedBy: user.id,
      expectedReturnDate: returnDate || null,
      isShared: isShared,
      authorizationCode: isShared ? authorizationCode : null,
      notes: notes || null,
    };

    assignEquipmentMutation.mutate(assignmentData);
  };

  // Filter equipment based on search term
  const filteredEquipment = equipment?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Maquinaria al Proyecto</DialogTitle>
          <DialogDescription>
            Seleccione equipamiento para asignarlo a este proyecto
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Form Section */}
          <Card className="p-4 bg-slate-50">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Buscar por nombre o código..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipment">Maquinaria</Label>
                  <Select
                    value={selectedEquipment?.toString() || ''}
                    onValueChange={(value) => setSelectedEquipment(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar maquinaria" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingEquipment ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : filteredEquipment.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No hay maquinaria disponible
                        </div>
                      ) : (
                        filteredEquipment.map(item => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            <div className="flex items-center">
                              {item.typeId === 1 ? (
                                <Laptop className="h-4 w-4 mr-2 text-blue-500" />
                              ) : (
                                <Wrench className="h-4 w-4 mr-2 text-orange-500" />
                              )}
                              <span>
                                {item.name} ({item.code})
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="returnDate">Fecha prevista de devolución</Label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <Input
                      type="date"
                      id="returnDate"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notas</Label>
                <Input 
                  id="notes" 
                  placeholder="Notas adicionales sobre la asignación..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isShared" 
                  checked={isShared}
                  onCheckedChange={(checked) => setIsShared(!!checked)}
                />
                <Label htmlFor="isShared">
                  Esta maquinaria podrá ser compartida con otros proyectos
                </Label>
              </div>
              
              {isShared && (
                <div>
                  <Label htmlFor="authCode">Código de autorización</Label>
                  <Input 
                    id="authCode" 
                    placeholder="Ingrese un código para autorizar el uso compartido"
                    value={authorizationCode}
                    onChange={(e) => setAuthorizationCode(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Este código será requerido si otro proyecto intenta usar esta maquinaria
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleAssignEquipment}
                disabled={!selectedEquipment || assignEquipmentMutation.isPending}
                className="w-full mt-2"
              >
                {assignEquipmentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Asignar al Proyecto
              </Button>
            </div>
          </Card>

          {/* Currently Assigned Equipment */}
          <div>
            <h3 className="font-medium mb-3">Maquinaria asignada a este proyecto</h3>
            
            {isLoadingAssigned ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !assignedEquipment || assignedEquipment.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground bg-gray-50 rounded-md">
                No hay maquinaria asignada a este proyecto
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Maquinaria</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Asignado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedEquipment.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {assignment.equipment.typeId === 1 ? (
                            <Laptop className="h-4 w-4 mr-2 text-blue-500" />
                          ) : (
                            <Wrench className="h-4 w-4 mr-2 text-orange-500" />
                          )}
                          <div>
                            <div>{assignment.equipment.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Código: {assignment.equipment.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {assignment.isShared ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Compartido
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Exclusivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(assignment.assignedDate).toLocaleDateString()}
                        </div>
                        {assignment.expectedReturnDate && (
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Devolución: {new Date(assignment.expectedReturnDate).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeAssignmentMutation.mutate(assignment.id)}
                          disabled={removeAssignmentMutation.isPending}
                        >
                          {removeAssignmentMutation.isPending && (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          )}
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Authorization Modal */}
        {showAuthModal && currentAssignment && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-red-700">Maquinaria en uso</h4>
                <p className="text-sm text-red-600">
                  Esta maquinaria ya está asignada a otro proyecto. Si desea asignarla aquí también, 
                  necesita autorización.
                </p>
                
                <div className="mt-2 p-3 bg-white rounded-md border border-red-100">
                  <h5 className="text-sm font-semibold flex items-center text-red-800">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Detalles de la asignación actual
                  </h5>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><span className="font-medium">Proyecto:</span> {currentAssignment.projectName}</p>
                    {currentAssignment.isShared && (
                      <Badge className="mt-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Compartido</Badge>
                    )}
                    {!currentAssignment.isShared && (
                      <Badge className="mt-1 bg-red-100 text-red-800 hover:bg-red-100">Exclusivo</Badge>
                    )}
                    {currentAssignment.expectedReturnDate && (
                      <p className="flex items-center text-xs mt-1 text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        Fecha esperada de devolución: {new Date(currentAssignment.expectedReturnDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <Label htmlFor="authorizationCode" className="text-red-700">
                    Código de autorización
                  </Label>
                  <Input 
                    id="authorizationCode"
                    value={authorizationCode}
                    onChange={(e) => setAuthorizationCode(e.target.value)}
                    placeholder="Ingrese el código de autorización"
                    className="mt-1 border-red-200"
                  />
                  {currentAssignment.isShared ? (
                    <p className="text-xs mt-1 text-red-600">
                      Esta maquinaria está configurada como compartida. Ingrese el código de autorización proporcionado.
                    </p>
                  ) : (
                    <p className="text-xs mt-1 text-red-600">
                      <strong>Atención:</strong> Esta maquinaria está configurada como exclusiva y no se recomienda compartirla.
                    </p>
                  )}
                  <div className="flex items-center mt-4 space-x-2">
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAuthModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setIsShared(true);
                        handleAssignEquipment();
                      }}
                      disabled={!authorizationCode}
                    >
                      Autorizar y asignar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignEquipmentDialog;