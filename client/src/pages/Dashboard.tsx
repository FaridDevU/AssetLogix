import { FC, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  FileText,
  Wrench,
  Clock,
  AlertCircle,
  CheckCircle2,
  CalendarRange,
  FolderOpen,
  Users,
  ArrowRight,
  LocateFixed
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import Layout from "@/components/Layout";
import { useAuth } from "../hooks/use-auth";

const Dashboard: FC = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("Buenos días");
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const handleNewAsset = () => {
    navigate("/equipment/new");
    toast({
      title: "Nuevo Activo",
      description: "Creando nuevo activo de equipamiento",
    });
  };

  const handleExportReports = async () => {
    toast({
      title: "Generando informes",
      description: "Preparando descarga de informes...",
    });

    try {
      // En una implementación real, aquí se haría una llamada a la API
      // para generar y descargar informes
      
      // Simulamos una descarga después de un pequeño retraso
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Creamos un blob con datos JSON como ejemplo
      const reportData = {
        equipmentCount: 128,
        documentsCount: 256,
        maintenancePending: 12,
        activeUsers: 18,
        generatedAt: new Date().toISOString(),
        maintenanceData: maintenanceData,
        documentData: documentData,
        statusData: statusData,
        categoryData: categoryData
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Creamos un enlace para la descarga y hacemos clic en él
      const a = document.createElement('a');
      a.href = url;
      a.download = `sistema-gm-informe-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Limpiamos
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Informes generados",
        description: "Los informes se han descargado correctamente",
        variant: "default"
      });
    } catch (error) {
      console.error("Error al exportar informes:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar los informes",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 18) {
      setGreeting("Buenas tardes");
    } else if (hour >= 18) {
      setGreeting("Buenas noches");
    }
  }, []);

  // Datos de ejemplo para los gráficos
  const maintenanceData = [
    { month: "Ene", preventive: 20, corrective: 5 },
    { month: "Feb", preventive: 18, corrective: 7 },
    { month: "Mar", preventive: 25, corrective: 3 },
    { month: "Abr", preventive: 22, corrective: 8 },
    { month: "May", preventive: 30, corrective: 4 },
    { month: "Jun", preventive: 28, corrective: 6 }
  ];

  const documentData = [
    { month: "Ene", uploads: 15, downloads: 32 },
    { month: "Feb", uploads: 20, downloads: 38 },
    { month: "Mar", uploads: 25, downloads: 45 },
    { month: "Abr", uploads: 18, downloads: 40 },
    { month: "May", uploads: 30, downloads: 52 },
    { month: "Jun", uploads: 22, downloads: 48 }
  ];

  const statusData = [
    { name: "Operativo", value: 85, color: "#10b981" },
    { name: "Mantenimiento", value: 10, color: "#f59e0b" },
    { name: "Inactivo", value: 5, color: "#ef4444" }
  ];

  const categoryData = [
    { name: "Maquinaria", value: 45, color: "#3b82f6" },
    { name: "Vehículos", value: 25, color: "#8b5cf6" },
    { name: "Equipos IT", value: 20, color: "#ec4899" },
    { name: "Otros", value: 10, color: "#6b7280" }
  ];

  const upcomingMaintenances = [
    {
      id: 1,
      assetName: "Compresor Industrial #2",
      date: "2025-05-04T09:00:00Z",
      type: "preventive",
      status: "scheduled",
      location: "Planta Principal"
    },
    {
      id: 2,
      assetName: "Montacargas Toyota",
      date: "2025-05-06T10:30:00Z",
      type: "corrective",
      status: "scheduled",
      location: "Bodega A"
    },
    {
      id: 3,
      assetName: "Generador Eléctrico",
      date: "2025-05-08T14:00:00Z",
      type: "preventive",
      status: "scheduled",
      location: "Edificio Principal"
    }
  ];

  const recentDocuments = [
    {
      id: 1,
      name: "Manual_Montacargas_Toyota.pdf",
      type: "pdf",
      updatedAt: "2025-04-26T14:32:00Z",
      size: 3240000,
      user: "Carlos Rodríguez"
    },
    {
      id: 2,
      name: "Mantenimiento_Preventivo_Q2_2025.xlsx",
      type: "xlsx",
      updatedAt: "2025-04-25T09:45:00Z",
      size: 1800000,
      user: "Juan Pérez"
    },
    {
      id: 3,
      name: "Informe_Reparaciones_Abril_2025.docx",
      type: "docx",
      updatedAt: "2025-04-24T16:20:00Z",
      size: 2500000,
      user: "Laura Martínez"
    }
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-6 h-6 text-red-500" />;
      case "xlsx":
        return <FileText className="w-6 h-6 text-green-500" />;
      case "docx":
        return <FileText className="w-6 h-6 text-blue-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const renderMaintenanceStatus = (status: string) => {
    switch (status) {
      case "scheduled":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Programado</span>;
      case "in_progress":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">En progreso</span>;
      case "completed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completado</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const renderMaintenanceType = (type: string) => {
    switch (type) {
      case "preventive":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">Preventivo</span>;
      case "corrective":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Correctivo</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{type}</span>;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <Layout currentModule="dashboard">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {greeting}, {user?.name}
            </h1>
            <p className="text-gray-600">
              Bienvenido al panel de control de SistemaGM
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => handleExportReports()}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Exportar Informes
            </Button>
            <Button 
              className="flex items-center"
              onClick={() => handleNewAsset()}
            >
              <Wrench className="h-4 w-4 mr-2" />
              Nuevo Activo
            </Button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardDescription>Total de Activos</CardDescription>
                <CardTitle className="text-3xl">128</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-xs text-green-600 font-medium flex items-center">
                  <span className="i-lucide-trending-up mr-1"></span>
                  <span>+5% desde el mes pasado</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/assets" className="text-xs text-gray-500 hover:text-teal-600 flex items-center">
                  Ver todos los activos
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardDescription>Mantenimientos Pendientes</CardDescription>
                <CardTitle className="text-3xl">12</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-xs text-amber-600 font-medium flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>3 programados para esta semana</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/assets/maintenance" className="text-xs text-gray-500 hover:text-teal-600 flex items-center">
                  Ver mantenimientos
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardDescription>Documentos Totales</CardDescription>
                <CardTitle className="text-3xl">256</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-xs text-blue-600 font-medium flex items-center">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  <span>24 archivos nuevos este mes</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/documents" className="text-xs text-gray-500 hover:text-teal-600 flex items-center">
                  Explorar documentos
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-2">
                <CardDescription>Usuarios Activos</CardDescription>
                <CardTitle className="text-3xl">18</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-xs text-purple-600 font-medium flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  <span>3 nuevos usuarios este mes</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/settings" className="text-xs text-gray-500 hover:text-teal-600 flex items-center">
                  Administrar usuarios
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </CardFooter>
            </Card>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle>Mantenimientos Próximos</CardTitle>
                <CardDescription>
                  Intervenciones programadas para los próximos 7 días
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMaintenances.map((maintenance) => (
                    <div
                      key={maintenance.id}
                      className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="mr-4 mt-1">
                        <CalendarRange className="h-8 w-8 text-teal-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {maintenance.assetName}
                        </h4>
                        <div className="mt-1 flex items-center">
                          <LocateFixed className="h-3.5 w-3.5 text-gray-500 mr-1" />
                          <p className="text-xs text-gray-500 truncate">
                            {maintenance.location}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {renderMaintenanceType(maintenance.type)}
                          {renderMaintenanceStatus(maintenance.status)}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(maintenance.date).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "2-digit"
                          })}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(maintenance.date).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/assets/maintenance">Ver todos los mantenimientos</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle>Documentos Recientes</CardTitle>
                <CardDescription>
                  Últimos archivos subidos al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="mr-4 mt-1">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {doc.name}
                        </h4>
                        <div className="mt-1 flex items-center">
                          <p className="text-xs text-gray-500 truncate">
                            {formatSize(doc.size)} • Actualizado por {doc.user}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/documents">Ver todos los documentos</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="maintenance" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-4">
              <TabsTrigger value="maintenance">Mantenimientos</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
            </TabsList>
            <TabsContent value="maintenance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle>Histórico de Mantenimientos</CardTitle>
                    <CardDescription>
                      Intervenciones preventivas vs. correctivas en los últimos 6 meses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={maintenanceData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="preventive" name="Preventivos" fill="#10b981" />
                          <Bar dataKey="corrective" name="Correctivos" fill="#f97316" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle>Estado de Activos</CardTitle>
                    <CardDescription>
                      Distribución por estado operativo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="documents" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle>Actividad de Documentos</CardTitle>
                    <CardDescription>
                      Subidas y descargas en los últimos 6 meses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={documentData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="uploads" name="Subidas" stroke="#3b82f6" fill="#93c5fd" />
                          <Area type="monotone" dataKey="downloads" name="Descargas" stroke="#8b5cf6" fill="#c4b5fd" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle>Categorías de Activos</CardTitle>
                    <CardDescription>
                      Distribución por tipo de equipamiento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;