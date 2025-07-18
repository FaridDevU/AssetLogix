import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Document, Folder } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Formulario para editar un documento existente
const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  folderId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

export default function EditDocumentModal({ 
  isOpen, 
  onClose, 
  document 
}: EditDocumentModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  // Cargar carpetas para el selector
  const { data: folders } = useQuery<Folder[]>({
    queryKey: ["/api/folders/all"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/folders/all");
        return await res.json();
      } catch (error) {
        console.error("Error fetching folders:", error);
        return [];
      }
    }
  });

  // Form definition with validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: document.name,
      folderId: document.folderId ? document.folderId.toString() : "",
    },
  });

  // Actualizar los valores del formulario cuando cambia el documento
  useEffect(() => {
    if (isOpen && document) {
      form.reset({
        name: document.name,
        folderId: document.folderId ? document.folderId.toString() : "root",
      });
    }
  }, [isOpen, document, form]);

  // Handle form submission
  const handleSubmit = async (values: FormData) => {
    try {
      setSubmitting(true);
      
      // Prepare payload
      const payload = {
        name: values.name,
        folderId: values.folderId && values.folderId !== "root" ? parseInt(values.folderId) : null
      };
      
      // Update document
      const res = await apiRequest("PATCH", `/api/documents/${document.id}`, payload);
      const data = await res.json();
      console.log("Document updated:", data);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", document.folderId] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}`] });
      
      // Si se cambió la carpeta, invalidar la carpeta anterior y la nueva
      const newFolderId = values.folderId && values.folderId !== "root" 
        ? parseInt(values.folderId) 
        : null;
      
      if (newFolderId !== document.folderId) {
        queryClient.invalidateQueries({ queryKey: ["/api/documents", newFolderId] });
        
        // Log activity if moved
        const fromFolder = document.folderId 
          ? folders?.find(f => f.id === document.folderId)?.name || `Carpeta #${document.folderId}`
          : "Raíz";
          
        const toFolder = newFolderId
          ? folders?.find(f => f.id === newFolderId)?.name || `Carpeta #${newFolderId}`
          : "Raíz";
        
        await logDocumentActivity({
          documentId: document.id,
          userId: user?.id || null,
          action: "moved",
          details: `Movió de "${fromFolder}" a "${toFolder}"`
        });
      }
      
      // Log activity if renamed
      if (document.name !== values.name) {
        await logDocumentActivity({
          documentId: document.id,
          userId: user?.id || null,
          action: "renamed",
          details: `Renombró de "${document.name}" a "${values.name}"`
        });
      }
      
      // Show success message
      toast({
        title: "Documento actualizado",
        description: "El documento ha sido actualizado exitosamente",
      });
      
      // Close modal
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error updating document:", error);
      toast({
        title: "Error al actualizar documento",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Function to log document activity
  const logDocumentActivity = async (activityData: any) => {
    try {
      const res = await apiRequest("POST", `/api/documents/${document.id}/activity`, activityData);
      await res.json();
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/activity`] });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
          <DialogDescription>
            Modifique la información del documento o muévalo a otra carpeta.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre del documento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carpeta</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "root"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una carpeta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="root">Carpeta Raíz</SelectItem>
                      {folders?.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id.toString()}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    La carpeta donde estará ubicado el documento.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}