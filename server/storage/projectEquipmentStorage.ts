import { db } from '../db';
import { sql } from 'drizzle-orm';
import { projectEquipment, type ProjectEquipment, type InsertProjectEquipment } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class ProjectEquipmentStorage {
  
  // Obtener equipos asignados a un proyecto
  async getProjectEquipment(projectId: number): Promise<ProjectEquipment[]> {
    const results = await db.execute<ProjectEquipment>(sql`
      SELECT * FROM get_project_equipment(${projectId})
    `);
    return results as unknown as ProjectEquipment[];
  }
  
  // Obtener un equipo asignado específico por ID
  async getProjectEquipmentById(id: number): Promise<ProjectEquipment | undefined> {
    const results = await db.execute<ProjectEquipment>(sql`
      SELECT * FROM get_project_equipment_by_id(${id})
    `);
    const resultsArray = results as unknown as ProjectEquipment[];
    return resultsArray.length > 0 ? resultsArray[0] : undefined;
  }
  
  // Crear una nueva asignación de equipo a proyecto
  async createProjectEquipment(data: InsertProjectEquipment): Promise<ProjectEquipment> {
    const [result] = await db
      .insert(projectEquipment)
      .values({
        ...data,
        status: data.status || 'assigned',
        assignedDate: data.assignedDate || new Date(),
        isShared: data.isShared || false
      })
      .returning();
    return result;
  }
  
  // Actualizar una asignación de equipo
  async updateProjectEquipment(id: number, data: Partial<InsertProjectEquipment>): Promise<ProjectEquipment | undefined> {
    const [result] = await db
      .update(projectEquipment)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(projectEquipment.id, id))
      .returning();
    return result;
  }
  
  // Eliminar una asignación de equipo
  async deleteProjectEquipment(id: number): Promise<boolean> {
    const result = await db
      .delete(projectEquipment)
      .where(eq(projectEquipment.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  // Obtener asignaciones actuales de un equipo (donde no ha sido devuelto)
  async getEquipmentCurrentAssignments(equipmentId: number): Promise<ProjectEquipment[]> {
    const results = await db.execute<ProjectEquipment>(sql`
      SELECT * FROM get_equipment_current_assignments(${equipmentId})
    `);
    return results as unknown as ProjectEquipment[];
  }
  
  // Obtener historial de asignaciones de un equipo
  async getEquipmentAssignmentHistory(equipmentId: number): Promise<ProjectEquipment[]> {
    const results = await db.execute<ProjectEquipment>(sql`
      SELECT * FROM get_equipment_assignment_history(${equipmentId})
    `);
    return results as unknown as ProjectEquipment[];
  }
}