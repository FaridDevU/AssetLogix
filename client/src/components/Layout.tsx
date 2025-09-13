import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  FileText, 
  HardDrive, 
  Users,
  Bell,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutMutation.mutateAsync();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getNavigation = () => {
    return [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, current: currentModule === 'dashboard' },
      { name: 'Documentos', href: '/documents', icon: FileText, current: currentModule === 'documentos' },
      { name: 'Inventario', href: '/inventory', icon: HardDrive, current: currentModule === 'inventario' },
      { name: 'Obras', href: '/projects', icon: Building2, current: currentModule === 'proyectos' },
      { name: 'Gestión de Usuarios', href: '/users', icon: Users, current: currentModule === 'empleados' },
      { name: 'Configuración', href: '/settings', icon: Settings, current: currentModule === 'configuracion' },
    ];
  };
  
  const navigation = getNavigation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay para móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[50] md:hidden"
            onClick={toggleSidebar}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar móvil */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-[60] w-72 bg-white border-r border-gray-200 shadow-2xl md:hidden flex flex-col max-h-screen"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between h-14 px-3 border-b border-gray-200 bg-white shrink-0">
              <span className="text-lg font-semibold text-gray-800">AssetLogix</span>
              <button
                className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100"
                onClick={toggleSidebar}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden bg-white min-h-0">
              <div className="flex-1 overflow-y-auto px-2 py-2">
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <button
                      key={item.name}
                      className={`w-full group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                        item.current 
                          ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => {
                        setLocation(item.href);
                        setSidebarOpen(false);
                      }}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 ${
                          item.current 
                            ? 'text-teal-600' 
                            : 'text-gray-500 group-hover:text-gray-700'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 border-t border-gray-200 bg-white shrink-0">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 py-2 text-sm"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar estático para desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200 pt-12">
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <span className="text-xl font-semibold text-gray-800">AssetLogix</span>
        </div>
        <nav className="flex flex-col flex-1 overflow-y-auto">
          <div className="px-2 py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <button 
                  key={item.name}
                  className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    item.current 
                      ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setLocation(item.href)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      item.current 
                        ? 'text-teal-600' 
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </button>
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
      <div className="flex flex-col flex-1 md:pl-64 pt-12">
        <header className="sticky top-12 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-14 px-3 md:h-16 md:px-4">
            <div className="flex items-center md:hidden">
              <button
                className="text-gray-700 hover:text-gray-900 focus:outline-none p-2 rounded-md hover:bg-gray-100 border border-gray-300"
                onClick={toggleSidebar}
                style={{ minHeight: '40px', minWidth: '40px' }}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center ml-auto">
              <button className="p-2 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none hover:bg-gray-100">
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <div className="ml-2 md:ml-3 relative">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-700">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.role}</div>
                  </div>
                  <Avatar className="h-7 w-7 md:h-8 md:w-8">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                    <AvatarFallback className="bg-teal-100 text-teal-600 text-sm">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;