// Script para crear funciones en la base de datos para gestionar equipos en proyectos
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function createProjectEquipmentFunctions() {
  // Inicializar la conexión con la base de datos
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });
  
  try {
    console.log("Eliminando funciones existentes...");
    
    // Eliminar funciones existentes
    await db.execute(sql`DROP FUNCTION IF EXISTS get_project_equipment(INT);`);
    await db.execute(sql`DROP FUNCTION IF EXISTS get_project_equipment_by_id(INT);`);
    await db.execute(sql`DROP FUNCTION IF EXISTS get_equipment_current_assignments(INT);`);
    await db.execute(sql`DROP FUNCTION IF EXISTS get_equipment_assignment_history(INT);`);
    
    console.log("Creando funciones para gestión de equipos en proyectos...");
    
    // Función para obtener equipos asignados a un proyecto
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_project_equipment(p_project_id INT)
      RETURNS TABLE (
        id INT,
        project_id INT,
        equipment_id INT,
        assigned_date TIMESTAMP,
        expected_return_date TIMESTAMP,
        actual_return_date TIMESTAMP,
        assigned_by INT,
        status VARCHAR(50),
        notes TEXT,
        is_shared BOOLEAN,
        authorization_code TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      ) AS $$
      BEGIN
        RETURN QUERY 
        SELECT 
          pe.id,
          pe.project_id,
          pe.equipment_id,
          pe.assigned_date,
          pe.expected_return_date,
          pe.actual_return_date,
          pe.assigned_by,
          pe.status,
          pe.notes,
          pe.is_shared,
          pe.authorization_code,
          pe.created_at,
          pe.updated_at
        FROM 
          project_equipment pe
        WHERE 
          pe.project_id = p_project_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Función para obtener un equipo asignado por ID
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_project_equipment_by_id(p_id INT)
      RETURNS TABLE (
        id INT,
        project_id INT,
        equipment_id INT,
        assigned_date TIMESTAMP,
        expected_return_date TIMESTAMP,
        actual_return_date TIMESTAMP,
        assigned_by INT,
        status VARCHAR(50),
        notes TEXT,
        is_shared BOOLEAN,
        authorization_code TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      ) AS $$
      BEGIN
        RETURN QUERY 
        SELECT 
          pe.id,
          pe.project_id,
          pe.equipment_id,
          pe.assigned_date,
          pe.expected_return_date,
          pe.actual_return_date,
          pe.assigned_by,
          pe.status,
          pe.notes,
          pe.is_shared,
          pe.authorization_code,
          pe.created_at,
          pe.updated_at
        FROM 
          project_equipment pe
        WHERE 
          pe.id = p_id;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Función para obtener asignaciones actuales de un equipo
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_equipment_current_assignments(p_equipment_id INT)
      RETURNS TABLE (
        id INT,
        project_id INT,
        equipment_id INT,
        assigned_date TIMESTAMP,
        expected_return_date TIMESTAMP,
        actual_return_date TIMESTAMP,
        assigned_by INT,
        status VARCHAR(50),
        notes TEXT,
        is_shared BOOLEAN,
        authorization_code TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      ) AS $$
      BEGIN
        RETURN QUERY 
        SELECT 
          pe.id,
          pe.project_id,
          pe.equipment_id,
          pe.assigned_date,
          pe.expected_return_date,
          pe.actual_return_date,
          pe.assigned_by,
          pe.status,
          pe.notes,
          pe.is_shared,
          pe.authorization_code,
          pe.created_at,
          pe.updated_at
        FROM 
          project_equipment pe
        WHERE 
          pe.equipment_id = p_equipment_id
          AND (pe.actual_return_date IS NULL)
          AND pe.status != 'returned';
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Función para obtener historial de asignaciones de un equipo
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION get_equipment_assignment_history(p_equipment_id INT)
      RETURNS TABLE (
        id INT,
        project_id INT,
        equipment_id INT,
        assigned_date TIMESTAMP,
        expected_return_date TIMESTAMP,
        actual_return_date TIMESTAMP,
        assigned_by INT,
        status VARCHAR(50),
        notes TEXT,
        is_shared BOOLEAN,
        authorization_code TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      ) AS $$
      BEGIN
        RETURN QUERY 
        SELECT 
          pe.id,
          pe.project_id,
          pe.equipment_id,
          pe.assigned_date,
          pe.expected_return_date,
          pe.actual_return_date,
          pe.assigned_by,
          pe.status,
          pe.notes,
          pe.is_shared,
          pe.authorization_code,
          pe.created_at,
          pe.updated_at
        FROM 
          project_equipment pe
        WHERE 
          pe.equipment_id = p_equipment_id
        ORDER BY 
          pe.assigned_date DESC;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log("Funciones creadas exitosamente.");
  } catch (error) {
    console.error("Error creando funciones:", error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

// Ejecutar la función
createProjectEquipmentFunctions();