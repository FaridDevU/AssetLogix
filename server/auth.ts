import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { MockDatabase } from "./mockDatabase";
import { User as UserType } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error('La contraseña almacenada no tiene el formato correcto:', stored);
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparando contraseñas:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Use memory store for demo instead of database
  const MemoryStore = createMemoryStore(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: "demo-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      secure: false, // false for demo
      sameSite: 'lax'
    },
    name: 'assetmanager.sid',
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        if (username === "admin" && password === "123") {
          const adminUser = MockDatabase.getUserByEmail("admin@assetlogix.com");
          if (adminUser) {
            return done(null, adminUser);
          }
        }
        
        const user = MockDatabase.getUserByEmail(username);
        if (user && (password === "123" || password === "admin123" || password === "demo123")) {
          return done(null, user);
        }
        
        return done(null, false);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user: Express.User, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      // For demo, use mock database
      const user = MockDatabase.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err: Error) => {
        if (err) return next(err);
        // No enviar la contraseña al cliente
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: Express.User | false, info: {message: string}) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Credenciales incorrectas" });
      
      req.login(user, (err: Error) => {
        if (err) return next(err);
        // No enviar la contraseña al cliente
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Error al cerrar sesión" });
        }
        
        res.clearCookie('assetmanager.sid', {
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'lax'
        });
        
        res.status(200).json({ message: "Logout exitoso" });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "No autenticado" });
    // No enviar la contraseña al cliente
    const { password: _, ...userWithoutPassword } = req.user as Express.User;
    res.json(userWithoutPassword);
  });
}