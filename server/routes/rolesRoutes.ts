import { Express, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertRoleSchema } from '@shared/schema';
import { authenticate, checkRole } from '../routes';

// Schema para validación de roles
const createRoleSchema = insertRoleSchema.extend({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" })
});

export function registerRolesRoutes(app: Express) {
  // Middleware para verificar permiso de administración de roles
  const canManageRoles = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    
    try {
      const userWithPermissions = await storage.getUserWithPermissions(req.user!.id);
      
      // Verificar si el usuario tiene el permiso requerido
      if (userWithPermissions?.permissions?.canManageRoles || req.user!.role === 'admin') {
        return next();
      } else {
        return res.status(403).json({ error: "No tienes permiso para administrar roles" });
      }
    } catch (error) {
      console.error("Error verificando permisos:", error);
      return res.status(500).json({ error: "Error al verificar permisos" });
    }
  };
  
  // Obtener todos los roles
  app.get('/api/roles', authenticate, async (req: Request, res: Response) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error al obtener roles:", error);
      res.status(500).json({ error: "Error al obtener roles" });
    }
  });
  
  // Obtener un rol específico
  app.get('/api/roles/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const roleId = parseInt(req.params.id);
      const role = await storage.getRole(roleId);
      
      if (!role) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }
      
      res.json(role);
    } catch (error) {
      console.error("Error al obtener rol:", error);
      res.status(500).json({ error: "Error al obtener rol" });
    }
  });
  
  // Crear un nuevo rol
  app.post('/api/roles', authenticate, canManageRoles, async (req: Request, res: Response) => {
    try {
      // Validar datos de entrada
      const validatedData = createRoleSchema.parse(req.body);
      
      // Verificar si ya existe un rol con ese nombre
      const existingRole = await storage.getRoleByName(validatedData.name);
      if (existingRole) {
        return res.status(400).json({ error: "Ya existe un rol con ese nombre" });
      }
      
      // Crear nuevo rol
      const newRole = await storage.createRole(validatedData);
      res.status(201).json(newRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error al crear rol:", error);
      res.status(500).json({ error: "Error al crear rol" });
    }
  });
  
  // Actualizar un rol existente
  app.put('/api/roles/:id', authenticate, canManageRoles, async (req: Request, res: Response) => {
    try {
      const roleId = parseInt(req.params.id);
      
      // Obtener el rol existente
      const existingRole = await storage.getRole(roleId);
      if (!existingRole) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }
      
      // No permitir modificar roles del sistema
      if (existingRole.isSystemRole) {
        return res.status(403).json({ error: "No se pueden modificar roles del sistema" });
      }
      
      // Validar datos de entrada
      const validatedData = createRoleSchema.partial().parse(req.body);
      
      // Si se intenta cambiar el nombre, verificar que no exista otro rol con ese nombre
      if (validatedData.name && validatedData.name !== existingRole.name) {
        const roleWithSameName = await storage.getRoleByName(validatedData.name);
        if (roleWithSameName && roleWithSameName.id !== roleId) {
          return res.status(400).json({ error: "Ya existe un rol con ese nombre" });
        }
      }
      
      // Actualizar rol
      const updatedRole = await storage.updateRole(roleId, validatedData);
      res.json(updatedRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error al actualizar rol:", error);
      res.status(500).json({ error: "Error al actualizar rol" });
    }
  });
  
  // Eliminar un rol
  app.delete('/api/roles/:id', authenticate, canManageRoles, async (req: Request, res: Response) => {
    try {
      const roleId = parseInt(req.params.id);
      
      // Obtener el rol existente
      const existingRole = await storage.getRole(roleId);
      if (!existingRole) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }
      
      // No permitir eliminar roles del sistema
      if (existingRole.isSystemRole) {
        return res.status(403).json({ error: "No se pueden eliminar roles del sistema" });
      }
      
      // Eliminar rol
      const deleted = await storage.deleteRole(roleId);
      
      if (!deleted) {
        return res.status(500).json({ error: "No se pudo eliminar el rol" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      res.status(500).json({ error: "Error al eliminar rol" });
    }
  });
  
  // Asignar rol a un usuario
  app.post('/api/users/:userId/role/:roleId', authenticate, canManageRoles, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const roleId = parseInt(req.params.roleId);
      
      // Verificar que el usuario existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      // Verificar que el rol existe
      const role = await storage.getRole(roleId);
      if (!role) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }
      
      // Asignar rol al usuario
      const updatedUser = await storage.assignCustomRoleToUser(userId, roleId);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error al asignar rol:", error);
      res.status(500).json({ error: "Error al asignar rol" });
    }
  });
}