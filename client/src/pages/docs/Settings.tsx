import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function DocsSettings() {
  const { toast } = useToast();
  const [storageLimit, setStorageLimit] = useState<number>(500);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(true);
  const [versioningEnabled, setVersioningEnabled] = useState<boolean>(true);
  const [maxVersions, setMaxVersions] = useState<number>(10);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState<boolean>(false);
  const [autoDeleteDays, setAutoDeleteDays] = useState<number>(30);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [systemNotifications, setSystemNotifications] = useState<boolean>(true);

  const handleSaveGeneral = () => {
    toast({
      title: "Configuración guardada",
      description: "La configuración general ha sido actualizada correctamente.",
    });
  };

  const handleSaveBackup = () => {
    toast({
      title: "Configuración guardada",
      description: "La configuración de respaldo ha sido actualizada correctamente.",
    });
  };

  const handleSaveVersioning = () => {
    toast({
      title: "Configuración guardada",
      description: "La configuración de versionado ha sido actualizada correctamente.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Configuración guardada",
      description: "La configuración de notificaciones ha sido actualizada correctamente.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Configuración del Sistema Documental</h2>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="backup">Respaldo</TabsTrigger>
          <TabsTrigger value="versioning">Versionado</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="users">Usuarios y Permisos</TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Administra la configuración básica del sistema documental.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Almacenamiento máximo (GB)</Label>
                  <div className="text-xs text-muted-foreground">
                    Límite de almacenamiento para todos los documentos
                  </div>
                </div>
                <div className="w-1/3 space-y-2">
                  <Slider 
                    value={[storageLimit]} 
                    onValueChange={(value) => setStorageLimit(value[0])}
                    max={1000}
                    step={50}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 GB</span>
                    <span>{storageLimit} GB</span>
                    <span>1000 GB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Formato de documentos permitidos</Label>
                  <div className="text-xs text-muted-foreground">
                    Tipos de archivo que se pueden subir al sistema
                  </div>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los formatos</SelectItem>
                    <SelectItem value="documents">Solo documentos</SelectItem>
                    <SelectItem value="images">Solo imágenes</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Tamaño máximo por archivo (MB)</Label>
                  <div className="text-xs text-muted-foreground">
                    Límite de tamaño para cada archivo individual
                  </div>
                </div>
                <Input 
                  type="number" 
                  className="w-[200px]" 
                  defaultValue="50" 
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Idioma del sistema</Label>
                  <div className="text-xs text-muted-foreground">
                    Idioma predeterminado para la interfaz
                  </div>
                </div>
                <Select defaultValue="es">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneral}>Guardar cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Respaldo</CardTitle>
              <CardDescription>
                Configura cómo se realizan los respaldos automáticos en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-backup">Respaldo automático</Label>
                  <div className="text-xs text-muted-foreground">
                    Habilitar el respaldo automático de documentos
                  </div>
                </div>
                <Switch 
                  id="auto-backup" 
                  checked={autoBackupEnabled}
                  onCheckedChange={setAutoBackupEnabled}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Frecuencia de respaldo</Label>
                  <div className="text-xs text-muted-foreground">
                    Cada cuánto tiempo se realizará el respaldo
                  </div>
                </div>
                <Select defaultValue="daily" disabled={!autoBackupEnabled}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Cada hora</SelectItem>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Destino de respaldo</Label>
                  <div className="text-xs text-muted-foreground">
                    Dónde se almacenarán los respaldos
                  </div>
                </div>
                <Select defaultValue="cloud" disabled={!autoBackupEnabled}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Almacenamiento local</SelectItem>
                    <SelectItem value="cloud">Nube (S3)</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Retención de respaldos</Label>
                  <div className="text-xs text-muted-foreground">
                    Cuántos respaldos se conservarán
                  </div>
                </div>
                <Select defaultValue="10" disabled={!autoBackupEnabled}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar retención" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 respaldos</SelectItem>
                    <SelectItem value="10">10 respaldos</SelectItem>
                    <SelectItem value="30">30 respaldos</SelectItem>
                    <SelectItem value="unlimited">Sin límite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveBackup}>Guardar cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Versioning Settings */}
        <TabsContent value="versioning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Versionado</CardTitle>
              <CardDescription>
                Administra cómo se controlan las versiones de los documentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="versioning">Control de versiones</Label>
                  <div className="text-xs text-muted-foreground">
                    Habilitar control de versiones para los documentos
                  </div>
                </div>
                <Switch 
                  id="versioning" 
                  checked={versioningEnabled}
                  onCheckedChange={setVersioningEnabled}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Versiones máximas por documento</Label>
                  <div className="text-xs text-muted-foreground">
                    Número máximo de versiones a almacenar por documento
                  </div>
                </div>
                <div className="w-1/3 space-y-2">
                  <Slider 
                    value={[maxVersions]} 
                    onValueChange={(value) => setMaxVersions(value[0])}
                    min={1}
                    max={50}
                    step={1}
                    disabled={!versioningEnabled}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>{maxVersions}</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-delete">Eliminar versiones antiguas</Label>
                  <div className="text-xs text-muted-foreground">
                    Eliminar automáticamente versiones anteriores después de un tiempo
                  </div>
                </div>
                <Switch 
                  id="auto-delete" 
                  checked={autoDeleteEnabled}
                  onCheckedChange={setAutoDeleteEnabled}
                  disabled={!versioningEnabled}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Días de retención de versiones</Label>
                  <div className="text-xs text-muted-foreground">
                    Días que se conservará una versión antigua
                  </div>
                </div>
                <div className="w-1/3 space-y-2">
                  <Slider 
                    value={[autoDeleteDays]} 
                    onValueChange={(value) => setAutoDeleteDays(value[0])}
                    min={1}
                    max={365}
                    step={1}
                    disabled={!versioningEnabled || !autoDeleteEnabled}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 día</span>
                    <span>{autoDeleteDays} días</span>
                    <span>1 año</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveVersioning}>Guardar cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>
                Configura cómo se envían las notificaciones del sistema documental.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notificaciones</Label>
                  <div className="text-xs text-muted-foreground">
                    Habilitar notificaciones para eventos del sistema
                  </div>
                </div>
                <Switch 
                  id="notifications" 
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Notificaciones por correo</Label>
                  <div className="text-xs text-muted-foreground">
                    Enviar notificaciones por correo electrónico
                  </div>
                </div>
                <Switch 
                  id="email-notifications" 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  disabled={!notificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="system-notifications">Notificaciones del sistema</Label>
                  <div className="text-xs text-muted-foreground">
                    Mostrar notificaciones en la aplicación
                  </div>
                </div>
                <Switch 
                  id="system-notifications" 
                  checked={systemNotifications}
                  onCheckedChange={setSystemNotifications}
                  disabled={!notificationsEnabled}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label>Eventos a notificar</Label>
                  <div className="text-xs text-muted-foreground">
                    Selecciona qué eventos generarán notificaciones
                  </div>
                </div>
                <div className="space-y-2 w-[200px]">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-upload" className="text-sm">Subidas</Label>
                    <Switch id="notify-upload" defaultChecked disabled={!notificationsEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-edit" className="text-sm">Ediciones</Label>
                    <Switch id="notify-edit" defaultChecked disabled={!notificationsEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-delete" className="text-sm">Eliminaciones</Label>
                    <Switch id="notify-delete" defaultChecked disabled={!notificationsEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-share" className="text-sm">Compartidos</Label>
                    <Switch id="notify-share" defaultChecked disabled={!notificationsEnabled} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications}>Guardar cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Users and Permissions Settings */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios y Permisos</CardTitle>
              <CardDescription>
                Administra los usuarios y sus permisos en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="bg-secondary-50 px-6 py-3 border-b">
                    <div className="grid grid-cols-12 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      <div className="col-span-4">Usuario</div>
                      <div className="col-span-3">Rol</div>
                      <div className="col-span-3">Último acceso</div>
                      <div className="col-span-2 text-right">Acciones</div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-secondary-100">
                    <div className="grid grid-cols-12 px-6 py-4 items-center">
                      <div className="col-span-4 flex items-center">
                        <img 
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" 
                          alt="Carlos Rodríguez"
                          className="h-8 w-8 rounded-full mr-2"
                        />
                        <div>
                          <p className="font-medium">Carlos Rodríguez</p>
                          <p className="text-xs text-secondary-500">admin@example.com</p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          Administrador
                        </span>
                      </div>
                      <div className="col-span-3 text-sm text-secondary-500">
                        Hace 10 minutos
                      </div>
                      <div className="col-span-2 flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <i className="ri-edit-line"></i>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <i className="ri-delete-bin-line"></i>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-12 px-6 py-4 items-center">
                      <div className="col-span-4 flex items-center">
                        <img 
                          src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" 
                          alt="Juan Pérez"
                          className="h-8 w-8 rounded-full mr-2"
                        />
                        <div>
                          <p className="font-medium">Juan Pérez</p>
                          <p className="text-xs text-secondary-500">tech@example.com</p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                          Técnico
                        </span>
                      </div>
                      <div className="col-span-3 text-sm text-secondary-500">
                        Hace 2 horas
                      </div>
                      <div className="col-span-2 flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <i className="ri-edit-line"></i>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <i className="ri-delete-bin-line"></i>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-12 px-6 py-4 items-center">
                      <div className="col-span-4 flex items-center">
                        <img 
                          src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80" 
                          alt="Laura Martínez"
                          className="h-8 w-8 rounded-full mr-2"
                        />
                        <div>
                          <p className="font-medium">Laura Martínez</p>
                          <p className="text-xs text-secondary-500">user@example.com</p>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                          Usuario
                        </span>
                      </div>
                      <div className="col-span-3 text-sm text-secondary-500">
                        Ayer
                      </div>
                      <div className="col-span-2 flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <i className="ri-edit-line"></i>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <i className="ri-delete-bin-line"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button className="mt-4">
                  <i className="ri-user-add-line mr-2"></i>
                  Añadir usuario
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
