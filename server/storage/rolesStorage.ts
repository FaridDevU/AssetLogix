import { db } from '../db';
import { roles, users, type Role, type InsertRole, type User } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class RolesStorage {
  // Obtener todos los roles
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles);
  }
  
  // Obtener un rol por ID
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }
  
  // Obtener un rol por nombre
  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }
  
  // Crear un nuevo rol
  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }
  
  // Actualizar un rol existente
  async updateRole(id: number, data: Partial<InsertRole>): Promise<Role | undefined> {
    const [updatedRole] = await db
      .update(roles)
      .set(data)
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }
  
  // Eliminar un rol
  async deleteRole(id: number): Promise<boolean> {
    // No permitir eliminar roles del sistema
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    if (role && role.isSystemRole) {
      return false;
    }
    
    const result = await db
      .delete(roles)
      .where(eq(roles.id, id));
    return result.rowCount > 0;
  }
  
  // Asignar un rol personalizado a un usuario
  async assignCustomRoleToUser(userId: number, roleId: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ customRoleId: roleId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  // Obtener usuario con sus permisos (rol personalizado o del sistema)
  async getUserWithPermissions(userId: number): Promise<User & { permissions?: Role }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    
    // Si el usuario tiene un rol personalizado, obtenerlo
    if (user.customRoleId) {
      const [role] = await db.select().from(roles).where(eq(roles.id, user.customRoleId));
      if (role) {
        return {
          ...user,
          permissions: role
        };
      }
    }
    
    // Si no tiene rol personalizado o no se encontró, obtener el rol basado en su rol de sistema
    const systemRoleName = user.role === 'admin' ? 'Administrador' :
                          user.role === 'technician' ? 'Técnico' : 'Usuario';
    
    const [systemRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, systemRoleName));
    
    return {
      ...user,
      permissions: systemRole
    };
  }
}