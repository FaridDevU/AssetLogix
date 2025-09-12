import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { insertProjectManagerSchema, Project } from "@shared/schema";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert";
import { ArrowLeft, Loader2 } from "lucide-react";

// Extend the schema with validations
const formSchema = insertProjectManagerSchema.extend({
  userId: z.coerce.number({
    required_error: "Seleccione un usuario",
    invalid_type_error: "ID de usuario inválido",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function AddManagerPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user || user.role !== "admin") {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>
            No tienes permiso para acceder a esta página. Se requiere rol de administrador.
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

  // Fetch project
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
    retry: 2,
  });

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ['/api/users'],
    retry: 2,
  });

  // Form definition
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: parseInt(id),
      userId: 0,
      role: "manager",
    },
  });

  // Add manager mutation
  const addManagerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", `/api/projects/${id}/managers`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Gestor añadido",
        description: "El gestor ha sido añadido al proyecto correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/managers`] });
      navigate(`/projects/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo añadir el gestor al proyecto",
        variant: "destructive",
      });
      console.error("Error adding manager:", error);
    },
  });

  const onSubmit = (data: FormData) => {
    addManagerMutation.mutate(data);
  };

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

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(`/projects/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Proyecto
        </Button>
        <h1 className="text-3xl font-bold mt-4">Añadir Gestor</h1>
        <p className="text-muted-foreground">
          Asignar un usuario como gestor del proyecto {project.name}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Usuario</CardTitle>
              <CardDescription>
                Elige un usuario para asignarlo como gestor de este proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario *</FormLabel>
                    <Select
                      onValueChange={(value: string) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingUsers ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="animate-spin h-4 w-4" />
                          </div>
                        ) : !users || users.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No hay usuarios disponibles
                          </div>
                        ) : (
                          users.map((u) => (
                            <SelectItem key={u.id} value={u.id.toString()}>
                              {u.name || u.username} ({u.role})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isLoadingUsers
                        ? "Cargando usuarios..."
                        : "Seleccione un usuario para asignarlo como gestor del proyecto"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol en el proyecto *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manager">Gestor Principal</SelectItem>
                        <SelectItem value="coordinator">Coordinador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="inspector">Inspector</SelectItem>
                        <SelectItem value="consultant">Consultor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/projects/${id}`)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={addManagerMutation.isPending}
              >
                {addManagerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Asignar Gestor
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}