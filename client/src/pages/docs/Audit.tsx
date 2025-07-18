import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DocumentViewer from "@/components/DocumentViewer";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";

interface ActivityItem {
  id: number;
  documentId: number;
  userId: number;
  action: string;
  details: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    avatar: string;
  };
  document: {
    id: number;
    name: string;
    type: string;
  };
}

export default function DocsAudit() {
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch all activity
  const { data: activities = [], isLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/activity', 'all'],
    queryFn: async () => {
      const response = await fetch('/api/activity?limit=100', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    }
  });

  // Fetch unique users for filter
  const { data: users = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      // This would be implemented in a real app
      // For now, extract unique users from activities
      const uniqueUsers = Array.from(
        new Map(
          activities
            .filter(a => a.user)
            .map(a => [a.user.id, { id: a.user.id, name: a.user.name }])
        ).values()
      );
      return uniqueUsers;
    },
    enabled: activities.length > 0
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "upload":
        return <i className="ri-upload-2-line text-primary-600"></i>;
      case "download":
        return <i className="ri-download-2-line text-secondary-600"></i>;
      case "view":
        return <i className="ri-eye-line text-secondary-600"></i>;
      case "edit":
        return <i className="ri-edit-line text-warning-600"></i>;
      case "delete":
        return <i className="ri-delete-bin-line text-error-600"></i>;
      case "new_version":
        return <i className="ri-file-upload-line text-primary-600"></i>;
      default:
        return <i className="ri-file-list-line text-secondary-600"></i>;
    }
  };

  const getActionVerb = (action: string): string => {
    switch (action) {
      case "upload": return "subió";
      case "download": return "descargó";
      case "view": return "visualizó";
      case "edit": return "editó";
      case "delete": return "eliminó";
      case "new_version": return "creó una nueva versión de";
      default: return action;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "upload":
        return "bg-primary-100 text-primary-800";
      case "download":
        return "bg-secondary-100 text-secondary-800";
      case "view":
        return "bg-secondary-100 text-secondary-800";
      case "edit":
        return "bg-warning-100 text-warning-800";
      case "delete":
        return "bg-error-100 text-error-800";
      case "new_version":
        return "bg-primary-100 text-primary-800";
      default:
        return "bg-secondary-100 text-secondary-800";
    }
  };

  const formatDateTime = (date: string): string => {
    return new Date(date).toLocaleString();
  };

  // Filter activities based on selected filters
  const filteredActivities = activities.filter(activity => {
    // Filter by action
    if (filterAction !== "all" && activity.action !== filterAction) {
      return false;
    }
    
    // Filter by user
    if (filterUser !== "all" && activity.user?.id.toString() !== filterUser) {
      return false;
    }
    
    // Filter by date range
    if (dateRange !== "all") {
      const activityDate = new Date(activity.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateRange === "today" && daysDiff >= 1) {
        return false;
      } else if (dateRange === "week" && daysDiff >= 7) {
        return false;
      } else if (dateRange === "month" && daysDiff >= 30) {
        return false;
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const documentName = activity.document?.name.toLowerCase() || "";
      const userName = activity.user?.name.toLowerCase() || "";
      const details = activity.details?.toLowerCase() || "";
      
      return documentName.includes(query) || 
             userName.includes(query) || 
             details.includes(query);
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registro de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="upload">Subidas</SelectItem>
                  <SelectItem value="download">Descargas</SelectItem>
                  <SelectItem value="view">Visualizaciones</SelectItem>
                  <SelectItem value="edit">Ediciones</SelectItem>
                  <SelectItem value="delete">Eliminaciones</SelectItem>
                  <SelectItem value="new_version">Nuevas versiones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Periodo de tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="rounded-md border">
            <div className="bg-secondary-50 px-6 py-3 border-b">
              <div className="grid grid-cols-12 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                <div className="col-span-2">Fecha</div>
                <div className="col-span-2">Usuario</div>
                <div className="col-span-1">Acción</div>
                <div className="col-span-4">Documento</div>
                <div className="col-span-3">Detalles</div>
              </div>
            </div>
            
            <div className="divide-y divide-secondary-100">
              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <i className="ri-history-line text-5xl text-secondary-300"></i>
                  <h3 className="mt-2 text-lg font-medium text-secondary-900">No hay registros de actividad</h3>
                  <p className="mt-1 text-secondary-500 max-w-md">
                    No se encontraron registros que coincidan con los filtros aplicados.
                  </p>
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <div key={activity.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-secondary-50">
                    <div className="col-span-2 text-sm text-secondary-500 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {formatDateTime(activity.createdAt)}
                    </div>
                    
                    <div className="col-span-2 flex items-center">
                      <img 
                        src={activity.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user.name)}`} 
                        alt={activity.user.name}
                        className="h-8 w-8 rounded-full mr-2"
                      />
                      <span className="text-sm font-medium">{activity.user.name}</span>
                    </div>
                    
                    <div className="col-span-1">
                      <Badge className={getActionBadgeColor(activity.action)}>
                        {getActionVerb(activity.action).split(" ")[0]}
                      </Badge>
                    </div>
                    
                    <div className="col-span-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-primary-600 text-sm">
                            {activity.document.name}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl">
                          <DocumentViewer documentId={activity.documentId} />
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="col-span-3 text-sm text-secondary-500">
                      {activity.details}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {filteredActivities.length > 0 && (
            <div className="flex justify-between items-center mt-4 text-sm text-secondary-500">
              <span>Mostrando {filteredActivities.length} de {activities.length} registros</span>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <i className="ri-arrow-left-s-line mr-1"></i>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Siguiente
                  <i className="ri-arrow-right-s-line ml-1"></i>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
