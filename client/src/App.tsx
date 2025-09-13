import { Switch, Route, useLocation, useParams } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Loader2 } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import * as React from 'react';

// Auth Provider
import { AuthProvider, useAuth } from "@/hooks/use-auth";

// Páginas
import NotFound from "@/pages/not-found";
import AnimatedLogin from "@/pages/auth/AnimatedLogin";
import Dashboard from "@/pages/Dashboard";

// Componentes lazy-loaded
const DocumentList = lazy(() => import("@/pages/documents/DocumentList"));
const DocumentDetail = lazy(() => import("@/pages/documents/DocumentDetail"));
const InventoryPage = lazy(() => import("@/pages/inventory/InventoryPage"));
const EquipmentDetail = lazy(() => import("@/pages/equipment/EquipmentDetail"));
const NewEquipmentPage = lazy(() => import("@/pages/equipment/NewEquipmentPage"));
const ScheduleMaintenancePage = lazy(() => import("@/pages/inventory/maintenance/ScheduleMaintenancePage"));
const UsersPage = lazy(() => import("@/pages/users/UsersPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));

// Componentes de mantenimiento
const MaintenanceSettings = lazy(() => import("@/pages/maintenance/Settings"));
const MaintenanceDashboard = lazy(() => import("@/pages/maintenance/Dashboard"));
const MaintenanceSchedule = lazy(() => import("@/pages/maintenance/Schedule"));
const MaintenanceReports = lazy(() => import("@/pages/maintenance/Reports"));
const MaintenanceCatalog = lazy(() => import("@/pages/maintenance/Catalog"));

// Componentes de proyectos (Obras)
const ProjectsPage = lazy(() => import("@/pages/projects/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("@/pages/projects/ProjectDetailPage"));
const ProjectFormPage = lazy(() => import("@/pages/projects/ProjectFormPage"));
const AddDocumentPage = lazy(() => import("@/pages/projects/AddDocumentPage"));
const AddManagerPage = lazy(() => import("@/pages/projects/AddManagerPage"));

// Componente para proteger rutas
const ProtectedRoute = ({ component: Component, path }: { 
  component: any; 
  path: string;
}) => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = path.split('/').filter(p => p.startsWith(':')).map(p => p.substring(1));
  
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/auth');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto" />
          <p className="mt-4 text-teal-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <Component />
    </Suspense>
  );
};

function Router() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Redireccionar según el estado de autenticación
  useEffect(() => {
    // Si no está autenticado y no estamos en /auth, enviar al login
    if (!isLoading && !user && location !== "/auth") {
      setLocation("/auth");
    }
    // Si ya está autenticado y está en /auth, enviar al dashboard
    if (!isLoading && user && location === "/auth") {
      setLocation("/");
    }
  }, [user, isLoading, location, setLocation]);

  return (
    <Switch>
      {/* Rutas públicas */}
      <Route path="/auth">
        <AnimatedLogin />
      </Route>
      
      {/* Rutas protegidas */}
      <Route path="/" component={() => <ProtectedRoute path="/" component={Dashboard} />} />
      
      {/* Rutas de documentos */}
      <Route path="/documents">
        <ProtectedRoute path="/documents" component={DocumentList} />
      </Route>
      
      <Route path="/documents/folder/:id">
        {(params) => (
          <ProtectedRoute path={`/documents/folder/${params.id}`} component={() => <DocumentList folderId={params.id} />} />
        )}
      </Route>
      
      <Route path="/documents/:id">
        {(params) => (
          <ProtectedRoute path={`/documents/${params.id}`} component={DocumentDetail} />
        )}
      </Route>
      
      {/* Ruta de inventario (unificando equipos y mantenimiento) */}
      <Route path="/inventory/new">
        <ProtectedRoute path="/inventory/new" component={NewEquipmentPage} />
      </Route>

      <Route path="/inventory/:id">
        {(params) => (
          params.id !== "new" ? (
            <ProtectedRoute path={`/inventory/${params.id}`} component={EquipmentDetail} />
          ) : (
            <ProtectedRoute path="/inventory/new" component={NewEquipmentPage} />
          )
        )}
      </Route>
      
      <Route path="/inventory">
        <ProtectedRoute path="/inventory" component={InventoryPage} />
      </Route>
      
      {/* Rutas específicas de equipo */}
      <Route path="/equipment/new">
        <ProtectedRoute path="/equipment/new" component={NewEquipmentPage} />
      </Route>
      
      <Route path="/equipment/:id">
        {(params) => (
          <ProtectedRoute path={`/equipment/${params.id}`} component={EquipmentDetail} />
        )}
      </Route>
      
      {/* Rutas de mantenimiento */}
      <Route path="/inventory/maintenance/schedule/:id">
        {(params) => (
          <ProtectedRoute path={`/inventory/maintenance/schedule/${params.id}`} component={ScheduleMaintenancePage} />
        )}
      </Route>
      
      <Route path="/maintenance/settings">
        <ProtectedRoute path="/maintenance/settings" component={MaintenanceSettings} />
      </Route>

      <Route path="/maintenance/dashboard">
        <ProtectedRoute path="/maintenance/dashboard" component={MaintenanceDashboard} />
      </Route>

      <Route path="/maintenance/schedule">
        <ProtectedRoute path="/maintenance/schedule" component={MaintenanceSchedule} />
      </Route>

      <Route path="/maintenance/reports">
        <ProtectedRoute path="/maintenance/reports" component={MaintenanceReports} />
      </Route>

      <Route path="/maintenance/catalog">
        <ProtectedRoute path="/maintenance/catalog" component={MaintenanceCatalog} />
      </Route>
      
      {/* Rutas de usuarios y configuración */}
      <Route path="/users">
        <ProtectedRoute path="/users" component={UsersPage} />
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute path="/settings" component={SettingsPage} />
      </Route>
      
      {/* Rutas de proyectos (Obras) */}
      <Route path="/projects/new">
        <ProtectedRoute path="/projects/new" component={ProjectFormPage} />
      </Route>
      
      <Route path="/projects/:id/edit">
        {(params) => (
          <ProtectedRoute path={`/projects/${params.id}/edit`} component={() => <ProjectFormPage />} />
        )}
      </Route>
      
      <Route path="/projects/:id/documents/add">
        {(params) => (
          <ProtectedRoute path={`/projects/${params.id}/documents/add`} component={() => <AddDocumentPage />} />
        )}
      </Route>
      
      <Route path="/projects/:id/managers/add">
        {(params) => (
          <ProtectedRoute path={`/projects/${params.id}/managers/add`} component={() => <AddManagerPage />} />
        )}
      </Route>
      
      <Route path="/projects/:id">
        {(params) => (
          <ProtectedRoute path={`/projects/${params.id}`} component={() => <ProjectDetailPage />} />
        )}
      </Route>
      
      <Route path="/projects">
        <ProtectedRoute path="/projects" component={ProjectsPage} />
      </Route>
      
      {/* Fallback 404 - this should be the last route */}
      <Route path="*">
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="sistema-gm-theme">
        <AuthProvider>
          <TooltipProvider>
            <div className="min-h-screen w-full">
              <AuthGate />
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto" />
          <p className="mt-4 text-teal-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AnimatedLogin />;
  }

  return <Router />;
}

export default App;