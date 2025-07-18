import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface DocumentVersion {
  id: number;
  documentId: number;
  version: number;
  path: string;
  size: number;
  createdBy: number;
  createdAt: string;
}

interface DocumentActivity {
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
}

interface DocumentViewerProps {
  documentId: number;
  onClose?: () => void;
}

export default function DocumentViewer({ documentId, onClose }: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState("preview");
  const { toast } = useToast();

  // Fetch document details
  const { data: document, isLoading: documentLoading } = useQuery({
    queryKey: [`/api/documents/${documentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch document');
      return response.json();
    }
  });

  // Fetch document versions
  const { data: versions = [], isLoading: versionsLoading } = useQuery<DocumentVersion[]>({
    queryKey: [`/api/documents/${documentId}/versions`],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}/versions`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch versions');
      return response.json();
    }
  });

  // Fetch document activity
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<DocumentActivity[]>({
    queryKey: [`/api/documents/${documentId}/activity`],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}/activity`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    }
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatActivityAction = (action: string): string => {
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

  const getRelativeTime = (date: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} minutos`;
    if (diffHour < 24) return `Hace ${diffHour} horas`;
    if (diffDay === 1) return 'Ayer';
    if (diffDay < 30) return `Hace ${diffDay} días`;
    
    return past.toLocaleDateString();
  };

  const isLoading = documentLoading || versionsLoading || activitiesLoading;

  const renderPreview = () => {
    if (!document) return null;

    const fileType = document.type;
    
    if (fileType.includes('pdf')) {
      // For PDFs, use PDF.js (in a real app) or an iframe
      return (
        <div className="w-full h-96 bg-secondary-50 flex items-center justify-center rounded-md">
          <div className="text-center">
            <i className="ri-file-pdf-line text-4xl text-error-500"></i>
            <p className="mt-2 text-secondary-600">Previsualización de PDF no disponible en este entorno</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => toast({
                title: "Descarga iniciada",
                description: "El archivo se está descargando",
              })}
            >
              <i className="ri-download-line mr-2"></i>
              Descargar PDF
            </Button>
          </div>
        </div>
      );
    } else if (fileType.includes('image')) {
      // For images
      return (
        <div className="w-full h-96 bg-secondary-50 flex items-center justify-center rounded-md overflow-hidden">
          <img 
            src={`${document.path}`} 
            alt={document.name} 
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Preview+Not+Available';
            }}
          />
        </div>
      );
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return (
        <div className="w-full h-96 bg-secondary-50 flex items-center justify-center rounded-md">
          <div className="text-center">
            <i className="ri-file-word-line text-4xl text-primary-500"></i>
            <p className="mt-2 text-secondary-600">Previsualización de documento no disponible</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => toast({
                title: "Descarga iniciada",
                description: "El archivo se está descargando",
              })}
            >
              <i className="ri-download-line mr-2"></i>
              Descargar documento
            </Button>
          </div>
        </div>
      );
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return (
        <div className="w-full h-96 bg-secondary-50 flex items-center justify-center rounded-md">
          <div className="text-center">
            <i className="ri-file-excel-line text-4xl text-success-500"></i>
            <p className="mt-2 text-secondary-600">Previsualización de hoja de cálculo no disponible</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => toast({
                title: "Descarga iniciada",
                description: "El archivo se está descargando",
              })}
            >
              <i className="ri-download-line mr-2"></i>
              Descargar hoja de cálculo
            </Button>
          </div>
        </div>
      );
    } else {
      // Generic file
      return (
        <div className="w-full h-96 bg-secondary-50 flex items-center justify-center rounded-md">
          <div className="text-center">
            <i className="ri-file-line text-4xl text-secondary-500"></i>
            <p className="mt-2 text-secondary-600">Previsualización no disponible para este tipo de archivo</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => toast({
                title: "Descarga iniciada",
                description: "El archivo se está descargando",
              })}
            >
              <i className="ri-download-line mr-2"></i>
              Descargar archivo
            </Button>
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-8 text-center">
        <p className="text-secondary-500">No se pudo cargar el documento</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">{document.name}</h2>
          <div className="flex items-center text-secondary-500 text-sm">
            <span className="mr-3">Versión {document.currentVersion}</span>
            <span className="mr-3">•</span>
            <span className="mr-3">{formatFileSize(document.size)}</span>
            <span className="mr-3">•</span>
            <span>Actualizado {getRelativeTime(document.updatedAt)}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => toast({
            title: "Descarga iniciada",
            description: "El archivo se está descargando",
          })}>
            <i className="ri-download-line mr-2"></i>
            Descargar
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <i className="ri-upload-line mr-2"></i>
                Nueva versión
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subir nueva versión</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors">
                  <i className="ri-upload-cloud-2-line text-4xl text-secondary-400"></i>
                  <p className="mt-2 text-sm text-secondary-600">
                    Arrastra un archivo aquí o haz clic para seleccionar
                  </p>
                  <input type="file" className="hidden" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={() => toast({
                  title: "Nueva versión creada",
                  description: "Se ha subido la nueva versión del documento correctamente",
                })}>Subir versión</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              <i className="ri-close-line"></i>
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full border-b border-secondary-200 pb-0">
          <TabsTrigger value="preview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary-600">
            <i className="ri-file-text-line mr-2"></i>
            Vista previa
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-primary-600">
            <i className="ri-information-line mr-2"></i>
            Detalles
          </TabsTrigger>
          <TabsTrigger value="versions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary-600">
            <i className="ri-history-line mr-2"></i>
            Versiones ({versions.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-primary-600">
            <i className="ri-time-line mr-2"></i>
            Actividad ({activities.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="pt-4">
          {renderPreview()}
        </TabsContent>
        
        <TabsContent value="details" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Información del documento</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-secondary-500">Nombre:</span>
                  <span className="font-medium">{document.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Tipo:</span>
                  <span className="font-medium">{document.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Tamaño:</span>
                  <span className="font-medium">{formatFileSize(document.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Versión actual:</span>
                  <span className="font-medium">{document.currentVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Fecha de creación:</span>
                  <span className="font-medium">{new Date(document.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500">Última modificación:</span>
                  <span className="font-medium">{new Date(document.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-secondary-900 mb-4">Permisos</h3>
              <div className="p-6 bg-secondary-50 rounded-lg text-center">
                <i className="ri-lock-line text-3xl text-secondary-400"></i>
                <p className="mt-2 text-secondary-600">Información de permisos no disponible</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="versions" className="pt-4">
          {versions.length === 0 ? (
            <div className="text-center p-6 bg-secondary-50 rounded-lg">
              <i className="ri-history-line text-3xl text-secondary-400"></i>
              <p className="mt-2 text-secondary-600">No hay versiones anteriores</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Versión
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Tamaño
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-100">
                  {versions.map((version) => (
                    <tr key={version.id} className={version.version === document.currentVersion ? "bg-primary-50" : "hover:bg-secondary-50"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-secondary-900">
                            {version.version === document.currentVersion ? (
                              <span className="inline-flex items-center">
                                V{version.version}
                                <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-800 rounded-full">Actual</span>
                              </span>
                            ) : (
                              `V${version.version}`
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-secondary-500">{new Date(version.createdAt).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-secondary-500">{formatFileSize(version.size)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm">
                          <i className="ri-download-line mr-1"></i>
                          Descargar
                        </Button>
                        {version.version !== document.currentVersion && (
                          <Button variant="ghost" size="sm">
                            <i className="ri-restart-line mr-1"></i>
                            Restaurar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="activity" className="pt-4">
          {activities.length === 0 ? (
            <div className="text-center p-6 bg-secondary-50 rounded-lg">
              <i className="ri-time-line text-3xl text-secondary-400"></i>
              <p className="mt-2 text-secondary-600">No hay actividad registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-secondary-50">
                  <img 
                    src={activity.user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(activity.user.name)} 
                    alt={activity.user.name} 
                    className="h-10 w-10 rounded-full"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-secondary-900">{activity.user.name}</span>
                      {" "}
                      <span>{formatActivityAction(activity.action)}</span>
                      {" "}
                      <span className="text-primary-600">{document.name}</span>
                    </p>
                    {activity.details && (
                      <p className="text-xs text-secondary-500 mt-1">{activity.details}</p>
                    )}
                    <p className="text-xs text-secondary-500 mt-1">{getRelativeTime(activity.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
