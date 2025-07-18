import { Request, Response } from "express";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "../storage";

const scryptAsync = promisify(scrypt);

// Verificar contraseña
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function verifyAdminPassword(req: Request, res: Response) {
  try {
    // Asegurarse que el usuario está autenticado y es administrador
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para realizar esta acción",
      });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Contraseña requerida",
      });
    }

    // Obtener el usuario de la base de datos
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Verificar la contraseña
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Contraseña incorrecta",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contraseña verificada correctamente",
    });
  } catch (error) {
    console.error("Error al verificar contraseña:", error);
    return res.status(500).json({
      success: false,
      message: "Error al verificar la contraseña",
    });
  }
}