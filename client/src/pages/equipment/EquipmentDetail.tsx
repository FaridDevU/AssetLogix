import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Calendar, Clock, Edit, Loader2, Trash2, Wrench, PlusCircle, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Equipment, EquipmentType, MaintenanceIntervention } from "@shared/schema";
import EditEquipmentModal from "./EditEquipmentModal";

interface EquipmentDetailProps {
  id: string;
}

export default function EquipmentDetail({ id }: EquipmentDetailProps) {
  const equipmentId = parseInt(id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Validar la autenticación y el ID de equipo
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        toast({
          title: "Acceso no autorizado",
          description: "Debe iniciar sesión para ver los detalles del equipo.",
          variant: "destructive"
        });
        setLocation("/auth");
        return;
      }
      
      if (isNaN(equipmentId)) {
        toast({
          title: "ID de equipo inválido",
          description: "El identificador del equipo no es válido.",
          variant: "destructive"
        });
        setLocation("/inventory");
      }
    }
  }, [equipmentId, user, isAuthLoading, setLocation, toast]);
  
  // Fetch equipment details
  const { 
    data: equipment, 
    isLoading: isLoadingEquipment,
    isError: isEquipmentError
  } = useQuery<Equipment>({
    queryKey: ["/api/equipment", equipmentId.toString()],
    queryFn: async () => {
      try {
        console.log(`Fetching equipment details for ID: ${equipmentId}`);
        const response = await fetch(`/api/equipment/${equipmentId}`, { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          } 
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error ${response.status} al obtener información del equipo: ${errorText}`);
          throw new Error(`Error al obtener información del equipo: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Equipment data received:', data);
        
        // Si la foto no existe o es nula, establecer una ruta predeterminada
        if (!data.photo) {
          data.photo = '/uploads/equipment/default-equipment.png';
        }
        
        return data;
      } catch (error) {
        console.error("Error fetching equipment details:", error);
        throw error;
      }
    },
    enabled: !isNaN(equipmentId) && !!user,
    retry: 2
  });

  // Fetch equipment type
  const { data: types } = useQuery<EquipmentType[]>({
    queryKey: ["/api/equipment-types"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/equipment-types', { credentials: 'include' });
        if (!response.ok) throw new Error(`Error al obtener tipos de equipo: ${response.status}`);
        return response.json();
      } catch (error) {
        console.error("Error fetching equipment types:", error);
        return [];
      }
    },
    enabled: !!user
  });

  // Fetch maintenance history
  const { 
    data: maintenanceHistory,
    isLoading: isLoadingHistory
  } = useQuery<MaintenanceIntervention[]>({
    queryKey: [`/api/maintenance/equipment/${equipmentId}`],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/maintenance/equipment/${equipmentId}`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Error al obtener historial de mantenimiento: ${response.status}`);
        return response.json();
      } catch (error) {
        console.error("Error fetching maintenance history:", error);
        return []; // Retorna arreglo vacío en lugar de error para evitar fallos en la interfaz
      }
    },
    enabled: !isNaN(equipmentId) && !!user
  });

  // Delete equipment mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/equipment/${equipmentId}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Activo eliminado",
        description: "El activo ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      setLocation("/inventory");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  const handleGoBack = () => {
    setLocation("/inventory");
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleScheduleMaintenance = () => {
    setLocation(`/inventory/maintenance/schedule/${equipmentId}`);
  };

  if (isAuthLoading || isLoadingEquipment) {
    return (
      <Layout currentModule="inventario">
        <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {isAuthLoading ? "Verificando acceso..." : "Cargando información del equipo..."}
          </p>
        </div>
      </Layout>
    );
  }

  if (isEquipmentError || !equipment) {
    return (
      <Layout currentModule="inventario">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-700">
              No se pudo cargar la información del activo
            </h2>
            <p className="text-gray-500 mt-2">
              El activo solicitado no existe o hubo un error al cargar sus datos.
            </p>
            <Button 
              onClick={handleGoBack} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al listado
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const equipmentType = types?.find(t => t.id === equipment.typeId)?.name || "No especificado";
  const specifications = equipment.specifications as Record<string, any> || {};
  const installationDate = equipment.installationDate 
    ? new Date(equipment.installationDate).toLocaleDateString() 
    : "No especificada";

  // Agrupar mantenimientos por tipo (preventivos, correctivos)
  const preventiveMaintenance = maintenanceHistory?.filter(m => m.type === "preventive") || [];
  const correctiveMaintenance = maintenanceHistory?.filter(m => m.type === "corrective") || [];

  return (
    <Layout currentModule="inventario">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al listado
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {equipment.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{equipment.code}</Badge>
                <Badge className={
                  equipment.status === "operational" ? "bg-green-500" :
                  equipment.status === "maintenance" ? "bg-amber-500" :
                  equipment.status === "repair" ? "bg-red-500" :
                  "bg-gray-500"
                }>
                  {equipment.status === "operational" ? "Operativo" :
                   equipment.status === "maintenance" ? "En Mantenimiento" :
                   equipment.status === "repair" ? "En Reparación" :
                   "Inactivo"}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleEdit}
                className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDelete}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
              <Button 
                onClick={handleScheduleMaintenance}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Wrench className="mr-2 h-4 w-4" />
                Programar Mantenimiento
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda con información del equipo */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <div className="relative h-[250px] overflow-hidden">
                  <img
                    src={equipment.photo || "/uploads/equipment/default-equipment.png"}
                    alt={equipment.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Error loading image:", e);
                      // Fallback image if there's an error loading the photo
                      e.currentTarget.src = "/uploads/equipment/default-equipment.png";
                    }}
                  />
                  <div className="absolute bottom-3 right-3">
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="bg-white/80 hover:bg-white shadow-sm"
                      onClick={handleEdit}
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      Cambiar foto
                    </Button>
                  </div>
                </div>
                
                <CardContent className="pt-6">
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                      <dd className="mt-1 text-sm text-gray-900">{equipmentType}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
                      <dd className="mt-1 text-sm text-gray-900">{equipment.location || "No especificada"}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Fecha de Instalación</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {installationDate}
                      </dd>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Notas</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {equipment.notes || "Sin notas adicionales"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Columna derecha con tabs de especificaciones y mantenimientos */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Tabs defaultValue="specs" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="specs" className="flex-1">Especificaciones</TabsTrigger>
                  <TabsTrigger value="maintenance" className="flex-1">Historial de Mantenimiento</TabsTrigger>
                </TabsList>
                
                <TabsContent value="specs" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Especificaciones Técnicas</CardTitle>
                      <CardDescription>
                        Detalles y características técnicas del equipo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(specifications).length > 0 ? (
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                          {Object.entries(specifications).map(([key, value]) => (
                            <div key={key}>
                              <dt className="text-sm font-medium text-gray-500 capitalize">{key}</dt>
                              <dd className="mt-1 text-sm text-gray-900">{value as string}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-gray-500 italic">No hay especificaciones registradas</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Especificaciones
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="maintenance" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">Historial de Mantenimiento</CardTitle>
                          <CardDescription>
                            Registro de mantenimientos preventivos y correctivos
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={handleScheduleMaintenance}
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Nuevo Mantenimiento
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingHistory ? (
                        <div className="py-8 flex justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : maintenanceHistory && maintenanceHistory.length > 0 ? (
                        <div className="space-y-6">
                          {/* Mantenimientos preventivos */}
                          <div>
                            <h3 className="font-medium text-gray-700 mb-3">Mantenimientos Preventivos</h3>
                            {preventiveMaintenance.length > 0 ? (
                              <div className="space-y-3">
                                {preventiveMaintenance.map((maintenance) => (
                                  <Card key={maintenance.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                      <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                          Preventivo
                                        </Badge>
                                        <Badge className={
                                          maintenance.status === "scheduled" ? "bg-blue-500" :
                                          maintenance.status === "in-progress" ? "bg-amber-500" :
                                          maintenance.status === "completed" ? "bg-green-500" :
                                          "bg-red-500"
                                        }>
                                          {maintenance.status === "scheduled" ? "Programado" :
                                           maintenance.status === "in-progress" ? "En Progreso" :
                                           maintenance.status === "completed" ? "Completado" :
                                           "Cancelado"}
                                        </Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-sm">
                                        <div className="flex items-center mb-2">
                                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                          <span>
                                            {new Date(maintenance.startDate).toLocaleDateString()}
                                            {maintenance.endDate && ` - ${new Date(maintenance.endDate).toLocaleDateString()}`}
                                          </span>
                                        </div>
                                        {maintenance.findings && (
                                          <p className="text-gray-700 mb-2">
                                            <span className="font-medium">Hallazgos:</span> {maintenance.findings}
                                          </p>
                                        )}
                                        {maintenance.actions && (
                                          <p className="text-gray-700">
                                            <span className="font-medium">Acciones:</span> {maintenance.actions}
                                          </p>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No hay mantenimientos preventivos registrados</p>
                            )}
                          </div>
                          
                          {/* Mantenimientos correctivos */}
                          <div>
                            <h3 className="font-medium text-gray-700 mb-3">Mantenimientos Correctivos</h3>
                            {correctiveMaintenance.length > 0 ? (
                              <div className="space-y-3">
                                {correctiveMaintenance.map((maintenance) => (
                                  <Card key={maintenance.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                      <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                                          Correctivo
                                        </Badge>
                                        <Badge className={
                                          maintenance.status === "scheduled" ? "bg-blue-500" :
                                          maintenance.status === "in-progress" ? "bg-amber-500" :
                                          maintenance.status === "completed" ? "bg-green-500" :
                                          "bg-red-500"
                                        }>
                                          {maintenance.status === "scheduled" ? "Programado" :
                                           maintenance.status === "in-progress" ? "En Progreso" :
                                           maintenance.status === "completed" ? "Completado" :
                                           "Cancelado"}
                                        </Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="text-sm">
                                        <div className="flex items-center mb-2">
                                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                          <span>
                                            {new Date(maintenance.startDate).toLocaleDateString()}
                                            {maintenance.endDate && ` - ${new Date(maintenance.endDate).toLocaleDateString()}`}
                                          </span>
                                        </div>
                                        {maintenance.findings && (
                                          <p className="text-gray-700 mb-2">
                                            <span className="font-medium">Hallazgos:</span> {maintenance.findings}
                                          </p>
                                        )}
                                        {maintenance.actions && (
                                          <p className="text-gray-700">
                                            <span className="font-medium">Acciones:</span> {maintenance.actions}
                                          </p>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No hay mantenimientos correctivos registrados</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600">Sin Historial de Mantenimiento</h3>
                          <p className="text-gray-500 mt-1">
                            Este equipo aún no tiene registros de mantenimiento
                          </p>
                          <Button 
                            onClick={handleScheduleMaintenance}
                            className="mt-4 bg-teal-600 hover:bg-teal-700"
                          >
                            Programar Primer Mantenimiento
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Modal para editar el equipo */}
      {isEditModalOpen && (
        <EditEquipmentModal
          equipment={equipment}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
      
      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este activo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este equipo y todo su historial de mantenimiento del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}