import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Calendar as CalendarIcon, Clock, ArrowLeft, UploadCloud, Wrench } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { Equipment } from "@shared/schema";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Esquema de validación para el formulario de programación de mantenimiento
const maintenanceScheduleSchema = z.object({
  type: z.enum(["preventive", "corrective"], {
    required_error: "Debe seleccionar un tipo de mantenimiento",
  }),
  date: z.date({
    required_error: "Debe seleccionar una fecha para el mantenimiento",
  }),
  time: z.string().min(1, "Debe seleccionar una hora para el mantenimiento"),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  frequency: z.enum(["once", "daily", "weekly", "monthly", "quarterly", "yearly"], {
    required_error: "Debe seleccionar una frecuencia",
  }),
  reminderDays: z.preprocess(
    (val) => parseInt(val as string, 10),
    z.number().min(1, "Debe ser al menos 1 día").max(30, "No puede ser más de 30 días")
  ),
  sendEmail: z.boolean().default(true),
});

type MaintenanceScheduleFormValues = z.infer<typeof maintenanceScheduleSchema>;

export default function ScheduleMaintenancePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const equipmentId = parseInt(id);

  // Verificar autenticación y validar ID
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        toast({
          title: "Acceso no autorizado",
          description: "Debe iniciar sesión para programar mantenimientos.",
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

  // Obtener datos del equipo
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery<Equipment>({
    queryKey: ["/api/equipment", id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/equipment/${id}`, { credentials: 'include' });
        if (!response.ok) throw new Error(`Error al obtener información del equipo: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error("Error fetching equipment details:", error);
        throw error;
      }
    },
    enabled: !isNaN(equipmentId) && !!user,
  });

  const form = useForm<MaintenanceScheduleFormValues>({
    resolver: zodResolver(maintenanceScheduleSchema),
    defaultValues: {
      type: "preventive",
      description: "",
      frequency: "once",
      reminderDays: 3,
      sendEmail: true,
    },
  });

  const onSubmit = async (values: MaintenanceScheduleFormValues) => {
    try {
      // Combinar fecha y hora
      const scheduledDate = new Date(values.date);
      const [hours, minutes] = values.time.split(":").map(Number);
      scheduledDate.setHours(hours, minutes);
      
      // Crear objeto para enviar al servidor
      const maintenanceData = {
        type: values.type,
        equipmentId,
        description: values.description,
        nextDate: scheduledDate.toISOString(),
        frequency: values.frequency,
        reminderDays: values.reminderDays,
        sendEmail: values.sendEmail,
      };
      
      const response = await apiRequest("POST", "/api/maintenance/schedule", maintenanceData);
      
      if (response.ok) {
        // Invalidar consultas relacionadas
        queryClient.invalidateQueries({ queryKey: [`/api/maintenance/equipment/${equipmentId}`] });
        
        toast({
          title: "Mantenimiento programado",
          description: "El mantenimiento ha sido programado exitosamente.",
        });
        
        // Redireccionar a la página de detalles del equipo
        setLocation(`/inventory/equipment/${equipmentId}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al programar el mantenimiento");
      }
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ha ocurrido un error al programar el mantenimiento",
        variant: "destructive",
      });
    }
  };

  const handleGoBack = () => {
    setLocation(`/inventory/equipment/${equipmentId}`);
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

  if (!equipment) {
    return (
      <Layout currentModule="inventario">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-700">
              No se pudo cargar la información del equipo
            </h2>
            <p className="text-gray-500 mt-2">
              El equipo solicitado no existe o hubo un error al cargar sus datos.
            </p>
            <Button 
              onClick={handleGoBack} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al equipo
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

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
            Volver al equipo
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Programar Mantenimiento
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-300">{equipment.code}</Badge>
                <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">{equipment.name}</Badge>
              </div>
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
                <div className="relative h-[200px] overflow-hidden">
                  <img
                    src={equipment.photo || "/uploads/equipment/default-equipment.png"}
                    alt={equipment.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Error loading image:", e);
                      e.currentTarget.src = "/uploads/equipment/default-equipment.png";
                    }}
                  />
                </div>
                
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Resumen del Equipo
                  </h3>
                  
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Código</dt>
                      <dd className="mt-1 text-sm text-gray-900">{equipment.code}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                      <dd className="mt-1 text-sm text-gray-900">{equipment.name}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Estado</dt>
                      <dd className="mt-1 text-sm text-gray-900">
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
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
                      <dd className="mt-1 text-sm text-gray-900">{equipment.location || "No especificada"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Columna derecha con formulario de programación */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Detalles del Mantenimiento</CardTitle>
                  <CardDescription>
                    Complete el formulario para programar un nuevo mantenimiento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Tipo de mantenimiento */}
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Mantenimiento</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione el tipo de mantenimiento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="preventive">Preventivo</SelectItem>
                                <SelectItem value="corrective">Correctivo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Preventivo: mantenimiento programado para prevenir fallos.<br/>
                              Correctivo: reparación de un equipo que ya presentó un fallo.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Fecha de mantenimiento */}
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha de Mantenimiento</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={"pl-3 text-left font-normal"}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: es })
                                      ) : (
                                        <span className="text-muted-foreground">Seleccione una fecha</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(day) => field.onChange(day || new Date())}
                                    disabled={(date) =>
                                      date < new Date(new Date().setHours(0, 0, 0, 0))
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Hora de mantenimiento */}
                        <FormField
                          control={form.control}
                          name="time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hora de Mantenimiento</FormLabel>
                              <div className="flex items-center">
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    className="w-full"
                                  />
                                </FormControl>
                                <Clock className="ml-2 h-4 w-4 text-gray-400" />
                              </div>
                              <FormDescription>
                                Horario en formato 24 horas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Descripción */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción del Mantenimiento</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describa el mantenimiento a realizar..."
                                className="resize-none min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Describa detalladamente el trabajo que se realizará
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Frecuencia */}
                        <FormField
                          control={form.control}
                          name="frequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Frecuencia</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione frecuencia" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="once">Una vez</SelectItem>
                                  <SelectItem value="daily">Diario</SelectItem>
                                  <SelectItem value="weekly">Semanal</SelectItem>
                                  <SelectItem value="monthly">Mensual</SelectItem>
                                  <SelectItem value="quarterly">Trimestral</SelectItem>
                                  <SelectItem value="yearly">Anual</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Define si el mantenimiento se repetirá
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Días de recordatorio */}
                        <FormField
                          control={form.control}
                          name="reminderDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Días de anticipación para recordatorio</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="30"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Días antes del mantenimiento para enviar recordatorio
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Enviar correo electrónico */}
                      <FormField
                        control={form.control}
                        name="sendEmail"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Enviar correo electrónico
                              </FormLabel>
                              <FormDescription>
                                Se enviará un recordatorio por correo electrónico cuando se acerque la fecha
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <Separator />
                      
                      <div className="flex justify-end space-x-4">
                        <Button variant="outline" type="button" onClick={handleGoBack}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Wrench className="mr-2 h-4 w-4" />
                              Programar Mantenimiento
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
