import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Middleware para verificar si un usuario puede eliminar documentos
export async function canDeleteDocumentsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "No autenticado" });
  }
  
  try {
    const userWithPermissions = await storage.getUserWithPermissions(req.user!.id);
    
    // Verificar si el usuario tiene el permiso requerido
    if (userWithPermissions?.permissions?.canDeleteDocuments || req.user!.role === 'admin') {
      return next();
    } else {
      return res.status(403).json({ 
        error: "No tienes permiso para eliminar documentos", 
        details: "Solo los administradores pueden eliminar documentos"
      });
    }
  } catch (error) {
    console.error("Error verificando permisos:", error);
    return res.status(500).json({ error: "Error al verificar permisos" });
  }
}

// Middleware para verificar si un usuario puede eliminar carpetas
export async function canDeleteFoldersMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "No autenticado" });
  }
  
  try {
    const userWithPermissions = await storage.getUserWithPermissions(req.user!.id);
    
    // Verificar si el usuario tiene el permiso requerido
    if (userWithPermissions?.permissions?.canDeleteFolders || req.user!.role === 'admin') {
      return next();
    } else {
      return res.status(403).json({ 
        error: "No tienes permiso para eliminar carpetas", 
        details: "Solo los administradores pueden eliminar carpetas"
      });
    }
  } catch (error) {
    console.error("Error verificando permisos:", error);
    return res.status(500).json({ error: "Error al verificar permisos" });
  }
}

// Middleware para verificar si un usuario puede ver el inventario
export async function canViewInventoryMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "No autenticado" });
  }
  
  try {
    const userWithPermissions = await storage.getUserWithPermissions(req.user!.id);
    
    // Verificar si el usuario tiene el permiso requerido (admin o técnico)
    if (
      userWithPermissions?.permissions?.canViewEquipment || 
      req.user!.role === 'admin' || 
      req.user!.role === 'technician'
    ) {
      return next();
    } else {
      return res.status(403).json({ 
        error: "No tienes permiso para ver el inventario", 
        details: "Solo los administradores y técnicos pueden ver el inventario"
      });
    }
  } catch (error) {
    console.error("Error verificando permisos:", error);
    return res.status(500).json({ error: "Error al verificar permisos" });
  }
}