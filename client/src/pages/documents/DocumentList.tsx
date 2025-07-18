import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlusCircle, FolderPlus, FileText, Search, Filter, Download, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Document, Folder } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import NewFolderModal from "./NewFolderModal";
import NewDocumentModal from "./NewDocumentModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

interface DocumentListProps {
  folderId?: string;
}

export default function DocumentList({ folderId }: DocumentListProps) {
  const currentFolderId = folderId ? parseInt(folderId) : null;
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewDocumentModalOpen, setIsNewDocumentModalOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get folders
  const { 
    data: folders, 
    isLoading: isLoadingFolders 
  } = useQuery<Folder[]>({
    queryKey: ["/api/folders", currentFolderId],
    queryFn: async () => {
      const url = currentFolderId 
        ? `/api/folders?parentId=${currentFolderId}` 
        : "/api/folders?parentId=null";
      const res = await fetch(url);
      return res.json();
    }
  });

  // Get documents
  const { 
    data: documents, 
    isLoading: isLoadingDocuments 
  } = useQuery<Document[]>({
    queryKey: ["/api/documents", currentFolderId],
    queryFn: async () => {
      const url = currentFolderId 
        ? `/api/documents?folderId=${currentFolderId}` 
        : "/api/documents?folderId=null";
      const res = await fetch(url);
      return res.json();
    }
  });

  // Get current folder info if in a subfolder
  const { 
    data: currentFolder,
    isLoading: isLoadingCurrentFolder 
  } = useQuery<Folder>({
    queryKey: ["/api/folders", currentFolderId, "details"],
    queryFn: async () => {
      const res = await fetch(`/api/folders/${currentFolderId}`);
      return res.json();
    },
    enabled: currentFolderId !== null
  });

  // Get breadcrumb path (could be improved with a recursive function)
  const { data: parentFolders } = useQuery<Folder[]>({
    queryKey: ["/api/folders/path", currentFolderId],
    queryFn: async () => {
      if (!currentFolderId) return [];
      const res = await fetch(`/api/folders/path/${currentFolderId}`);
      return res.json();
    },
    enabled: currentFolderId !== null
  });

  // Create filtered folders and docs based on search
  const filteredFolders = folders
    ? folders.filter(folder => 
        folder.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const filteredDocuments = documents
    ? documents.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleOpenFolder = (id: number) => {
    setLocation(`/documents/folder/${id}`);
  };

  const handleOpenDocument = (id: number) => {
    setLocation(`/documents/${id}`);
  };

  const handleGoBack = () => {
    // Navigate to parent folder if available, otherwise to root
    if (currentFolder?.parentId) {
      setLocation(`/documents/folder/${currentFolder.parentId}`);
    } else {
      setLocation("/documents");
    }
  };
  
  // Handle document download
  const { user } = useAuth();

  const handleDownloadDocument = async (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation(); // Prevent card click (navigation)
    try {
      // Log activity
      if (user) {
        await fetch(`/api/documents/${doc.id}/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: doc.id,
            userId: user.id,
            action: "download",
            details: "Descargó el documento desde la vista de carpeta"
          })
        });
      }
      
      // Iniciar la descarga
      const downloadUrl = `/api/documents/${doc.id}/download`;
      const a = window.document.createElement('a');
      a.href = downloadUrl;
      
      // Determinar el nombre de descarga con extensión
      let downloadName = doc.name;
      if (doc.originalExtension) {
        if (!downloadName.toLowerCase().endsWith(doc.originalExtension.toLowerCase())) {
          downloadName += doc.originalExtension;
        }
      } else if (doc.type && !downloadName.toLowerCase().includes(`.${doc.type.toLowerCase()}`)) {
        downloadName += `.${doc.type}`;
      }
      
      a.download = downloadName;
      a.target = '_blank';
      a.click();
      
      toast({
        title: "Descarga iniciada",
        description: `Descargando ${doc.name}`,
      });
    } catch (error) {
      console.error("Error al descargar documento:", error);
      toast({
        title: "Error de descarga",
        description: "No se pudo descargar el documento",
        variant: "destructive",
      });
    }
  };

  const isLoading = isLoadingFolders || isLoadingDocuments || (currentFolderId && isLoadingCurrentFolder);

  if (isLoading) {
    return (
      <Layout currentModule="documentos">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <Layout currentModule="documentos">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => setLocation("/documents")}>Documentos</BreadcrumbLink>
            </BreadcrumbItem>
            {parentFolders?.map(folder => (
              <BreadcrumbItem key={folder.id}>
                <BreadcrumbLink onClick={() => handleOpenFolder(folder.id)}>{folder.name}</BreadcrumbLink>
              </BreadcrumbItem>
            ))}
            {currentFolder && (
              <BreadcrumbItem>
                <BreadcrumbLink>{currentFolder.name}</BreadcrumbLink>
              </BreadcrumbItem>
            )}
          </Breadcrumb>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {currentFolder ? currentFolder.name : "Documentos"}
            </h1>
            <p className="text-gray-500 mt-1">
              {currentFolder 
                ? "Explore los archivos y carpetas en esta ubicación" 
                : "Gestione y explore todos los documentos del sistema"}
            </p>
          </div>
          <div className="flex gap-2">
            {currentFolder && (
              <Button 
                variant="secondary"
                onClick={handleGoBack}
                className="border-gray-200 text-gray-700 hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => setIsNewFolderModalOpen(true)}
              className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              Nueva Carpeta
            </Button>
            <Button 
              onClick={() => setIsNewDocumentModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Documento
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar documentos y carpetas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Folders Section */}
        {((folders && folders.length > 0) || (documents && documents.length > 0)) ? (
          <div className="space-y-6">
            {filteredFolders.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-700 mb-3">Carpetas</h2>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  <AnimatePresence>
                    {filteredFolders.map(folder => (
                      <motion.div 
                        key={folder.id} 
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        layout
                      >
                        <Card 
                          className="hover:shadow-md transition-shadow duration-200 cursor-pointer hover:border-teal-200"
                          onClick={() => handleOpenFolder(folder.id)}
                          onDoubleClick={() => handleOpenFolder(folder.id)} // Agregar navegación con doble clic
                        >
                          <CardContent className="pt-6 flex items-center">
                            <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mr-4 text-teal-600">
                              <FolderPlus className="h-6 w-6" />
                            </div>
                            <div className="overflow-hidden">
                              <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
                              <p className="text-sm text-gray-500">
                                {folder.createdAt && !isNaN(new Date(folder.createdAt).getTime()) 
                                  ? new Date(folder.createdAt).toLocaleDateString() 
                                  : "Sin fecha"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {/* Documents Section */}
            {filteredDocuments.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-700 mb-3">Documentos</h2>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  <AnimatePresence>
                    {filteredDocuments.map(document => (
                      <motion.div 
                        key={document.id} 
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        layout
                      >
                        <Card 
                          className="hover:shadow-md transition-shadow duration-200 cursor-pointer hover:border-blue-200 relative group"
                          onClick={() => handleOpenDocument(document.id)}
                          onDoubleClick={() => handleOpenDocument(document.id)} // Agregar navegación con doble clic
                        >
                          {/* Botones de acción con opciones */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => handleDownloadDocument(e, document)} className="cursor-pointer">
                                  <Download className="mr-2 h-4 w-4" />
                                  Descargar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {/* Botón de descarga rápida */}
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full border border-blue-100 hover:border-blue-300"
                              onClick={(e) => handleDownloadDocument(e, document)}
                            >
                              <Download className="h-4 w-4 text-blue-600" />
                            </Button>
                          </div>
                          
                          <CardContent className="pt-6 flex items-center">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mr-4 text-blue-600">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center">
                                <h3 className="font-medium text-gray-900 truncate">{document.name}</h3>
                                <Badge className="ml-2 text-xs" variant="outline">v{document.currentVersion}</Badge>
                              </div>
                              <p className="text-sm text-gray-500 flex items-center">
                                <span className="truncate">
                                  {document.type.toUpperCase()} • {Math.round(document.size / 1024)} KB
                                </span>
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600">Carpeta Vacía</h3>
            <p className="text-gray-500 mt-1 max-w-md mx-auto">
              {searchTerm 
                ? "No se encontraron carpetas o documentos para su búsqueda"
                : "Esta carpeta no contiene documentos ni subcarpetas"}
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button 
                variant="outline"
                onClick={() => setIsNewFolderModalOpen(true)}
                className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Nueva Carpeta
              </Button>
              <Button 
                onClick={() => setIsNewDocumentModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Documento
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for creating a new folder */}
      <NewFolderModal 
        isOpen={isNewFolderModalOpen} 
        onClose={() => setIsNewFolderModalOpen(false)}
        parentFolderId={currentFolderId}
      />

      {/* Modal for creating a new document */}
      <NewDocumentModal 
        isOpen={isNewDocumentModalOpen} 
        onClose={() => setIsNewDocumentModalOpen(false)}
        folderId={currentFolderId}
      />
    </Layout>
  );
}