import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { insertProjectDocumentSchema, Project } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
const formSchema = insertProjectDocumentSchema.extend({
  documentId: z.coerce.number({
    required_error: "Seleccione un documento",
    invalid_type_error: "ID de documento inválido",
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function AddDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>
            Debe iniciar sesión para acceder a esta página.
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

  // Fetch documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<any[]>({
    queryKey: ['/api/documents'],
    retry: 2,
  });

  // Form definition
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: parseInt(id),
      documentId: 0,
      documentType: "plan",
      description: "",
      uploadedBy: user.id,
    },
  });

  // Add document mutation
  const addDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", `/api/projects/${id}/documents`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Documento asociado",
        description: "El documento ha sido asociado al proyecto correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/documents`] });
      navigate(`/projects/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo asociar el documento al proyecto",
        variant: "destructive",
      });
      console.error("Error adding document:", error);
    },
  });

  const onSubmit = (data: FormData) => {
    addDocumentMutation.mutate(data);
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
        <h1 className="text-3xl font-bold mt-4">Añadir Documento</h1>
        <p className="text-muted-foreground">
          Asociar un documento existente al proyecto {project.name}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Documento</CardTitle>
              <CardDescription>
                Elige un documento del sistema para asociarlo a este proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="documentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento *</FormLabel>
                    <Select
                      onValueChange={(value: string) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar documento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingDocuments ? (
                          <div className="flex justify-center p-2">
                            <Loader2 className="animate-spin h-4 w-4" />
                          </div>
                        ) : !documents || documents.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No hay documentos disponibles
                          </div>
                        ) : (
                          documents.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id.toString()}>
                              {doc.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isLoadingDocuments
                        ? "Cargando documentos..."
                        : "Seleccione un documento para asociarlo al proyecto"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de documento *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="plan">Plano</SelectItem>
                        <SelectItem value="permit">Permiso</SelectItem>
                        <SelectItem value="contract">Contrato</SelectItem>
                        <SelectItem value="report">Informe</SelectItem>
                        <SelectItem value="invoice">Factura</SelectItem>
                        <SelectItem value="specification">Especificación técnica</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Breve descripción del documento..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
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
                disabled={addDocumentMutation.isPending}
              >
                {addDocumentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Asociar Documento
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}