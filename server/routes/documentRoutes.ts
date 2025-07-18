import { Express, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { authenticate } from '../routes';
import { canDeleteDocumentsMiddleware, canDeleteFoldersMiddleware } from './documentPermissionMiddleware';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

// Configuración de almacenamiento para multer
const storageDir = './public/uploads/documents';
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export function registerDocumentRoutes(app: Express) {
  // Endpoint para obtener documentos
  app.get("/api/documents", authenticate, async (req, res) => {
    try {
      const folderId = req.query.folderId ? Number(req.query.folderId) : undefined;
      const documents = await storage.getDocuments(folderId);
      res.json(documents);
    } catch (error) {
      console.error("Error obteniendo documentos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para obtener un documento específico
  app.get("/api/documents/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error obteniendo documento:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para eliminar un documento (solo para admin)
  app.delete("/api/documents/:id", authenticate, canDeleteDocumentsMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }
      
      // Eliminar archivo físico si existe
      if (document.path) {
        const fullPath = path.join(process.cwd(), 'public', document.path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      
      // Eliminar versiones anteriores si existen
      const versions = await storage.getDocumentVersions(id);
      for (const version of versions) {
        if (version.path) {
          const versionPath = path.join(process.cwd(), 'public', version.path);
          if (fs.existsSync(versionPath)) {
            fs.unlinkSync(versionPath);
          }
        }
      }
      
      // Registrar actividad de eliminación
      await storage.logDocumentActivity({
        documentId: id,
        userId: req.user.id,
        action: "delete",
        details: `Documento eliminado por ${req.user.name}`
      });
      
      // Eliminar documento de la base de datos
      const deleted = await storage.deleteDocument(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Error al eliminar el documento" });
      }
      
      res.json({ message: "Documento eliminado correctamente" });
    } catch (error) {
      console.error("Error eliminando documento:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para descargar documentos
  app.get("/api/documents/:id/download", authenticate, async (req, res) => {
    try {
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
      
      // Registrar la descarga en el historial de actividad
      await storage.logDocumentActivity({
        documentId: id,
        userId: req.user.id,
        action: "download",
        details: `Documento descargado por ${req.user.name}`
      });
      
      // Enviar el archivo al cliente
      res.download(fullPath, downloadName);
    } catch (error) {
      console.error("Error descargando documento:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para preparar la carga de archivos
  app.post("/api/documents/prepare-upload", authenticate, async (req, res) => {
    try {
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
  
  // Endpoint para crear un nuevo documento
  app.post("/api/documents", authenticate, async (req, res) => {
    try {
      const { 
        name, 
        path: filePath, 
        type, 
        size, 
        folderId, 
        originalExtension 
      } = req.body;
      
      if (!name || !filePath) {
        return res.status(400).json({ message: "Nombre y ruta del archivo son requeridos" });
      }
      
      // Crear el nuevo documento
      const newDocument = await storage.createDocument({
        name,
        path: filePath,
        type: type || '',
        size: size || 0,
        folderId: folderId ? Number(folderId) : null,
        createdBy: req.user.id,
        originalExtension: originalExtension || null,
        currentVersion: 1
      });
      
      // Crear la primera versión del documento
      await storage.createDocumentVersion({
        documentId: newDocument.id,
        version: 1,
        path: filePath,
        size: size || 0,
        createdBy: req.user.id
      });
      
      // Registrar la actividad
      await storage.logDocumentActivity({
        documentId: newDocument.id,
        userId: req.user.id,
        action: "upload",
        details: `Documento cargado por ${req.user.name}`
      });
      
      res.status(201).json(newDocument);
    } catch (error) {
      console.error("Error creando documento:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para buscar documentos
  app.get("/api/documents/search/:query", authenticate, async (req, res) => {
    try {
      const query = req.params.query;
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "La consulta debe tener al menos 2 caracteres" });
      }
      
      const results = await storage.searchDocuments(query);
      res.json(results);
    } catch (error) {
      console.error("Error buscando documentos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para obtener carpetas
  app.get("/api/folders", authenticate, async (req, res) => {
    try {
      const parentId = req.query.parentId ? Number(req.query.parentId) : undefined;
      const folders = await storage.getFolders(parentId);
      res.json(folders);
    } catch (error) {
      console.error("Error obteniendo carpetas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para obtener una carpeta específica
  app.get("/api/folders/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const folder = await storage.getFolder(id);
      
      if (!folder) {
        return res.status(404).json({ message: "Carpeta no encontrada" });
      }
      
      res.json(folder);
    } catch (error) {
      console.error("Error obteniendo carpeta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para crear una carpeta
  app.post("/api/folders", authenticate, async (req, res) => {
    try {
      const { name, parentId } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "El nombre de la carpeta es requerido" });
      }
      
      // Determinar la ruta de la carpeta
      let path = '';
      if (parentId) {
        const parentFolder = await storage.getFolder(Number(parentId));
        if (parentFolder) {
          path = parentFolder.path ? `${parentFolder.path}/${name}` : name;
        } else {
          return res.status(404).json({ message: "Carpeta padre no encontrada" });
        }
      } else {
        path = name;
      }
      
      // Crear la carpeta
      const newFolder = await storage.createFolder({
        name,
        path,
        parentId: parentId ? Number(parentId) : null,
        createdBy: req.user.id
      });
      
      res.status(201).json(newFolder);
    } catch (error) {
      console.error("Error creando carpeta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para eliminar una carpeta (solo para admin)
  app.delete("/api/folders/:id", authenticate, canDeleteFoldersMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const folder = await storage.getFolder(id);
      
      if (!folder) {
        return res.status(404).json({ message: "Carpeta no encontrada" });
      }
      
      // Verificar si la carpeta tiene documentos
      const documents = await storage.getDocuments(id);
      if (documents.length > 0) {
        // Si hay documentos, eliminarlos si el usuario es administrador
        for (const doc of documents) {
          // Eliminar archivo físico si existe
          if (doc.path) {
            const fullPath = path.join(process.cwd(), 'public', doc.path);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          }
          
          // Eliminar documento de la base de datos
          await storage.deleteDocument(doc.id);
        }
      }
      
      // Verificar si hay subcarpetas y eliminarlas recursivamente
      const subfolders = await storage.getFolders(id);
      for (const subfolder of subfolders) {
        await storage.deleteFolder(subfolder.id);
      }
      
      // Eliminar la carpeta
      const deleted = await storage.deleteFolder(id);
      
      if (!deleted) {
        return res.status(500).json({ message: "Error al eliminar la carpeta" });
      }
      
      res.json({ message: "Carpeta eliminada correctamente" });
    } catch (error) {
      console.error("Error eliminando carpeta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // Endpoint para obtener la ruta completa de una carpeta
  app.get("/api/folders/path/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      // Función recursiva para obtener la ruta completa de carpetas
      async function getFolderPath(folderId, path = []) {
        const folder = await storage.getFolder(folderId);
        if (!folder) return path;
        
        path.unshift(folder);
        
        if (folder.parentId) {
          return getFolderPath(folder.parentId, path);
        }
        
        return path;
      }
      
      const folderPath = await getFolderPath(id);
      res.json(folderPath);
    } catch (error) {
      console.error("Error obteniendo ruta de carpeta:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}