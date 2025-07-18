import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { X, Plus, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Layout from "@/components/Layout";

// Tipos para equipos
interface EquipmentType {
  id: number;
  name: string;
  description: string | null;
}

// Esquemas de validación para formularios
const equipmentTypeSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional().nullable(),
});

export default function MaintenanceSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // Extraer parámetros de URL
  const params = new URLSearchParams(location.split('?')[1] || '');
  const tabFromUrl = params.get('tab');
  
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [reminderDays, setReminderDays] = useState<number>(7);
  const [autoStatusChange, setAutoStatusChange] = useState<boolean>(true);
  const [qrCodesEnabled, setQrCodesEnabled] = useState<boolean>(true);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'equipment_types' ? 'categories' : 'general');
  
  // Consulta para obtener los tipos de equipo
  const { 
    data: equipmentTypes = [], 
    isLoading: isLoadingTypes,
    isError: isErrorTypes,
  } = useQuery<EquipmentType[]>({
    queryKey: ["/api/equipment-types"],
    queryFn: async () => {
      const response = await fetch('/api/equipment-types', { credentials: 'include' });
      if (!response.ok) throw new Error('Error al obtener tipos de equipo');
      return response.json();
    },
    enabled: !!user && user.role === 'admin'
  });
  
  // Mutación para crear un nuevo tipo de equipo
  const createEquipmentTypeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof equipmentTypeSchema>) => {
      const response = await fetch('/api/equipment-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Error al crear tipo de equipo');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tipo de equipo creado",
        description: `El tipo de equipo ${data.name} ha sido creado exitosamente.`,
      });
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al crear el tipo de equipo.",
        variant: "destructive",
      });
    }
  });
  
  // Mutación para eliminar un tipo de equipo
  const deleteEquipmentTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/equipment-types/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Error al eliminar tipo de equipo');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tipo de equipo eliminado",
        description: "El tipo de equipo ha sido eliminado exitosamente.",
      });
      setDeleteDialogOpen(false);
      setSelectedTypeId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al eliminar el tipo de equipo.",
        variant: "destructive",
      });
    }
  });
  
  // Manejadores de eventos
  const handleDeleteEquipmentType = () => {
    if (selectedTypeId) {
      deleteEquipmentTypeMutation.mutate(selectedTypeId);
    }
  };
  
  // Form para crear un nuevo tipo de equipo
  const newTypeForm = useForm<z.infer<typeof equipmentTypeSchema>>({
    resolver: zodResolver(equipmentTypeSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const onSubmitNewType = (data: z.infer<typeof equipmentTypeSchema>) => {
    createEquipmentTypeMutation.mutate(data);
  };
  
  // Función para guardar la configuración general
  const handleSaveGeneral = () => {
    toast({
      title: "Configuración guardada",
      description: "La configuración general ha sido actualizada.",
    });
  };
  
  const handleSaveEquipment = () => {
    toast({
      title: "Configuración guardada",
      description: "La configuración de equipos ha sido actualizada.",
    });
  };
  
  return (
    <Layout currentModule="configuracion">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Configuración de Mantenimiento</h2>
        </div>
  
        <Tabs 
          defaultValue="general" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="equipment">Equipos</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            <TabsTrigger value="categories">Tipos y Categorías</TabsTrigger>
          </TabsList>
          
          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                  Ajustes generales del sistema de mantenimiento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="timezone">Zona horaria</Label>
                  <Select defaultValue="america-mexico_city">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar zona horaria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america-mexico_city">América/Ciudad de México (UTC-6)</SelectItem>
                      <SelectItem value="america-bogota">América/Bogotá (UTC-5)</SelectItem>
                      <SelectItem value="america-santiago">América/Santiago (UTC-4)</SelectItem>
                      <SelectItem value="america-buenos_aires">América/Buenos Aires (UTC-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="date-format">Formato de fecha</Label>
                  <Select defaultValue="dd-mm-yyyy">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                      <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="unit-system">Sistema de unidades</Label>
                  <Select defaultValue="metric">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Métrico (kg, cm, °C)</SelectItem>
                      <SelectItem value="imperial">Imperial (lb, in, °F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cambio automático de estado</Label>
                    <p className="text-sm text-secondary-500">
                      Actualizar automáticamente el estado de los equipos según su último mantenimiento
                    </p>
                  </div>
                  <Switch 
                    checked={autoStatusChange} 
                    onCheckedChange={setAutoStatusChange} 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveGeneral}>Guardar cambios</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Equipment Settings */}
          <TabsContent value="equipment">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Equipos</CardTitle>
                <CardDescription>
                  Ajustes relacionados con la gestión de equipos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Códigos QR</Label>
                    <p className="text-sm text-secondary-500">
                      Habilitar generación de códigos QR para cada equipo
                    </p>
                  </div>
                  <Switch 
                    checked={qrCodesEnabled} 
                    onCheckedChange={setQrCodesEnabled} 
                  />
                </div>
                
                <div>
                  <Label className="text-sm">ID secuencial para equipos</Label>
                  <Select defaultValue="type-seq">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global-seq">Secuencial global (EQ-0001)</SelectItem>
                      <SelectItem value="type-seq">Secuencial por tipo (MOT-0001)</SelectItem>
                      <SelectItem value="location-seq">Secuencial por ubicación (PLANTA1-0001)</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label>Prefijo para códigos de equipo</Label>
                  <Input placeholder="EQ-" />
                </div>
                
                <div className="space-y-1">
                  <Label>Campos obligatorios</Label>
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="req-location" />
                      <Label htmlFor="req-location">Ubicación</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="req-installdate" />
                      <Label htmlFor="req-installdate">Fecha de instalación</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="req-specs" />
                      <Label htmlFor="req-specs">Especificaciones</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveEquipment}>Guardar cambios</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Notificaciones</CardTitle>
                <CardDescription>
                  Ajustes para recibir alertas y recordatorios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones</Label>
                    <p className="text-sm text-secondary-500">
                      Habilitar todas las notificaciones del sistema
                    </p>
                  </div>
                  <Switch 
                    checked={notificationsEnabled} 
                    onCheckedChange={setNotificationsEnabled} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por correo</Label>
                    <p className="text-sm text-secondary-500">
                      Recibir notificaciones por correo electrónico
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                    disabled={!notificationsEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Días de anticipación para recordatorios</Label>
                    <span className="text-sm text-secondary-500">{reminderDays} días</span>
                  </div>
                  <Slider
                    disabled={!notificationsEnabled}
                    value={[reminderDays]}
                    onValueChange={(value) => setReminderDays(value[0])}
                    min={1}
                    max={30}
                    step={1}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label>Enviar notificaciones para</Label>
                  <Select defaultValue="all" disabled={!notificationsEnabled}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los mantenimientos</SelectItem>
                      <SelectItem value="preventive">Solo mantenimientos preventivos</SelectItem>
                      <SelectItem value="corrective">Solo mantenimientos correctivos</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Configuración guardada",
                      description: "La configuración de notificaciones ha sido actualizada.",
                    });
                  }}
                  disabled={!notificationsEnabled}
                >
                  Guardar cambios
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Categories Settings */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Tipos y Categorías</CardTitle>
                <CardDescription>
                  Administra los tipos de equipos y categorías de mantenimiento.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="equipment-types">
                  <TabsList className="mb-4">
                    <TabsTrigger value="equipment-types">Tipos de Equipo</TabsTrigger>
                    <TabsTrigger value="maintenance-types">Tipos de Mantenimiento</TabsTrigger>
                    <TabsTrigger value="status-options">Estados</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="equipment-types">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Tipos de equipo existentes</h4>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="flex items-center">
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar tipo
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Crear nuevo tipo de equipo</DialogTitle>
                              <DialogDescription>
                                Añade un nuevo tipo de equipo al sistema.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...newTypeForm}>
                              <form onSubmit={newTypeForm.handleSubmit(onSubmitNewType)} className="space-y-4">
                                <FormField
                                  control={newTypeForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nombre</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Ej: Motor Eléctrico" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={newTypeForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Descripción</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          {...field} 
                                          value={field.value || ''} 
                                          placeholder="Descripción opcional" 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter className="pt-4">
                                  <Button 
                                    type="submit" 
                                    disabled={createEquipmentTypeMutation.isPending}
                                  >
                                    {createEquipmentTypeMutation.isPending ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Guardando...
                                      </>
                                    ) : 'Guardar'}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <div className="border rounded-md">
                        <div className="bg-secondary-50 px-4 py-2 border-b">
                          <div className="grid grid-cols-3 gap-4 text-xs font-medium text-secondary-500 uppercase">
                            <div>Nombre</div>
                            <div>Descripción</div>
                            <div className="text-right">Acciones</div>
                          </div>
                        </div>
                        <div className="divide-y">
                          {isLoadingTypes ? (
                            <div className="py-12 flex justify-center items-center">
                              <Loader2 className="h-8 w-8 animate-spin text-secondary-400" />
                            </div>
                          ) : isErrorTypes ? (
                            <div className="py-8 text-center">
                              <p className="text-error-500">Error al cargar tipos de equipo</p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2" 
                                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/equipment-types"] })}
                              >
                                Reintentar
                              </Button>
                            </div>
                          ) : equipmentTypes.length === 0 ? (
                            <div className="py-8 text-center text-secondary-400">
                              No hay tipos de equipo definidos
                            </div>
                          ) : (
                            equipmentTypes.map((type) => (
                              <div key={type.id} className="grid grid-cols-3 gap-4 px-4 py-3 items-center">
                                <div className="font-medium">{type.name}</div>
                                <div className="text-sm text-secondary-500">{type.description || '—'}</div>
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="flex items-center text-white font-bold px-4 py-2 bg-red-600 hover:bg-red-700 shadow-sm"
                                    onClick={() => {
                                      setSelectedTypeId(type.id);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Eliminar
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="maintenance-types">
                    <div className="space-y-4">
                      <div className="text-center py-12 text-secondary-400">
                        Próximamente: Configuración de tipos de mantenimiento
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="status-options">
                    <div className="space-y-4">
                      <div className="text-center py-12 text-secondary-400">
                        Próximamente: Configuración de estados de equipos
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedTypeId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el tipo de equipo seleccionado.
              Si hay equipos asociados a este tipo, podrían verse afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEquipmentType}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteEquipmentTypeMutation.isPending}
            >
              {deleteEquipmentTypeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}