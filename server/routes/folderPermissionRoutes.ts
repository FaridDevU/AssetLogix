import { Router } from 'express';
import { storage } from '../storage';
import { insertFolderPermissionSchema } from '@shared/schema';
import express, { Response, NextFunction } from 'express';

const router = Router();

// Middleware de autenticación local para este archivo de rutas
const authenticate = (req: express.Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "No autenticado" });
  }
  next();
};

// Get all permissions for a folder
router.get('/folders/:folderId/permissions', authenticate, async (req, res) => {
  try {
    const folderId = parseInt(req.params.folderId);
    
    // Verify folder exists
    const folder = await storage.getFolder(folderId);
    if (!folder) {
      return res.status(404).json({ message: 'Carpeta no encontrada' });
    }
    
    // Check if user has permission to view folder permissions
    // Only folder owners or admins can view permissions
    const userId = req.user!.id;
    const userPermission = await storage.getFolderPermission(folderId, userId);
    const isAdmin = req.user!.role === 'admin';
    
    if (!isAdmin && (!userPermission || !userPermission.isOwner)) {
      return res.status(403).json({ message: 'No autorizado para ver permisos de esta carpeta' });
    }
    
    const permissions = await storage.getFolderPermissionsByFolder(folderId);
    
    // Get user info for each permission
    const permissionsWithUserInfo = await Promise.all(
      permissions.map(async (permission) => {
        const user = await storage.getUser(permission.userId);
        return {
          ...permission,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role
          } : null
        };
      })
    );
    
    res.json(permissionsWithUserInfo);
  } catch (error) {
    console.error('Error obteniendo permisos de carpeta:', error);
    res.status(500).json({ message: 'Error al obtener permisos de carpeta' });
  }
});

// Get all folders a user has access to
router.get('/users/:userId/folder-permissions', authenticate, async (req, res) => {
  try {
    const requestedUserId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;
    const isAdmin = req.user!.role === 'admin';
    
    // Users can only view their own permissions unless they're admin
    if (!isAdmin && requestedUserId !== currentUserId) {
      return res.status(403).json({ message: 'No autorizado para ver permisos de otro usuario' });
    }
    
    const permissions = await storage.getFolderPermissionsByUser(requestedUserId);
    
    // Get folder info for each permission
    const permissionsWithFolderInfo = await Promise.all(
      permissions.map(async (permission) => {
        const folder = await storage.getFolder(permission.folderId);
        return {
          ...permission,
          folder: folder ? {
            id: folder.id,
            name: folder.name,
            path: folder.path,
            parentId: folder.parentId
          } : null
        };
      })
    );
    
    res.json(permissionsWithFolderInfo);
  } catch (error) {
    console.error('Error obteniendo permisos de usuario:', error);
    res.status(500).json({ message: 'Error al obtener permisos de usuario' });
  }
});

// Check if a user has permission to access a folder
router.get('/folders/:folderId/permissions/check', authenticate, async (req, res) => {
  try {
    const folderId = parseInt(req.params.folderId);
    const userId = req.user!.id;
    
    // Verify folder exists
    const folder = await storage.getFolder(folderId);
    if (!folder) {
      return res.status(404).json({ message: 'Carpeta no encontrada' });
    }
    
    // Get direct permission for the user on this folder
    const directPermission = await storage.getFolderPermission(folderId, userId);
    
    // Check if user has permission to view the folder (direct, inherited, or admin)
    const hasViewPermission = await storage.hasPermissionToViewFolder(folderId, userId);
    
    res.json({
      hasAccess: hasViewPermission,
      permissions: directPermission || null
    });
  } catch (error) {
    console.error('Error verificando permisos:', error);
    res.status(500).json({ message: 'Error al verificar permisos' });
  }
});

