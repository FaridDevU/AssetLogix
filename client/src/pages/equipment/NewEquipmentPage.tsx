import { FC, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import EquipmentImageUpload from "@/components/EquipmentImageUpload";
import NewEquipmentTypeModal from "./NewEquipmentTypeModal";
import { insertEquipmentTypeSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  name: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres",
  }),
  code: z.string().min(1, {
    message: "El código es obligatorio",
  }),
  typeId: z.coerce.number().int().min(1, {
    message: "Seleccione un tipo de equipo",
  }),
  location: z.string().min(1, {
    message: "La ubicación es obligatoria",
  }),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  status: z.enum(["operational", "maintenance", "inactive"]),
});

type FormData = z.infer<typeof formSchema>;

interface EquipmentType {
  id: number;
  name: string;
}

const NewEquipmentPage: FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [uploadedImage, setUploadedImage] = useState<{url: string; filename: string} | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const { isLoading: isLoadingTypes, data: equipmentTypes } = 
    useQuery<EquipmentType[]>({
      queryKey: ["/api/equipment-types"],
    });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      location: "",
      description: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      status: "operational",
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Incluir datos de la imagen cargada si existe
      const equipmentData = {
        ...data,
        imagePath: uploadedImage?.url || null,
        imageFilename: uploadedImage?.filename || null
      };

      const response = await apiRequest("POST", "/api/equipment", equipmentData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Equipo creado",
        description: "El nuevo equipo ha sido creado exitosamente.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      navigate("/inventory");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el equipo: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleImageUploaded = (imageData: {url: string; filename: string}) => {
    setUploadedImage(imageData);
  };

  const onSubmit = (data: FormData) => {
    createEquipmentMutation.mutate(data);
  };

  return (
    <Layout currentModule="inventario">
      {/* Modal para crear un nuevo tipo de equipo */}
      <NewEquipmentTypeModal 
        isOpen={isTypeModalOpen} 
        onClose={() => setIsTypeModalOpen(false)} 
      />
      
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Nuevo Equipo</h1>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Registrar Nuevo Activo</CardTitle>
            <CardDescription>
              Ingrese la información del nuevo equipo o activo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Equipo*</FormLabel>
                        <FormControl>
                          <Input placeholder="Compresor Industrial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código*</FormLabel>
                        <FormControl>
                          <Input placeholder="COMP-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="typeId"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Tipo de Equipo*</FormLabel>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setIsTypeModalOpen(true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormControl>
                          <Select
                            value={field.value ? field.value.toString() : ""}
                            onValueChange={(value) => {
                              field.onChange(parseInt(value));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingTypes ? (
                                <div className="flex justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                equipmentTypes?.length === 0 ? (
                                  <SelectItem value="-1" disabled>
                                    No hay tipos de equipos creados
                                  </SelectItem>
                                ) : (
                                  equipmentTypes?.map((type) => (
                                    <SelectItem
                                      key={type.id}
                                      value={type.id.toString()}
                                    >
                                      {type.name}
                                    </SelectItem>
                                  ))
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado*</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="operational">Operativo</SelectItem>
                              <SelectItem value="maintenance">En Mantenimiento</SelectItem>
                              <SelectItem value="inactive">Inactivo</SelectItem>
                            </SelectContent>
                          </Select>
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
                        <FormLabel>Ubicación*</FormLabel>
                        <FormControl>
                          <Input placeholder="Planta Principal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fabricante</FormLabel>
                        <FormControl>
                          <Input placeholder="Atlas Copco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="GA55+" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Serie</FormLabel>
                        <FormControl>
                          <Input placeholder="SN12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Compra</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                          placeholder="Detalles adicionales sobre el equipo..."
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel>Imagen del Equipo</FormLabel>
                  <EquipmentImageUpload onImageUploaded={handleImageUploaded} />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/inventory")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEquipmentMutation.isPending}
                  >
                    {createEquipmentMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar Equipo
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NewEquipmentPage;