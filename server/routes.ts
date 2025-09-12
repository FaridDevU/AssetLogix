import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MockDatabase } from "./mockDatabase";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { reactionService } from './services/reactionService';
import { registerProjectRoutes } from './routes/projectRoutes';
import { registerRolesRoutes } from './routes/rolesRoutes';
import { registerDocumentRoutes } from './routes/documentRoutes';
import { registerProjectEquipmentRoutes } from './routes/projectEquipmentRoutes';
import folderPermissionRoutes from './routes/folderPermissionRoutes';
import {
  insertUserSchema,
  insertFolderSchema,
  insertDocumentSchema,
  insertDocumentVersionSchema,
  insertDocumentActivitySchema,
  insertEquipmentTypeSchema,
  insertEquipmentSchema,
  insertMaintenanceScheduleSchema,
  insertMaintenanceInterventionSchema,
  insertMaintenanceAttachmentSchema,
  insertIotSensorSchema,
  insertSensorReadingSchema,
  insertMaintenancePredictionSchema,
  insertPredictionEvidenceSchema,
  insertIotDeviceSchema,
  insertAlertNotificationSchema,
  insertReactionSchema,
  insertProjectSchema,
  insertProjectManagerSchema,
  insertProjectDocumentSchema
} from "@shared/schema";
import { setupAuth } from "./auth";
import { verifyAdminPassword } from "./auth/verifyPassword";

export const authenticate = (req: Express.Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "No autenticado" });
  }
  next();
};

