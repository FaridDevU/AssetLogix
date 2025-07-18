import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { pool } from "./db";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function updatePasswords() {
  console.log('Actualizando contraseñas...');
  
  // Mapa de contraseñas ya conocidas
  const passwords = {
    'admin@example.com': 'admin123',
    'user@example.com': 'user123',
    'tecnico@example.com': 'tech123'
  };

  try {
    // Obtener todos los usuarios
    const { rows: users } = await pool.query('SELECT id, username FROM users');
    
    console.log(`Encontrados ${users.length} usuarios`);
    
    // Actualizar contraseñas una por una
    for (const user of users) {
      const username = user.username;
      let password = passwords[username];
      
      if (!password) {
        console.log(`Usuario ${username} no tiene contraseña predefinida, usando 'password123'`);
        password = 'password123';
      }
      
      const hashedPassword = await hashPassword(password);
      
      console.log(`Actualizando contraseña para ${username}`);
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, user.id]
      );
    }
    
    console.log('Contraseñas actualizadas correctamente');
  } catch (error) {
    console.error('Error actualizando contraseñas:', error);
  } finally {
    process.exit(0);
  }
}

updatePasswords();