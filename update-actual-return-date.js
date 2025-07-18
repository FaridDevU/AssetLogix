// Script para agregar la columna actual_return_date en la tabla project_equipment
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function addActualReturnDateColumn() {
  // Inicializar la conexión con la base de datos
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });
  
  try {
    console.log("Iniciando actualización de la tabla project_equipment...");
    
    // Usar consulta SQL directa para verificar si la columna existe
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_equipment' 
      AND column_name = 'actual_return_date';
    `;
    
    const result = await db.execute(checkColumnQuery);
    
    // Si la columna no existe, agregarla
    if (result.rows.length === 0) {
      console.log("La columna actual_return_date no existe, agregándola...");
      
      // Usar consulta SQL directa para agregar la columna
      const addColumnQuery = sql`
        ALTER TABLE project_equipment 
        ADD COLUMN actual_return_date TIMESTAMP;
      `;
      
      await db.execute(addColumnQuery);
      console.log("Columna actual_return_date agregada exitosamente.");
    } else {
      console.log("La columna actual_return_date ya existe.");
    }
    
    // Verificar si la columna assigned_by existe
    const checkAssignedByQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_equipment' 
      AND column_name = 'assigned_by';
    `;
    
    const assignedByResult = await db.execute(checkAssignedByQuery);
    
    // Si la columna no existe, agregarla
    if (assignedByResult.rows.length === 0) {
      console.log("La columna assigned_by no existe, agregándola...");
      
      // Usar consulta SQL directa para agregar la columna
      const addColumnQuery = sql`
        ALTER TABLE project_equipment 
        ADD COLUMN assigned_by INTEGER REFERENCES users(id);
      `;
      
      await db.execute(addColumnQuery);
      console.log("Columna assigned_by agregada exitosamente.");
    } else {
      console.log("La columna assigned_by ya existe.");
    }
    
    // Verificar si la columna is_shared existe
    const checkIsSharedQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_equipment' 
      AND column_name = 'is_shared';
    `;
    
    const isSharedResult = await db.execute(checkIsSharedQuery);
    
    // Si la columna no existe, agregarla
    if (isSharedResult.rows.length === 0) {
      console.log("La columna is_shared no existe, agregándola...");
      
      // Usar consulta SQL directa para agregar la columna
      const addColumnQuery = sql`
        ALTER TABLE project_equipment 
        ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false;
      `;
      
      await db.execute(addColumnQuery);
      console.log("Columna is_shared agregada exitosamente.");
    } else {
      console.log("La columna is_shared ya existe.");
    }
    
    // Verificar si la columna authorization_code existe
    const checkAuthCodeQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_equipment' 
      AND column_name = 'authorization_code';
    `;
    
    const authCodeResult = await db.execute(checkAuthCodeQuery);
    
    // Si la columna no existe, agregarla
    if (authCodeResult.rows.length === 0) {
      console.log("La columna authorization_code no existe, agregándola...");
      
      // Usar consulta SQL directa para agregar la columna
      const addColumnQuery = sql`
        ALTER TABLE project_equipment 
        ADD COLUMN authorization_code TEXT;
      `;
      
      await db.execute(addColumnQuery);
      console.log("Columna authorization_code agregada exitosamente.");
    } else {
      console.log("La columna authorization_code ya existe.");
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
addActualReturnDateColumn();