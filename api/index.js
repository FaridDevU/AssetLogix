import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { setupAuth } from '../server/auth.js';

const MemoryStoreSession = MemoryStore(session);

const app = express();

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Configurar sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'demo-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  },
  name: 'assetmanager.sid'
}));

// Configurar autenticación
setupAuth(app);

// Rutas básicas de autenticación
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ message: "No autenticado" });
  }
});

// Mock database simple para Vercel
const mockUsers = [
  {
    id: 1,
    email: "admin@demo.com",
    username: "admin",
    password: "123",
    name: "Administrador",
    role: "admin",
    avatar: null,
    status: "active"
  }
];

app.post('/api/login', (req, res, next) => {
  const { username, password } = req.body;
  
  // Verificar credenciales
  const user = mockUsers.find(u => 
    (u.username === username || u.email === username) && u.password === password
  );
  
  if (!user) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }
  
  // Simular req.login de Passport
  req.login = (user, callback) => {
    req.session.passport = { user: user.id };
    req.user = user;
    if (callback) callback(null);
  };
  
  req.isAuthenticated = () => !!req.user;
  
  req.login(user, (err) => {
    if (err) {
      return res.status(500).json({ message: "Error al iniciar sesión" });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error al cerrar sesión" });
    }
    res.clearCookie('assetmanager.sid');
    res.json({ message: "Sesión cerrada exitosamente" });
  });
});

// Exportar como función serverless
export default app;