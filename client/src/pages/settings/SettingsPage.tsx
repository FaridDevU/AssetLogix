import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Save, Settings, Database, Shield, Bell, FileText, HardDrive, BarChart } from "lucide-react";
import { BarChart as RechartBar, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  // Valores de configuración (simulados)
  const [companyName, setCompanyName] = useState("Mi Empresa S.A.");
  const [logoUrl, setLogoUrl] = useState("");
  const [maintenanceNotifications, setMaintenanceNotifications] = useState(true);
  const [documentNotifications, setDocumentNotifications] = useState(true);
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [backupInterval, setBackupInterval] = useState("daily");
  const [autoArchiveOldDocs, setAutoArchiveOldDocs] = useState(false);
  const [theme, setTheme] = useState("light");
  
  // Datos del gráfico de uso del sistema
  const [usageData, setUsageData] = useState([
    { name: 'Lunes', documentos: 12, equipos: 8, mantenimientos: 5 },
    { name: 'Martes', documentos: 19, equipos: 13, mantenimientos: 9 },
    { name: 'Miércoles', documentos: 15, equipos: 11, mantenimientos: 6 },
    { name: 'Jueves', documentos: 22, equipos: 16, mantenimientos: 12 },
    { name: 'Viernes', documentos: 24, equipos: 18, mantenimientos: 14 },
    { name: 'Sábado', documentos: 8, equipos: 4, mantenimientos: 2 },
    { name: 'Domingo', documentos: 6, equipos: 2, mantenimientos: 1 },
  ]);

  const handleSaveSettings = (section: string) => {
    toast({
      title: "Configuración guardada",
      description: `La configuración de ${section} ha sido actualizada.`,
    });
  };

  return (
    <Layout currentModule="configuracion">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Configuración</h1>
            <p className="text-gray-500 mt-1">
              Gestione las configuraciones generales del sistema
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="w-full max-w-md mx-auto">
            <TabsTrigger value="general" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex-1">
              <Database className="h-4 w-4 mr-2" />
              Respaldos
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1">
              <Shield className="h-4 w-4 mr-2" />
              Seguridad
            </TabsTrigger>
          </TabsList>
          
          {/* Configuración General */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                  Configure los ajustes generales del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Nombre de la Empresa</Label>
                    <Input 
                      id="company-name" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="logo">Logo de la Empresa</Label>
                    <div className="flex items-center gap-4">
                      <Input 
                        id="logo" 
                        value={logoUrl} 
                        onChange={(e) => setLogoUrl(e.target.value)} 
                        placeholder="URL del logo o cargue una imagen" 
                      />
                      <Button variant="outline">Cargar</Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="theme">Tema del Sistema</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Seleccionar tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Oscuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />

                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-teal-500" />
                    Estadísticas de Uso del Sistema
                  </h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-base font-medium text-gray-700 mb-3">Actividad de la última semana</h4>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartBar
                          data={usageData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="documentos" fill="#3b82f6" name="Documentos" />
                          <Bar dataKey="equipos" fill="#10b981" name="Equipos" />
                          <Bar dataKey="mantenimientos" fill="#f59e0b" name="Mantenimientos" />
                        </RechartBar>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Operaciones realizadas por día
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-violet-500" />
                    Preferencias de Módulos
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <Label htmlFor="archive-docs">Archivar documentos antiguos automáticamente</Label>
                      </div>
                      <Switch 
                        id="archive-docs" 
                        checked={autoArchiveOldDocs} 
                        onCheckedChange={setAutoArchiveOldDocs} 
                      />
                    </div>
                    <p className="text-sm text-gray-500 ml-7">
                      Los documentos con más de 1 año se archivarán automáticamente
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5 text-gray-500" />
                        <Label htmlFor="equipment-module">Módulo de Inventario</Label>
                      </div>
                      <Switch 
                        id="equipment-module" 
                        checked={true} 
                        disabled 
                      />
                    </div>
                    <p className="text-sm text-gray-500 ml-7">
                      Este es un módulo esencial y no puede ser desactivado
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSaveSettings("general")}
                  className="ml-auto bg-teal-600 hover:bg-teal-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Configuración de Notificaciones */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Notificaciones</CardTitle>
                <CardDescription>
                  Configure cómo y cuándo recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notificaciones de Mantenimiento</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maintenance-notifications">Notificaciones de Mantenimiento</Label>
                      <Switch 
                        id="maintenance-notifications" 
                        checked={maintenanceNotifications} 
                        onCheckedChange={setMaintenanceNotifications} 
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Reciba notificaciones sobre mantenimientos programados y alertas
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="maintenance-reminder">Recordatorio de Mantenimiento</Label>
                    <Select defaultValue="7">
                      <SelectTrigger id="maintenance-reminder">
                        <SelectValue placeholder="Seleccionar días" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 día antes</SelectItem>
                        <SelectItem value="3">3 días antes</SelectItem>
                        <SelectItem value="7">7 días antes</SelectItem>
                        <SelectItem value="14">14 días antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notificaciones de Documentos</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="document-notifications">Notificaciones de Documentos</Label>
                      <Switch 
                        id="document-notifications" 
                        checked={documentNotifications} 
                        onCheckedChange={setDocumentNotifications} 
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Reciba notificaciones sobre cambios en documentos
                    </p>
                  </div>
                  
                  <div className="pl-7 space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="doc-create" className="rounded" checked />
                      <Label htmlFor="doc-create">Creación de documentos</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="doc-update" className="rounded" checked />
                      <Label htmlFor="doc-update">Actualización de documentos</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="doc-delete" className="rounded" checked />
                      <Label htmlFor="doc-delete">Eliminación de documentos</Label>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Canales de Notificación</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Correo Electrónico</Label>
                      <Switch id="email-notifications" checked />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="app-notifications">Notificaciones en la Aplicación</Label>
                      <Switch id="app-notifications" checked />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="whatsapp-notifications">WhatsApp</Label>
                      <Switch id="whatsapp-notifications" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Requiere configuración adicional en Seguridad &gt; API Keys
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSaveSettings("notificaciones")}
                  className="ml-auto bg-teal-600 hover:bg-teal-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Configuración de Respaldos */}
          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Respaldos</CardTitle>
                <CardDescription>
                  Configure opciones de respaldo y recuperación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="backup-enabled">Respaldos Automáticos</Label>
                      <Switch 
                        id="backup-enabled" 
                        checked={backupEnabled} 
                        onCheckedChange={setBackupEnabled} 
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Habilitar respaldos automáticos programados
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="backup-interval">Frecuencia de Respaldo</Label>
                    <Select 
                      value={backupInterval} 
                      onValueChange={setBackupInterval}
                      disabled={!backupEnabled}
                    >
                      <SelectTrigger id="backup-interval">
                        <SelectValue placeholder="Seleccionar frecuencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="backup-time">Hora del Respaldo</Label>
                    <Input 
                      id="backup-time" 
                      type="time" 
                      defaultValue="02:00" 
                      disabled={!backupEnabled}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Se recomienda programar los respaldos en horas de baja actividad
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Destino del Respaldo</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="radio" id="backup-local" name="backup-dest" className="rounded" checked />
                      <Label htmlFor="backup-local">Almacenamiento Local</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="radio" id="backup-cloud" name="backup-dest" className="rounded" />
                      <Label htmlFor="backup-cloud">Almacenamiento en la Nube</Label>
                    </div>
                    
                    <div className="pl-7 space-y-2 mt-2">
                      <Label htmlFor="backup-path">Ruta de Respaldo</Label>
                      <Input 
                        id="backup-path" 
                        defaultValue="/backups" 
                        disabled={!backupEnabled} 
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Retención de Respaldos</h3>
                  
                  <div>
                    <Label htmlFor="backup-retention">Número de Respaldos a Mantener</Label>
                    <Input 
                      id="backup-retention" 
                      type="number" 
                      defaultValue="7" 
                      min="1" 
                      max="30" 
                      disabled={!backupEnabled} 
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Los respaldos más antiguos se eliminarán automáticamente
                    </p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => {
                      toast({
                        title: "Respaldo iniciado",
                        description: "Se ha iniciado un respaldo manual del sistema.",
                      });
                    }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Respaldar Ahora
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-amber-700 border-amber-200 hover:bg-amber-50"
                    onClick={() => {
                      toast({
                        title: "Función en desarrollo",
                        description: "La restauración de respaldos estará disponible próximamente.",
                      });
                    }}
                  >
                    <i className="ri-history-line mr-2"></i>
                    Restaurar Respaldo
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSaveSettings("respaldos")}
                  className="ml-auto bg-teal-600 hover:bg-teal-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Configuración de Seguridad */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Seguridad</CardTitle>
                <CardDescription>
                  Configure opciones de seguridad y acceso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Política de Contraseñas</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-complexity">Complejidad de Contraseñas</Label>
                      <Switch id="password-complexity" defaultChecked />
                    </div>
                    <p className="text-sm text-gray-500">
                      Requerir contraseñas con letras, números y caracteres especiales
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="password-expiry">Caducidad de Contraseñas</Label>
                    <Select defaultValue="90">
                      <SelectTrigger id="password-expiry">
                        <SelectValue placeholder="Seleccionar días" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 días</SelectItem>
                        <SelectItem value="60">60 días</SelectItem>
                        <SelectItem value="90">90 días</SelectItem>
                        <SelectItem value="never">Nunca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Autenticación</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="two-factor">Autenticación de Dos Factores</Label>
                      <Switch id="two-factor" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Requerir verificación adicional al iniciar sesión
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="session-timeout">Tiempo de Inactividad</Label>
                      <Select defaultValue="30">
                        <SelectTrigger id="session-timeout" className="w-[180px]">
                          <SelectValue placeholder="Seleccionar minutos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutos</SelectItem>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="60">60 minutos</SelectItem>
                          <SelectItem value="never">Nunca</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm text-gray-500">
                      Cerrar sesión automáticamente después del tiempo de inactividad
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-500" />
                    API Keys
                  </h3>
                  
                  <div className="space-y-3">
                    <Label htmlFor="whatsapp-api">API Key de WhatsApp</Label>
                    <div className="flex">
                      <Input 
                        id="whatsapp-api" 
                        type="password" 
                        value="••••••••••••••••" 
                        className="rounded-r-none"
                      />
                      <Button
                        variant="outline"
                        className="rounded-l-none border-l-0"
                        onClick={() => {
                          toast({
                            title: "Función en desarrollo",
                            description: "La gestión de API keys estará disponible próximamente.",
                          });
                        }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="storage-api">API Key de Almacenamiento</Label>
                    <div className="flex">
                      <Input 
                        id="storage-api" 
                        type="password" 
                        value="" 
                        placeholder="No configurado"
                        className="rounded-r-none"
                      />
                      <Button
                        variant="outline"
                        className="rounded-l-none border-l-0"
                        onClick={() => {
                          toast({
                            title: "Función en desarrollo",
                            description: "La gestión de API keys estará disponible próximamente.",
                          });
                        }}
                      >
                        Configurar
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-green-500" />
                    Registro de Actividad
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="activity-log">Registro Detallado</Label>
                      <Switch id="activity-log" defaultChecked />
                    </div>
                    <p className="text-sm text-gray-500">
                      Mantener un registro detallado de todas las acciones en el sistema
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="log-retention">Período de Retención de Registros</Label>
                    <Select defaultValue="365">
                      <SelectTrigger id="log-retention">
                        <SelectValue placeholder="Seleccionar días" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 días</SelectItem>
                        <SelectItem value="90">90 días</SelectItem>
                        <SelectItem value="180">180 días</SelectItem>
                        <SelectItem value="365">1 año</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Función en desarrollo",
                          description: "La descarga de registros estará disponible próximamente.",
                        });
                      }}
                    >
                      <i className="ri-file-download-line mr-2"></i>
                      Descargar Registros
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSaveSettings("seguridad")}
                  className="ml-auto bg-teal-600 hover:bg-teal-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}