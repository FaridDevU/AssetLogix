import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { insertProjectSchema, Project } from "@shared/schema";
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
import {
  ArrowLeft,
  Loader2,
  Camera,
  Upload,
  X,
  Image as ImageIcon
} from "lucide-react";

// Extend the schema with validations
const formSchema = insertProjectSchema
  .extend({
    startDate: z.coerce.date({
      required_error: "Se requiere una fecha de inicio",
      invalid_type_error: "Fecha inválida",
    }),
    endDate: z.coerce.date().nullable().optional(),
  })
  .refine((data) => !data.endDate || data.startDate <= data.endDate, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  });

type FormData = z.infer<typeof formSchema>;

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditMode = !!id;

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

  // Fetch project for edit mode
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
    enabled: isEditMode,
    retry: 2,
  });

  // Estado para la imagen
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form definition
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      status: "in-progress", 
      startDate: new Date(),
      endDate: null,
      clientName: "",
      clientContact: "",
      budget: "",
      image: "",
    },
    mode: "onBlur"
  });

  // Update form with project data when in edit mode
  useEffect(() => {
    if (isEditMode && project) {
      form.reset({
        name: project.name,
        location: project.location,
        description: project.description || "",
        status: project.status,
        startDate: new Date(project.startDate),
        endDate: project.endDate ? new Date(project.endDate) : null,
        clientName: project.clientName || "",
        clientContact: project.clientContact || "",
        budget: project.budget || "",
        image: project.image || "",
      });
      
      // Establecer la vista previa de la imagen si existe
      if (project.image) {
        setImagePreview(project.image);
      }
    }
  }, [isEditMode, project, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Ejecutando mutación para crear proyecto con datos:", data);
      try {
        // Asegúrate de que las fechas estén en el formato correcto para el backend
        const formattedData = {
          ...data,
          createdBy: user.id,
          // Asegúrate de que startDate sea un objeto Date
          startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate as any),
          // Asegúrate de que endDate sea null o un objeto Date
          endDate: data.endDate ? new Date(data.endDate as any) : null,
        };
        
        console.log("Datos formateados para enviar:", formattedData);
        
        const res = await apiRequest("POST", "/api/projects", formattedData);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error en respuesta del servidor:", errorText);
          throw new Error(`Error del servidor: ${res.status} ${res.statusText} - ${errorText}`);
        }
        
        return await res.json();
      } catch (err) {
        console.error("Error en la petición:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Proyecto creado con éxito:", data);
      toast({
        title: "Proyecto creado",
        description: "El proyecto ha sido creado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      navigate(`/projects/${data.id}`);
    },
    onError: (error: any) => {
      console.error("Error en mutación para crear proyecto:", error);
      let description = "No se pudo crear el proyecto";
      
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        description = validationErrors.map((err: any) => err.message).join(", ");
      }
      
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Ejecutando mutación para actualizar proyecto con datos:", data);
      try {
        // Asegúrate de que las fechas estén en el formato correcto para el backend
        const formattedData = {
          ...data,
          // Asegúrate de que startDate sea un objeto Date
          startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate as any),
          // Asegúrate de que endDate sea null o un objeto Date
          endDate: data.endDate ? new Date(data.endDate as any) : null,
          // Asegúrate de que todos los campos opcionales tengan valores adecuados para el backend
          status: data.status || "in-progress",
          description: data.description || null,
          budget: data.budget || null,
          clientName: data.clientName || null,
          clientContact: data.clientContact || null
        };
        
        console.log("Datos formateados para enviar en actualización:", formattedData);
        
        const res = await apiRequest("PUT", `/api/projects/${id}`, formattedData);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error en respuesta del servidor:", errorText);
          throw new Error(`Error del servidor: ${res.status} ${res.statusText} - ${errorText}`);
        }
        
        return await res.json();
      } catch (err) {
        console.error("Error en la petición de actualización:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Proyecto actualizado con éxito:", data);
      toast({
        title: "Proyecto actualizado",
        description: "El proyecto ha sido actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      navigate(`/projects/${id}`);
    },
    onError: (error) => {
      console.error("Error en mutación para actualizar proyecto:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el proyecto",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Formulario enviado con datos:", data);
    
    // Procesa las fechas y campos opcionales antes de enviar
    const processedData = {
      ...data,
      // Asegúrate de que startDate sea un objeto Date
      startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate as any),
      // Asegúrate de que endDate sea null o un objeto Date
      endDate: data.endDate ? new Date(data.endDate as any) : null,
      // Valores por defecto para campos opcionales
      status: data.status || "in-progress",
      description: data.description || null,
      budget: data.budget || null,
      clientName: data.clientName || null,
      clientContact: data.clientContact || null
    };
    
    console.log("Datos procesados para enviar:", processedData);
    
    if (isEditMode) {
      console.log("Modo edición: Actualizando proyecto...");
      updateMutation.mutate(processedData);
    } else {
      console.log("Modo creación: Creando nuevo proyecto...");
      createMutation.mutate(processedData);
    }
  };

  if (isEditMode && isLoadingProject) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isEditMode && !project) {
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

  // Funciones para manejar la carga de imágenes
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Crear un objeto FormData para enviar el archivo
      const formData = new FormData();
      formData.append('image', file);
      
      // Realizar la solicitud para subir la imagen usando el endpoint específico para proyectos
      const response = await fetch('/api/projects/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }
      
      const result = await response.json();
      
      // Actualizar el estado con la URL de la imagen
      const imageUrl = result.url;
      setImagePreview(imageUrl);
      form.setValue('image', imageUrl);
      
      toast({
        title: 'Imagen subida',
        description: 'La imagen se ha subido correctamente',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la imagen',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo y tamaño
      if (!file.type.includes('image/')) {
        toast({
          title: 'Tipo de archivo no válido',
          description: 'Por favor, seleccione una imagen',
          variant: 'destructive',
        });
        return;
      }
      
      // Crear una vista previa temporal
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Iniciar carga de la imagen al servidor
      handleImageUpload(file);
    }
  };
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveImage = () => {
    setImagePreview(null);
    form.setValue('image', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <h1 className="text-3xl font-bold mt-4">
          {isEditMode ? "Editar Proyecto" : "Nuevo Proyecto"}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode
            ? "Actualiza los detalles del proyecto existente"
            : "Completa los detalles para crear un nuevo proyecto de obra"}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información básica</CardTitle>
              <CardDescription>
                Ingresa los datos principales del proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Proyecto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Edificio Torres del Norte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación *</FormLabel>
                      <FormControl>
                        <Input placeholder="Av. Principal #123, Ciudad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalles sobre el proyecto..."
                        className="min-h-[100px]"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Componente de carga de imagen */}
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen del Proyecto</FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-center gap-4">
                        <input
                          type="hidden"
                          {...field}
                          value={field.value || ""}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                        
                        {imagePreview ? (
                          <div className="relative w-full max-w-md">
                            <img
                              src={imagePreview}
                              alt="Vista previa"
                              className="w-full h-48 object-cover rounded-md border border-gray-200"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 rounded-full"
                              onClick={handleRemoveImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={handleImageClick}
                            className="flex flex-col items-center justify-center w-full max-w-md h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            {isUploading ? (
                              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                            ) : (
                              <>
                                <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">
                                  Haga clic para subir una imagen
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  PNG, JPG o WEBP
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Suba una imagen representativa del proyecto para facilitar su identificación
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="in-progress">En progreso</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de inicio *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de finalización</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            if (e.target.value) {
                              field.onChange(new Date(e.target.value));
                            } else {
                              field.onChange(null);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del cliente</CardTitle>
              <CardDescription>
                Datos opcionales sobre el cliente del proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del cliente</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre de la empresa o cliente" 
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contacto del cliente</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Email o teléfono" 
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presupuesto</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="$1,000,000" 
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
                onClick={() => navigate("/projects")}
              >
                Cancelar
              </Button>
              <div className="space-x-2">
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const data = form.getValues();
                    console.log("Datos actuales del formulario:", data);
                    
                    // Procesa las fechas y campos opcionales antes de enviar (igual que en onSubmit)
                    const processedData = {
                      ...data,
                      startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate as any),
                      endDate: data.endDate ? new Date(data.endDate as any) : null,
                      status: data.status || "in-progress",
                      description: data.description || null,
                      budget: data.budget || null,
                      clientName: data.clientName || null,
                      clientContact: data.clientContact || null
                    };
                    
                    console.log("Datos procesados para enviar (Debug):", processedData);
                    
                    if (isEditMode) {
                      console.log("Intentando actualizar proyecto manualmente...");
                      updateMutation.mutate(processedData);
                    } else {
                      console.log("Intentando crear proyecto manualmente...");
                      createMutation.mutate(processedData);
                    }
                  }}
                >
                  {isEditMode ? "Actualizar (Debug)" : "Crear (Debug)"}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "Actualizar Proyecto" : "Crear Proyecto"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}