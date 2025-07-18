import { Router, Request, Response, Express } from 'express';
import { storage } from '../storage';
import { authenticate, checkRole } from '../routes';
import { z } from 'zod';
import { insertProjectEquipmentSchema } from '@shared/schema';

export function registerProjectEquipmentRoutes(app: Express) {
  const router = Router();

  // Validación para la creación de asignaciones de equipos
  const insertProjectEquipmentValidator = insertProjectEquipmentSchema
    .extend({
      equipmentId: z.number().positive("El ID del equipo es requerido"),
      projectId: z.number().positive("El ID del proyecto es requerido"),
      assignedBy: z.number().positive("El ID del asignador es requerido"),
    });

  // Obtener todos los equipos asignados a un proyecto
  router.get('/:projectId', authenticate, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'ID de proyecto inválido' });
      }

      // Verificar que el proyecto existe
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      // Verificar permisos para ver este proyecto
      const userRole = req.user?.role;
      const isMember = await storage.isProjectMember(projectId, req.user?.id || 0);

      if (userRole !== 'admin' && !isMember) {
        return res.status(403).json({ error: 'No tienes permiso para ver los equipos de este proyecto' });
      }

      const equipments = await storage.getProjectEquipment(projectId);
      res.json(equipments);
    } catch (error) {
      console.error('Error obteniendo equipos del proyecto:', error);
      res.status(500).json({ error: 'Error del servidor al obtener equipos' });
    }
  });

  // Obtener un equipo asignado específico
  router.get('/detail/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de asignación inválido' });
      }

      const equipment = await storage.getProjectEquipmentById(id);
      if (!equipment) {
        return res.status(404).json({ error: 'Asignación de equipo no encontrada' });
      }

      // Verificar permisos para ver este proyecto
      const userRole = req.user?.role;
      const isMember = await storage.isProjectMember(equipment.projectId, req.user?.id || 0);

      if (userRole !== 'admin' && !isMember) {
        return res.status(403).json({ error: 'No tienes permiso para ver este equipo' });
      }

      res.json(equipment);
    } catch (error) {
      console.error('Error obteniendo detalle de equipo:', error);
      res.status(500).json({ error: 'Error del servidor al obtener detalle de equipo' });
    }
  });

  // Crear una nueva asignación de equipo
  router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
      // Validar los datos de entrada
      const validationResult = insertProjectEquipmentValidator.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: validationResult.error.format() 
        });
      }

      const data = validationResult.data;

      // Verificar que el usuario tiene permisos para asignar equipos en este proyecto
      const userRole = req.user?.role;
      const isManager = await storage.isProjectManager(data.projectId, req.user?.id || 0);

      if (userRole !== 'admin' && !isManager) {
        return res.status(403).json({ error: 'No tienes permiso para asignar equipos a este proyecto' });
      }

      // Verificar que el equipo existe
      const equipment = await storage.getEquipment(data.equipmentId);
      if (!equipment) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }

      // Verificar que el proyecto existe
      const project = await storage.getProject(data.projectId);
      if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      // Verificar si el equipo ya está asignado y no está disponible
      const currentAssignments = await storage.getEquipmentCurrentAssignments(data.equipmentId);
      if (currentAssignments.length > 0 && !data.isShared) {
        return res.status(400).json({ 
          error: 'Este equipo ya está asignado a otro proyecto y no está marcado como compartible',
          currentAssignments
        });
      }

      // Crear la asignación
      const newAssignment = await storage.createProjectEquipment({
        ...data,
        assignedBy: req.user?.id || data.assignedBy,
      });

      res.status(201).json(newAssignment);
    } catch (error) {
      console.error('Error creando asignación de equipo:', error);
      res.status(500).json({ error: 'Error del servidor al asignar equipo' });
    }
  });

  // Actualizar una asignación de equipo
  router.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de asignación inválido' });
      }

      // Obtener la asignación actual
      const currentAssignment = await storage.getProjectEquipmentById(id);
      if (!currentAssignment) {
        return res.status(404).json({ error: 'Asignación de equipo no encontrada' });
      }

      // Verificar permisos para actualizar esta asignación
      const userRole = req.user?.role;
      const isManager = await storage.isProjectManager(currentAssignment.projectId, req.user?.id || 0);

      if (userRole !== 'admin' && !isManager) {
        return res.status(403).json({ error: 'No tienes permiso para actualizar esta asignación' });
      }

      // Actualizar solo los campos permitidos
      const updatedAssignment = await storage.updateProjectEquipment(id, {
        status: req.body.status,
        notes: req.body.notes,
        expectedReturnDate: req.body.expectedReturnDate,
        actualReturnDate: req.body.actualReturnDate,
        isShared: req.body.isShared
      });

      res.json(updatedAssignment);
    } catch (error) {
      console.error('Error actualizando asignación de equipo:', error);
      res.status(500).json({ error: 'Error del servidor al actualizar asignación' });
    }
  });

  // Devolver un equipo (marcar como devuelto)
  router.put('/:id/return', authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de asignación inválido' });
      }

      // Obtener la asignación actual
      const currentAssignment = await storage.getProjectEquipmentById(id);
      if (!currentAssignment) {
        return res.status(404).json({ error: 'Asignación de equipo no encontrada' });
      }

      // Verificar permisos
      const userRole = req.user?.role;
      const isManager = await storage.isProjectManager(currentAssignment.projectId, req.user?.id || 0);

      if (userRole !== 'admin' && !isManager) {
        return res.status(403).json({ error: 'No tienes permiso para devolver este equipo' });
      }

      // Verificar que el equipo no haya sido devuelto ya
      if (currentAssignment.status === 'returned') {
        return res.status(400).json({ error: 'Este equipo ya ha sido devuelto' });
      }

      // Actualizar asignación
      const updatedAssignment = await storage.updateProjectEquipment(id, {
        status: 'returned',
        actualReturnDate: new Date(),
        notes: req.body.notes || currentAssignment.notes
      });

      res.json(updatedAssignment);
    } catch (error) {
      console.error('Error devolviendo equipo:', error);
      res.status(500).json({ error: 'Error del servidor al devolver equipo' });
    }
  });

  // Eliminar una asignación de equipo
  router.delete('/:id', authenticate, checkRole(['admin']), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID de asignación inválido' });
      }

      // Verificar que existe la asignación
      const assignment = await storage.getProjectEquipmentById(id);
      if (!assignment) {
        return res.status(404).json({ error: 'Asignación de equipo no encontrada' });
      }

      // Solo los administradores pueden eliminar asignaciones (ya verificado por checkRole)
      
      // Eliminar la asignación
      const deleted = await storage.deleteProjectEquipment(id);
      if (!deleted) {
        return res.status(500).json({ error: 'No se pudo eliminar la asignación' });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error eliminando asignación de equipo:', error);
      res.status(500).json({ error: 'Error del servidor al eliminar asignación' });
    }
  });

  // Obtener historial de asignaciones de un equipo
  router.get('/equipment/:equipmentId/history', authenticate, async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.equipmentId);
      if (isNaN(equipmentId)) {
        return res.status(400).json({ error: 'ID de equipo inválido' });
      }

      // Verificar que el equipo existe
      const equipment = await storage.getEquipment(equipmentId);
      if (!equipment) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }

      // Verificar permisos: admin o técnico pueden ver el historial
      const userRole = req.user?.role;
      if (userRole !== 'admin' && userRole !== 'technician') {
        return res.status(403).json({ error: 'No tienes permiso para ver el historial de este equipo' });
      }

      const history = await storage.getEquipmentAssignmentHistory(equipmentId);
      res.json(history);
    } catch (error) {
      console.error('Error obteniendo historial de equipo:', error);
      res.status(500).json({ error: 'Error del servidor al obtener historial' });
    }
  });

  // Obtener asignaciones actuales de un equipo
  router.get('/equipment/:equipmentId/current', authenticate, async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.equipmentId);
      if (isNaN(equipmentId)) {
        return res.status(400).json({ error: 'ID de equipo inválido' });
      }

      // Verificar que el equipo existe
      const equipment = await storage.getEquipment(equipmentId);
      if (!equipment) {
        return res.status(404).json({ error: 'Equipo no encontrado' });
      }

      // Verificar permisos: admin o técnico pueden ver las asignaciones actuales
      const userRole = req.user?.role;
      if (userRole !== 'admin' && userRole !== 'technician') {
        return res.status(403).json({ error: 'No tienes permiso para ver las asignaciones actuales de este equipo' });
      }

      const currentAssignments = await storage.getEquipmentCurrentAssignments(equipmentId);
      res.json(currentAssignments);
    } catch (error) {
      console.error('Error obteniendo asignaciones actuales de equipo:', error);
      res.status(500).json({ error: 'Error del servidor al obtener asignaciones actuales' });
    }
  });

  // Registramos todas las rutas de equipos de proyecto bajo /api/project-equipment
  app.use('/api/project-equipment', router);
}