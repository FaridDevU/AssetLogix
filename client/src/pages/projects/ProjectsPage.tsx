import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Building2, 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  Trash2, 
  Edit, 
  FileText, 
  MoreVertical, 
  ChevronLeft, 
  FileUp, 
  Users, 
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Project } from '@shared/schema';
import { Link, useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCompleted, setShowCompleted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Fetch projects data
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    retry: 2
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Error al eliminar el proyecto');
      return id;
    },
    onSuccess: (id) => {
      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto ha sido eliminado correctamente',
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      // Cerrar el diálogo
      closeDeleteDialog();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el proyecto',
        variant: 'destructive',
      });
    },
  });

  const openDeleteDialog = (project: Project) => {
    setProjectToDelete(project.id);
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
    setSelectedProject(null);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteMutation.mutate(projectToDelete);
    }
  };

  const filteredProjects = projects?.filter(project => 
    showCompleted ? true : project.status !== 'completed'
  );

  const [_, setLocation] = useLocation(); // Para navegación

  return (
    <div className="container mx-auto py-6">
      {/* Botón para volver al sistema */}
      <div className="mb-4">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setLocation("/")}
        >
          <ChevronLeft size={16} />
          Volver al sistema
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Obras y Proyectos</h1>
          <p className="text-muted-foreground">
            Gestión de obras en construcción y proyectos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showCompleted"
              checked={showCompleted}
              onChange={() => setShowCompleted(!showCompleted)}
              className="h-4 w-4"
            />
            <label htmlFor="showCompleted">Mostrar completados</label>
          </div>
          
          {/* Botón de Nuevo Proyecto con estilo mejorado */}
          <Link href="/projects/new">
            <Button className="flex items-center gap-2" variant="default">
              <PlusCircle size={16} />
              Nuevo Proyecto
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProjects?.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <Badge variant={project.status === 'completed' ? 'secondary' : 'default'}>
                        {project.status === 'completed' ? 'Completado' : 'En progreso'}
                      </Badge>
                    </div>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-muted-foreground" />
                        <span>{project.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-muted-foreground" />
                        <span>Inicio: {format(new Date(project.startDate), 'dd/MM/yyyy')}</span>
                      </div>
                      {project.endDate && (
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-muted-foreground" />
                          <span>Fin: {format(new Date(project.endDate), 'dd/MM/yyyy')}</span>
                        </div>
                      )}
                      {project.clientName && (
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-muted-foreground" />
                          <span>Cliente: {project.clientName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-muted-foreground" />
                        <span>Creado por: {project.createdBy}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline">Ver detalles</Button>
                    </Link>
                    
                    {/* Menú de 3 puntos para opciones */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/projects/${project.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye size={16} className="mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/projects/${project.id}/add-manager`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Users size={16} className="mr-2" />
                            Gestionar responsables
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/projects/${project.id}/add-document`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <FileUp size={16} className="mr-2" />
                            Añadir documentos
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        {user?.role === 'admin' && (
                          <>
                            <Link href={`/projects/${project.id}/edit`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit size={16} className="mr-2" />
                                Editar proyecto
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => openDeleteDialog(project)}
                            >
                              <Trash2 size={16} className="mr-2" />
                              Eliminar proyecto
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredProjects?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center">
              <FileText size={64} className="text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay proyectos</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                {showCompleted
                  ? "No hay proyectos registrados en el sistema."
                  : "No hay proyectos en curso. Habilite la opción 'Mostrar completados' para ver proyectos anteriores."}
              </p>
              <Link href="/projects/new">
                <Button className="flex items-center gap-2">
                  <PlusCircle size={16} />
                  Crear primer proyecto
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Diálogo de confirmación para eliminar proyecto */}
      {selectedProject && (
        <DeleteConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={closeDeleteDialog}
          onConfirm={confirmDelete}
          title="Eliminar Proyecto"
          description="Para eliminar este proyecto, debe confirmar con su contraseña. Esta acción es permanente y no se puede deshacer."
          itemName={`${selectedProject.name} (ID: ${selectedProject.id})`}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  );
}