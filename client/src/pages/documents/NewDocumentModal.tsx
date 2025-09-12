import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertDocumentSchema } from "@shared/schema";
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
import { Loader2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Extend the schema for form validation
const formSchema = insertDocumentSchema.extend({
  file: z.instanceof(File).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: number | null;
}

export default function NewDocumentModal({ isOpen, onClose, folderId }: NewDocumentModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form definition with validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      folderId: folderId,
      type: "",
      path: "",
      size: 0,
      createdBy: user?.id || null,
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Update form values based on file
      form.setValue("name", file.name);
      form.setValue("type", file.type || file.name.split(".").pop() || "");
      form.setValue("size", file.size);
    }
  };

  // Handle form submission
  const createMutation = useMutation({
    mutationFn: async (values: FormData) => {
      setIsUploading(true);
      
      try {
        if (!selectedFile) {
          throw new Error("Por favor seleccione un archivo");
        }
        
        // First, prepare for file upload by getting an upload URL
        // No enviamos documentId porque es un documento nuevo
        const prepareRes = await apiRequest("POST", "/api/documents/prepare-upload", {
          filename: selectedFile.name,
          contentType: selectedFile.type,
          size: selectedFile.size,
        });
        
        if (!prepareRes.ok) throw new Error("Error al preparar la carga del archivo");
        
        const { uploadUrl, filePath } = await prepareRes.json();
        
        // Upload the file
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Content-Type": selectedFile.type,
          },
          credentials: 'include', // Incluir credenciales para autenticación
        });
        
        if (!uploadRes.ok) throw new Error("Error al cargar el archivo");
        
        // Create document record
        const docValues = {
          ...values,
          path: filePath,
          folderId,
          createdBy: user?.id,
        };
        
        const createRes = await apiRequest("POST", "/api/documents", docValues);
        return await createRes.json();
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents", folderId] });
      
      // Show success message and close modal
      toast({
        title: "Documento creado",
        description: "El documento ha sido cargado exitosamente",
      });
      
      // Reset form and close modal
      form.reset();
      setSelectedFile(null);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cargar documento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormData) => {
    // Set user ID and folder ID
    values.createdBy = user?.id || null;
    values.folderId = folderId;
    
    createMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Documento</DialogTitle>
          <DialogDescription>
            Cargue un nuevo documento al sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : "Haga clic para seleccionar un archivo"}
                </span>
                {selectedFile ? (
                  <span className="text-xs text-gray-500 mt-1">
                    {selectedFile.type || "Sin tipo definido"} • {Math.round(selectedFile.size / 1024)} KB
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, DOCX, XLSX, PPTX, etc.
                  </span>
                )}
              </label>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Documento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ingrese el nombre del documento" {...field} />
                  </FormControl>
                  <FormDescription>
                    Puede cambiar el nombre por defecto del archivo.
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
                disabled={createMutation.isPending || isUploading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || isUploading || !selectedFile}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {(createMutation.isPending || isUploading) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  "Cargar Documento"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}