import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Calendar, Clock, Edit, Loader2, Trash2, Download, Upload, History, Eye, FileText, MoreVertical } from "lucide-react";
import EditDocumentModal from "./EditDocumentModal";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Document, DocumentVersion, DocumentActivity, User } from "@shared/schema";
import NewVersionModal from "./NewVersionModal";
import { useAuth } from "@/hooks/use-auth";

interface DocumentDetailProps {
  id: string;
}

export default function DocumentDetail({ id }: DocumentDetailProps) {
  const documentId = parseInt(id);
  
  // Verificar que el ID sea un número válido
  if (isNaN(documentId)) {
    console.error('ID de documento inválido:', id);
  }
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Fetch document details
  const { 
    data: document, 
    isLoading: isLoadingDocument,
    isError: isDocumentError
  } = useQuery<Document>({
    queryKey: ["/api/documents", documentId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${documentId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching document: ${res.status}`);
      }
      return res.json();
    },
    enabled: !isNaN(documentId)
  });

  // Fetch document versions
  const { 
    data: versions,
    isLoading: isLoadingVersions
  } = useQuery<DocumentVersion[]>({
    queryKey: ["/api/documents/versions", documentId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching versions: ${res.status}`);
      }
      return res.json();
    },
    enabled: !isNaN(documentId)
  });

  // Fetch document activity
  const { 
    data: activities,
    isLoading: isLoadingActivities
  } = useQuery<DocumentActivity[]>({
    queryKey: ["/api/documents/activity", documentId],
    queryFn: async () => {
      const res = await fetch(`/api/documents/${documentId}/activity`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching activity: ${res.status}`);
      }
      return res.json();
    },
    enabled: !isNaN(documentId)
  });

  // Fetch users for activity log
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/documents/${documentId}`);
      return res.ok;
    },
    onSuccess: () => {
      toast({
        title: "Documento eliminado",
        description: "El documento ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setLocation("/documents");
    },
    onError: (error: Error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // View document (download)
  const handleViewDocument = async (versionId?: number) => {
    try {
      const url = versionId 
        ? `/api/documents/versions/${versionId}/download` 
        : `/api/documents/${documentId}/download`;

      // Log activity if viewing current version
      if (!versionId && user) {
        await apiRequest("POST", `/api/documents/${documentId}/activity`, {
          documentId,
          userId: user.id,
          action: "download",
          details: "Descargó el documento"
        });

        // Refresh activity log
        queryClient.invalidateQueries({ queryKey: ["/api/documents/activity", documentId] });
      }
      
      // Determinar el nombre de descarga con extensión correcta
      let downloadName = document?.name || 'documento';
      if (document?.originalExtension) {
        if (!downloadName.toLowerCase().endsWith(document.originalExtension.toLowerCase())) {
          downloadName += document.originalExtension;
        }
      } else if (document?.type && !downloadName.toLowerCase().includes(`.${document.type.toLowerCase()}`)) {
        downloadName += `.${document.type}`;
      }

      // Iniciar descarga usando una ventana o frame oculto
      const a = window.document.createElement('a');
      a.href = url;
      a.download = downloadName;
      a.target = '_blank';
      a.click();
    } catch (error) {
      console.error("Error al descargar documento:", error);
      toast({
        title: "Error al descargar documento",
        description: "No se pudo descargar el documento",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (isNaN(documentId)) {
      toast({
        title: "Error al eliminar",
        description: "ID de documento inválido",
        variant: "destructive",
      });
      return;
    }
    deleteMutation.mutate();
  };

  const handleGoBack = () => {
    setLocation("/documents");
  };

  const handleNewVersion = () => {
    setIsNewVersionModalOpen(true);
  };

  // Function to get user name for activity log
  const getUserName = (userId: number | null) => {
    if (!userId) return "Sistema";
    const foundUser = users?.find(u => u.id === userId);
    return foundUser ? foundUser.name : `Usuario #${userId}`;
  };

  // Función para determinar el icono basado en el tipo de archivo o extensión original
  const getFileIcon = () => {
    if (!document) return <FileText className="h-20 w-20 text-blue-300" />;

    // Verificar la extensión original (archivos de Autodesk)
    if (document.originalExtension) {
      const ext = document.originalExtension.toLowerCase();

      // Archivos AutoCAD
      if (['.dwg', '.dxf', '.dwf'].includes(ext)) {
        return <FileText className="h-20 w-20 text-orange-400" />;
      }

      // Archivos Revit
      if (['.rvt', '.rfa', '.rte', '.rft'].includes(ext)) {
        return <FileText className="h-20 w-20 text-blue-500" />;
      }
    }

    // Determinar icono por tipo de archivo
    switch(document?.type?.toLowerCase() || 'unknown') {
      case 'pdf':
        return <FileText className="h-20 w-20 text-red-400" />;
      case 'word':
      case 'doc':
      case 'docx':
        return <FileText className="h-20 w-20 text-blue-600" />;
      case 'excel':
      case 'xls':
      case 'xlsx':
        return <FileText className="h-20 w-20 text-green-600" />;
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText className="h-20 w-20 text-purple-500" />;
      default:
        return <FileText className="h-20 w-20 text-blue-300" />;
    }
  };

  if (isLoadingDocument) {
    return (
      <Layout currentModule="documentos">
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isDocumentError || !document || isNaN(documentId)) {
    return (
      <Layout currentModule="documentos">
        <div className="container mx-auto py-8 px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-700">
              No se pudo cargar la información del documento
            </h2>
            <p className="text-gray-500 mt-2">
              El documento solicitado no existe o hubo un error al cargar sus datos.
            </p>
            <Button 
              onClick={handleGoBack} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a documentos
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Format dates safely
  const createdDate = document.createdAt && !isNaN(new Date(document.createdAt).getTime()) 
    ? new Date(document.createdAt).toLocaleDateString() 
    : "Sin fecha";
  const updatedDate = document.updatedAt && !isNaN(new Date(document.updatedAt).getTime()) 
    ? new Date(document.updatedAt).toLocaleDateString() 
    : "Sin fecha";

  return (
    <Layout currentModule="documentos">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a documentos
          </Button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {document.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="uppercase">{document?.type || 'Desconocido'}</Badge>
                {document.originalExtension && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 uppercase">
                    {document.originalExtension}
                  </Badge>
                )}
                <Badge>Versión {document.currentVersion}</Badge>
                <Badge variant="outline">{Math.round(document.size / 1024)} KB</Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleDelete}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleViewDocument()}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button 
                onClick={handleNewVersion}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Nueva Versión
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda con información del documento */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <div className="bg-blue-50 h-[150px] flex items-center justify-center">
                  {getFileIcon()}
                </div>

                <CardContent className="pt-6">
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Ruta del Archivo</dt>
                      <dd className="mt-1 text-sm text-gray-900 truncate">{document.path}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Creado</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {createdDate}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {updatedDate}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Creado por</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {getUserName(document.createdBy)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Columna derecha con tabs de versiones y actividad */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Tabs defaultValue="versions" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="versions" className="flex-1">Versiones</TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1">Actividad</TabsTrigger>
                </TabsList>

                <TabsContent value="versions" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">Historial de Versiones</CardTitle>
                          <CardDescription>
                            Versiones anteriores del documento
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={handleNewVersion}
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Nueva Versión
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoadingVersions ? (
                        <div className="py-8 flex justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : versions && versions.length > 0 ? (
                        <div className="space-y-4">
                          {versions.map((version, index) => (
                            <Card key={version.id} className={`border ${index === 0 ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                              <CardContent className="py-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant={index === 0 ? "default" : "outline"}>
                                        v{version.version}
                                      </Badge>
                                      {index === 0 && (
                                        <Badge className="bg-blue-500">Actual</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                      <span className="font-medium">Tamaño:</span> {Math.round(version.size / 1024)} KB
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      <span className="font-medium">Fecha:</span> {new Date(version.createdAt).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      <span className="font-medium">Creada por:</span> {getUserName(version.createdBy)}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                    onClick={() => handleViewDocument(version.id)}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600">Sin historial de versiones</h3>
                          <p className="text-gray-500 mt-1">
                            Este documento solo tiene la versión actual
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Registro de Actividad</CardTitle>
                      <CardDescription>
                        Historial de acciones realizadas sobre este documento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingActivities ? (
                        <div className="py-8 flex justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : activities && activities.length > 0 ? (
                        <div className="space-y-4">
                          {activities.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {getUserName(activity.userId).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm font-medium">
                                    {getUserName(activity.userId)}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {new Date(activity.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {activity.action === "created" && "Creó el documento"}
                                  {activity.action === "updated" && "Actualizó el documento"}
                                  {activity.action === "viewed" && "Visualizó el documento"}
                                  {activity.action === "uploaded" && "Subió una nueva versión"}
                                  {activity.action === "deleted" && "Eliminó una versión"}
                                  {activity.action === "renamed" && "Renombró el documento"}
                                </p>
                                {activity.details && (
                                  <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-600">Sin actividad registrada</h3>
                          <p className="text-gray-500 mt-1">
                            No hay actividad registrada para este documento
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal para nueva versión */}
      <NewVersionModal
        document={document}
        isOpen={isNewVersionModalOpen}
        onClose={() => setIsNewVersionModalOpen(false)}
      />

      {/* Modal para editar documento */}
      {document && (
        <EditDocumentModal
          document={document}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este documento y todas sus versiones del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}