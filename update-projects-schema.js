import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Configuración específica para Neon
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// No es necesario cargar el esquema completo para esta operación simple
const main = async () => {
  console.log('Iniciando actualización de esquema...');
  
  try {
    // Conectar a la base de datos
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está definida');
    }
    
    console.log('Conectando a la base de datos...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('Ejecutando consulta para añadir columna image...');
    // Ejecutar el ALTER TABLE directamente
    await pool.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS image TEXT
    `);
    
    console.log('Verificando si existe la tabla project_members...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'project_members'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Creando tabla project_members...');
      await pool.query(`
        CREATE TABLE project_members (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL REFERENCES projects(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          role TEXT NOT NULL DEFAULT 'member',
          permissions JSONB NOT NULL DEFAULT '["view"]',
          added_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('Tabla project_members creada correctamente');
    } else {
      console.log('La tabla project_members ya existe');
    }
    
    console.log('¡Columna añadida correctamente!');
    
    // Cerrar la conexión
    await pool.end();
    
  } catch (error) {
    console.error('Error durante la actualización del esquema:', error);
  }
};

main();