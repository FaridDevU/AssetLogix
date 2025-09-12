import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { insertEquipmentTypeSchema } from "@shared/schema";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Extend the schema for form validation
const formSchema = insertEquipmentTypeSchema.extend({});

type FormData = z.infer<typeof formSchema>;

interface NewEquipmentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewEquipmentTypeModal({ isOpen, onClose }: NewEquipmentTypeModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form definition with validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: null,
    },
  });

  // Handle form submission
  const createTypeMutation = useMutation({
    mutationFn: async (values: FormData) => {
      setIsSubmitting(true);
      try {
        const response = await apiRequest("POST", "/api/equipment-types", values);
        return await response.json();
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-types"] });
      
      // Show success message and close modal
      toast({
        title: "Tipo de equipo creado",
        description: "El tipo de equipo ha sido creado exitosamente",
      });
      
      // Reset form and close modal
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear tipo de equipo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormData) => {
    createTypeMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Tipo de Equipo</DialogTitle>
          <DialogDescription>
            Añada un nuevo tipo de equipo al sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre*</FormLabel>
                  <FormControl>
                    <Input placeholder="Compresor" {...field} />
                  </FormControl>
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
                      placeholder="Descripción del tipo de equipo" 
                      className="min-h-24" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createTypeMutation.isPending || isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createTypeMutation.isPending || isSubmitting}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {(createTypeMutation.isPending || isSubmitting) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Tipo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