export const checkRole = (allowedRoles: string[]) => {
  return (req: Express.Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const user = req.user as Express.User;
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticación
  setupAuth(app);

  // Configurar multer para cargas de archivos
  const multerStorage = multer.diskStorage({
    destination: (req: Express.Request, file, cb) => {
      // Determinar la carpeta de destino según el tipo de archivo
      let uploadDir = './public/uploads';
      
      // Verificar si el archivo está relacionado con documentos, equipos o proyectos
      const url = (req as any).path || (req as any).url || (req as any).originalUrl || '';
      if (url.includes('/documents')) {
        uploadDir = './public/uploads/documents';
      } else if (url.includes('/equipment')) {
        uploadDir = './public/uploads/equipment';
      } else if (url.includes('/projects')) {
        uploadDir = './public/uploads/projects';
      }
      
      // Garantizar que el directorio exista
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generar nombre de archivo único con timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      // Obtener extensión del archivo original
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  // Función para filtrar tipos de archivos
  const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Acceder a la ruta de la solicitud
    const url = (req as any).path || (req as any).url || (req as any).originalUrl || '';
    
    // Permitir todos los archivos para documentos
    if (url.includes('/documents')) {
      return cb(null, true);
    }
    
    // Para equipos, solo permitir imágenes
    if (url.includes('/equipment')) {
      if (file.mimetype.startsWith('image/')) {
        return cb(null, true);
      }
      cb(new Error('Solo se permiten archivos de imagen para equipos'));
    }
    
    // Por defecto, aceptar el archivo
    cb(null, true);
  };

  const upload = multer({ 
    storage: multerStorage, 
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // Limitar a 10MB
    }
  });

  const authenticate = (req: Express.Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "No autenticado" });
    }
    next();
  };

  const checkRole = (allowedRoles: string[]) => {
    return (req: Express.Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "No autenticado" });
      }
      const user = req.user as Express.User;
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      next();
    };
  };

  // API Routes
  // === Authentication endpoints already set up by setupAuth === //
  
  // Endpoint para verificar la contraseña del administrador
  app.post("/api/auth/verify-admin-password", authenticate, async (req, res) => {
    await verifyAdminPassword(req, res);
  });

  // === Reactions (emojis) ===
  app.get("/api/reactions/comment/:commentId", authenticate, async (req, res) => {
    try {
      const commentId = Number(req.params.commentId);
      const user = req.user as Express.User;
      
      const reactions = await reactionService.getFormattedReactions(user.id, commentId);
      res.json(reactions);
    } catch (error) {
      console.error('Error getting reactions:', error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/reactions/task/:taskId", authenticate, async (req, res) => {
    try {
      const taskId = Number(req.params.taskId);
      const user = req.user as Express.User;
      
      const reactions = await reactionService.getFormattedReactions(user.id, undefined, taskId);
      res.json(reactions);
    } catch (error) {
      console.error('Error getting reactions:', error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/reactions/toggle", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { emoji, commentId, taskId } = insertReactionSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      // Convert empty values or invalid strings to undefined to avoid type errors
      const sanitizedCommentId = commentId ? Number(commentId) : undefined;
      const sanitizedTaskId = taskId ? Number(taskId) : undefined;
      
      const result = await reactionService.toggleReaction(user.id, emoji, sanitizedCommentId, sanitizedTaskId);
      res.json({ success: true, added: !!result, reaction: result });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de reacción inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  // === Users ===
  app.get("/api/users", authenticate, async (req, res) => {
    try {
      const users = MockDatabase.getUsers();
      // Filter out passwords
      const usersWithoutPasswords = users.map((user: any) => {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/users", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Agregar campos faltantes con valores por defecto para el mock database
      const userDataWithDefaults = {
        ...userData,
        customRoleId: null, // Por defecto null para usuarios nuevos
        role: userData.role || "user", // Rol por defecto
        status: userData.status || "active", // Estado por defecto
        avatar: userData.avatar || null, // Avatar por defecto
      };
      
      const user = MockDatabase.createUser(userDataWithDefaults);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === Folders ===
  app.get("/api/folders", authenticate, async (req, res) => {
    try {
      const parentId = req.query.parentId ? Number(req.query.parentId) : null;
      const folders = MockDatabase.getFoldersByParent(parentId);
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Obtener todas las carpetas (para seleccionadores)
  app.get("/api/folders/all", authenticate, async (req, res) => {
    try {
      const folders = MockDatabase.getFolders();
      res.json(folders);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/folders", authenticate, async (req, res) => {
    try {
      // Agregar campos requeridos con valores por defecto
      const folderDataWithDefaults = {
        name: req.body.name,
        path: req.body.path,
        parentId: req.body.parentId || null,
        createdBy: req.body.createdBy || 1, // Default user for demo
        description: req.body.description || "", // Descripción por defecto vacía
      };
      
      const folder = MockDatabase.createFolder(folderDataWithDefaults);
      res.status(201).json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/folders/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const folderData = req.body;
      
      const updatedFolder = await storage.updateFolder(id, folderData);
      
      if (!updatedFolder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.json(updatedFolder);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/folders/:id", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteFolder(id);
      
      if (!success) {
        return res.status(404).json({ message: "Folder not found" });
      }
      
      res.json({ message: "Folder deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Documents ===

  app.get("/api/documents", authenticate, async (req, res) => {
    try {
      const folderId = req.query.folderId ? Number(req.query.folderId) : null;
      const documents = MockDatabase.getDocumentsByFolder(folderId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/documents/search", authenticate, async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Simple search in documents by name and description
      const allDocuments = MockDatabase.getDocuments();
      const documents = allDocuments.filter(doc => 
        doc.name.toLowerCase().includes(query.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(query.toLowerCase()))
      );
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/documents", authenticate, async (req, res) => {
    try {
      // Extraer la extensión original si existe en el nombre del archivo
      let originalExtension = null;
      const fileName = req.body.name;
      
      if (fileName) {
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          // Extraer la extensión incluyendo el punto (.dwg, .rvt, etc.)
          originalExtension = fileName.substring(lastDotIndex);
          
          // Verificar si es un archivo de Autodesk u otro formato especial que debamos preservar
          const autoCadExts = ['.dwg', '.dxf', '.dwf'];
          const revitExts = ['.rvt', '.rfa', '.rte', '.rft'];
          const specialExts = [...autoCadExts, ...revitExts, '.skp', '.3ds', '.max'];
          
          // Si es una extensión especial, guardarla; de lo contrario, dejarla como null
          if (!specialExts.includes(originalExtension.toLowerCase())) {
            originalExtension = null;
          }
        }
      }
      
      const documentData = {
        ...req.body,
        originalExtension,
        uploadedBy: 1, // Demo user
        uploadedAt: new Date()
      };
      
      const document = MockDatabase.createDocument(documentData);
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid document data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/documents/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const allDocuments = MockDatabase.getDocuments();
      const document = allDocuments.find(doc => doc.id === id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint para descargar documentos
  app.get("/api/documents/:id/download", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const id = Number(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }
      
      // Construir la ruta completa al archivo
      const fullPath = path.join(process.cwd(), 'public', document.path);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(fullPath)) {
        console.error(`Archivo no encontrado en: ${fullPath}`);
        return res.status(404).json({ message: "Archivo no encontrado en el servidor" });
      }
      
      // Determinar el nombre de archivo para la descarga
      let downloadName = document.name;
      
      // Si existe una extensión original, asegurarse de que el archivo se descargue con ella
      if (document.originalExtension) {
        // Si el nombre ya incluye la extensión, no la duplicamos
        if (!downloadName.toLowerCase().endsWith(document.originalExtension.toLowerCase())) {
          downloadName = `${downloadName}${document.originalExtension}`;
        }
      } else if (document.type && !downloadName.toLowerCase().includes(`.${document.type.toLowerCase()}`)) {
        // Usar el tipo como extensión si no hay una extensión original
        downloadName = `${downloadName}.${document.type}`;
      }
      
      // Establecer headers para la descarga
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Enviar el archivo como respuesta
      const fileStream = fs.createReadStream(fullPath);
      fileStream.on('error', (err) => {
        console.error(`Error al leer el archivo ${fullPath}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error al descargar el archivo" });
        }
      });
      
      fileStream.pipe(res);
      
      // Log de la actividad (esto se ejecuta antes de que termine la descarga, pero es aceptable)
      storage.logDocumentActivity({
        documentId: document.id,
        userId: user.id,
        action: "download",
        details: `Document ${document.name} downloaded`
      }).catch(error => {
        console.error("Error logging document activity:", error);
      });
    } catch (error) {
      console.error("Error during download:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/documents/:id", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const id = Number(req.params.id);
      const documentData = req.body;
      
      const updatedDocument = await storage.updateDocument(id, documentData);
      
      if (!updatedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Log the activity
      await storage.logDocumentActivity({
        documentId: updatedDocument.id,
        userId: user.id,
        action: "edit",
        details: `Document ${updatedDocument.name} edited`
      });
      
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/documents/:id", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const id = Number(req.params.id);
      const documentData = req.body;
      
      // Obtener documento actual para comparación
      const currentDocument = await storage.getDocument(id);
      if (!currentDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Actualizar documento
      const updatedDocument = await storage.updateDocument(id, documentData);
      
      if (!updatedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // No registramos la actividad aquí porque el cliente lo hace específicamente para
      // renombrar y mover acciones con mensajes más específicos
      
      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/documents/:id", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      const id = Number(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const success = await storage.deleteDocument(id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete document" });
      }
      
      // Log the activity
      await storage.logDocumentActivity({
        documentId: id,
        userId: user.id,
        action: "delete",
        details: `Document ${document.name} deleted`
      });
      
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Endpoint para preparar la carga de archivos
  app.post("/api/documents/prepare-upload", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { filename, contentType, size, documentId, version } = req.body;
      
      if (!filename) {
        return res.status(400).json({ message: "El nombre del archivo es requerido" });
      }
      
      // Generar un nombre de archivo único
      const timestamp = Date.now();
      const fileExt = filename.includes('.') ? filename.split('.').pop() : '';
      let uniqueFilename;
      
      if (documentId && version) {
        // Si es una nueva versión de un documento existente
        uniqueFilename = `document_${documentId}_v${version}_${timestamp}.${fileExt}`;
      } else {
        // Si es un documento nuevo
        uniqueFilename = `document_new_${timestamp}.${fileExt}`;
      }
      
      const filePath = `/uploads/documents/${uniqueFilename}`;
      
      // En una implementación real, aquí es donde generaríamos una URL firmada 
      // para S3, Firebase Storage, etc. Por ahora simulamos el proceso.
      const uploadUrl = `/api/upload-file?path=${filePath}`;
      
      res.json({
        uploadUrl,
        filePath
      });
    } catch (error) {
      console.error("Error preparando carga:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para manejar la carga directa del archivo
  app.put("/api/upload-file", authenticate, async (req, res) => {
    try {
      const { path: filePath } = req.query;
      
      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ message: "Se requiere una ruta de archivo válida" });
      }
      
      // Crear el directorio si no existe
      const fullPath = path.join(process.cwd(), 'public', filePath);
      const fileDir = path.dirname(fullPath);
      
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      // Crear una secuencia de escritura y guardar el archivo
      const writeStream = fs.createWriteStream(fullPath);
      
      // Manejar errores en la escritura
      writeStream.on('error', (err) => {
        console.error(`Error escribiendo archivo en ${fullPath}:`, err);
        res.status(500).json({ message: "Error al guardar el archivo" });
      });
      
      // Manejar la finalización exitosa
      writeStream.on('finish', () => {
        res.status(200).json({ 
          message: "Archivo cargado exitosamente",
          path: filePath
        });
      });
      
      // Pasar datos desde la solicitud a la secuencia de escritura
      req.pipe(writeStream);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === Document Versions ===
  app.get("/api/documents/:id/versions", authenticate, async (req, res) => {
    try {
      const documentId = Number(req.params.id);
      const versions = await storage.getDocumentVersions(documentId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/documents/:id/versions", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const documentId = Number(req.params.id);
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const versionData = insertDocumentVersionSchema.parse({
        ...req.body,
        documentId,
        version: document.currentVersion + 1,
        createdBy: user.id
      });
      
      const version = await storage.createDocumentVersion(versionData);
      
      // Log the activity
      await storage.logDocumentActivity({
        documentId,
        userId: user.id,
        action: "new_version",
        details: `New version ${version.version} created for document ${document.name}`
      });
      
      res.status(201).json(version);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid version data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // === Document Activity ===
  app.get("/api/activity", authenticate, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const activities = await storage.getRecentActivity(limit);
      
      // Enrich with user and document information
      const enrichedActivities = await Promise.all(activities.map(async (activity) => {
        // Utilizamos operador de encadenamiento opcional (?) para manejar valores nulos
        const user = activity.userId ? await storage.getUser(activity.userId) : null;
        const document = activity.documentId ? await storage.getDocument(activity.documentId) : null;
        
        return {
          ...activity,
          user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null,
          document: document ? { id: document.id, name: document.name, type: document.type } : null
        };
      }));
      
      res.json(enrichedActivities);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/documents/:id/activity", authenticate, async (req, res) => {
    try {
      const documentId = Number(req.params.id);
      const activities = await storage.getDocumentActivity(documentId);
      
      // Enrich with user information
      const enrichedActivities = await Promise.all(activities.map(async (activity) => {
        const user = activity.userId ? await storage.getUser(activity.userId) : null;
        
        return {
          ...activity,
          user: user ? { id: user.id, name: user.name, avatar: user.avatar } : null
        };
      }));
      
      res.json(enrichedActivities);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/documents/:id/activity", authenticate, async (req, res) => {
    try {
      const documentId = Number(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const activityData = {
        ...req.body,
        documentId,
        timestamp: new Date()
      };
      
      const activity = await storage.logDocumentActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      console.error("Error logging document activity:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Equipment Types ===
  app.get("/api/equipment-types", authenticate, async (req, res) => {
    try {
      const types: any[] = [];
      res.json(types);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/equipment/types", authenticate, async (req, res) => {
    try {
      const types: any[] = [];
      res.json(types);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/equipment-types", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const mockType = {
        id: Date.now(),
        name: req.body.name || "Demo Equipment Type",
        description: req.body.description || "Demo description",
        createdAt: new Date().toISOString()
      };
      res.status(201).json(mockType);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/equipment-types/:id", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      res.json({ success: true, message: "Tipo de equipo eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === Equipment ===
  // Configuración de multer para subida de imágenes
  const equipmentStorageConfig = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'equipment');
      
      // Crear directorio si no existe
      if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Crear nombre único usando timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'equipment-' + uniqueSuffix + ext);
    }
  });
  
  const equipmentUpload = multer({ 
    storage: equipmentStorageConfig,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB límite
    },
    fileFilter: (req, file, cb) => {
      // Aceptar solo imágenes
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    }
  });
  
  app.post("/api/equipment/upload-image", authenticate, checkRole(["admin", "technician"]), equipmentUpload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se ha subido ningún archivo" });
      }
      
      // Construir URL relativa al archivo
      const relativePath = `/uploads/equipment/${path.basename(req.file.path)}`;
      
      // Devolver información del archivo
      res.json({
        url: relativePath,
        filename: path.basename(req.file.path),
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      console.error("Error al subir imagen:", error);
      res.status(500).json({ message: "Error al procesar la imagen" });
    }
  });
  
  app.get("/api/equipment", authenticate, async (req, res) => {
    try {
      const equipment: any[] = [];
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/equipment/search", authenticate, async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const equipment: any[] = [];
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/equipment", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const equipmentData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipment(equipmentData);
      res.status(201).json(equipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid equipment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/equipment/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const equipment = await storage.getEquipment(id);
      
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      
      // Enrich with type information
      const type = equipment.typeId ? await storage.getEquipmentType(equipment.typeId) : null;
      
      res.json({
        ...equipment,
        type: type ? { id: type.id, name: type.name } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/equipment/:id", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const equipmentData = req.body;
      
      const updatedEquipment = await storage.updateEquipment(id, equipmentData);
      
      if (!updatedEquipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      
      res.json(updatedEquipment);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/equipment/:id", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteEquipment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      
      res.json({ message: "Equipment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Maintenance Schedules ===
  app.get("/api/maintenance-schedules", authenticate, async (req, res) => {
    try {
      const equipmentId = req.query.equipmentId ? Number(req.query.equipmentId) : undefined;
      const schedules = await storage.getMaintenanceSchedules(equipmentId);
      
      // Enrich with equipment information
      const enrichedSchedules = await Promise.all(schedules.map(async (schedule) => {
        const equipment = await storage.getEquipment(schedule.equipmentId);
        
        return {
          ...schedule,
          equipment: equipment ? { 
            id: equipment.id, 
            name: equipment.name, 
            code: equipment.code,
            status: equipment.status 
          } : null
        };
      }));
      
      res.json(enrichedSchedules);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/maintenance-schedules/upcoming", authenticate, async (req, res) => {
    try {
      const days = req.query.days ? Number(req.query.days) : 7;
      const schedules = await storage.getUpcomingMaintenances(days);
      
      // Enrich with equipment information
      const enrichedSchedules = await Promise.all(schedules.map(async (schedule) => {
        const equipment = await storage.getEquipment(schedule.equipmentId);
        
        return {
          ...schedule,
          equipment: equipment ? { 
            id: equipment.id, 
            name: equipment.name, 
            code: equipment.code,
            status: equipment.status 
          } : null
        };
      }));
      
      res.json(enrichedSchedules);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/maintenance-schedules", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const scheduleData = insertMaintenanceScheduleSchema.parse(req.body);
      const schedule = await storage.createMaintenanceSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Ruta para programar mantenimiento con notificaciones por correo electrónico
  app.post("/api/maintenance/schedule", authenticate, async (req, res) => {
    try {
      // Validar datos recibidos
      const { type, equipmentId, description, nextDate, frequency, reminderDays, sendEmail } = req.body;

      if (!type || !equipmentId || !nextDate) {
        return res.status(400).json({ 
          message: "Faltan datos obligatorios (tipo, equipo y fecha)"
        });
      }

      // Verificar que el equipo existe
      const equipment = await storage.getEquipment(equipmentId);
      if (!equipment) {
        return res.status(404).json({
          message: `Equipo con ID ${equipmentId} no encontrado`
        });
      }

      // Crear programación de mantenimiento
      const maintenanceData = {
        equipmentId,
        type,
        nextDate: new Date(nextDate),
        description: description || null,
        frequency: frequency || null,
        reminderDays: reminderDays || null,
      };

      // Validar datos con schema
      const validatedData = insertMaintenanceScheduleSchema.parse(maintenanceData);
      const newSchedule = await storage.createMaintenanceSchedule(validatedData);
      
      // Importar servicio de notificaciones
      const { notificationService } = await import('./services/notificationService');

      // Enviar notificación por correo si se solicitó
      let emailSent = false;
      if (sendEmail) {
        emailSent = await notificationService.sendMaintenanceNotification(newSchedule.id);
              }

      res.status(201).json({
        ...newSchedule,
        emailSent,
      });
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de mantenimiento inválidos", errors: error.errors });
      } else {
        res.status(500).json({
          message: "Error al programar mantenimiento",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  });

  app.put("/api/maintenance-schedules/:id", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scheduleData = req.body;
      
      const updatedSchedule = await storage.updateMaintenanceSchedule(id, scheduleData);
      
      if (!updatedSchedule) {
        return res.status(404).json({ message: "Maintenance schedule not found" });
      }
      
      res.json(updatedSchedule);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/maintenance-schedules/:id", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteMaintenanceSchedule(id);
      
      if (!success) {
        return res.status(404).json({ message: "Maintenance schedule not found" });
      }
      
      res.json({ message: "Maintenance schedule deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Maintenance Interventions ===
  app.get("/api/maintenance-interventions", authenticate, async (req, res) => {
    try {
      // Extraer parámetros de consulta para filtros
      const params = {
        equipmentId: req.query.equipmentId ? Number(req.query.equipmentId) : undefined,
        type: req.query.type as string || undefined,
        equipmentTypeId: req.query.equipmentTypeId ? Number(req.query.equipmentTypeId) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };
      
      const interventions = await storage.getMaintenanceInterventions(params);
      
      // Enrich with equipment and technician information
      const enrichedInterventions = await Promise.all(interventions.map(async (intervention) => {
        const equipment = await storage.getEquipment(intervention.equipmentId);
        const technician = intervention.technician ? await storage.getUser(intervention.technician) : null;
        
        return {
          ...intervention,
          equipment: equipment ? { 
            id: equipment.id, 
            name: equipment.name, 
            code: equipment.code,
            status: equipment.status,
            typeId: equipment.typeId
          } : null,
          technicianData: technician ? { 
            id: technician.id, 
            name: technician.name,
            avatar: technician.avatar 
          } : null
        };
      }));
      
      res.json(enrichedInterventions);
    } catch (error) {
      console.error("Error fetching maintenance interventions:", error);
      res.status(500).json({ message: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/maintenance-interventions/recent", authenticate, async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const interventions = await storage.getRecentInterventions(limit);
      
      // Enrich with equipment and technician information
      const enrichedInterventions = await Promise.all(interventions.map(async (intervention) => {
        const equipment = await storage.getEquipment(intervention.equipmentId);
        const technician = intervention.technician ? await storage.getUser(intervention.technician) : null;
        
        return {
          ...intervention,
          equipment: equipment ? { 
            id: equipment.id, 
            name: equipment.name, 
            code: equipment.code,
            status: equipment.status 
          } : null,
          technicianData: technician ? { 
            id: technician.id, 
            name: technician.name,
            avatar: technician.avatar 
          } : null
        };
      }));
      
      res.json(enrichedInterventions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Obtener intervenciones pasadas (más de 2 semanas)
  app.get("/api/maintenance-interventions/past", authenticate, async (req, res) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
      
      const interventions = await storage.getPastInterventions(page, pageSize);
      
      // Enrich with equipment and technician information
      const enrichedInterventions = await Promise.all(interventions.map(async (intervention) => {
        const equipment = await storage.getEquipment(intervention.equipmentId);
        const technician = intervention.technician ? await storage.getUser(intervention.technician) : null;
        
        return {
          ...intervention,
          equipment: equipment ? { 
            id: equipment.id, 
            name: equipment.name, 
            code: equipment.code,
            status: equipment.status 
          } : null,
          technicianData: technician ? { 
            id: technician.id, 
            name: technician.name,
            avatar: technician.avatar 
          } : null
        };
      }));
      
      res.json(enrichedInterventions);
    } catch (error) {
      console.error("Error al obtener intervenciones pasadas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/maintenance-interventions", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const user = req.user as Express.User;
      const interventionData = insertMaintenanceInterventionSchema.parse({
        ...req.body,
        technician: user.id
      });
      
      const intervention = await storage.createMaintenanceIntervention(interventionData);
      
      // Update equipment status if needed
      if (interventionData.status === "in_progress") {
        await storage.updateEquipment(interventionData.equipmentId, { status: "maintenance" });
      } else if (interventionData.status === "completed" && interventionData.endDate) {
        await storage.updateEquipment(interventionData.equipmentId, { status: "operational" });
      }
      
      res.status(201).json(intervention);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid intervention data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/maintenance-interventions/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const intervention = await storage.getMaintenanceIntervention(id);
      
      if (!intervention) {
        return res.status(404).json({ message: "Maintenance intervention not found" });
      }
      
      // Enrich with equipment and technician information
      const equipment = await storage.getEquipment(intervention.equipmentId);
      const technician = intervention.technician ? await storage.getUser(intervention.technician) : null;
      
      // Get attachments
      const attachments = await storage.getMaintenanceAttachments(id);
      
      res.json({
        ...intervention,
        equipment: equipment ? { 
          id: equipment.id, 
          name: equipment.name, 
          code: equipment.code,
          status: equipment.status 
        } : null,
        technicianData: technician ? { 
          id: technician.id, 
          name: technician.name,
          avatar: technician.avatar 
        } : null,
        attachments
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/maintenance-interventions/:id", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const interventionData = req.body;
      
      const updatedIntervention = await storage.updateMaintenanceIntervention(id, interventionData);
      
      if (!updatedIntervention) {
        return res.status(404).json({ message: "Maintenance intervention not found" });
      }
      
      // Update equipment status if needed
      if (interventionData.status === "in_progress") {
        await storage.updateEquipment(updatedIntervention.equipmentId, { status: "maintenance" });
      } else if (interventionData.status === "completed" && interventionData.endDate) {
        await storage.updateEquipment(updatedIntervention.equipmentId, { status: "operational" });
      }
      
      res.json(updatedIntervention);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Maintenance Attachments ===
  app.get("/api/maintenance-interventions/:id/attachments", authenticate, async (req, res) => {
    try {
      const interventionId = Number(req.params.id);
      const attachments = await storage.getMaintenanceAttachments(interventionId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/maintenance-interventions/:id/attachments", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const interventionId = Number(req.params.id);
      
      const intervention = await storage.getMaintenanceIntervention(interventionId);
      if (!intervention) {
        return res.status(404).json({ message: "Maintenance intervention not found" });
      }
      
      const user = req.user as Express.User;
      const attachmentData = insertMaintenanceAttachmentSchema.parse({
        ...req.body,
        interventionId,
        uploadedBy: user.id
      });
      
      const attachment = await storage.createMaintenanceAttachment(attachmentData);
      res.status(201).json(attachment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid attachment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/maintenance-attachments/:id", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteMaintenanceAttachment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Maintenance attachment not found" });
      }
      
      res.json({ message: "Maintenance attachment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === File Upload Endpoints ===
  // Endpoint para cargar archivos de documentos
  app.post("/api/documents/upload", authenticate, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se ha enviado ningún archivo" });
      }

      const user = req.user as Express.User;
      
      // Obtener datos del archivo cargado
      const fileInfo = {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      };

      // Extraer la extensión original del archivo
      const ext = path.extname(req.file.originalname);
      let originalExtension = null;
      
      // Verificar si es un archivo de Autodesk u otro formato especial que debamos preservar
      const autoCadExts = ['.dwg', '.dxf', '.dwf'];
      const revitExts = ['.rvt', '.rfa', '.rte', '.rft'];
      const specialExts = [...autoCadExts, ...revitExts, '.skp', '.3ds', '.max'];
      
      // Si es una extensión especial, guardarla
      if (specialExts.includes(ext.toLowerCase())) {
        originalExtension = ext;
      }

      // Determinar el tipo de documento basado en la extensión
      let type = 'unknown';
      if (req.file.mimetype.startsWith('image/')) {
        type = 'image';
      } else if (['.pdf'].includes(ext.toLowerCase())) {
        type = 'pdf';
      } else if (['.doc', '.docx', '.odt'].includes(ext.toLowerCase())) {
        type = 'word';
      } else if (['.xls', '.xlsx', '.ods'].includes(ext.toLowerCase())) {
        type = 'excel';
      } else if (['.ppt', '.pptx', '.odp'].includes(ext.toLowerCase())) {
        type = 'powerpoint';
      } else if (autoCadExts.includes(ext.toLowerCase())) {
        type = 'autocad';
      } else if (revitExts.includes(ext.toLowerCase())) {
        type = 'revit';
      } else if (['.txt', '.md'].includes(ext.toLowerCase())) {
        type = 'text';
      }
      
      // Crear un documento en la base de datos con la información del archivo
      const documentData = {
        name: req.file.originalname, // Usar el nombre original del archivo
        description: req.body.description || '',
        type,
        path: req.file.path,
        size: req.file.size,
        folderId: req.body.folderId ? Number(req.body.folderId) : null,
        originalExtension,
        createdBy: user.id,
        status: 'active'
      };
      
      const document = await storage.createDocument(documentData);
      
      // Registrar la actividad
      await storage.logDocumentActivity({
        documentId: document.id,
        userId: user.id,
        action: "upload",
        details: `Document ${document.name} uploaded`
      });
      
      res.status(201).json({ 
        ...document, 
        fileInfo
      });
    } catch (error) {
      console.error("Error durante la carga de archivo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Nota: la ruta para carga de imágenes de equipos está definida arriba
  // usando equipmentUpload.single('image')

  // Endpoint genérico para la carga de archivos
  app.post("/api/upload", authenticate, upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se ha enviado ningún archivo" });
      }

      // Retornar la información del archivo cargado
      res.status(201).json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        url: `/uploads/${req.file.filename}` // URL relativa para acceder al archivo
      });
    } catch (error) {
      console.error("Error durante la carga de archivo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === IoT Integration for Predictive Maintenance ===

  // === IoT Devices ===
  app.get("/api/iot-devices", authenticate, async (req, res) => {
    try {
      const devices = await storage.getIotDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/iot-devices/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const device = await storage.getIotDevice(id);
      
      if (!device) {
        return res.status(404).json({ message: "Dispositivo IoT no encontrado" });
      }
      
      res.json(device);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/iot-devices", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const deviceData = insertIotDeviceSchema.parse(req.body);
      
      // Generar una API key única para el dispositivo si no se proporciona una
      if (!deviceData.apiKey) {
        const crypto = require('crypto');
        deviceData.apiKey = crypto.randomBytes(20).toString('hex');
      }
      
      const device = await storage.createIotDevice(deviceData);
      res.status(201).json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de dispositivo inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  app.put("/api/iot-devices/:id", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deviceData = req.body;
      
      const updatedDevice = await storage.updateIotDevice(id, deviceData);
      
      if (!updatedDevice) {
        return res.status(404).json({ message: "Dispositivo IoT no encontrado" });
      }
      
      res.json(updatedDevice);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/iot-devices/:id", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteIotDevice(id);
      
      if (!success) {
        return res.status(404).json({ message: "Dispositivo IoT no encontrado" });
      }
      
      res.json({ message: "Dispositivo IoT eliminado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === IoT Sensors ===
  app.get("/api/iot-sensors", authenticate, async (req, res) => {
    try {
      const equipmentId = req.query.equipmentId ? Number(req.query.equipmentId) : undefined;
      const sensors = await storage.getIotSensors(equipmentId);
      res.json(sensors);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/iot-sensors/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const sensor = await storage.getIotSensor(id);
      
      if (!sensor) {
        return res.status(404).json({ message: "Sensor IoT no encontrado" });
      }
      
      res.json(sensor);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/iot-sensors", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const sensorData = insertIotSensorSchema.parse(req.body);
      const sensor = await storage.createIotSensor(sensorData);
      res.status(201).json(sensor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de sensor inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  app.put("/api/iot-sensors/:id", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const sensorData = req.body;
      
      const updatedSensor = await storage.updateIotSensor(id, sensorData);
      
      if (!updatedSensor) {
        return res.status(404).json({ message: "Sensor IoT no encontrado" });
      }
      
      res.json(updatedSensor);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/iot-sensors/:id", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteIotSensor(id);
      
      if (!success) {
        return res.status(404).json({ message: "Sensor IoT no encontrado" });
      }
      
      res.json({ message: "Sensor IoT eliminado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === Sensor Readings ===
  app.get("/api/sensor-readings", authenticate, async (req, res) => {
    try {
      const sensorId = req.query.sensorId ? Number(req.query.sensorId) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 100; // Default limit
      
      const readings = await storage.getSensorReadings(sensorId, startDate, endDate, limit);
      res.json(readings);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Endpoint público para recibir lecturas de sensores (usado por los dispositivos IoT)
  app.post("/api/sensor-readings", async (req, res) => {
    try {
      // Validación de autenticación de dispositivo
      const apiKey = req.headers['x-api-key'] as string;
      if (!apiKey) {
        return res.status(401).json({ message: "Se requiere API key" });
      }
      
      // Verificar si la API key corresponde a un dispositivo registrado
      const device = await storage.getIotDeviceByApiKey(apiKey);
      if (!device) {
        return res.status(401).json({ message: "API key inválida" });
      }
      
      // Actualizar último contacto del dispositivo
      await storage.updateIotDevice(device.id, { lastCommunication: new Date() });
      
      // Procesar lecturas de sensores (puede ser una sola o múltiples)
      const readings = Array.isArray(req.body) ? req.body : [req.body];
      const results = [];
      
      for (const reading of readings) {
        // Validar el formato de la lectura
        const readingData = insertSensorReadingSchema.parse(reading);
        
        // Obtener el sensor por su ID
        const sensor = await storage.getIotSensor(readingData.sensorId);
        if (!sensor) {
          results.push({ success: false, message: `Sensor ${readingData.sensorId} no encontrado` });
          continue;
        }
        
        // Determinar el estado de la lectura basado en los umbrales del sensor
        if (!readingData.status) {
          let status = "normal";
          const value = Number(readingData.value);
          
          if (sensor.criticalMinThreshold !== null && value <= Number(sensor.criticalMinThreshold) ||
              sensor.criticalMaxThreshold !== null && value >= Number(sensor.criticalMaxThreshold)) {
            status = "critical";
          } else if (sensor.minThreshold !== null && value <= Number(sensor.minThreshold) ||
                     sensor.maxThreshold !== null && value >= Number(sensor.maxThreshold)) {
            status = "warning";
          }
          
          readingData.status = status;
        }
        
        // Guardar la lectura en la base de datos
        const savedReading = await storage.createSensorReading(readingData);
        
        // Actualizar último contacto del sensor
        await storage.updateIotSensor(sensor.id, { lastCommunication: new Date() });
        
        // Crear alertas si es necesario
        if (readingData.status === "warning" || readingData.status === "critical") {
          // Encontrar técnicos asignados al equipo o administradores
          const users = await storage.getUsersByRole(["admin", "technician"]);
          
          for (const user of users) {
            const notificationData = {
              equipmentId: sensor.equipmentId,
              sensorId: sensor.id,
              readingId: savedReading.id,
              title: `Alerta de sensor: ${sensor.name}`,
              message: `Lectura ${readingData.status === "critical" ? "crítica" : "de advertencia"} detectada: ${readingData.value} ${sensor.units}`,
              severity: readingData.status,
              recipientId: user.id,
              sendEmail: readingData.status === "critical", // Enviar correo solo para alertas críticas
              sendSms: readingData.status === "critical", // Enviar SMS solo para alertas críticas
            };
            
            await storage.createAlertNotification(notificationData);
          }
        }
        
        results.push({ success: true, readingId: savedReading.id });
      }
      
      res.status(201).json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de lectura inválidos", errors: error.errors });
      } else {
        console.error("Error al procesar lecturas de sensores:", error);
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  // === Predictive Maintenance ===
  app.get("/api/maintenance-predictions", authenticate, async (req, res) => {
    try {
      const equipmentId = req.query.equipmentId ? Number(req.query.equipmentId) : undefined;
      const status = req.query.status as string || undefined;
      const predictions = await storage.getMaintenancePredictions(equipmentId, status);
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/maintenance-predictions/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const prediction = await storage.getMaintenancePrediction(id);
      
      if (!prediction) {
        return res.status(404).json({ message: "Predicción de mantenimiento no encontrada" });
      }
      
      // Obtener también las evidencias relacionadas con esta predicción
      const evidence = await storage.getPredictionEvidence(id);
      
      res.json({ ...prediction, evidence });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/maintenance-predictions", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const predictionData = insertMaintenancePredictionSchema.parse(req.body);
      const prediction = await storage.createMaintenancePrediction(predictionData);
      
      // Si hay evidencias incluidas, crearlas también
      if (req.body.evidence && Array.isArray(req.body.evidence)) {
        for (const item of req.body.evidence) {
          const evidenceData = insertPredictionEvidenceSchema.parse({
            ...item,
            predictionId: prediction.id
          });
          await storage.createPredictionEvidence(evidenceData);
        }
      }
      
      // Crear una notificación para los usuarios relevantes
      const users = await storage.getUsersByRole(["admin", "technician"]);
      for (const user of users) {
        const notificationData = {
          predictionId: prediction.id,
          equipmentId: predictionData.equipmentId,
          title: "Nueva predicción de mantenimiento",
          message: `Se ha generado una nueva predicción de mantenimiento para el equipo #${predictionData.equipmentId}`,
          severity: Number(predictionData.confidence) > 80 ? "warning" : "info",
          recipientId: user.id,
        };
        
        await storage.createAlertNotification(notificationData);
      }
      
      res.status(201).json(prediction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de predicción inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  app.put("/api/maintenance-predictions/:id", authenticate, checkRole(["admin", "technician"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = req.user as Express.User;
      
      // Si se está cambiando el estado a "acknowledged" o "resolved", agregar información del usuario
      if (req.body.status === "acknowledged" && !req.body.acknowledgedBy) {
        req.body.acknowledgedBy = user.id;
        req.body.acknowledgedAt = new Date();
      } else if (req.body.status === "resolved" && !req.body.resolvedBy) {
        req.body.resolvedBy = user.id;
        req.body.resolvedAt = new Date();
      }
      
      const updatedPrediction = await storage.updateMaintenancePrediction(id, req.body);
      
      if (!updatedPrediction) {
        return res.status(404).json({ message: "Predicción de mantenimiento no encontrada" });
      }
      
      res.json(updatedPrediction);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === Alert Notifications ===
  app.get("/api/alert-notifications", authenticate, async (req, res) => {
    try {
      const userId = (req.user as Express.User).id;
      const status = req.query.status as string || undefined;
      const notifications = await storage.getAlertNotifications(userId, status);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/alert-notifications/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = (req.user as Express.User).id;
      
      const notification = await storage.getAlertNotification(id);
      if (!notification) {
        return res.status(404).json({ message: "Notificación no encontrada" });
      }
      
      // Verificar que la notificación pertenece al usuario actual
      if (notification.recipientId !== userId) {
        return res.status(403).json({ message: "No autorizado para modificar esta notificación" });
      }
      
      // Marcar como leída si se solicita
      if (req.body.status === "read" && notification.status === "unread") {
        req.body.readAt = new Date();
      }
      
      const updatedNotification = await storage.updateAlertNotification(id, req.body);
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/alert-notifications/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = (req.user as Express.User).id;
      
      const notification = await storage.getAlertNotification(id);
      if (!notification) {
        return res.status(404).json({ message: "Notificación no encontrada" });
      }
      
      // Verificar que la notificación pertenece al usuario actual
      if (notification.recipientId !== userId) {
        return res.status(403).json({ message: "No autorizado para eliminar esta notificación" });
      }
      
      const success = await storage.deleteAlertNotification(id);
      res.json({ message: "Notificación eliminada exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Create the HTTP server
  // === Sistema de Reacciones ===

  // Añadir reacción
  app.post("/api/reactions", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const reactionData = insertReactionSchema.parse({
        ...req.body,
        userId: user.id
      });

      const reaction = await reactionService.addReaction(reactionData);
      res.status(201).json(reaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de reacción inválidos", errors: error.errors });
      } else {
        console.error("Error al añadir reacción:", error);
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  // Alternar reacción (añadir si no existe, eliminar si existe)
  app.post("/api/reactions/toggle", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { emoji, commentId, taskId } = req.body;

      if (!emoji) {
        return res.status(400).json({ message: "Se requiere un emoji" });
      }

      if (!commentId && !taskId) {
        return res.status(400).json({ message: "Se requiere un commentId o taskId" });
      }

      const result = await reactionService.toggleReaction(user.id, emoji, commentId, taskId);
      res.json({ success: true, reaction: result });
    } catch (error) {
      console.error("Error al alternar reacción:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener reacciones para un comentario
  app.get("/api/reactions/comments/:commentId", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const commentId = Number(req.params.commentId);

      const reactions = await reactionService.getFormattedReactions(user.id, commentId);
      res.json(reactions);
    } catch (error) {
      console.error("Error al obtener reacciones:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener reacciones para una tarea
  app.get("/api/reactions/tasks/:taskId", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const taskId = Number(req.params.taskId);

      const reactions = await reactionService.getFormattedReactions(user.id, undefined, taskId);
      res.json(reactions);
    } catch (error) {
      console.error("Error al obtener reacciones:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Registrar las rutas del módulo de Proyectos (Obras)
  registerProjectRoutes(app);
  
  // Registrar las rutas de maquinaria para proyectos
  registerProjectEquipmentRoutes(app);
  
  // Registrar las rutas de roles y permisos
  registerRolesRoutes(app);
  
  // Registrar las rutas de documentos con restricciones
  registerDocumentRoutes(app);
  
  // Endpoint para subir imágenes de proyectos
  const projectsUpload = multer({ storage: multerStorage });
  app.post("/api/projects/upload-image", authenticate, projectsUpload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se ha enviado ninguna imagen" });
      }
      
      // Construimos la URL relativa para acceder a la imagen
      const relativePath = `/uploads/projects/${path.basename(req.file.path)}`;
      
      // Retornar la información del archivo cargado
      res.status(201).json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        url: relativePath // URL relativa para acceder al archivo
      });
    } catch (error) {
      console.error("Error durante la carga de imagen:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoints de mantenimiento para mostrar próximos mantenimientos
  app.get("/api/maintenance-schedules/upcoming", authenticate, async (req, res) => {
    try {
      const days = req.query.days ? Number(req.query.days) : 7; // Por defecto, próximos 7 días
      
      // Obtener todas las programaciones de mantenimiento
      const allSchedules = await storage.getMaintenanceSchedules();
      
      // Calcular la fecha límite (hoy + días)
      const today = new Date();
      const limitDate = new Date(today);
      limitDate.setDate(limitDate.getDate() + days);
      
      // Filtrar por programaciones que tienen fecha próxima dentro del rango
      const upcomingSchedules = allSchedules.filter(schedule => {
        const scheduleDate = new Date(schedule.nextDate);
        return scheduleDate >= today && scheduleDate <= limitDate;
      });
      
      // Enriquecer con información del equipo
      const enrichedSchedules = await Promise.all(upcomingSchedules.map(async (schedule) => {
        const equipment = await storage.getEquipment(schedule.equipmentId);
        return {
          ...schedule,
          equipment: equipment ? {
            id: equipment.id,
            name: equipment.name,
            code: equipment.code,
            status: equipment.status
          } : null
        };
      }));
      
      // Ordenar por fecha más próxima primero
      enrichedSchedules.sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
      
      res.json(enrichedSchedules);
    } catch (error) {
      console.error("Error al obtener próximos mantenimientos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Registrar las rutas de permisos de carpetas
  app.use("/api", folderPermissionRoutes);
  
  // === Endpoints de administración de usuarios ===
  
  // Obtener lista de todos los usuarios (solo para administradores)
  app.get("/api/users", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Eliminamos las contraseñas por seguridad
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app.put("/api/users/:id/role", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { role } = req.body;
      
            
      if (!role) {
        return res.status(400).json({ message: "Se requiere especificar el rol" });
      }
      
      // Validar que el rol sea válido
      const validRoles = ["admin", "user", "technician", "manager"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Rol no válido" });
      }
      
      // Para demo: Usar mock database
      const updatedUser = MockDatabase.updateUserRole(userId, role);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Eliminamos el password de la respuesta por seguridad
      const { password, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error actualizando rol de usuario:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  app.put("/api/users/:id/status", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { status } = req.body;
      
            
      if (!status) {
        return res.status(400).json({ message: "Se requiere especificar el estado" });
      }
      
      // Validar que el estado sea válido
      const validStatuses = ["active", "disabled", "pending"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Estado no válido" });
      }
      
      // Para demo: Usar mock database
      const updatedUser = MockDatabase.updateUserStatus(userId, status);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      // Eliminamos el password de la respuesta por seguridad
      const { password, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error actualizando estado de usuario:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
