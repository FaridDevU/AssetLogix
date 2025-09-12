import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, PlusCircle, Search, Filter, Wrench, HardDrive, BarChart, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { equipment as equipmentSchema, equipmentTypes as equipmentTypesSchema } from "@shared/schema";

// Definición de tipos para los datos que manejamos
type Equipment = {
  id: number;
  name: string;
  code: string;
  typeId: number | null;
  status: string;
  location: string | null;
  installationDate: Date | null;
  specifications: any;
  photo: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Campo opcional agregado por el backend
  type?: { id: number, name: string };
};

type EquipmentType = {
  id: number;
  name: string;
  description: string | null;
};
import { motion, AnimatePresence } from "framer-motion";
import EquipmentCard from "@/components/EquipmentCard";

export default function InventoryPage() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all_types");
  const [selectedStatus, setSelectedStatus] = useState<string>("all_status");
  const [selectedLocation, setSelectedLocation] = useState<string>("all_locations");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"equipment" | "maintenance">("equipment");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch equipment
  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ['/api/equipment'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/equipment', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch equipment');
        return response.json();
      } catch (error) {
        console.error("Error fetching equipment:", error);
        return [];
      }
    }
  });

  // Fetch equipment types
  const { data: equipmentTypes = [], isLoading: typesLoading } = useQuery<EquipmentType[]>({
    queryKey: ['/api/equipment-types'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/equipment-types', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch equipment types');
        return response.json();
      } catch (error) {
        console.error("Error fetching equipment types:", error);
        return [];
      }
    }
  });

  // Generate unique locations from equipment
  const locations = Array.from(new Set(equipment.map(eq => eq.location).filter(Boolean))) as string[];

  // Filter equipment based on search and filters
  const filteredEquipment = equipment.filter(eq => {
    // Filter by search query
    if (searchQuery && !eq.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !eq.code.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by type
    if (selectedType !== "all_types" && (eq.typeId?.toString() !== selectedType)) {
      return false;
    }
    
    // Filter by status
    if (selectedStatus !== "all_status" && eq.status !== selectedStatus) {
      return false;
    }
    
    // Filter by location
    if (selectedLocation && selectedLocation !== "all_locations" && eq.location !== selectedLocation) {
      return false;
    }
    
    return true;
  });

  // Sort filtered equipment
  const sortedEquipment = [...filteredEquipment].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    } else if (sortBy === "type") {
      // Buscar el nombre del tipo de equipo para ordenar
      const typeA = equipmentTypes.find(t => t.id === a.typeId)?.name || "";
      const typeB = equipmentTypes.find(t => t.id === b.typeId)?.name || "";
      return typeA.localeCompare(typeB);
    } else if (sortBy === "recent") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });

  const handleViewDetails = (id: number) => {
    setLocation(`/inventory/${id}`);
  };

  const handleScheduleMaintenance = (id: number) => {
    setLocation(`/maintenance/schedule/new?equipmentId=${id}`);
  };

  // Mutation para eliminar un equipo
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/equipment/${id}`);
      if (!response.ok) {
        throw new Error('Error al eliminar el equipo');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment'] });
      toast({
        title: "Equipo eliminado",
        description: "El equipo ha sido eliminado correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al eliminar el equipo.",
        variant: "destructive",
      });
    }
  });

  // Manejar la eliminación de un equipo
  const handleDeleteEquipment = (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar este equipo? Esta acción no se puede deshacer.")) {
      deleteEquipmentMutation.mutate(id);
    }
  };

  return (
    <Layout currentModule="inventario">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Inventario y Mantenimiento</h1>
            <p className="text-gray-500 mt-1">
              Gestione equipos, mantenimientos y programaciones
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setLocation("/inventory/new")}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Activo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="equipment" onValueChange={(value) => setActiveTab(value as "equipment" | "maintenance")} className="w-full mb-6">
          <TabsList className="w-full max-w-md mx-auto">
            <TabsTrigger value="equipment" className="flex-1">
              <HardDrive className="h-4 w-4 mr-2" />
              Equipos
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex-1">
              <Wrench className="h-4 w-4 mr-2" />
              Mantenimientos
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">
              <BarChart className="h-4 w-4 mr-2" />
              Reportes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="equipment" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Filters sidebar */}
              <Card className="h-auto">
                <CardContent className="p-5">
                  <h3 className="text-lg font-medium text-secondary-900 mb-4">Filtros</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-secondary-700 mb-2">Buscar</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Buscar equipos..."
                          className="w-full pl-9 pr-4 py-2"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Search className="h-4 w-4 text-secondary-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm font-medium text-secondary-700">Tipo de equipo</Label>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs h-7 px-2 border-teal-600 text-teal-700 hover:bg-teal-50"
                          onClick={() => setLocation('/maintenance/settings?tab=equipment_types')}
                        >
                          Administrar tipos
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Checkbox
                            id="type-all"
                            checked={selectedType === "all_types"}
                            onCheckedChange={() => setSelectedType("all_types")}
                          />
                          <Label htmlFor="type-all" className="ml-2 text-sm text-secondary-600">Todos</Label>
                        </div>
                        
                        {equipmentTypes.map((type) => (
                          <div key={type.id} className="flex items-center">
                            <Checkbox
                              id={`type-${type.id}`}
                              checked={selectedType === type.id.toString()}
                              onCheckedChange={() => setSelectedType(type.id.toString())}
                            />
                            <Label htmlFor={`type-${type.id}`} className="ml-2 text-sm text-secondary-600">{type.name}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-secondary-700 mb-2">Estado</Label>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Checkbox
                            id="status-all"
                            checked={selectedStatus === "all_status"}
                            onCheckedChange={() => setSelectedStatus("all_status")}
                          />
                          <Label htmlFor="status-all" className="ml-2 text-sm text-secondary-600">Todos</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="status-operational"
                            checked={selectedStatus === "operational"}
                            onCheckedChange={() => setSelectedStatus("operational")}
                          />
                          <Label htmlFor="status-operational" className="ml-2 text-sm text-secondary-600">Operativos</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="status-maintenance"
                            checked={selectedStatus === "maintenance"}
                            onCheckedChange={() => setSelectedStatus("maintenance")}
                          />
                          <Label htmlFor="status-maintenance" className="ml-2 text-sm text-secondary-600">En Mantenimiento</Label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="status-outofservice"
                            checked={selectedStatus === "out_of_service"}
                            onCheckedChange={() => setSelectedStatus("out_of_service")}
                          />
                          <Label htmlFor="status-outofservice" className="ml-2 text-sm text-secondary-600">Fuera de Servicio</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-secondary-700 mb-2">Ubicación</Label>
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Todas las ubicaciones" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_locations">Todas las ubicaciones</SelectItem>
                          {locations.map((location) => (
                            <SelectItem key={location} value={location}>{location}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        className="w-full bg-primary-600 text-white rounded-md py-2 text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        onClick={() => {
                          // Filters are already applied on change, this button is just for UX
                          toast({
                            title: "Filtros aplicados",
                            description: "Se han aplicado los filtros seleccionados."
                          });
                        }}
                      >
                        Aplicar filtros
                      </Button>
                      <Button
                        variant="link"
                        className="w-full text-primary-600 hover:text-primary-800 py-2 text-sm font-medium"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedType("all_types");
                          setSelectedStatus("all_status");
                          setSelectedLocation("all_locations");
                        }}
                      >
                        Limpiar filtros
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Equipment catalog */}
              <div className="md:col-span-3">
                <Card className="h-full">
                  {/* Catalog header */}
                  <div className="p-5 border-b border-secondary-100 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-secondary-900">Catálogo de Equipos</h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={viewMode === "list" ? "bg-secondary-100" : ""}
                        onClick={() => setViewMode("list")}
                      >
                        <i className="ri-list-check"></i>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={viewMode === "grid" ? "bg-secondary-100" : ""}
                        onClick={() => setViewMode("grid")}
                      >
                        <i className="ri-layout-grid-line"></i>
                      </Button>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recent">Recientes primero</SelectItem>
                          <SelectItem value="name">Nombre (A-Z)</SelectItem>
                          <SelectItem value="status">Estado</SelectItem>
                          <SelectItem value="type">Tipo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Equipment cards/list */}
                  <div className="p-5">
                    {equipmentLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                      </div>
                    ) : sortedEquipment.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Filter className="h-16 w-16 text-secondary-300 mb-4" />
                        <h3 className="text-xl font-medium text-secondary-600">No se encontraron equipos</h3>
                        <p className="text-secondary-500 mt-2 max-w-md">
                          {searchQuery || selectedType !== "all_types" || selectedStatus !== "all_status" || selectedLocation !== "all_locations"
                            ? "Intente modificar los filtros de búsqueda para encontrar lo que busca."
                            : "No hay equipos registrados en el sistema. Cree un nuevo equipo para comenzar."}
                        </p>
                        <Button 
                          onClick={() => setLocation("/inventory/new")}
                          className="mt-6 bg-teal-600 hover:bg-teal-700"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Nuevo Activo
                        </Button>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={viewMode === "grid" 
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                          : "space-y-3"
                        }
                      >
                        <AnimatePresence>
                          {sortedEquipment.map((item) => (
                            <motion.div 
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              layout
                              transition={{
                                duration: 0.2,
                                type: "spring",
                                stiffness: 100
                              }}
                            >
                              <EquipmentCard
                                equipment={item}
                                viewMode={viewMode}
                                onViewDetails={handleViewDetails}
                                onScheduleMaintenance={handleScheduleMaintenance}
                                onDelete={handleDeleteEquipment}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mantenimientos Programados</CardTitle>
                <CardDescription>
                  Gestione los mantenimientos programados para todos los equipos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between">
                    <Button 
                      className="bg-teal-600 hover:bg-teal-700"
                      onClick={() => setLocation("/maintenance/schedule/new")}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Programar Mantenimiento
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setLocation("/maintenance/dashboard")}>
                        <BarChart className="mr-2 h-4 w-4" />
                        Dashboard de Mantenimiento
                      </Button>
                      <Button variant="outline" onClick={() => setLocation("/maintenance/catalog")}>
                        <i className="ri-list-check mr-2"></i>
                        Ver Todos
                      </Button>
                    </div>
                  </div>
                  
                  {equipmentLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                    </div>
                  ) : filteredEquipment.length === 0 ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="text-center">
                        <Wrench className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600">No hay equipos disponibles</h3>
                        <p className="text-gray-500 max-w-md mt-2">
                          Agregue equipos para programar mantenimientos.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredEquipment.map((eq) => (
                        <Card key={eq.id} className="hover:shadow-md transition-shadow duration-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{eq.name}</CardTitle>
                            <CardDescription>Código: {eq.code}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Tipo:</span>
                                <span className="text-sm font-medium">{equipmentTypes.find(t => t.id === eq.typeId)?.name || "N/A"}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Estado:</span>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium
                                  ${eq.status === 'operational' ? 'bg-success-100 text-success-800' : 
                                  eq.status === 'maintenance' ? 'bg-warning-100 text-warning-800' : 
                                  'bg-error-100 text-error-800'}`}>
                                  {eq.status === 'operational' ? 'Operativo' : 
                                   eq.status === 'maintenance' ? 'En Mantenimiento' : 
                                   'Fuera de Servicio'}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0 flex justify-between">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewDetails(eq.id)}
                            >
                              Ver Detalles
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-primary-600 border-primary-600"
                              onClick={() => setLocation(`/maintenance/schedule/new?equipmentId=${eq.id}`)}
                            >
                              <Wrench className="mr-2 h-4 w-4" />
                              Programar
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Reportes e Informes</CardTitle>
                <CardDescription>
                  Visualice informes y estadísticas sobre el inventario y mantenimientos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <BarChart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-600">Módulo en desarrollo</h3>
                    <p className="text-gray-500 max-w-md mt-2">
                      El módulo de reportes e informes estará disponible próximamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}