import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  ChevronLeft, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  FileText, 
  Wrench,
  HardDrive, 
  Users,
  Bell,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export interface LayoutProps {
  children: React.ReactNode;
  currentModule: 'dashboard' | 'documentos' | 'inventario' | 'empleados' | 'configuracion' | 'proyectos' | 'admin' | 'mantenimiento';
}

const Layout: React.FC<LayoutProps> = ({ children, currentModule }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    if (isLoggingOut) return; // evitar múltiples clics
    setIsLoggingOut(true);
    try {
      await logoutMutation.mutateAsync();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Filtrar navegación basada en rol
  const getNavigation = () => {
    const baseNav = [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, current: currentModule === 'dashboard' },
      { name: 'Documentos', href: '/documents', icon: FileText, current: currentModule === 'documentos' },
      { name: 'Inventario', href: '/inventory', icon: HardDrive, current: currentModule === 'inventario' },
      { name: 'Obras', href: '/projects', icon: Building2, current: currentModule === 'proyectos' },
      { name: 'Gestión de Usuarios', href: '/users', icon: Users, current: currentModule === 'empleados' },
      { name: 'Configuración', href: '/settings', icon: Settings, current: currentModule === 'configuracion' },
    ];
    
    return baseNav;
  };
  
  const navigation = getNavigation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 pt-12">
      {/* Sidebar para mobile con overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            onClick={toggleSidebar}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 md:relative md:translate-x-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <div className="flex items-center">
                <span className="text-xl font-semibold text-gray-800">AssetLogix</span>
              </div>
              <button
                className="md:hidden text-gray-500 hover:text-gray-600"
                onClick={toggleSidebar}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col h-0 flex-1 overflow-y-auto">
              <div className="px-2 py-4">
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <div
                      key={item.name}
                      className="w-full"
                      onClick={() => {
                        setLocation(item.href);
                        setSidebarOpen(false);
                      }}
                    >
                      <a
                        className={`group flex items-center px-3 py-2 text-base font-medium rounded-md cursor-pointer ${
                          item.current 
                            ? 'bg-teal-50 text-teal-600' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <item.icon
                          className={`mr-3 h-6 w-6 flex-shrink-0 ${
                            item.current 
                              ? 'text-teal-500' 
                              : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        {item.name}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto p-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Cerrar sesión
                </Button>
              </div>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar estática para pantallas medianas y grandes */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <span className="text-xl font-semibold text-gray-800">AssetLogix</span>
        </div>
        <nav className="flex flex-col flex-1 overflow-y-auto">
          <div className="px-2 py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <div 
                  key={item.name}
                  className="w-full"
                  onClick={() => setLocation(item.href)}
                >
                  <a
                    className={`group flex items-center px-3 py-2 text-base font-medium rounded-md cursor-pointer ${
                      item.current 
                        ? 'bg-teal-50 text-teal-600' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-6 w-6 flex-shrink-0 ${
                        item.current 
                          ? 'text-teal-500' 
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={isLoggingOut}
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar sesión
            </Button>
          </div>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Barra superior */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center md:hidden">
              <button
                className="text-gray-500 hover:text-gray-600 focus:outline-none"
                onClick={toggleSidebar}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center ml-auto">
              <button className="p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none">
                <Bell className="w-6 h-6" />
              </button>
              <div className="ml-3 relative">
                <div className="flex items-center gap-3">
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-700">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.role}</div>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                    <AvatarFallback className="bg-teal-100 text-teal-600">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;