import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";

interface EquipmentImageUploadProps {
  onImageUploaded?: (imageData: { url: string; filename: string }) => void;
  className?: string;
}

export default function EquipmentImageUpload({ onImageUploaded, className = "" }: EquipmentImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadImage(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadImage(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  const uploadImage = async (file: File) => {
    // Verificar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Por favor seleccione un archivo de imagen (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('image', file);

      // Usar XMLHttpRequest para seguir el progreso
      const response = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.floor((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`HTTP Error: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Request timeout'));
        });

        // Set up and send the request
        xhr.open('POST', '/api/equipment/upload-image');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.withCredentials = true; // Para enviar cookies de autenticación
        xhr.send(formData);
      });

      // Notificar éxito y pasar los datos de la imagen
      if (onImageUploaded) {
        onImageUploaded({
          url: response.url,
          filename: response.filename
        });
      }

      toast({
        title: "Imagen subida",
        description: "La imagen se ha cargado correctamente",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error de carga",
        description: error instanceof Error ? error.message : "No se pudo cargar la imagen",
        variant: "destructive",
      });
      // Eliminar la vista previa en caso de error
      setImagePreview(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={className}>
      {imagePreview ? (
        <div className="relative w-full max-w-md mx-auto">
          <img
            src={imagePreview}
            alt="Vista previa"
            className="w-full h-auto max-h-64 object-contain border rounded-md"
          />
          {isUploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${
            isDragging ? "border-primary-500 bg-primary-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('equipment-dropzone-file')?.click()}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-10 h-10 mb-3 ${isDragging ? "text-primary-500" : "text-gray-400"}`} />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Haga clic para cargar</span> o arrastre y suelte
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG o WEBP (MAX. 5MB)
            </p>
            {isUploading && (
              <div className="w-full mt-4 px-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-primary-500 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-xs text-center text-gray-500">
                  Subiendo... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            id="equipment-dropzone-file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      )}
    </div>
  );
}
