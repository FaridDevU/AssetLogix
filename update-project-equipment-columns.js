// Script para agregar la columna faltante en la tabla project_equipment
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from "drizzle-orm";
import * as schema from "./shared/schema.js";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function addMissingColumnToProjectEquipment() {
  // Inicializar la conexión con la base de datos
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });
  
  try {
    console.log("Iniciando actualización de la tabla project_equipment...");

    // Usar consulta SQL directa para verificar si la columna existe
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_equipment' 
      AND column_name = 'expected_return_date';
    `;
    
    const result = await db.execute(checkColumnQuery);
    
    // Si la columna no existe, agregarla
    if (result.rows.length === 0) {
      console.log("La columna expected_return_date no existe, agregándola...");
      
      // Usar consulta SQL directa para agregar la columna
      const addColumnQuery = sql`
        ALTER TABLE project_equipment 
        ADD COLUMN expected_return_date TIMESTAMP;
      `;
      
      await db.execute(addColumnQuery);
      console.log("Columna expected_return_date agregada exitosamente.");
    } else {
      console.log("La columna expected_return_date ya existe.");
    }
    
    console.log("Actualización completada con éxito.");
  } catch (error) {
    console.error("Error al actualizar la tabla project_equipment:", error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

// Ejecutar la función
addMissingColumnToProjectEquipment();