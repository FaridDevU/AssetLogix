// Script para crear la tabla roles y añadir la columna custom_role_id a users
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function setupRolesAndPermissions() {
  // Inicializar la conexión con la base de datos
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });
  
  try {
    console.log("Iniciando configuración de roles y permisos...");
    
    // 1. Crear tabla de roles
    console.log("Creando tabla de roles...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        can_manage_users BOOLEAN NOT NULL DEFAULT false,
        can_manage_roles BOOLEAN NOT NULL DEFAULT false,
        can_create_documents BOOLEAN NOT NULL DEFAULT true,
        can_view_documents BOOLEAN NOT NULL DEFAULT true,
        can_edit_documents BOOLEAN NOT NULL DEFAULT false,
        can_delete_documents BOOLEAN NOT NULL DEFAULT false,
        can_create_folders BOOLEAN NOT NULL DEFAULT true,
        can_view_folders BOOLEAN NOT NULL DEFAULT true,
        can_edit_folders BOOLEAN NOT NULL DEFAULT false,
        can_delete_folders BOOLEAN NOT NULL DEFAULT false,
        can_create_equipment BOOLEAN NOT NULL DEFAULT false,
        can_view_equipment BOOLEAN NOT NULL DEFAULT true,
        can_edit_equipment BOOLEAN NOT NULL DEFAULT false,
        can_delete_equipment BOOLEAN NOT NULL DEFAULT false,
        can_schedule_maintenance BOOLEAN NOT NULL DEFAULT false,
        can_complete_maintenance BOOLEAN NOT NULL DEFAULT false,
        can_create_projects BOOLEAN NOT NULL DEFAULT false,
        can_view_projects BOOLEAN NOT NULL DEFAULT true,
        can_edit_projects BOOLEAN NOT NULL DEFAULT false,
        can_delete_projects BOOLEAN NOT NULL DEFAULT false,
        can_manage_project_equipment BOOLEAN NOT NULL DEFAULT false,
        is_system_role BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // 2. Verificar si la columna custom_role_id existe en users
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'custom_role_id';
    `;
    
    const result = await db.execute(checkColumnQuery);
    
    // Si la columna no existe, agregarla
    if (result.rows.length === 0) {
      console.log("La columna custom_role_id no existe en users, agregándola...");
      
      // Añadir columna custom_role_id a users
      await db.execute(sql`
        ALTER TABLE users 
        ADD COLUMN custom_role_id INTEGER REFERENCES roles(id);
      `);
      
      console.log("Columna custom_role_id agregada exitosamente.");
    } else {
      console.log("La columna custom_role_id ya existe en la tabla users.");
    }
    
    // 3. Crear roles predefinidos del sistema
    console.log("Creando roles predefinidos del sistema...");
    
    // Role: Administrador
    await db.execute(sql`
      INSERT INTO roles (
        name, description, is_system_role,
        can_manage_users, can_manage_roles,
        can_create_documents, can_view_documents, can_edit_documents, can_delete_documents,
        can_create_folders, can_view_folders, can_edit_folders, can_delete_folders,
        can_create_equipment, can_view_equipment, can_edit_equipment, can_delete_equipment,
        can_schedule_maintenance, can_complete_maintenance,
        can_create_projects, can_view_projects, can_edit_projects, can_delete_projects,
        can_manage_project_equipment
      ) 
      VALUES (
        'Administrador', 'Rol de administrador con todos los permisos', true,
        true, true,
        true, true, true, true,
        true, true, true, true,
        true, true, true, true,
        true, true,
        true, true, true, true,
        true
      )
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Role: Técnico
    await db.execute(sql`
      INSERT INTO roles (
        name, description, is_system_role,
        can_manage_users, can_manage_roles,
        can_create_documents, can_view_documents, can_edit_documents, can_delete_documents,
        can_create_folders, can_view_folders, can_edit_folders, can_delete_folders,
        can_create_equipment, can_view_equipment, can_edit_equipment, can_delete_equipment,
        can_schedule_maintenance, can_complete_maintenance,
        can_create_projects, can_view_projects, can_edit_projects, can_delete_projects,
        can_manage_project_equipment
      ) 
      VALUES (
        'Técnico', 'Rol para técnicos de mantenimiento', true,
        false, false,
        true, true, true, false,
        true, true, true, false,
        true, true, true, false,
        true, true,
        false, true, false, false,
        true
      )
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Role: Usuario
    await db.execute(sql`
      INSERT INTO roles (
        name, description, is_system_role,
        can_manage_users, can_manage_roles,
        can_create_documents, can_view_documents, can_edit_documents, can_delete_documents,
        can_create_folders, can_view_folders, can_edit_folders, can_delete_folders,
        can_create_equipment, can_view_equipment, can_edit_equipment, can_delete_equipment,
        can_schedule_maintenance, can_complete_maintenance,
        can_create_projects, can_view_projects, can_edit_projects, can_delete_projects,
        can_manage_project_equipment
      ) 
      VALUES (
        'Usuario', 'Rol básico para usuarios generales', true,
        false, false,
        true, true, false, false,
        true, true, false, false,
        false, false, false, false,
        false, false,
        false, true, false, false,
        false
      )
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // 4. Asignar rol personalizado a usuarios existentes basado en su rol actual
    console.log("Asignando roles personalizados a usuarios existentes...");
    
    // Asignar rol de Administrador a usuarios con role='admin'
    await db.execute(sql`
      UPDATE users
      SET custom_role_id = (SELECT id FROM roles WHERE name = 'Administrador')
      WHERE role = 'admin' AND custom_role_id IS NULL;
    `);
    
    // Asignar rol de Técnico a usuarios con role='technician'
    await db.execute(sql`
      UPDATE users
      SET custom_role_id = (SELECT id FROM roles WHERE name = 'Técnico')
      WHERE role = 'technician' AND custom_role_id IS NULL;
    `);
    
    // Asignar rol de Usuario a usuarios con role='user'
    await db.execute(sql`
      UPDATE users
      SET custom_role_id = (SELECT id FROM roles WHERE name = 'Usuario')
      WHERE role = 'user' AND custom_role_id IS NULL;
    `);
    
    console.log("Configuración de roles y permisos completada con éxito.");
  } catch (error) {
    console.error("Error en la configuración de roles y permisos:", error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

// Ejecutar la función
setupRolesAndPermissions();