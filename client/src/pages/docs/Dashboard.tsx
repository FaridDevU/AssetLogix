import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DocumentViewer from "@/components/DocumentViewer";

interface FolderStats {
  total: number;
  recent: number;
}

interface DocumentStats {
  total: number;
  byType: {
    [key: string]: number;
  };
  change: number;
}

interface StorageStats {
  used: number;
  total: number;
  available: number;
  percentUsed: number;
}

interface ActivityItem {
  id: number;
  documentId: number;
  userId: number;
  action: string;
  details: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    avatar: string;
  };
  document: {
    id: number;
    name: string;
    type: string;
  };
}

interface Folder {
  id: number;
  name: string;
  path: string;
  parentId: number | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export default function DocsDashboard() {
  // Fetch document statistics
  const { data: documentStats, isLoading: statsLoading } = useQuery<DocumentStats>({
    queryKey: ['/api/documents/stats'],
    queryFn: async () => {
      // This would normally come from API, but for demo we're creating mock data
      return {
        total: 1248,
        byType: {
          pdf: 500,
          image: 250,
          spreadsheet: 250,
          other: 248
        },
        change: 8.2
      };
    }
  });

  // Fetch storage statistics
  const { data: storageStats, isLoading: storageLoading } = useQuery<StorageStats>({
    queryKey: ['/api/storage/stats'],
    queryFn: async () => {
      // This would normally come from API, but for demo we're creating mock data
      return {
        used: 342,
        total: 500,
        available: 158,
        percentUsed: 68.4
      };
    }
  });

  // Fetch activity data
  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/activity'],
    queryFn: async () => {
      const response = await fetch(`/api/activity?limit=4`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    }
  });

