import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  Users,
  FileText,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  ChevronLeft,
  Image as ImageIcon,
  Wrench,
  Hammer,
  Laptop,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { Project, ProjectManager, ProjectDocument, ProjectMember } from "@shared/schema";
import AssignEquipmentDialog from "@/components/project/AssignEquipmentDialog";
import { ManageProjectMembersDialog } from "@/components/project/ManageProjectMembersDialog";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [isProjectManager, setIsProjectManager] = useState(false);
  const [isAssignEquipmentDialogOpen, setIsAssignEquipmentDialogOpen] = useState(false);

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
    retry: 2,
  });



  // Fetch project managers
  const { data: managers, isLoading: isLoadingManagers } = useQuery<{
    id: number;
    userId: number;
    projectId: number;
    role: string;
    createdAt: Date;
    userDetails: {
      id: number;
      username: string;
      email: string;
      name: string;
      role: string;
      avatar: string | null;
    } | null;
  }[]>({
    queryKey: [`/api/projects/${id}/managers`],
    retry: 2,
  });
  
  // Detectar si el usuario actual es gestor del proyecto
  useEffect(() => {
    if (managers && user) {
      // Comprobar si el usuario actual está en la lista de gestores
      const isManager = managers.some(manager => 
        manager.userDetails?.id === user.id
      );
      setIsProjectManager(isManager);
    }
  }, [managers, user]);

  // Fetch project equipment
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery<{
    id: number;
    projectId: number;
    equipmentId: number;
    assignedDate: Date;
    expectedReturnDate: Date | null;
    actualReturnDate: Date | null;
    assignedBy: number;
    status: string;
    notes: string | null;
    isShared: boolean;
    authorizationCode: string | null;
    equipment: {
      id: number;
      name: string;
      code: string;
      typeId: number;
      status: string;
      photo: string | null;
    };
  }[]>({
    queryKey: [`/api/projects/${id}/equipment`],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/projects/${id}/equipment`);
        if (!res.ok) {
          return [];
        }
        return await res.json();
      } catch (error) {
        console.error("Error fetching equipment:", error);
        return [];
      }
    },
    retry: 2,
  });

  // Fetch project documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<{
    id: number;
    documentId: number;
    projectId: number;
    documentType: string;
    description: string | null;
    uploadedBy: number;
    createdAt: Date;
    documentDetails: {
      id: number;
      name: string;
      path: string;
      type: string;
      size: number;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }[]>({
    queryKey: [`/api/projects/${id}/documents`],
    retry: 2,
  });

  // Manager removal mutation
  const removeManagerMutation = useMutation({
    mutationFn: async (managerId: number) => {
      const res = await fetch(`/api/projects/managers/${managerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar el gestor");
      return managerId;
    },
    onSuccess: () => {
      toast({
        title: "Gestor eliminado",
        description: "El gestor ha sido eliminado del proyecto",
      });
      // Refresh managers data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/managers`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el gestor",
        variant: "destructive",
      });
    },
  });

  // Document removal mutation
  const removeDocumentMutation = useMutation({
    mutationFn: async (docId: number) => {
      const res = await fetch(`/api/projects/documents/${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar el documento");
      return docId;
    },
    onSuccess: () => {
      toast({
        title: "Documento eliminado",
        description: "El documento ha sido eliminado del proyecto",
      });
      // Refresh documents data
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/documents`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive",
      });
    },
  });

  if (isLoadingProject) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Proyecto no encontrado</AlertTitle>
          <AlertDescription>
            No se pudo encontrar el proyecto solicitado. Puede que haya sido
            eliminado o no existe.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Proyectos
          </Button>
        </div>
      </div>
    );
  }

  const handleRemoveManager = (managerId: number) => {
    if (window.confirm("¿Está seguro de que desea eliminar este gestor del proyecto?")) {
      removeManagerMutation.mutate(managerId);
    }
  };

  const handleRemoveDocument = (docId: number) => {
    if (window.confirm("¿Está seguro de que desea eliminar este documento del proyecto?")) {
      removeDocumentMutation.mutate(docId);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Barra de navegación superior */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate("/")}
          >
            <ChevronLeft size={16} />
            Volver al sistema
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            Lista de proyectos
          </Button>
          
          {isAdmin && (
            <Link href={`/projects/${id}/edit`}>
              <Button>Editar Proyecto</Button>
            </Link>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Imagen del proyecto */}
            <div className="hidden md:block">
              {project.image ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Si hay error al cargar la imagen, mostrar icono por defecto
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                        const icon = document.createElement('div');
                        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                        parent.appendChild(icon);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-3 text-muted-foreground mt-1">
                <Badge variant={project.status === "completed" ? "secondary" : "default"}>
                  {project.status === "completed" ? "Completado" : "En progreso"}
                </Badge>
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1" />
                  {project.location}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsAssignEquipmentDialogOpen(true)}
            >
              <Wrench className="h-4 w-4" />
              Asignar Maquinaria
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {project.description && (
                <div>
                  <h3 className="font-medium mb-2">Descripción</h3>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Detalles Generales</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Calendar size={16} className="text-muted-foreground" />
                      <span>Fecha de inicio: {format(new Date(project.startDate), "dd/MM/yyyy")}</span>
                    </li>
                    {project.endDate && (
                      <li className="flex items-center gap-2">
                        <Clock size={16} className="text-muted-foreground" />
                        <span>Fecha de fin: {format(new Date(project.endDate), "dd/MM/yyyy")}</span>
                      </li>
                    )}
                    {project.createdBy && (
                      <li className="flex items-center gap-2">
                        <User size={16} className="text-muted-foreground" />
                        <span>Creado por: Usuario ID {project.createdBy}</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <Clock size={16} className="text-muted-foreground" />
                      <span>Creado el: {format(new Date(project.createdAt), "dd/MM/yyyy HH:mm")}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Información del Cliente</h3>
                  {project.clientName || project.clientContact ? (
                    <ul className="space-y-2">
                      {project.clientName && (
                        <li className="flex items-center gap-2">
                          <Building2 size={16} className="text-muted-foreground" />
                          <span>Nombre: {project.clientName}</span>
                        </li>
                      )}
                      {project.clientContact && (
                        <li className="flex items-center gap-2">
                          <User size={16} className="text-muted-foreground" />
                          <span>Contacto: {project.clientContact}</span>
                        </li>
                      )}
                      {project.budget && (
                        <li className="flex items-center gap-2">
                          <span className="text-muted-foreground">$</span>
                          <span>Presupuesto: {project.budget}</span>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No hay información del cliente registrada</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Miembros del Proyecto */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Miembros del Proyecto</CardTitle>
                {/* Solo los administradores y gestores pueden gestionar miembros */}
                {(isAdmin || isProjectManager) && (
                  <ManageProjectMembersDialog
                    projectId={parseInt(id!)}
                    trigger={
                      <Button size="sm" variant="default" className="h-8">
                        <Users size={16} className="mr-1" /> Gestionar
                      </Button>
                    }
                  />
                )}
              </div>
              <CardDescription>
                Personas asignadas a este proyecto que tienen acceso a los recursos.
              </CardDescription>
            </CardHeader>
          </Card>
          
          {/* Gestores del Proyecto */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Gestores del Proyecto</CardTitle>
                {isAdmin && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8"
                    onClick={() => navigate(`/projects/${id}/managers/add`)}
                  >
                    <Plus size={16} className="mr-1" /> Añadir
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingManagers ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !managers || managers.length === 0 ? (
                <div className="text-center py-4">
                  <Users size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay gestores asignados</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {managers.map((manager) => (
                    <li key={manager.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-8 w-8 rounded-full bg-cover bg-center flex-shrink-0"
                          style={{
                            backgroundImage: manager.userDetails?.avatar
                              ? `url(${manager.userDetails.avatar})`
                              : "none",
                            backgroundColor: !manager.userDetails?.avatar ? "#e2e8f0" : undefined,
                          }}
                        >
                          {!manager.userDetails?.avatar && (
                            <span className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-600">
                              {manager.userDetails?.name?.[0] || "?"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {manager.userDetails?.name || `Usuario ID: ${manager.userId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {manager.role || "Gestor"}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveManager(manager.id)}
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Documentos</CardTitle>
                <Link href={`/projects/${id}/documents/add`}>
                  <Button size="sm" variant="outline" className="h-8">
                    <Plus size={16} className="mr-1" /> Añadir
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !documents || documents.length === 0 ? (
                <div className="text-center py-4">
                  <FileText size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay documentos asociados</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText size={20} className="text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {doc.documentDetails?.name || `Documento ID: ${doc.documentId}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.documentType} {doc.description ? `- ${doc.description}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {doc.documentDetails && (
                          <a
                            href={`/api/documents/${doc.documentId}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon">
                              <Download size={16} />
                            </Button>
                          </a>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDocument(doc.id)}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          
          {/* Sección de Maquinaria Asignada */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Maquinaria Asignada</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8"
                  onClick={() => setIsAssignEquipmentDialogOpen(true)}
                >
                  <Plus size={16} className="mr-1" /> Asignar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEquipment ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !equipment || equipment.length === 0 ? (
                <div className="text-center py-4">
                  <Wrench size={24} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay maquinaria asignada a este proyecto</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {equipment.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                          {item.equipment.typeId === 1 ? (
                            <Laptop size={18} className="text-blue-500" />
                          ) : (
                            <Wrench size={18} className="text-orange-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.equipment.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              Código: {item.equipment.code}
                            </p>
                            {item.isShared && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                Compartido
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-right">
                        <p className="text-xs text-muted-foreground">
                          Asignado: {format(new Date(item.assignedDate), "dd/MM/yyyy")}
                        </p>
                        {item.expectedReturnDate && (
                          <p className="text-xs text-muted-foreground">
                            Devolución: {format(new Date(item.expectedReturnDate), "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Diálogo para asignar maquinaria */}
      <AssignEquipmentDialog
        isOpen={isAssignEquipmentDialogOpen}
        onClose={() => setIsAssignEquipmentDialogOpen(false)}
        projectId={parseInt(id)}
      />
    </div>
  );
}