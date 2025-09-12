// Script para añadir columna de imagen a la tabla de proyectos
import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addImageColumnToProjects() {
  try {
    console.log('Verificando si la columna ya existe...');
    
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'image'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('La columna "image" no existe, añadiéndola...');
      
      await pool.query(`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS image TEXT
      `);
      
      console.log('Columna "image" añadida correctamente');
    } else {
      console.log('La columna "image" ya existe');
    }
    
  } catch (error) {
    console.error('Error al añadir la columna:', error);
  } finally {
    await pool.end();
  }
}

addImageColumnToProjects();