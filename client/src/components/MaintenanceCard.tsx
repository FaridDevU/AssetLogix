import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: number;
  name: string;
  code: string;
  status: string;
}

interface Technician {
  id: number;
  name: string;
  avatar: string;
}

interface MaintenanceIntervention {
  id: number;
  equipmentId: number;
  scheduleId?: number;
  type: string;
  status: string;
  startDate: string;
  endDate?: string;
  technician?: number;
  findings?: string;
  actions?: string;
  parts?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  equipment?: Equipment;
  technicianData?: Technician;
}

interface MaintenanceSchedule {
  id: number;
  equipmentId: number;
  type: string;
  frequency?: string;
  nextDate: string;
  description?: string;
  reminderDays?: number;
  createdAt: string;
  updatedAt: string;
  equipment?: Equipment;
}

type MaintenanceCardProps = {
  type: "intervention";
  data: MaintenanceIntervention;
} | {
  type: "schedule";
  data: MaintenanceSchedule;
};

export default function MaintenanceCard(props: MaintenanceCardProps) {
  const { toast } = useToast();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success-100 text-success-800";
      case "in_progress":
        return "bg-warning-100 text-warning-800";
      case "pending":
        return "bg-secondary-100 text-secondary-800";
      default:
        return "bg-secondary-100 text-secondary-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado";
      case "in_progress":
        return "En proceso";
      case "pending":
        return "Pendiente";
      default:
        return status;
    }
  };

  const getMaintenanceTypeText = (type: string) => {
    switch (type) {
      case "preventive":
        return "Preventivo";
      case "corrective":
        return "Correctivo";
      case "emergency":
        return "Emergencia";
      default:
        return type;
    }
  };

  const getMaintenanceTypeClass = (type: string) => {
    switch (type) {
      case "preventive":
        return "bg-primary-100 text-primary-800";
      case "corrective":
        return "bg-warning-100 text-warning-800";
      case "emergency":
        return "bg-error-100 text-error-800";
      default:
        return "bg-secondary-100 text-secondary-800";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (props.type === "intervention") {
    const { data } = props;
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-md font-medium">{data.equipment?.name || "Equipo sin nombre"}</CardTitle>
              <p className="text-sm text-secondary-500">ID: {data.equipment?.code || "N/A"}</p>
            </div>
            <Badge className={getStatusBadgeClass(data.status)}>
              {getStatusText(data.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-secondary-500 text-xs">Tipo</p>
              <Badge variant="outline" className={getMaintenanceTypeClass(data.type)}>
                {getMaintenanceTypeText(data.type)}
              </Badge>
            </div>
            <div>
              <p className="text-secondary-500 text-xs">Técnico</p>
              {data.technicianData ? (
                <div className="flex items-center">
                  <img 
                    src={data.technicianData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.technicianData.name)}`} 
                    alt={data.technicianData.name} 
                    className="h-5 w-5 rounded-full mr-1"
                  />
                  <span className="truncate">{data.technicianData.name}</span>
                </div>
              ) : (
                <span className="text-secondary-400">No asignado</span>
              )}
            </div>
            <div>
              <p className="text-secondary-500 text-xs">Fecha inicio</p>
              <p className="font-medium">{formatDate(data.startDate)}</p>
            </div>
            <div>
              <p className="text-secondary-500 text-xs">Hora</p>
              <p className="font-medium">{formatTime(data.startDate)}</p>
            </div>
          </div>
          
          {data.findings && (
            <div className="mt-3">
              <p className="text-secondary-500 text-xs">Hallazgos</p>
              <p className="text-sm line-clamp-2">{data.findings}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="text-xs text-secondary-500">
            Creado: {formatDate(data.createdAt)}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Ver detalles</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Detalles de la intervención</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{data.equipment?.name}</h3>
                    <p className="text-sm text-secondary-500">ID: {data.equipment?.code}</p>
                  </div>
                  <Badge className={getStatusBadgeClass(data.status)}>
                    {getStatusText(data.status)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-secondary-500 text-xs">Tipo</p>
                    <Badge variant="outline" className={getMaintenanceTypeClass(data.type)}>
                      {getMaintenanceTypeText(data.type)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-secondary-500 text-xs">Técnico</p>
                    {data.technicianData ? (
                      <div className="flex items-center">
                        <img 
                          src={data.technicianData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.technicianData.name)}`} 
                          alt={data.technicianData.name} 
                          className="h-5 w-5 rounded-full mr-1"
                        />
                        <span>{data.technicianData.name}</span>
                      </div>
                    ) : (
                      <span className="text-secondary-400">No asignado</span>
                    )}
                  </div>
                  <div>
                    <p className="text-secondary-500 text-xs">Fecha inicio</p>
                    <p>{formatDate(data.startDate)} {formatTime(data.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500 text-xs">Fecha finalización</p>
                    <p>{data.endDate ? `${formatDate(data.endDate)} ${formatTime(data.endDate)}` : "En progreso"}</p>
                  </div>
                </div>
                
                {data.findings && (
                  <div>
                    <p className="text-secondary-500 text-xs">Hallazgos</p>
                    <p className="text-sm bg-secondary-50 p-2 rounded">{data.findings}</p>
                  </div>
                )}
                
                {data.actions && (
                  <div>
                    <p className="text-secondary-500 text-xs">Acciones realizadas</p>
                    <p className="text-sm bg-secondary-50 p-2 rounded">{data.actions}</p>
                  </div>
                )}
                
                {data.parts && Object.keys(data.parts).length > 0 && (
                  <div>
                    <p className="text-secondary-500 text-xs">Repuestos utilizados</p>
                    <div className="text-sm bg-secondary-50 p-2 rounded">
                      <ul className="list-disc list-inside">
                        {Object.entries(data.parts).map(([part, quantity]) => (
                          <li key={part}>{part}: {quantity}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => toast({
                  title: "Acción completada",
                  description: "Se ha actualizado el estado de la intervención",
                })}>
                  {data.status === "completed" ? "Reabrirm" : "Marcar como completado"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    );
  } else {
    // Schedule card
    const { data } = props;
    
    const isUpcoming = new Date(data.nextDate) > new Date();
    const daysUntil = Math.ceil((new Date(data.nextDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <Card className={daysUntil <= 3 && isUpcoming ? "border-warning-300" : ""}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-md font-medium">{data.equipment?.name || "Equipo sin nombre"}</CardTitle>
              <p className="text-sm text-secondary-500">ID: {data.equipment?.code || "N/A"}</p>
            </div>
            <Badge className={getMaintenanceTypeClass(data.type)}>
              {getMaintenanceTypeText(data.type)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-secondary-500 text-xs">Próxima fecha</p>
              <p className="font-medium">{formatDate(data.nextDate)}</p>
            </div>
            <div>
              <p className="text-secondary-500 text-xs">Hora</p>
              <p className="font-medium">{formatTime(data.nextDate)}</p>
            </div>
            <div>
              <p className="text-secondary-500 text-xs">Frecuencia</p>
              <p className="font-medium capitalize">{data.frequency || "N/A"}</p>
            </div>
            <div>
              <p className="text-secondary-500 text-xs">Estado equipo</p>
              <p className="font-medium capitalize">{data.equipment?.status === "operational" ? "Operativo" : 
                data.equipment?.status === "maintenance" ? "En mantenimiento" : "Fuera de servicio"}</p>
            </div>
          </div>
          
          {data.description && (
            <div className="mt-3">
              <p className="text-secondary-500 text-xs">Descripción</p>
              <p className="text-sm line-clamp-2">{data.description}</p>
            </div>
          )}
          
          {isUpcoming && daysUntil <= 7 && (
            <div className="mt-3 bg-warning-50 p-2 rounded-md text-xs flex items-center">
              <i className="ri-alarm-warning-line text-warning-500 mr-1"></i>
              <span className="text-warning-700">
                {daysUntil === 0 ? "Programado para hoy" : 
                 daysUntil === 1 ? "Programado para mañana" : 
                 `Programado en ${daysUntil} días`}
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="text-xs text-secondary-500">
            Creado: {formatDate(data.createdAt)}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Ver detalles</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Detalles del mantenimiento programado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{data.equipment?.name}</h3>
                    <p className="text-sm text-secondary-500">ID: {data.equipment?.code}</p>
                  </div>
                  <Badge className={getMaintenanceTypeClass(data.type)}>
                    {getMaintenanceTypeText(data.type)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-secondary-500 text-xs">Fecha programada</p>
                    <p>{formatDate(data.nextDate)} {formatTime(data.nextDate)}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500 text-xs">Frecuencia</p>
                    <p className="capitalize">{data.frequency || "Única vez"}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500 text-xs">Recordatorio</p>
                    <p>{data.reminderDays || 0} días antes</p>
                  </div>
                  <div>
                    <p className="text-secondary-500 text-xs">Estado equipo</p>
                    <p className="font-medium capitalize">{data.equipment?.status === "operational" ? "Operativo" : 
                      data.equipment?.status === "maintenance" ? "En mantenimiento" : "Fuera de servicio"}</p>
                  </div>
                </div>
                
                {data.description && (
                  <div>
                    <p className="text-secondary-500 text-xs">Descripción</p>
                    <p className="text-sm bg-secondary-50 p-2 rounded">{data.description}</p>
                  </div>
                )}
                
                {isUpcoming && (
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => toast({
                      title: "Mantenimiento reprogramado",
                      description: "Se ha actualizado la fecha de mantenimiento",
                    })}>
                      Reprogramar
                    </Button>
                    <Button onClick={() => toast({
                      title: "Intervención creada",
                      description: "Se ha iniciado una intervención a partir de este mantenimiento programado",
                    })}>
                      Iniciar intervención
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    );
  }
}
