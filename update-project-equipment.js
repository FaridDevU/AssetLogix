import { sql } from 'drizzle-orm';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function createProjectEquipmentTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS project_equipment (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        equipment_id INTEGER NOT NULL,
        assigned_date TIMESTAMP NOT NULL DEFAULT NOW(),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by INTEGER,
        UNIQUE(project_id, equipment_id),
        CONSTRAINT fk_project
          FOREIGN KEY(project_id) 
          REFERENCES projects(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_equipment
          FOREIGN KEY(equipment_id) 
          REFERENCES equipment(id)
          ON DELETE CASCADE
      )
    `);
    console.log('Tabla project_equipment creada o ya existente');

    // Verificamos que se haya creado
    const check = await db.execute(sql`SELECT to_regclass('public.project_equipment')`);
    console.log('Resultado de verificación:', check);

    // Nos desconectamos para evitar que el script quede colgado
    await pool.end();
  } catch (error) {
    console.error('Error al crear tabla project_equipment:', error);
    process.exit(1);
  }
}

createProjectEquipmentTable();