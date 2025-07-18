import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { z } from "zod";
import {
  insertProjectSchema,
  insertProjectManagerSchema,
  insertProjectDocumentSchema,
  insertProjectMemberSchema
} from "@shared/schema";
import { authenticate, checkRole } from "../routes";

export function registerProjectRoutes(app: Express) {
  // Utilizaremos los middlewares del archivo principal
  // definidos en routes.ts para asegurar coherencia

  // === Proyectos (Obras) ===

  // Obtener proyectos según los permisos del usuario
  app.get("/api/projects", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      let projects = [];
      
      // Si es admin, obtiene todos los proyectos
      if (user.role === "admin") {
        projects = await storage.getAllProjects();
      } else {
        // Si no es admin, solo obtiene los proyectos donde está asignado
        projects = await storage.getProjectsByUserId(user.id);
      }
      
      res.json(projects);
    } catch (error) {
      console.error("Error obteniendo proyectos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener un proyecto específico por ID con verificación de permisos
  app.get("/api/projects/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = req.user as Express.User;
      
      // Obtener el proyecto
      const project = await storage.getProject(id);

      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }
      
      // Si el usuario es admin, tiene acceso directo
      if (user.role === "admin") {
        return res.json(project);
      }
      
      // Verificar si el usuario es miembro o gestor del proyecto
      const isManager = await storage.isProjectManager(id, user.id);
      const isMember = await storage.isProjectMember(id, user.id);
      
      if (!isManager && !isMember) {
        return res.status(403).json({ 
          message: "No tienes permiso para acceder a este proyecto",
          projectId: id,
          userId: user.id
        });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error obteniendo proyecto:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Crear un nuevo proyecto
  app.post("/api/projects", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const user = req.user as Express.User;

      // Crear un schema personalizado para validar entrada con conversión de fechas
      const createProjectSchema = z.object({
        name: z.string().min(1),
        location: z.string().min(1),
        status: z.string().default("in-progress"),
        // Acepta tanto date como string y convierte string a date
        startDate: z.union([
          z.date(),
          z.string().transform(val => new Date(val))
        ]),
        // Acepta date, string o null y convierte adecuadamente
        endDate: z.union([
          z.date(),
          z.string().transform(val => new Date(val)),
          z.null()
        ]),
        description: z.string().nullable(),
        budget: z.string().transform(val => {
          // Eliminar comas para que sea compatible con PostgreSQL
          return val ? val.replace(/,/g, '') : null;
        }).nullable(),
        clientName: z.string().nullable(),
        clientContact: z.string().nullable(),
        createdBy: z.number()
      });

      // Crear objeto con valores por defecto y el ID del usuario
      const dataWithDefaults = {
        ...req.body,
        createdBy: user.id,
        status: req.body.status || "in-progress" // Por defecto en progreso
      };

      console.log("Datos recibidos para creación:", dataWithDefaults);

      // Validación de datos con nuestro schema personalizado
      const projectData = createProjectSchema.parse(dataWithDefaults);

      console.log("Datos validados para creación:", projectData);

      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creando proyecto:", error);
      if (error instanceof z.ZodError) {
        const customErrors = error.errors.map(err => ({
          ...err,
          message: err.path[0] === "name" ? "El nombre del proyecto es requerido" :
                   err.path[0] === "location" ? "La ubicación del proyecto es requerida" :
                   err.message
        }));
        res.status(400).json({ message: "Datos de proyecto inválidos", errors: customErrors });
      } else {
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  // Actualizar un proyecto existente
  app.put("/api/projects/:id", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const id = Number(req.params.id);

      // Validar datos con z.object en lugar de insertProjectSchema 
      // para no requerir todos los campos
      const updateProjectSchema = z.object({
        name: z.string().min(1),
        location: z.string().min(1),
        status: z.string().default("in-progress"),
        // Acepta tanto date como string y convierte string a date
        startDate: z.union([
          z.date(),
          z.string().transform(val => new Date(val))
        ]),
        // Acepta date, string o null y convierte adecuadamente
        endDate: z.union([
          z.date(),
          z.string().transform(val => new Date(val)),
          z.null()
        ]),
        description: z.string().nullable(),
        budget: z.string().transform(val => {
          // Eliminar comas para que sea compatible con PostgreSQL
          return val ? val.replace(/,/g, '') : null;
        }).nullable(),
        clientName: z.string().nullable(),
        clientContact: z.string().nullable()
      });

      // Parsear y validar los datos
      const projectData = updateProjectSchema.parse(req.body);

      console.log("Datos validados para actualización:", projectData);

      const updatedProject = await storage.updateProject(id, projectData);

      if (!updatedProject) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      res.json(updatedProject);
    } catch (error) {
      console.error("Error actualizando proyecto:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de proyecto inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  // Eliminar un proyecto
  app.delete("/api/projects/:id", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteProject(id);

      if (!success) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      res.json({ message: "Proyecto eliminado correctamente" });
    } catch (error) {
      console.error("Error eliminando proyecto:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Ruta especial para crear un proyecto de demostración (solo para desarrollo)
  app.post("/api/demo/create-project", async (req, res) => {
    try {
      // Verificar si ya existen proyectos
      const existingProjects = await storage.getAllProjects();

      if (existingProjects && existingProjects.length > 0) {
        return res.json({ 
          message: "Ya existen proyectos en el sistema", 
          projectsCount: existingProjects.length 
        });
      }

      // Crear proyectos de demostración
      const demoProjects = [
        {
          name: "Torre Residencial Norte",
          location: "Av. Principal 123, Ciudad",
          status: "in-progress",
          startDate: new Date("2025-05-01"),
          endDate: new Date("2026-03-01"),
          description: "Edificio residencial de 12 pisos con 48 apartamentos",
          budget: "2500000",
          clientName: "Constructora Moderna",
          clientContact: "contacto@constructoramoderna.com",
          createdBy: 1
        },
        {
          name: "Centro Comercial Plaza Mayor",
          location: "Calle Comercio 45, Zona Sur",
          status: "in-progress",
          startDate: new Date("2025-06-15"),
          endDate: null,
          description: "Centro comercial con 120 locales y 4 plantas",
          budget: "8500000",
          clientName: "Inversiones Retail S.A.",
          clientContact: "info@inversionesretail.com",
          createdBy: 1
        },
        {
          name: "Remodelación Hospital Central",
          location: "Av. Salud 78, Ciudad",
          status: "completed",
          startDate: new Date("2024-12-10"),
          endDate: new Date("2025-04-20"),
          description: "Renovación completa del ala este del hospital",
          budget: "1200000",
          clientName: "Ministerio de Salud",
          clientContact: "proyectos@minsal.gov",
          createdBy: 1
        }
      ];

      const results = [];

      for (const project of demoProjects) {
        const newProject = await storage.createProject(project);
        results.push(newProject);
      }

      res.status(201).json({ 
        message: "Proyectos de demostración creados correctamente",
        projects: results 
      });
    } catch (error) {
      console.error("Error creando proyectos de demostración:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === Gestores de Proyectos ===

  // Obtener los gestores de un proyecto - Acceso público para demostración
  app.get("/api/projects/:id/managers", async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const managers = await storage.getProjectManagers(projectId);

      // Obtener detalles completos de los usuarios
      const managersWithDetails = await Promise.all(managers.map(async (manager) => {
        const user = await storage.getUser(manager.userId);
        if (!user) return { ...manager, userDetails: null };

        // No incluir la contraseña en la respuesta
        const { password: _, ...userWithoutPassword } = user;
        return { ...manager, userDetails: userWithoutPassword };
      }));

      res.json(managersWithDetails);
    } catch (error) {
      console.error("Error obteniendo gestores del proyecto:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Añadir un gestor a un proyecto
  app.post("/api/projects/:id/managers", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const projectId = Number(req.params.id);

      // Verificar que el proyecto existe
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const managerData = insertProjectManagerSchema.parse({
        ...req.body,
        projectId,
        role: req.body.role || "manager" // Rol por defecto
      });

      const manager = await storage.addProjectManager(managerData);
      res.status(201).json(manager);
    } catch (error) {
      console.error("Error añadiendo gestor al proyecto:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de gestor inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  // Eliminar un gestor de un proyecto
  app.delete("/api/projects/managers/:id", authenticate, checkRole(["admin"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.removeProjectManager(id);

      if (!success) {
        return res.status(404).json({ message: "Gestor no encontrado" });
      }

      res.json({ message: "Gestor eliminado correctamente del proyecto" });
    } catch (error) {
      console.error("Error eliminando gestor del proyecto:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === Documentos de Proyectos ===

  // Obtener documentos de un proyecto - Acceso público para demostración
  app.get("/api/projects/:id/documents", async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const documents = await storage.getProjectDocuments(projectId);

      // Obtener detalles de los documentos originales
      const documentsWithDetails = await Promise.all(documents.map(async (doc) => {
        const document = await storage.getDocument(doc.documentId);
        return { ...doc, documentDetails: document || null };
      }));

      res.json(documentsWithDetails);
    } catch (error) {
      console.error("Error obteniendo documentos del proyecto:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Añadir un documento a un proyecto
  app.post("/api/projects/:id/documents", authenticate, async (req, res) => {
    try {
      const user = req.user as Express.User;
      const projectId = Number(req.params.id);

      // Verificar que el proyecto existe
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const documentData = insertProjectDocumentSchema.parse({
        ...req.body,
        projectId,
        uploadedBy: user.id
      });

      const document = await storage.addProjectDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error añadiendo documento al proyecto:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de documento inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  // Eliminar un documento de un proyecto
  app.delete("/api/projects/documents/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.removeProjectDocument(id);

      if (!success) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }

      res.json({ message: "Documento eliminado correctamente del proyecto" });
    } catch (error) {
      console.error("Error eliminando documento del proyecto:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  
  // === Miembros de Proyectos ===
  
  // Obtener los miembros de un proyecto
  app.get("/api/projects/:id/members", authenticate, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const user = req.user as Express.User;
      
      // Verificar que el usuario tenga permiso para ver los miembros
      if (user.role !== "admin") {
        const isManager = await storage.isProjectManager(projectId, user.id);
        const isMember = await storage.isProjectMember(projectId, user.id);
        
        if (!isManager && !isMember) {
          return res.status(403).json({ 
            message: "No tienes permiso para ver los miembros de este proyecto" 
          });
        }
      }
      
      const members = await storage.getProjectMembers(projectId);

      // Obtener detalles completos de los usuarios
      const membersWithDetails = await Promise.all(members.map(async (member) => {
        const user = await storage.getUser(member.userId);
        if (!user) return { ...member, userDetails: null };

        // No incluir la contraseña en la respuesta
        const { password: _, ...userWithoutPassword } = user;
        return { ...member, userDetails: userWithoutPassword };
      }));

      res.json(membersWithDetails);
    } catch (error) {
      console.error("Error obteniendo miembros del proyecto:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Añadir un miembro a un proyecto
  app.post("/api/projects/:id/members", authenticate, async (req, res) => {
    try {
      const projectId = Number(req.params.id);
      const user = req.user as Express.User;
      
      // Verificar que el proyecto existe
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }
      
      // Verificar si el usuario tiene permisos para añadir miembros
      if (user.role !== "admin") {
        const isManager = await storage.isProjectManager(projectId, user.id);
        
        if (!isManager) {
          return res.status(403).json({ 
            message: "Solo los administradores y gestores del proyecto pueden añadir miembros" 
          });
        }
      }

      const memberData = insertProjectMemberSchema.parse({
        ...req.body,
        projectId,
        addedBy: user.id,
        role: req.body.role || "member" // Rol por defecto
      });

      const member = await storage.addProjectMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error añadiendo miembro al proyecto:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de miembro inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  // Actualizar los permisos de un miembro
  app.put("/api/projects/members/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = req.user as Express.User;
      
      // Obtener información del miembro actual
      const member = await storage.getProjectMemberById(id);
      if (!member) {
        return res.status(404).json({ message: "Miembro no encontrado" });
      }
      
      // Verificar permisos para actualizar
      if (user.role !== "admin") {
        const isManager = await storage.isProjectManager(member.projectId, user.id);
        
        if (!isManager) {
          return res.status(403).json({ 
            message: "Solo los administradores y gestores del proyecto pueden actualizar miembros" 
          });
        }
      }
      
      // Schema para validar solo los campos que se pueden actualizar
      const updateSchema = z.object({
        role: z.string().optional(),
        permissions: z.array(z.string()).optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      
      const updatedMember = await storage.updateProjectMember(id, updateData);
      
      if (!updatedMember) {
        return res.status(404).json({ message: "Miembro no encontrado" });
      }
      
      res.json(updatedMember);
    } catch (error) {
      console.error("Error actualizando miembro del proyecto:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de miembro inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  // Eliminar un miembro de un proyecto
  app.delete("/api/projects/members/:id", authenticate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const user = req.user as Express.User;
      
      // Obtener información del miembro actual
      const member = await storage.getProjectMemberById(id);
      if (!member) {
        return res.status(404).json({ message: "Miembro no encontrado" });
      }
      
      // Verificar permisos para eliminar
      if (user.role !== "admin") {
        const isManager = await storage.isProjectManager(member.projectId, user.id);
        
        if (!isManager) {
          return res.status(403).json({ 
            message: "Solo los administradores y gestores del proyecto pueden eliminar miembros" 
          });
        }
      }
      
      const success = await storage.removeProjectMember(id);

      if (!success) {
        return res.status(404).json({ message: "Miembro no encontrado" });
      }

      res.json({ message: "Miembro eliminado correctamente del proyecto" });
    } catch (error) {
      console.error("Error eliminando miembro del proyecto:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}