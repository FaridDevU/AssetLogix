import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertDocumentVersionSchema, Document } from "@shared/schema";
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
const formSchema = insertDocumentVersionSchema.extend({
  file: z.instanceof(File).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NewVersionModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

export default function NewVersionModal({ document, isOpen, onClose }: NewVersionModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form definition with validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentId: document.id,
      version: document.currentVersion + 1,
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
        const prepareRes = await apiRequest("POST", "/api/documents/prepare-upload", {
          filename: selectedFile.name,
          contentType: selectedFile.type,
          size: selectedFile.size,
          documentId: document.id,
          version: values.version
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
        });
        
        if (!uploadRes.ok) throw new Error("Error al cargar el archivo");
        
        // Create document version record
        const versionValues = {
          ...values,
          path: filePath,
          documentId: document.id,
          createdBy: user?.id,
        };
        
        const createRes = await apiRequest("POST", `/api/documents/${document.id}/versions`, versionValues);
        
        // Log activity
        if (user) {
          await apiRequest("POST", `/api/documents/${document.id}/activity`, {
            documentId: document.id,
            userId: user.id,
            action: "uploaded",
            details: `Subió la versión ${values.version}`
          });
        }
        
        return await createRes.json();
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/versions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/activity`] });
      
      // Show success message and close modal
      toast({
        title: "Nueva versión creada",
        description: "Se ha registrado una nueva versión del documento",
      });
      
      // Reset form and close modal
      form.reset();
      setSelectedFile(null);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear nueva versión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormData) => {
    // Set user ID and document ID
    values.createdBy = user?.id || null;
    values.documentId = document.id;
    
    createMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Versión</DialogTitle>
          <DialogDescription>
            Cargue una nueva versión del documento "{document.name}".
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
                    El tipo de archivo debe coincidir con la versión anterior
                  </span>
                )}
              </label>
            </div>

            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versión</FormLabel>
                  <FormControl>
                    <Input type="number" readOnly {...field} />
                  </FormControl>
                  <FormDescription>
                    Número de versión calculado automáticamente
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
                  "Cargar Nueva Versión"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}