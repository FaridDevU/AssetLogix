import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Equipment {
  id: number;
  name: string;
  code: string;
  typeId: number | null;
  status: string;
  location: string | null;
  installationDate: Date | null;
  specifications: Record<string, any> | null;
  photo: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Agregar el tipo manualmente
  type?: { id: number; name: string; };
}

interface EquipmentCardProps {
  equipment: Equipment;
  viewMode?: "grid" | "list";
  onViewDetails?: (id: number) => void;
  onScheduleMaintenance?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function EquipmentCard({ 
  equipment, 
  viewMode = "grid",
  onViewDetails,
  onScheduleMaintenance,
  onDelete
}: EquipmentCardProps) {
  const { toast } = useToast();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-success-100 text-success-800";
      case "maintenance":
        return "bg-warning-100 text-warning-800";
      case "out_of_service":
        return "bg-error-100 text-error-800";
      default:
        return "bg-secondary-100 text-secondary-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return "Operativo";
      case "maintenance":
        return "En Mantenimiento";
      case "out_of_service":
        return "Fuera de Servicio";
      default:
        return status;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (viewMode === "list") {
    return (
      <tr className="hover:bg-secondary-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <img 
                className="h-10 w-10 rounded object-cover" 
                src={equipment.photo ? equipment.photo : "/uploads/equipment/default-equipment.png"} 
                alt={equipment.name} 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/uploads/equipment/default-equipment.png";
                }}
              />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-secondary-900">{equipment.name}</div>
              <div className="text-sm text-secondary-500">ID: {equipment.code}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-secondary-900">{equipment.type?.name || "N/A"}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(equipment.status)}`}>
            {getStatusText(equipment.status)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-secondary-900">{equipment.location}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-secondary-500">{formatDate(equipment.installationDate)}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <i className="ri-more-2-fill"></i>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(equipment.id)}>
                <i className="ri-eye-line mr-2"></i>
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onScheduleMaintenance?.(equipment.id)}>
                <i className="ri-calendar-line mr-2"></i>
                Programar mantenimiento
              </DropdownMenuItem>
              <DropdownMenuItem>
                <i className="ri-edit-line mr-2"></i>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-error-600"
                onClick={() => onDelete?.(equipment.id)}
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  }

  return (
    <div className="border border-secondary-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-secondary-100">
        <img 
          src={equipment.photo ? equipment.photo : "/uploads/equipment/default-equipment.png"} 
          alt={equipment.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/uploads/equipment/default-equipment.png";
          }}
        />
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(equipment.status)}`}>
            {getStatusText(equipment.status)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-base font-medium text-secondary-900">{equipment.name}</h4>
            <p className="text-sm text-secondary-500">ID: {equipment.code}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-secondary-400 hover:text-secondary-600 p-1">
                <i className="ri-more-2-fill"></i>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails?.(equipment.id)}>
                <i className="ri-eye-line mr-2"></i>
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onScheduleMaintenance?.(equipment.id)}>
                <i className="ri-calendar-line mr-2"></i>
                Programar mantenimiento
              </DropdownMenuItem>
              <DropdownMenuItem>
                <i className="ri-edit-line mr-2"></i>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-error-600"
                onClick={() => onDelete?.(equipment.id)}
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-secondary-500">Tipo</p>
            <p className="font-medium text-secondary-900">{equipment.type?.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-secondary-500">Ubicación</p>
            <p className="font-medium text-secondary-900">{equipment.location || "N/A"}</p>
          </div>
          <div>
            <p className="text-secondary-500">Instalación</p>
            <p className="font-medium text-secondary-900">{formatDate(equipment.installationDate)}</p>
          </div>
          <div>
            <p className="text-secondary-500">Último mantto.</p>
            <p className="font-medium text-secondary-900">15/11/2023</p>
          </div>
        </div>
        <div className="mt-3 flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium hover:bg-primary-200 border-primary-200"
            onClick={() => onViewDetails?.(equipment.id)}
          >
            Ver detalles
          </Button>
          <Button 
            variant="outline"
            className="flex-1 px-2 py-1 bg-secondary-100 text-secondary-700 rounded text-xs font-medium hover:bg-secondary-200 border-secondary-200"
            onClick={() => onScheduleMaintenance?.(equipment.id)}
          >
            Programar mantto.
          </Button>
        </div>
      </div>
    </div>
  );
}
