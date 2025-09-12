import { registerRoutes } from './routes.js';

export default async function handler(req, res) {
  // Configurar CORS para Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Crear una aplicación Express temporal para manejar la request
  const express = (await import('express')).default;
  const app = express();

  // Registrar todas las rutas
  await registerRoutes(app);

  // Ejecutar la aplicación con la request/response de Vercel
  app(req, res);
}