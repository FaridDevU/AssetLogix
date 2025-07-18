import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlusCircle, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Equipment, EquipmentType } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import NewEquipmentModal from "./NewEquipmentModal";

export default function EquipmentList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch equipment data
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Fetch equipment types for filter
  const { data: types } = useQuery<EquipmentType[]>({
    queryKey: ["/api/equipment/types"],
  });

  // Apply filters
  const filteredEquipment = equipment
    ? equipment.filter((item) => {
        const matchesSearch = searchTerm === "" || 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = selectedType === "" || selectedType === "all_types" || String(item.typeId) === selectedType;
        const matchesStatus = selectedStatus === "" || selectedStatus === "all_status" || item.status === selectedStatus;
        
        return matchesSearch && matchesType && matchesStatus;
      })
    : [];

  const handleViewDetails = (id: number) => {
    setLocation(`/equipment/${id}`);
  };

  const handleNewEquipment = () => {
    setIsModalOpen(true);
  };

  const handleScheduleMaintenance = (id: number) => {
    setLocation(`/maintenance/schedule/${id}`);
  };

  if (isLoadingEquipment) {
    return (
      <Layout currentModule="mantenimiento">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <Layout currentModule="mantenimiento">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Inventario de Activos</h1>
            <p className="text-gray-500 mt-1">
              Gestione y monitoree todos los equipos registrados
            </p>
          </div>
          <Button 
            onClick={handleNewEquipment}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Activo
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, código o ubicación"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_types">Todos los tipos</SelectItem>
              {types?.map((type) => (
                <SelectItem key={type.id} value={String(type.id)}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_status">Todos los estados</SelectItem>
              <SelectItem value="operational">Operativo</SelectItem>
              <SelectItem value="maintenance">En Mantenimiento</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
              <SelectItem value="repair">En Reparación</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Equipment List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredEquipment?.length > 0 ? (
              filteredEquipment.map((item) => (
                <motion.div 
                  key={item.id} 
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  layout
                  className="h-full"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-200 overflow-hidden group">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.photo || "https://images.unsplash.com/photo-1581093806997-124204d9fa9d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80"}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={
                          item.status === "operational" ? "bg-green-500" :
                          item.status === "maintenance" ? "bg-amber-500" :
                          item.status === "repair" ? "bg-red-500" :
                          "bg-gray-500"
                        }>
                          {item.status === "operational" ? "Operativo" :
                           item.status === "maintenance" ? "En Mantenimiento" :
                           item.status === "repair" ? "En Reparación" :
                           "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl font-semibold truncate">
                            {item.name}
                          </CardTitle>
                          <CardDescription className="truncate">
                            Código: {item.code}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-500 mb-4">
                        <div className="flex justify-between mb-1">
                          <span>Ubicación:</span>
                          <span className="font-medium text-gray-700">{item.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tipo:</span>
                          <span className="font-medium text-gray-700">
                            {types?.find(t => t.id === item.typeId)?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                          onClick={() => handleViewDetails(item.id)}
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-teal-600 hover:bg-teal-700"
                          onClick={() => handleScheduleMaintenance(item.id)}
                        >
                          Mantenimiento
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Filter className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-600">No se encontraron activos</h3>
                <p className="text-gray-500 mt-1 max-w-md">
                  No hay activos que coincidan con los criterios de búsqueda o filtros seleccionados.
                </p>
                {(searchTerm || selectedType || selectedStatus) && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedType("");
                      setSelectedStatus("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modal for creating new equipment */}
      <NewEquipmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
      />
    </Layout>
  );
}