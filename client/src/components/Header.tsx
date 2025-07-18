import { useLocation } from "wouter";
import { useState } from "react";
import { UserContextType } from "@/App";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/ThemeProvider";

interface HeaderProps {
  toggleSidebar: () => void;
  currentModule: "documentos" | "mantenimiento";
  userContext: UserContextType;
}

export default function Header({ toggleSidebar, currentModule, userContext }: HeaderProps) {
  const [location] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, firebaseUser, logout } = userContext;
  const { theme, setTheme } = useTheme();
  
  // Count of unread notifications
  const notificationCount = 3;

  // Get current view based on route
  const getCurrentView = () => {
    if (location.includes('/documents/dashboard')) return 'Dashboard';
    if (location.includes('/documents/explorer')) return 'Explorador';
    if (location.includes('/documents/search')) return 'Búsqueda';
    if (location.includes('/documents/audit')) return 'Auditoría';
    if (location.includes('/documents/settings')) return 'Configuración';
    
    if (location.includes('/maintenance/dashboard')) return 'Dashboard';
    if (location.includes('/maintenance/catalog')) return 'Catálogo';
    if (location.includes('/maintenance/schedule')) return 'Calendario';
    if (location.includes('/maintenance/reports')) return 'Informes';
    if (location.includes('/maintenance/settings')) return 'Configuración';
    
    return 'Dashboard';
  };

  return (
    <header className="bg-white shadow z-10">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        {/* Left header section */}
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="text-secondary-500 hover:text-secondary-700 md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <h1 className="ml-3 md:ml-0 text-lg font-medium capitalize">
            <span>{currentModule === 'documentos' ? 'Gestión Documental' : 'Mantenimiento'}</span>
            {' - '}
            <span>{getCurrentView()}</span>
          </h1>
        </div>
        
        {/* Right header section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Input
              type="text"
              placeholder="Buscar..."
              className="w-64 pr-10 pl-4 py-2"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <i className="ri-search-line text-secondary-400"></i>
            </div>
          </div>
          
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="text-secondary-500 hover:text-secondary-700"
            onClick={() => {
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }}
          >
            <i className={`text-xl ${theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line'}`}></i>
          </Button>
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <i className="ri-notification-3-line text-xl"></i>
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-error-500 text-white rounded-full text-xs flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b border-secondary-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Notificaciones</h3>
                  <Button variant="ghost" size="sm" className="text-xs text-primary-600 hover:text-primary-800">
                    Marcar todo como leído
                  </Button>
                </div>
              </div>
              
              <div className="divide-y divide-secondary-100 max-h-96 overflow-y-auto">
                {/* Notification 1 */}
                <div className="p-4 hover:bg-secondary-50">
                  <div className="flex">
                    <div className="flex-shrink-0 bg-primary-100 rounded-md p-2">
                      <i className="ri-file-warning-line text-primary-600"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-secondary-900">Nuevo documento pendiente de revisión</p>
                      <p className="text-xs text-secondary-500">Manual de operaciones v2.3</p>
                      <p className="mt-1 text-xs text-secondary-500">Hace 10 minutos</p>
                    </div>
                  </div>
                </div>
                
                {/* Notification 2 */}
                <div className="p-4 hover:bg-secondary-50">
                  <div className="flex">
                    <div className="flex-shrink-0 bg-warning-100 rounded-md p-2">
                      <i className="ri-calendar-event-line text-warning-500"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-secondary-900">Mantenimiento programado</p>
                      <p className="text-xs text-secondary-500">Compresor industrial #103 - Mañana</p>
                      <p className="mt-1 text-xs text-secondary-500">Hace 1 hora</p>
                    </div>
                  </div>
                </div>
                
                {/* Notification 3 */}
                <div className="p-4 hover:bg-secondary-50">
                  <div className="flex">
                    <div className="flex-shrink-0 bg-success-100 rounded-md p-2">
                      <i className="ri-checkbox-circle-line text-success-500"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-secondary-900">Intervención completada</p>
                      <p className="text-xs text-secondary-500">Reemplazo de filtros en unidad #42</p>
                      <p className="mt-1 text-xs text-secondary-500">Ayer</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2 border-t border-secondary-100">
                <Button variant="ghost" className="w-full text-sm text-center text-primary-600 hover:text-primary-800">
                  Ver todas las notificaciones
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center text-sm space-x-2">
                <span className="hidden md:block">
                  <span className="text-secondary-700">{user?.name || firebaseUser?.displayName || firebaseUser?.email?.split('@')[0]}</span>
                </span>
                <img 
                  className="h-8 w-8 rounded-full" 
                  src={user?.avatar || firebaseUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || firebaseUser?.displayName || 'User')}`} 
                  alt={user?.name || firebaseUser?.displayName || "User"} 
                />
                <svg className="h-4 w-4 text-secondary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* User info */}
              <div className="px-4 py-3">
                <p className="text-sm font-medium truncate">{user?.name || firebaseUser?.displayName}</p>
                <p className="text-xs text-secondary-500 truncate">{user?.email || firebaseUser?.email}</p>
                <div className="mt-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-primary-100 text-primary-800">
                    {user?.role || "Usuario"}
                  </span>
                </div>
              </div>
              <div className="border-t border-secondary-200 my-1"></div>
              <DropdownMenuItem className="cursor-pointer">
                <i className="ri-user-line mr-2"></i>
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <i className="ri-settings-4-line mr-2"></i>
                Configuración
              </DropdownMenuItem>
              <div className="border-t border-secondary-200 my-1"></div>
              <DropdownMenuItem 
                className="cursor-pointer text-error-600 hover:text-error-800"
                onClick={logout}
              >
                <i className="ri-logout-box-line mr-2"></i>
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
