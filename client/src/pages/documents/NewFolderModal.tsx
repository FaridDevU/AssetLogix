import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertFolderSchema } from "@shared/schema";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Extend the schema for form validation
const formSchema = insertFolderSchema.extend({});

type FormData = z.infer<typeof formSchema>;

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentFolderId: number | null;
}

export default function NewFolderModal({ isOpen, onClose, parentFolderId }: NewFolderModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Form definition with validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      parentId: parentFolderId,
      path: "", // Will be calculated on the server
      createdBy: user?.id || null,
    },
  });

  // Handle form submission
  const createMutation = useMutation({
    mutationFn: async (values: FormData) => {
      const res = await apiRequest("POST", "/api/folders", values);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders", parentFolderId] });
      
      // Show success message and close modal
      toast({
        title: "Carpeta creada",
        description: "La carpeta ha sido creada exitosamente",
      });
      
      // Reset form and close modal
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear carpeta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormData) => {
    // Ensure the current user ID is set
    values.createdBy = user?.id || null;
    values.parentId = parentFolderId;
    createMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Carpeta</DialogTitle>
          <DialogDescription>
            Cree una nueva carpeta para organizar sus documentos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Carpeta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre de la carpeta" {...field} />
                  </FormControl>
                  <FormDescription>
                    El nombre debe ser descriptivo para identificar fácilmente su contenido.
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
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Carpeta"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}