import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EquipmentCard from "@/components/EquipmentCard";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: number;
  name: string;
  code: string;
  typeId: number;
  status: string;
  location: string;
  installationDate: string;
  specifications: Record<string, any>;
  photo: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  type?: {
    id: number;
    name: string;
  };
}

interface EquipmentType {
  id: number;
  name: string;
  description?: string;
}

export default function MaintenanceCatalog() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all_locations");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const { toast } = useToast();

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
  const locations = Array.from(new Set(equipment.map(eq => eq.location).filter(Boolean)));

  // Filter equipment based on search and filters
  const filteredEquipment = equipment.filter(eq => {
    // Filter by search query
    if (searchQuery && !eq.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !eq.code.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by type
    if (selectedType !== "all" && eq.typeId.toString() !== selectedType) {
      return false;
    }
    
    // Filter by status
    if (selectedStatus !== "all" && eq.status !== selectedStatus) {
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
      const typeA = a.type?.name || "";
      const typeB = b.type?.name || "";
      return typeA.localeCompare(typeB);
    } else if (sortBy === "recent") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });

  const handleViewDetails = (id: number) => {
    setSelectedEquipmentId(id);
  };

  const handleScheduleMaintenance = (id: number) => {
    toast({
      title: "Función no implementada",
      description: "La programación de mantenimiento se implementará próximamente.",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
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
                  <i className="ri-search-line text-secondary-400"></i>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-secondary-700 mb-2">Tipo de equipo</Label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Checkbox
                    id="type-all"
                    checked={selectedType === "all"}
                    onCheckedChange={() => setSelectedType("all")}
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
                    checked={selectedStatus === "all"}
                    onCheckedChange={() => setSelectedStatus("all")}
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
            
            <div>
              <Label className="text-sm font-medium text-secondary-700 mb-2">Antigüedad</Label>
              <div className="flex items-center space-x-2">
                <Input type="number" placeholder="Min" className="w-full" />
                <span className="text-secondary-500">-</span>
                <Input type="number" placeholder="Max" className="w-full" />
                <span className="text-secondary-500">años</span>
              </div>
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
                  setSelectedType("all");
                  setSelectedStatus("all");
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
              <Button className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700">
                <i className="ri-add-line mr-1"></i>
                Nuevo Equipo
              </Button>
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
                <i className="ri-tools-line text-5xl text-secondary-300"></i>
                <h3 className="mt-2 text-lg font-medium text-secondary-900">No se encontraron equipos</h3>
                <p className="mt-1 text-secondary-500 max-w-md">
                  No hay equipos que coincidan con los criterios de búsqueda.
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedEquipment.map((eq) => (
                  <EquipmentCard 
                    key={eq.id} 
                    equipment={eq} 
                    viewMode="grid"
                    onViewDetails={handleViewDetails}
                    onScheduleMaintenance={handleScheduleMaintenance}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Equipo</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Tipo</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Estado</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Ubicación</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Instalación</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-100">
                    {sortedEquipment.map((eq) => (
                      <EquipmentCard 
                        key={eq.id} 
                        equipment={eq} 
                        viewMode="list"
                        onViewDetails={handleViewDetails}
                        onScheduleMaintenance={handleScheduleMaintenance}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {sortedEquipment.length > 0 && (
            <div className="px-5 py-3 border-t border-secondary-100 flex items-center justify-between">
              <div className="text-sm text-secondary-500">
                Mostrando <span className="font-medium">1</span> a <span className="font-medium">{sortedEquipment.length}</span> de <span className="font-medium">{equipment.length}</span> equipos
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={true}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-primary-50 border-primary-500 text-primary-600 font-medium"
                >
                  1
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={equipment.length <= sortedEquipment.length}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* Equipment details dialog */}
      {selectedEquipmentId && (
        <Dialog open={!!selectedEquipmentId} onOpenChange={open => !open && setSelectedEquipmentId(null)}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalles del Equipo</DialogTitle>
            </DialogHeader>
            
            {/* Equipment details content */}
            {equipment.find(eq => eq.id === selectedEquipmentId) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="rounded-lg overflow-hidden h-64 bg-secondary-100">
                    <img 
                      src={equipment.find(eq => eq.id === selectedEquipmentId)?.photo || "https://via.placeholder.com/800x600?text=No+Image"} 
                      alt={equipment.find(eq => eq.id === selectedEquipmentId)?.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/800x600?text=No+Image";
                      }}
                    />
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    <h3 className="text-xl font-bold">
                      {equipment.find(eq => eq.id === selectedEquipmentId)?.name}
                    </h3>
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        equipment.find(eq => eq.id === selectedEquipmentId)?.status === "operational" 
                          ? "bg-success-100 text-success-800" 
                          : equipment.find(eq => eq.id === selectedEquipmentId)?.status === "maintenance"
                            ? "bg-warning-100 text-warning-800"
                            : "bg-error-100 text-error-800"
                      }`}>
                        {equipment.find(eq => eq.id === selectedEquipmentId)?.status === "operational" 
                          ? "Operativo" 
                          : equipment.find(eq => eq.id === selectedEquipmentId)?.status === "maintenance"
                            ? "En mantenimiento"
                            : "Fuera de servicio"}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                        {equipment.find(eq => eq.id === selectedEquipmentId)?.type?.name}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-secondary-500">Código</p>
                      <p className="font-medium">{equipment.find(eq => eq.id === selectedEquipmentId)?.code}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-secondary-500">Ubicación</p>
                      <p className="font-medium">{equipment.find(eq => eq.id === selectedEquipmentId)?.location}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-secondary-500">Fecha de instalación</p>
                      <p className="font-medium">
                        {new Date(equipment.find(eq => eq.id === selectedEquipmentId)?.installationDate || "").toLocaleDateString()}
                      </p>
                    </div>
                    
                    {equipment.find(eq => eq.id === selectedEquipmentId)?.notes && (
                      <div>
                        <p className="text-sm text-secondary-500">Notas</p>
                        <p className="text-sm">{equipment.find(eq => eq.id === selectedEquipmentId)?.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Especificaciones técnicas</h4>
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {Object.entries(equipment.find(eq => eq.id === selectedEquipmentId)?.specifications || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-secondary-100 py-2 last:border-0">
                              <span className="text-sm text-secondary-500">{key}</span>
                              <span className="text-sm font-medium">{value as string}</span>
                            </div>
                          ))}
                          
                          {Object.keys(equipment.find(eq => eq.id === selectedEquipmentId)?.specifications || {}).length === 0 && (
                            <p className="text-center text-sm text-secondary-500 py-4">
                              No hay especificaciones disponibles
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Próximos mantenimientos</h4>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center py-6">
                          <i className="ri-calendar-line text-4xl text-secondary-300"></i>
                          <p className="mt-2 text-sm text-secondary-500">
                            No hay mantenimientos programados
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Historial de mantenimiento</h4>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center py-6">
                          <i className="ri-history-line text-4xl text-secondary-300"></i>
                          <p className="mt-2 text-sm text-secondary-500">
                            No hay registros de mantenimiento
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button className="flex-1" onClick={() => handleScheduleMaintenance(selectedEquipmentId)}>
                      <i className="ri-calendar-line mr-2"></i>
                      Programar mantenimiento
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <i className="ri-edit-line mr-2"></i>
                      Editar equipo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