// Add a new permission
router.post('/folders/:folderId/permissions', authenticate, async (req, res) => {
  try {
    const folderId = parseInt(req.params.folderId);
    const currentUserId = req.user!.id;
    
    // Verify folder exists
    const folder = await storage.getFolder(folderId);
    if (!folder) {
      return res.status(404).json({ message: 'Carpeta no encontrada' });
    }
    
    // Check if user has permission to manage folder permissions
    const userPermission = await storage.getFolderPermission(folderId, currentUserId);
    const isAdmin = req.user!.role === 'admin';
    
    if (!isAdmin && (!userPermission || !userPermission.isOwner && !userPermission.canShare)) {
      return res.status(403).json({ message: 'No autorizado para compartir esta carpeta' });
    }
    
    // Validate request body
    const validationResult = insertFolderPermissionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ message: 'Datos inválidos', errors: validationResult.error.errors });
    }
    
    const permissionData = validationResult.data;
    
    // Override folderId to ensure it matches the URL parameter
    permissionData.folderId = folderId;
    
    // Check if permission already exists for this user/folder
    const existingPermission = await storage.getFolderPermission(folderId, permissionData.userId);
    if (existingPermission) {
      return res.status(409).json({ 
        message: 'El usuario ya tiene permisos para esta carpeta',
        permission: existingPermission
      });
    }
    
    // Create new permission
    const newPermission = await storage.createFolderPermission(permissionData);
    
    res.status(201).json(newPermission);
  } catch (error) {
    console.error('Error creando permiso de carpeta:', error);
    res.status(500).json({ message: 'Error al crear permiso de carpeta' });
  }
});

// Update an existing permission
router.put('/folders/:folderId/permissions/:userId', authenticate, async (req, res) => {
  try {
    const folderId = parseInt(req.params.folderId);
    const permissionUserId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;
    
    // Verify folder exists
    const folder = await storage.getFolder(folderId);
    if (!folder) {
      return res.status(404).json({ message: 'Carpeta no encontrada' });
    }
    
    // Check if permission exists
    const existingPermission = await storage.getFolderPermission(folderId, permissionUserId);
    if (!existingPermission) {
      return res.status(404).json({ message: 'Permiso no encontrado' });
    }
    
    // Check if current user has permission to manage folder permissions
    const userPermission = await storage.getFolderPermission(folderId, currentUserId);
    const isAdmin = req.user!.role === 'admin';
    
    if (!isAdmin && (!userPermission || !userPermission.isOwner)) {
      return res.status(403).json({ message: 'No autorizado para modificar permisos de esta carpeta' });
    }
    
    // Users cannot modify their own owner status
    if (currentUserId === permissionUserId && req.body.isOwner === false && existingPermission.isOwner) {
      return res.status(400).json({ message: 'No puedes quitarte a ti mismo los permisos de propietario' });
    }
    
    // Update permission
    const updatedPermission = await storage.updateFolderPermission(existingPermission.id, req.body);
    
    res.json(updatedPermission);
  } catch (error) {
    console.error('Error actualizando permiso de carpeta:', error);
    res.status(500).json({ message: 'Error al actualizar permiso de carpeta' });
  }
});

// Delete a permission
router.delete('/folders/:folderId/permissions/:userId', authenticate, async (req, res) => {
  try {
    const folderId = parseInt(req.params.folderId);
    const permissionUserId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;
    
    // Verify folder exists
    const folder = await storage.getFolder(folderId);
    if (!folder) {
      return res.status(404).json({ message: 'Carpeta no encontrada' });
    }
    
    // Check if permission exists
    const existingPermission = await storage.getFolderPermission(folderId, permissionUserId);
    if (!existingPermission) {
      return res.status(404).json({ message: 'Permiso no encontrado' });
    }
    
    // Check if current user has permission to manage folder permissions
    const userPermission = await storage.getFolderPermission(folderId, currentUserId);
    const isAdmin = req.user!.role === 'admin';
    
    if (!isAdmin && (!userPermission || !userPermission.isOwner)) {
      return res.status(403).json({ message: 'No autorizado para eliminar permisos de esta carpeta' });
    }
    
    // Owners cannot remove their own owner permissions
    if (currentUserId === permissionUserId && existingPermission.isOwner) {
      return res.status(400).json({ message: 'No puedes eliminar tus propios permisos de propietario' });
    }
    
    // Delete permission
    await storage.deleteFolderPermission(existingPermission.id);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando permiso de carpeta:', error);
    res.status(500).json({ message: 'Error al eliminar permiso de carpeta' });
  }
});

export default router;