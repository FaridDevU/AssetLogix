import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DocumentViewer from "@/components/DocumentViewer";
import { Card, CardContent } from "@/components/ui/card";

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

export default function DocsSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [fileType, setFileType] = useState<string>("all");

  // Search documents
  const { data: searchResults = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents/search', searchQuery, fileType],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      let url = `/api/documents/search?q=${encodeURIComponent(searchQuery)}`;
      if (fileType !== "all") {
        url += `&type=${encodeURIComponent(fileType)}`;
      }
      
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to search documents');
      return response.json();
    },
    enabled: searchQuery.trim().length > 0
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search will be triggered automatically by the query's dependency on searchQuery
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

  // Sort results
  const sortedResults = [...(searchResults || [])].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "size") {
      return b.size - a.size;
    } else if (sortBy === "updatedAt") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else {
      return 0;
    }
  });

  return (
    <div className="h-full">
      <Card className="mb-6">
        <CardContent className="py-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <i className="ri-search-line text-secondary-400"></i>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Tipo de archivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="word">Word</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="image">Imágenes</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updatedAt">Más recientes</SelectItem>
                    <SelectItem value="name">Nombre (A-Z)</SelectItem>
                    <SelectItem value="size">Tamaño</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">
                <i className="ri-search-line mr-2"></i>
                Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-5 border-b border-secondary-100">
          <h2 className="text-lg font-medium">
            {searchQuery ? `Resultados para "${searchQuery}"` : "Búsqueda de documentos"}
          </h2>
          {searchResults && searchResults.length > 0 && (
            <p className="text-sm text-secondary-500">
              {searchResults.length} {searchResults.length === 1 ? "resultado" : "resultados"} encontrados
            </p>
          )}
        </div>
        
        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : !searchQuery ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <i className="ri-search-line text-5xl text-secondary-300"></i>
              <h3 className="mt-2 text-lg font-medium text-secondary-900">Busca documentos</h3>
              <p className="mt-1 text-secondary-500 max-w-md">
                Ingresa un término de búsqueda para encontrar documentos por nombre, contenido o metadatos.
              </p>
            </div>
          ) : sortedResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <i className="ri-file-search-line text-5xl text-secondary-300"></i>
              <h3 className="mt-2 text-lg font-medium text-secondary-900">No se encontraron resultados</h3>
              <p className="mt-1 text-secondary-500 max-w-md">
                No hay documentos que coincidan con tu búsqueda. Intenta con otros términos o filtros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sortedResults.map((doc) => (
                <div 
                  key={doc.id}
                  className="border border-secondary-200 rounded-lg p-4 hover:bg-secondary-50 cursor-pointer transition"
                  onClick={() => setSelectedDocumentId(doc.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <i className={`${getFileIcon(doc.type)} text-2xl`}></i>
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-base font-medium text-secondary-900">{doc.name}</h4>
                      <div className="mt-1 flex items-center text-sm text-secondary-500">
                        <span>{formatFileSize(doc.size)}</span>
                        <span className="mx-2">•</span>
                        <span>Versión {doc.currentVersion}</span>
                        <span className="mx-2">•</span>
                        <span>Actualizado {getRelativeTime(doc.updatedAt)}</span>
                      </div>
                    </div>
                    <div>
                      <Button variant="ghost" size="sm">
                        <i className="ri-more-2-fill"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Document viewer dialog */}
      {selectedDocumentId && (
        <Dialog open={!!selectedDocumentId} onOpenChange={(open) => !open && setSelectedDocumentId(null)}>
          <DialogContent className="sm:max-w-4xl">
            <DocumentViewer 
              documentId={selectedDocumentId} 
              onClose={() => setSelectedDocumentId(null)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
