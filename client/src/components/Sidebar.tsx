import { Link, useLocation } from "wouter";
import { UserContextType } from "@/App";

interface SidebarProps {
  open: boolean;
  currentModule: "documentos" | "mantenimiento";
  setCurrentModule: (module: "documentos" | "mantenimiento") => void;
  toggleSidebar: () => void;
  userContext: UserContextType;
}

export default function Sidebar({ 
  open, 
  currentModule, 
  setCurrentModule, 
  toggleSidebar,
  userContext
}: SidebarProps) {
  const [location] = useLocation();
  const { user } = userContext;

  const getActiveClass = (path: string) => {
    return location === path 
      ? "bg-primary-50 text-primary-600" 
      : "text-secondary-600 hover:bg-secondary-50";
  };

  return (
    <aside 
      className={`${
        open ? 'translate-x-0' : '-translate-x-full'
      } bg-white shadow-lg w-64 flex-shrink-0 fixed inset-y-0 z-30 md:relative md:translate-x-0 transition duration-200 ease-in-out`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-100">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="ml-2 text-sm font-semibold">SistemaGM</span>
        </div>
        <button onClick={toggleSidebar} className="md:hidden text-secondary-500 hover:text-secondary-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Modules */}
      <nav className="mt-5 px-2">
        <h3 className="px-3 text-xs font-semibold text-secondary-500 uppercase tracking-wider">
          Módulos
        </h3>
        <div className="mt-2 space-y-1">
          <button 
            onClick={() => setCurrentModule("documentos")} 
            className={`${
              currentModule === "documentos" 
                ? "bg-primary-50 text-primary-600" 
                : "text-secondary-600 hover:bg-secondary-50"
            } group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
          >
            <i className="ri-file-list-line mr-3 text-lg"></i>
            Gestión Documental
          </button>
          
          <button 
            onClick={() => setCurrentModule("mantenimiento")} 
            className={`${
              currentModule === "mantenimiento" 
                ? "bg-primary-50 text-primary-600" 
                : "text-secondary-600 hover:bg-secondary-50"
            } group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
          >
            <i className="ri-tools-line mr-3 text-lg"></i>
            Mantenimiento
          </button>
        </div>
      </nav>
      
      {/* Views */}
      <div className="mt-5 px-2">
        <h3 className="px-3 text-xs font-semibold text-secondary-500 uppercase tracking-wider">
          {currentModule === "documentos" ? "Documentos" : "Equipos"}
        </h3>
        
        {/* Document views */}
        {currentModule === "documentos" && (
          <div className="mt-2 space-y-1">
            <Link href="/documents/dashboard">
              <a className={`${getActiveClass("/documents/dashboard")} group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}>
                <i className="ri-dashboard-line mr-3 text-lg"></i>
                Dashboard
              </a>
            </Link>
            <Link href="/documents/explorer">
              <a className={`${getActiveClass("/documents/explorer")} group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}>
                <i className="ri-folder-line mr-3 text-lg"></i>
                Explorador
              </a>
            </Link>
            <Link href="/documents/search">
              <a className={`${getActiveClass("/documents/search")} group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}>
                <i className="ri-search-line mr-3 text-lg"></i>
                Búsqueda
              </a>
            </Link>
            <Link href="/documents/audit">
              <a className={`${getActiveClass("/documents/audit")} group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}>
                <i className="ri-history-line mr-3 text-lg"></i>
                Auditoría
              </a>
            </Link>
            <Link href="/documents/settings">
              <a className={`${getActiveClass("/documents/settings")} group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}>
                <i className="ri-settings-line mr-3 text-lg"></i>
                Configuración
              </a>
            </Link>
          </div>
        )}
        
        {/* Maintenance views */}
        {currentModule === "mantenimiento" && (
          <div className="mt-2 space-y-1">
            <Link href="/maintenance/dashboard">
              <a className={`${getActiveClass("/maintenance/dashboard")} group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}>
                <i className="ri-dashboard-line mr-3 text-lg"></i>
                Dashboard
              </a>
            </Link>
            <Link href="/maintenance/catalog">
              <a className={`${getActiveClass("/maintenance/catalog")} group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}>
                <i className="ri-list-check mr-3 text-lg"></i>
                Catálogo
              </a>
            </Link>
            <Link href="/maintenance/schedule">
              <a className={`${getActiveClass("/maintenance/schedule")} group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}>
                <i className="ri-calendar-line mr-3 text-lg"></i>
                Calendario
              </a>
            </Link>
            <Link href="/maintenance/reports">
              <a className={`${getActiveClass("/maintenance/reports")} group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}>
                <i className="ri-file-chart-line mr-3 text-lg"></i>
                Informes
              </a>
            </Link>
            <Link href="/maintenance/settings">
              <a className={`${getActiveClass("/maintenance/settings")} group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}>
                <i className="ri-settings-line mr-3 text-lg"></i>
                Configuración
              </a>
            </Link>
          </div>
        )}
      </div>
      
      {/* User */}
      <div className="mt-auto p-4 border-t border-secondary-100">
        <div className="flex items-center">
          <img 
            className="h-8 w-8 rounded-full" 
            src={user?.avatar || "https://ui-avatars.com/api/?name=User"} 
            alt={user?.name || "User"} 
          />
          <div className="ml-3">
            <p className="text-sm font-medium text-secondary-700">{user?.name}</p>
            <p className="text-xs text-secondary-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
