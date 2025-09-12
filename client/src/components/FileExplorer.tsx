import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FileUpload from "./FileUpload";

interface Folder {
  id: number;
  name: string;
  path: string;
  parentId: number | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  path: string;
  folderId: number | null;
  currentVersion: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  name: string;
  avatar: string;
}

interface FileExplorerProps {
  initialFolderId?: number;
}

export default function FileExplorer({ initialFolderId }: FileExplorerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<number | undefined>(initialFolderId);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery<Folder[]>({
    queryKey: ['/api/folders', currentFolderId],
    queryFn: async () => {
      const url = currentFolderId ? `/api/folders?parentId=${currentFolderId}` : '/api/folders';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    }
  });

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', currentFolderId],
    queryFn: async () => {
      const url = currentFolderId ? `/api/documents?folderId=${currentFolderId}` : '/api/documents';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  // Build folder path breadcrumbs
  useEffect(() => {
    const buildPath = async () => {
      if (!currentFolderId) {
        setFolderPath([]);
        return;
      }

      let path: Folder[] = [];
      let currentId: number | null = currentFolderId;

      while (currentId) {
        try {
          const response = await fetch(`/api/folders/${currentId}`, { credentials: 'include' });
          if (!response.ok) break;
          
          const folder = await response.json();
          path.unshift(folder);
          currentId = folder.parentId;
        } catch (error) {
          console.error("Error building path:", error);
          break;
        }
      }

      setFolderPath(path);
    };

    buildPath();
  }, [currentFolderId]);

  const handleFolderClick = (folderId: number) => {
    setCurrentFolderId(folderId);
  };

  const handleGoBack = () => {
    if (folderPath.length > 0) {
      const parentId = folderPath[folderPath.length - 1].parentId;
      setCurrentFolderId(parentId === null ? undefined : parentId);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/folders', currentFolderId] });
    queryClient.invalidateQueries({ queryKey: ['/api/documents', currentFolderId] });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la carpeta no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    try {
      const folderData = {
        name: newFolderName.trim(),
        path: currentFolderId ? `${folderPath.map(f => f.name).join('/')}/${newFolderName}` : `/${newFolderName}`,
        parentId: currentFolderId || null
      };

      await apiRequest('POST', '/api/folders', folderData);
      
      toast({
        title: "Carpeta creada",
        description: "La carpeta se ha creado correctamente",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/folders', currentFolderId] });
      setNewFolderName("");
      setShowNewFolderDialog(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la carpeta",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return 'ri-file-pdf-line text-error-500';
    if (type.includes('word') || type.includes('docx')) return 'ri-file-word-line text-primary-500';
    if (type.includes('excel') || type.includes('xlsx')) return 'ri-file-excel-line text-success-500';
    if (type.includes('image')) return 'ri-image-line text-warning-500';
    return 'ri-file-line text-secondary-500';
  };

  const getRelativeTime = (date: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} minutos`;
    if (diffHour < 24) return `Hace ${diffHour} horas`;
    if (diffDay === 1) return 'Ayer';
    if (diffDay < 30) return `Hace ${diffDay} días`;
    
    return past.toLocaleDateString();
  };

  const isLoading = foldersLoading || documentsLoading;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden h-full">
      {/* Explorer header */}
      <div className="border-b border-secondary-100 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleGoBack} 
              disabled={!currentFolderId}
            >
              <i className="ri-arrow-left-line"></i>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
            >
              <i className="ri-refresh-line"></i>
            </Button>
            <span className="text-secondary-500">/</span>
            <Button 
              variant="link" 
              onClick={() => setCurrentFolderId(undefined)}
              className="text-primary-600 hover:text-primary-800"
            >
              Documentos
            </Button>
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center">
                <span className="text-secondary-500">/</span>
                <Button 
                  variant="link" 
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="text-primary-600 hover:text-primary-800"
                >
                  {folder.name}
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Input 
                type="text"
                placeholder="Buscar en esta carpeta..." 
                className="w-64 pl-9 pr-4 py-2"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i className="ri-search-line text-secondary-400"></i>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 border-l border-secondary-200 pl-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewMode("list")} 
                className={viewMode === "list" ? "bg-secondary-100" : ""}
              >
                <i className="ri-list-check"></i>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setViewMode("grid")} 
                className={viewMode === "grid" ? "bg-secondary-100" : ""}
              >
                <i className="ri-layout-grid-line"></i>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500">
                <i className="ri-upload-line mr-1"></i>
                Subir
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Subir archivos</DialogTitle>
                <DialogDescription>
                  Sube uno o varios archivos a esta carpeta.
                </DialogDescription>
              </DialogHeader>
              <FileUpload folderId={currentFolderId} onUploadComplete={() => handleRefresh()} />
              <DialogFooter className="sm:justify-end">
                <Button variant="secondary" onClick={() => handleRefresh()}>
                  Cerrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <i className="ri-folder-add-line mr-1"></i>
                Nueva Carpeta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear nueva carpeta</DialogTitle>
                <DialogDescription>
                  Introduce un nombre para la nueva carpeta.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Nombre de la carpeta"
                  className="w-full"
                />
              </div>
              <DialogFooter className="sm:justify-end">
                <Button variant="secondary" onClick={() => setShowNewFolderDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateFolder}>
                  Crear
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Explorer content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : folders.length === 0 && documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-secondary-500">
            <i className="ri-folder-5-line text-4xl mb-2"></i>
            <p>Esta carpeta está vacía</p>
            <p className="text-sm">Comienza subiendo archivos o creando carpetas</p>
          </div>
        ) : viewMode === "grid" ? (
          // Grid view of files and folders
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Folders */}
            {folders.map((folder) => (
              <div 
                key={folder.id}
                className="border border-secondary-200 rounded-lg p-3 hover:bg-secondary-50 cursor-pointer transition"
                onClick={() => handleFolderClick(folder.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-primary-500">
                    <i className="ri-folder-line text-xl"></i>
                  </div>
                  <button className="text-secondary-400 hover:text-secondary-600">
                    <i className="ri-more-2-fill"></i>
                  </button>
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-secondary-900 truncate">{folder.name}</h4>
                  <p className="text-xs text-secondary-500 mt-1">
                    Actualizado {getRelativeTime(folder.updatedAt)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Documents */}
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="border border-secondary-200 rounded-lg p-3 hover:bg-secondary-50 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <i className={`${getFileIcon(doc.type)} text-xl`}></i>
                  </div>
                  <button className="text-secondary-400 hover:text-secondary-600">
                    <i className="ri-more-2-fill"></i>
                  </button>
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-secondary-900 truncate">{doc.name}</h4>
                  <p className="text-xs text-secondary-500 mt-1">
                    {formatFileSize(doc.size)} • Modificado {getRelativeTime(doc.updatedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List view of files and folders
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Modificado
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-100">
                {/* Folders */}
                {folders.map((folder) => (
                  <tr key={folder.id} className="hover:bg-secondary-50" onClick={() => handleFolderClick(folder.id)}>
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
                      <div className="flex items-center">
                        <div className="text-primary-500">
                          <i className="ri-folder-line text-xl"></i>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-secondary-900">{folder.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-secondary-500">—</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-secondary-500">{getRelativeTime(folder.updatedAt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        <i className="ri-more-2-fill"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {/* Documents */}
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
                      <div className="flex items-center">
                        <div>
                          <i className={`${getFileIcon(doc.type)} text-xl`}></i>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-secondary-900">{doc.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-secondary-500">{formatFileSize(doc.size)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-secondary-500">{getRelativeTime(doc.updatedAt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        <i className="ri-more-2-fill"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
