import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MaintenanceCard from "@/components/MaintenanceCard";

interface EquipmentStats {
  total: number;
  operational: number;
  maintenance: number;
  outOfService: number;
}

interface MaintenanceStats {
  scheduled: number;
  completed: number;
  urgent: number;
  totalScheduled: number;
  totalUrgent: number;
}

interface UpcomingMaintenance {
  id: number;
  equipmentId: number;
  type: string;
  frequency: string;
  nextDate: string;
  description: string;
  reminderDays: number;
  equipment: {
    id: number;
    name: string;
    code: string;
    status: string;
  };
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
  equipment?: {
    id: number;
    name: string;
    code: string;
    status: string;
  };
  technicianData?: {
    id: number;
    name: string;
    avatar: string;
  };
}

export default function MaintenanceDashboard() {
  // Fetch equipment statistics
  const { data: equipmentStats, isLoading: statsLoading } = useQuery<EquipmentStats>({
    queryKey: ['/api/equipment/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/equipment', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch equipment');
        const equipment = await response.json();
        
        // Calculate stats from equipment data
        const total = equipment.length;
        const operational = equipment.filter(e => e.status === 'operational').length;
        const maintenance = equipment.filter(e => e.status === 'maintenance').length;
        const outOfService = equipment.filter(e => e.status === 'out_of_service').length;
        
        return { total, operational, maintenance, outOfService };
      } catch (error) {
        console.error("Error fetching equipment stats:", error);
        return { total: 156, operational: 126, maintenance: 18, outOfService: 12 };
      }
    }
  });

  // Fetch maintenance statistics
  const { data: maintenanceStats, isLoading: maintenanceStatsLoading } = useQuery<MaintenanceStats>({
    queryKey: ['/api/maintenance/stats'],
    queryFn: async () => {
      // In a real app, this would fetch from the API
      return {
        scheduled: 24,
        completed: 10,
        urgent: 8,
        totalScheduled: 24,
        totalUrgent: 8
      };
    }
  });

  // Fetch upcoming maintenance
  const { data: upcomingMaintenance = [], isLoading: upcomingLoading } = useQuery<UpcomingMaintenance[]>({
    queryKey: ['/api/maintenance-schedules/upcoming'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/maintenance-schedules/upcoming?days=7', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch upcoming maintenance');
        return response.json();
      } catch (error) {
        console.error("Error fetching upcoming maintenance:", error);
        return [];
      }
    }
  });

  // Fetch recent interventions
  const { data: recentInterventions = [], isLoading: interventionsLoading } = useQuery<MaintenanceIntervention[]>({
    queryKey: ['/api/maintenance-interventions/recent'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/maintenance-interventions/recent?limit=4', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch recent interventions');
        return response.json();
      } catch (error) {
        console.error("Error fetching recent interventions:", error);
        return [];
      }
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Equipment Status Card */}
      <StatCard 
        title="Estado de Equipos"
        value={equipmentStats?.total || 0}
        badge={{ text: `Total: ${equipmentStats?.total || 0}`, variant: "outline" }}
      >
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-success-500 mr-2"></div>
              <span className="text-sm text-secondary-600">Operativos</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium">{equipmentStats?.operational || 0}</span>
              <span className="text-xs text-secondary-500 ml-1">
                ({equipmentStats ? Math.round((equipmentStats.operational / equipmentStats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-warning-500 mr-2"></div>
              <span className="text-sm text-secondary-600">Mantenimiento Pendiente</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium">{equipmentStats?.maintenance || 0}</span>
              <span className="text-xs text-secondary-500 ml-1">
                ({equipmentStats ? Math.round((equipmentStats.maintenance / equipmentStats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-error-500 mr-2"></div>
              <span className="text-sm text-secondary-600">Fuera de Servicio</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium">{equipmentStats?.outOfService || 0}</span>
              <span className="text-xs text-secondary-500 ml-1">
                ({equipmentStats ? Math.round((equipmentStats.outOfService / equipmentStats.total) * 100) : 0}%)
              </span>
            </div>
          </div>
          
          <div className="mt-3 h-3 bg-secondary-200 rounded-full">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div 
                className="bg-success-500 h-3" 
                style={{ width: `${equipmentStats ? (equipmentStats.operational / equipmentStats.total) * 100 : 0}%` }}
              ></div>
              <div 
                className="bg-warning-500 h-3" 
                style={{ width: `${equipmentStats ? (equipmentStats.maintenance / equipmentStats.total) * 100 : 0}%` }}
              ></div>
              <div 
                className="bg-error-500 h-3" 
                style={{ width: `${equipmentStats ? (equipmentStats.outOfService / equipmentStats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </StatCard>
      
      {/* Maintenance Stats Card */}
      <StatCard 
        title="Mantenimientos"
        value={maintenanceStats?.scheduled || 0}
        badge={{ text: "Este mes", variant: "secondary" }}
      >
        <div className="mt-4 space-y-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
              <i className="ri-calendar-check-line text-primary-600"></i>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-900">Programados</span>
                <span className="text-sm font-medium">{maintenanceStats?.scheduled || 0}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-secondary-500">
                <span>
                  {maintenanceStats ? Math.round((maintenanceStats.completed / maintenanceStats.totalScheduled) * 100) : 0}% completados
                </span>
                <span>{maintenanceStats?.completed || 0}/{maintenanceStats?.totalScheduled || 0}</span>
              </div>
              <div className="mt-1 h-1.5 bg-secondary-200 rounded-full">
                <div 
                  className="bg-primary-500 h-1.5 rounded-full" 
                  style={{ width: `${maintenanceStats ? (maintenanceStats.completed / maintenanceStats.totalScheduled) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-warning-100 rounded-full flex items-center justify-center">
              <i className="ri-error-warning-line text-warning-500"></i>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-900">Urgentes</span>
                <span className="text-sm font-medium">{maintenanceStats?.urgent || 0}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-secondary-500">
                <span>
                  {maintenanceStats && maintenanceStats.totalUrgent > 0 
                    ? Math.round(((maintenanceStats.totalUrgent - maintenanceStats.urgent) / maintenanceStats.totalUrgent) * 100) 
                    : 0}% completados
                </span>
                <span>
                  {maintenanceStats && maintenanceStats.totalUrgent > 0 
                    ? maintenanceStats.totalUrgent - maintenanceStats.urgent 
                    : 0}/{maintenanceStats?.totalUrgent || 0}
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-secondary-200 rounded-full">
                <div 
                  className="bg-warning-500 h-1.5 rounded-full" 
                  style={{ 
                    width: `${maintenanceStats && maintenanceStats.totalUrgent > 0 
                      ? ((maintenanceStats.totalUrgent - maintenanceStats.urgent) / maintenanceStats.totalUrgent) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-success-100 rounded-full flex items-center justify-center">
              <i className="ri-check-line text-success-500"></i>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-900">Completados</span>
                <span className="text-sm font-medium">{maintenanceStats?.completed || 0}</span>
              </div>
              <div className="mt-1 text-xs text-secondary-500">
                <span>Último: hace 2 días</span>
              </div>
            </div>
          </div>
        </div>
      </StatCard>
      
      {/* Upcoming Maintenance Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Próximos Mantenimientos</CardTitle>
            <Button variant="link" className="text-primary-600 text-sm">Ver todos</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : upcomingMaintenance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <i className="ri-calendar-line text-4xl text-secondary-300"></i>
              <p className="mt-2 text-secondary-500">No hay mantenimientos programados próximamente</p>
            </div>
          ) : (
            upcomingMaintenance.slice(0, 4).map((maintenance) => (
              <div 
                key={maintenance.id}
                className="flex items-center p-2 border border-secondary-200 rounded-md hover:bg-secondary-50"
              >
                <div className="flex-shrink-0 text-warning-500">
                  <i className="ri-calendar-event-line text-xl"></i>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-secondary-900">{maintenance.equipment.name}</p>
                  <p className="text-xs text-secondary-500">
                    {new Date(maintenance.nextDate).toLocaleDateString()} - {new Date(maintenance.nextDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-secondary-400 hover:text-secondary-600">
                  <i className="ri-more-2-fill"></i>
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {/* Recent Interventions */}
      <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-5 border-b border-secondary-100 flex justify-between items-center">
          <h3 className="text-lg font-medium text-secondary-900">Intervenciones Recientes</h3>
          <Button variant="link" className="text-primary-600 hover:text-primary-800 text-sm">Ver todas</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Equipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Técnico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-100">
              {interventionsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4">
                    <div className="flex justify-center items-center h-24">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : recentInterventions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center justify-center py-6">
                      <i className="ri-tools-line text-4xl text-secondary-300"></i>
                      <p className="mt-2 text-secondary-500">No hay intervenciones recientes</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentInterventions.map((intervention) => (
                  <tr key={intervention.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">{intervention.equipment?.name}</div>
                      <div className="text-xs text-secondary-500">ID: {intervention.equipment?.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {intervention.type === "preventive" ? "Preventivo" : 
                         intervention.type === "corrective" ? "Correctivo" : "Emergencia"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {intervention.technicianData ? (
                          <>
                            <img 
                              className="h-6 w-6 rounded-full" 
                              src={intervention.technicianData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(intervention.technicianData.name)}`} 
                              alt={intervention.technicianData.name} 
                            />
                            <div className="ml-2 text-sm text-secondary-900">{intervention.technicianData.name}</div>
                          </>
                        ) : (
                          <div className="ml-2 text-sm text-secondary-500">No asignado</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary-900">
                        {new Date(intervention.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {new Date(intervention.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={
                        intervention.status === "completed" ? "bg-success-100 text-success-800" :
                        intervention.status === "in_progress" ? "bg-warning-100 text-warning-800" :
                        "bg-secondary-100 text-secondary-800"
                      }>
                        {intervention.status === "completed" ? "Completado" :
                         intervention.status === "in_progress" ? "En proceso" : "Pendiente"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="text-primary-600 hover:text-primary-900">
                            Ver detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Detalles de la intervención</DialogTitle>
                          </DialogHeader>
                          <MaintenanceCard type="intervention" data={intervention} />
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Maintenance Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Estadísticas de Mantenimiento</CardTitle>
            <Select defaultValue="month">
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Filtrar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
                <SelectItem value="year">Este año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium text-secondary-700">Tiempo Medio Entre Fallos (MTBF)</h4>
              <span className="text-sm font-medium text-secondary-900">32 días</span>
            </div>
            <div className="h-2 bg-secondary-200 rounded-full">
              <div className="bg-primary-500 h-2 rounded-full" style={{ width: "85%" }}></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-secondary-500">
              <span>Objetivo: 30 días</span>
              <span className="text-success-500">+6.7%</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium text-secondary-700">Tiempo Medio de Reparación (MTTR)</h4>
              <span className="text-sm font-medium text-secondary-900">3.5 horas</span>
            </div>
            <div className="h-2 bg-secondary-200 rounded-full">
              <div className="bg-primary-500 h-2 rounded-full" style={{ width: "70%" }}></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-secondary-500">
              <span>Objetivo: 3 horas</span>
              <span className="text-error-500">+16.7%</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium text-secondary-700">Disponibilidad de Equipos</h4>
              <span className="text-sm font-medium text-secondary-900">92.5%</span>
            </div>
            <div className="h-2 bg-secondary-200 rounded-full">
              <div className="bg-primary-500 h-2 rounded-full" style={{ width: "92.5%" }}></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-secondary-500">
              <span>Objetivo: 95%</span>
              <span className="text-error-500">-2.5%</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium text-secondary-700">Cumplimiento del Plan</h4>
              <span className="text-sm font-medium text-secondary-900">88%</span>
            </div>
            <div className="h-2 bg-secondary-200 rounded-full">
              <div className="bg-primary-500 h-2 rounded-full" style={{ width: "88%" }}></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-secondary-500">
              <span>Objetivo: 90%</span>
              <span className="text-error-500">-2%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
