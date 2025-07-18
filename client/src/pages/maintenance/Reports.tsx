import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function MaintenanceReports() {
  const [reportType, setReportType] = useState("interventions");
  const [dateRange, setDateRange] = useState({ from: new Date(), to: new Date() });
  const [isLoading, setIsLoading] = useState(false);
  const [format, setFormat] = useState("pdf");
  const [generatedReports, setGeneratedReports] = useState<Array<{
    id: string;
    type: string;
    name: string;
    date: Date;
    format: string;
    url: string;
  }>>([]);
  const { toast } = useToast();

  const handleGenerateReport = () => {
    setIsLoading(true);
    
    // Simulamos la generación del reporte
    setTimeout(() => {
      const reportNames = {
        interventions: "Intervenciones de mantenimiento",
        schedule: "Programación de mantenimientos",
        equipment: "Estado de equipos",
        costs: "Costos de mantenimiento",
        technicians: "Rendimiento de técnicos"
      };
      
      // Creamos un nuevo reporte con ID único
      const newReport = {
        id: `report-${Date.now()}`,
        type: reportType,
        name: reportNames[reportType as keyof typeof reportNames],
        date: new Date(),
        format: format,
        url: `#report-${reportType}-${Date.now()}.${format}` // URL simulada
      };
      
      // Agregamos el nuevo reporte a la lista
      setGeneratedReports(prev => [newReport, ...prev]);
      
      setIsLoading(false);
      toast({
        title: "Reporte generado exitosamente",
        description: "El reporte se ha generado y está listo para descargar.",
      });
    }, 1500);
  };
  
  const handleDownloadReport = (reportUrl: string) => {
    // En una aplicación real, esto descargará el archivo
    toast({
      title: "Descargando reporte",
      description: "El reporte se está descargando...",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Reportes de Mantenimiento</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generar Reportes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Reporte</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de reporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interventions">Intervenciones de mantenimiento</SelectItem>
                    <SelectItem value="schedule">Programación de mantenimientos</SelectItem>
                    <SelectItem value="equipment">Estado de equipos</SelectItem>
                    <SelectItem value="costs">Costos de mantenimiento</SelectItem>
                    <SelectItem value="technicians">Rendimiento de técnicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Periodo de tiempo</label>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Select defaultValue="custom">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Hoy</SelectItem>
                        <SelectItem value="yesterday">Ayer</SelectItem>
                        <SelectItem value="last7">Últimos 7 días</SelectItem>
                        <SelectItem value="last30">Últimos 30 días</SelectItem>
                        <SelectItem value="thisMonth">Este mes</SelectItem>
                        <SelectItem value="lastMonth">Mes pasado</SelectItem>
                        <SelectItem value="thisYear">Este año</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Formato</label>
                <Select defaultValue="pdf" value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              {reportType === "interventions" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de intervención</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="preventive">Preventivo</SelectItem>
                        <SelectItem value="corrective">Correctivo</SelectItem>
                        <SelectItem value="emergency">Emergencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="in_progress">En progreso</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {reportType === "equipment" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de equipo</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="mechanical">Mecánico</SelectItem>
                        <SelectItem value="electrical">Eléctrico</SelectItem>
                        <SelectItem value="hydraulic">Hidráulico</SelectItem>
                        <SelectItem value="pneumatic">Neumático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="operational">Operativo</SelectItem>
                        <SelectItem value="maintenance">En mantenimiento</SelectItem>
                        <SelectItem value="out_of_service">Fuera de servicio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="text-sm font-medium">Incluir gráficos</label>
                <div className="flex items-center mt-2">
                  <input type="checkbox" id="includeCharts" className="mr-2" />
                  <label htmlFor="includeCharts" className="text-sm">Incluir gráficos y estadísticas</label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleGenerateReport} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando reporte...
                </>
              ) : (
                <>
                  <i className="ri-file-chart-line mr-2"></i>
                  Generar Reporte
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reportes Guardados</CardTitle>
        </CardHeader>
        <CardContent>
          {generatedReports.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-gray-300 mb-2" />
                <h3 className="mt-2 text-lg font-medium text-gray-700">No hay reportes guardados</h3>
                <p className="mt-1 text-gray-500">
                  Los reportes generados aparecerán aquí para su acceso rápido.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {generatedReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="bg-teal-100 p-2 rounded-md mr-3">
                        <FileText className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">{report.name}</h4>
                        <p className="text-xs text-gray-500">
                          {report.format.toUpperCase()} • {
                            new Date(report.date).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                      onClick={() => handleDownloadReport(report.url)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}