  // Fetch recent folders
  const { data: recentFolders = [], isLoading: foldersLoading } = useQuery<Folder[]>({
    queryKey: ['/api/folders/recent'],
    queryFn: async () => {
      const response = await fetch('/api/folders', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch folders');
      return response.json();
    }
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "upload":
        return <i className="ri-upload-2-line text-primary-600"></i>;
      case "download":
        return <i className="ri-download-2-line text-secondary-600"></i>;
      case "view":
        return <i className="ri-eye-line text-secondary-600"></i>;
      case "edit":
        return <i className="ri-edit-line text-warning-600"></i>;
      case "delete":
        return <i className="ri-delete-bin-line text-error-600"></i>;
      case "new_version":
        return <i className="ri-file-upload-line text-primary-600"></i>;
      default:
        return <i className="ri-file-list-line text-secondary-600"></i>;
    }
  };

  const getActionVerb = (action: string): string => {
    switch (action) {
      case "upload": return "subió";
      case "download": return "descargó";
      case "view": return "vio";
      case "edit": return "editó";
      case "delete": return "eliminó";
      case "new_version": return "actualizó";
      default: return action;
    }
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Quick stats cards */}
      <StatCard 
        title="Documentos"
        value={documentStats?.total || 0}
        change={documentStats?.change ? { value: documentStats.change, type: "increase" } : undefined}
        badge={{ text: "Total", variant: "outline" }}
      >
        {documentStats && (
          <div className="mt-4 h-12">
            <div className="flex justify-between text-xs text-secondary-500">
              <span>PDF</span>
              <span>Imágenes</span>
              <span>Hojas de cálculo</span>
              <span>Otros</span>
            </div>
            <div className="mt-1 flex h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary-500" 
                style={{ width: `${(documentStats.byType.pdf / documentStats.total) * 100}%` }}
              ></div>
              <div 
                className="bg-warning-500" 
                style={{ width: `${(documentStats.byType.image / documentStats.total) * 100}%` }}
              ></div>
              <div 
                className="bg-success-500" 
                style={{ width: `${(documentStats.byType.spreadsheet / documentStats.total) * 100}%` }}
              ></div>
              <div 
                className="bg-secondary-400" 
                style={{ width: `${(documentStats.byType.other / documentStats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </StatCard>
      
      <StatCard 
        title="Almacenamiento"
        value={`${storageStats?.used || 0} GB`}
        badge={{ text: `${storageStats?.total || 0} GB`, variant: "secondary" }}
      >
        <div className="mt-4">
          <div className="flex justify-between items-center text-xs text-secondary-500">
            <span>{storageStats?.percentUsed || 0}% usado</span>
            <span>{storageStats?.available || 0} GB disponibles</span>
          </div>
          <div className="mt-1 h-2 bg-secondary-200 rounded-full">
            <div 
              className="bg-primary-500 h-2 rounded-full" 
              style={{ width: `${storageStats?.percentUsed || 0}%` }}
            ></div>
          </div>
        </div>
      </StatCard>
      
      <StatCard 
        title="Actividad"
        value={214}
        change={{ value: 3.5, type: "decrease" }}
        badge={{ text: "Últimos 7 días", variant: "secondary" }}
      >
        <div className="mt-4 h-12">
          <div className="flex justify-between text-xs text-secondary-500">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>
          <div className="mt-1 flex items-end justify-between h-6">
            <div className="bg-primary-500 w-8 rounded-t" style={{ height: '60%' }}></div>
            <div className="bg-primary-500 w-8 rounded-t" style={{ height: '80%' }}></div>
            <div className="bg-primary-500 w-8 rounded-t" style={{ height: '40%' }}></div>
            <div className="bg-primary-500 w-8 rounded-t" style={{ height: '70%' }}></div>
            <div className="bg-primary-500 w-8 rounded-t" style={{ height: '90%' }}></div>
            <div className="bg-primary-500 w-8 rounded-t" style={{ height: '30%' }}></div>
            <div className="bg-primary-500 w-8 rounded-t" style={{ height: '20%' }}></div>
          </div>
        </div>
      </StatCard>
      
      {/* Recent activity */}
      <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-5 border-b border-secondary-100 flex justify-between items-center">
          <h3 className="text-lg font-medium text-secondary-900">Actividad reciente</h3>
          <Button variant="link" className="text-primary-600 hover:text-primary-800 text-sm">Ver todas</Button>
        </div>
        <ul className="divide-y divide-secondary-100">
          {activitiesLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <i className="ri-file-list-line text-4xl text-secondary-300"></i>
              <p className="mt-2 text-secondary-500">No hay actividad reciente</p>
            </div>
          ) : (
            activities.map((activity) => (
              <li key={activity.id} className="p-4 hover:bg-secondary-50">
                <div className="flex">
                  <img 
                    className="h-10 w-10 rounded-full" 
                    src={activity.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user.name)}`} 
                    alt={activity.user.name} 
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-secondary-900">
                      {activity.user.name} {getActionVerb(activity.action)}{" "}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-primary-600">
                            {activity.document.name}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl">
                          <DocumentViewer documentId={activity.documentId} />
                        </DialogContent>
                      </Dialog>
                    </p>
                    <p className="text-xs text-secondary-500">{getRelativeTime(activity.createdAt)}</p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      
      {/* Recent folders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-5 border-b border-secondary-100 flex justify-between items-center">
          <h3 className="text-lg font-medium text-secondary-900">Carpetas recientes</h3>
          <Button variant="link" className="text-primary-600 hover:text-primary-800 text-sm">Ver todas</Button>
        </div>
        <ul className="divide-y divide-secondary-100">
          {foldersLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : recentFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <i className="ri-folder-line text-4xl text-secondary-300"></i>
              <p className="mt-2 text-secondary-500">No hay carpetas recientes</p>
            </div>
          ) : (
            recentFolders.slice(0, 4).map((folder) => (
              <li key={folder.id} className="p-4 hover:bg-secondary-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0 text-primary-500">
                    <i className="ri-folder-line text-xl"></i>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-secondary-900">{folder.name}</p>
                    <p className="text-xs text-secondary-500">Actualizado {getRelativeTime(folder.updatedAt)}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-secondary-400 hover:text-secondary-600">
                    <i className="ri-more-2-fill"></i>
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}