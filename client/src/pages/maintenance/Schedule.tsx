import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MaintenanceCard from "@/components/MaintenanceCard";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: number;
  name: string;
  code: string;
  status: string;
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

export default function MaintenanceSchedule() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showNewScheduleDialog, setShowNewScheduleDialog] = useState(false);
  const { toast } = useToast();
  
  // Fetch maintenance schedules
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<MaintenanceSchedule[]>({
    queryKey: ['/api/maintenance-schedules'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/maintenance-schedules', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch maintenance schedules');
        return response.json();
      } catch (error) {
        console.error("Error fetching maintenance schedules:", error);
        return [];
      }
    }
  });

  // Fetch equipment for dropdown
  const { data: equipment = [], isLoading: equipmentLoading } = useQuery({
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

  // Filter schedules for the selected date/view
  const getFilteredSchedules = () => {
    if (!date) return [];
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // For week view
    const startOfWeek = new Date(date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // For month view
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.nextDate);
      
      if (view === "day") {
        return scheduleDate >= startOfDay && scheduleDate <= endOfDay;
      } else if (view === "week") {
        return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
      } else { // month
        return scheduleDate >= startOfMonth && scheduleDate <= endOfMonth;
      }
    });
  };

  const filteredSchedules = getFilteredSchedules();

  // Get calendar day content (for highlighting days with maintenance)
  const getDayContent = (day: Date) => {
    const hasSchedule = schedules.some(schedule => {
      const scheduleDate = new Date(schedule.nextDate);
      return scheduleDate.getDate() === day.getDate() && 
             scheduleDate.getMonth() === day.getMonth() && 
             scheduleDate.getFullYear() === day.getFullYear();
    });
    
    return hasSchedule ? (
      <div className="h-1.5 w-1.5 bg-primary-500 rounded-full absolute bottom-1 left-1/2 transform -translate-x-1/2"></div>
    ) : null;
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to the API
    toast({
      title: "Mantenimiento programado",
      description: "Se ha creado la programación de mantenimiento correctamente."
    });
    setShowNewScheduleDialog(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Calendar card */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Calendario de Mantenimiento</CardTitle>
            <div className="flex space-x-2">
              <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week" | "day")}>
                <TabsList>
                  <TabsTrigger value="month">Mes</TabsTrigger>
                  <TabsTrigger value="week">Semana</TabsTrigger>
                  <TabsTrigger value="day">Día</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" onClick={() => setDate(new Date())}>Hoy</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              components={{
                DayContent: ({ day }) => (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {day.getDate()}
                    {getDayContent(day)}
                  </div>
                )
              }}
            />
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {view === "day" 
                  ? `Mantenimientos para el ${date?.toLocaleDateString()}`
                  : view === "week"
                    ? "Mantenimientos de esta semana"
                    : "Mantenimientos de este mes"}
              </h3>
              <Dialog open={showNewScheduleDialog} onOpenChange={setShowNewScheduleDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <i className="ri-add-line mr-2"></i>
                    Programar mantenimiento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Programar nuevo mantenimiento</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateSchedule}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="equipment" className="text-right">
                          Equipo
                        </Label>
                        <div className="col-span-3">
                          <Select required>
                            <SelectTrigger id="equipment">
                              <SelectValue placeholder="Seleccionar equipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {equipment.map((eq) => (
                                <SelectItem key={eq.id} value={eq.id.toString()}>
                                  {eq.name} ({eq.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                          Tipo
                        </Label>
                        <div className="col-span-3">
                          <Select defaultValue="preventive" required>
                            <SelectTrigger id="type">
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="preventive">Preventivo</SelectItem>
                              <SelectItem value="corrective">Correctivo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="frequency" className="text-right">
                          Frecuencia
                        </Label>
                        <div className="col-span-3">
                          <Select defaultValue="once">
                            <SelectTrigger id="frequency">
                              <SelectValue placeholder="Seleccionar frecuencia" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once">Una vez</SelectItem>
                              <SelectItem value="daily">Diario</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensual</SelectItem>
                              <SelectItem value="quarterly">Trimestral</SelectItem>
                              <SelectItem value="yearly">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                          Fecha
                        </Label>
                        <div className="col-span-3">
                          <Input 
                            id="date" 
                            type="date" 
                            defaultValue={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">
                          Hora
                        </Label>
                        <div className="col-span-3">
                          <Input 
                            id="time" 
                            type="time"
                            defaultValue="09:00"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">
                          Descripción
                        </Label>
                        <Textarea 
                          id="description" 
                          placeholder="Detalles del mantenimiento a realizar" 
                          className="col-span-3"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reminder" className="text-right">
                          Recordatorio
                        </Label>
                        <div className="col-span-3 flex items-center space-x-2">
                          <Input 
                            id="reminder" 
                            type="number" 
                            defaultValue="7"
                            min="0"
                            className="w-20"
                          />
                          <span className="text-sm text-secondary-500">días antes</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Programar</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {schedulesLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="bg-white rounded-lg border border-secondary-200 p-8 text-center">
                <div className="flex flex-col items-center justify-center py-6">
                  <i className="ri-calendar-line text-5xl text-secondary-300"></i>
                  <h3 className="mt-2 text-lg font-medium text-secondary-900">No hay mantenimientos programados</h3>
                  <p className="mt-1 text-secondary-500">
                    No hay mantenimientos programados para {view === "day" ? "este día" : view === "week" ? "esta semana" : "este mes"}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSchedules.map((schedule) => (
                  <MaintenanceCard 
                    key={schedule.id} 
                    type="schedule" 
                    data={schedule} 
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Upcoming maintenance card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Próximos Mantenimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {schedulesLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <i className="ri-calendar-line text-4xl text-secondary-300"></i>
              <p className="mt-2 text-secondary-500">No hay mantenimientos programados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules
                .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
                .slice(0, 5)
                .map((schedule) => (
                  <div 
                    key={schedule.id}
                    className="flex items-center p-3 border border-secondary-200 rounded-md hover:bg-secondary-50"
                  >
                    <div className="flex-shrink-0 text-warning-500">
                      <i className="ri-calendar-event-line text-xl"></i>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-secondary-900">{schedule.equipment?.name}</p>
                      <div className="flex justify-between">
                        <p className="text-xs text-secondary-500">
                          {new Date(schedule.nextDate).toLocaleDateString()} - {new Date(schedule.nextDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary-100 text-primary-800">
                          {schedule.type === "preventive" ? "Preventivo" : "Correctivo"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <h4 className="text-sm font-medium mb-2">Resumen de mantenimientos</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Próximos 7 días</span>
                <span className="text-sm font-medium">
                  {schedules.filter(s => {
                    const scheduleDate = new Date(s.nextDate);
                    const now = new Date();
                    const in7Days = new Date();
                    in7Days.setDate(now.getDate() + 7);
                    return scheduleDate >= now && scheduleDate <= in7Days;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Próximos 30 días</span>
                <span className="text-sm font-medium">
                  {schedules.filter(s => {
                    const scheduleDate = new Date(s.nextDate);
                    const now = new Date();
                    const in30Days = new Date();
                    in30Days.setDate(now.getDate() + 30);
                    return scheduleDate >= now && scheduleDate <= in30Days;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Preventivos</span>
                <span className="text-sm font-medium">
                  {schedules.filter(s => s.type === "preventive").length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-600">Correctivos</span>
                <span className="text-sm font-medium">
                  {schedules.filter(s => s.type === "corrective").length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
