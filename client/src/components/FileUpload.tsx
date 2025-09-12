import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface FileUploadProps {
  folderId?: number;
  onUploadComplete?: () => void;
}

export default function FileUpload({ folderId, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      uploadFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (files: FileList) => {
    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    // Process files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update progress based on which file we're on
        setUploadProgress(Math.floor((i / files.length) * 100));

        // Create FormData object for the file upload
        const formData = new FormData();
        formData.append('file', file);
        if (folderId) {
          formData.append('folderId', folderId.toString());
        }
        if (file.type) {
          formData.append('type', file.type);
        }
        formData.append('description', `Uploaded on ${new Date().toLocaleString()}`);

        // Use XMLHttpRequest to get upload progress
        const response = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              // Calculate total progress including the current file's progress
              const fileProgress = (event.loaded / event.total) * (100 / files.length);
              const previousFilesProgress = (i / files.length) * 100;
              setUploadProgress(Math.floor(previousFilesProgress + fileProgress));
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
          xhr.open('POST', '/api/documents/upload');
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send(formData);
        });

        console.log('Upload successful:', response);
        successCount++;
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        errorCount++;
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    
    if (successCount > 0) {
      toast({
        title: "Subida completada",
        description: `${successCount} archivos subidos correctamente${errorCount > 0 ? `, ${errorCount} errores` : ''}`,
        variant: "default",
      });
      
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } else if (errorCount > 0) {
      toast({
        title: "Error de subida",
        description: "No se pudo subir ningún archivo",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
        isDragging ? "border-primary-500 bg-primary-50" : "border-secondary-300"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center">
        <i className={`ri-upload-cloud-2-line text-4xl ${isDragging ? "text-primary-500" : "text-secondary-400"}`}></i>
        
        <p className="mt-2 text-sm text-secondary-600">
          {isDragging 
            ? "Suelta los archivos aquí" 
            : "Arrastra y suelta archivos aquí, o"
          }
        </p>
        
        <label className="mt-2">
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <span className="inline-block px-4 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer">
            Seleccionar archivos
          </span>
        </label>
        
        {isUploading && (
          <div className="w-full mt-4">
            <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
              <div 
                className="h-2 bg-primary-500 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-1 text-xs text-center text-secondary-500">
              Subiendo... {uploadProgress}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
