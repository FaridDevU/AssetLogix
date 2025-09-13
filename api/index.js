export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Mock users data
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
      },
      {
        id: 2,
        email: "tech@demo.com",
        username: "technician",
        password: "tech123",
        name: "Juan Técnico",
        role: "technician",
        avatar: null,
        status: "active"
      },
      {
        id: 3,
        email: "user@demo.com",
        username: "user",
        password: "user123",
        name: "María Usuario",
        role: "user",
        avatar: null,
        status: "active"
      }
    ];

    // Mock projects data
    const mockProjects = [
      {
        id: 1,
        name: "Proyecto Demo Construcción",
        description: "Proyecto de demostración para construcción de edificio",
        status: "active",
        progress: 65,
        startDate: "2024-01-15",
        endDate: "2024-12-31",
        budget: 150000
      },
      {
        id: 2,
        name: "Mantenimiento Equipos Q4",
        description: "Proyecto de mantenimiento preventivo trimestre 4",
        status: "active",
        progress: 30,
        startDate: "2024-10-01",
        endDate: "2024-12-31",
        budget: 25000
      },
      {
        id: 3,
        name: "Actualización Sistema HVAC",
        description: "Modernización del sistema de climatización",
        status: "completed",
        progress: 100,
        startDate: "2024-03-01",
        endDate: "2024-08-30",
        budget: 80000
      }
    ];

    // Mock documents data
    const mockDocuments = [
      {
        id: 1,
        name: "Manual de Usuario AssetLogix.pdf",
        type: "manual",
        size: "2.5 MB",
        uploadDate: "2024-09-01",
        category: "documentation",
        currentVersion: 1,
        originalExtension: ".pdf"
      },
      {
        id: 2,
        name: "Protocolo Mantenimiento Preventivo.docx",
        type: "protocol",
        size: "890 KB",
        uploadDate: "2024-09-05",
        category: "maintenance",
        currentVersion: 2,
        originalExtension: ".docx"
      },
      {
        id: 3,
        name: "Reporte Inventario Agosto 2024.xlsx",
        type: "report",
        size: "1.2 MB",
        uploadDate: "2024-09-10",
        category: "inventory",
        currentVersion: 1,
        originalExtension: ".xlsx"
      }
    ];

    // Mock folders data
    const mockFolders = [
      {
        id: 1,
        name: "Manuales de Usuario",
        createdAt: "2024-08-01T00:00:00.000Z",
        parentId: null
      },
      {
        id: 2,
        name: "Protocolos de Mantenimiento",
        createdAt: "2024-08-15T00:00:00.000Z",
        parentId: null
      },
      {
        id: 3,
        name: "Reportes Mensuales",
        createdAt: "2024-09-01T00:00:00.000Z",
        parentId: null
      }
    ];

    // Mock equipment data
    const mockEquipment = [
      {
        id: 1,
        name: "Generador Diesel CAT 100KW",
        type: "generator",
        status: "operational",
        location: "Sala de Máquinas A",
        lastMaintenance: "2024-08-15",
        nextMaintenance: "2024-11-15"
      },
      {
        id: 2,
        name: "Compresor de Aire Industrial",
        type: "compressor",
        status: "maintenance",
        location: "Taller Principal",
        lastMaintenance: "2024-09-01",
        nextMaintenance: "2024-12-01"
      },
      {
        id: 3,
        name: "Bomba Centrífuga 50HP",
        type: "pump",
        status: "operational",
        location: "Planta Baja",
        lastMaintenance: "2024-07-20",
        nextMaintenance: "2024-10-20"
      }
    ];

    const url = new URL(req.url, "https://" + req.headers.host);
    const path = url.pathname.replace("/api", "");

    console.log("API " + req.method + " " + path);

    // Handle user endpoint - return mock user for demo
    if (path === "/user" && req.method === "GET") {
      // For demo purposes, return a default user instead of 401
      const demoUser = mockUsers[0]; // Admin user
      const { password: _, ...userResult } = demoUser;
      return res.status(200).json(userResult);
    }

    if (path === "/login" && req.method === "POST") {
      const body = req.body || {};
      const { username, password } = body;
      
      console.log("Login attempt:", username);
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username y password requeridos" });
      }

      const user = mockUsers.find(u => 
        (u.username === username || u.email === username) && u.password === password
      );

      if (user) {
        const { password: _, ...userResult } = user;
        console.log("Login success");
        return res.status(200).json(userResult);
      }

      console.log("Login failed");
      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    if (path === "/logout" && req.method === "POST") {
      console.log("Logout");
      return res.status(200).json({ message: "Logout exitoso" });
    }

    // Demo data endpoints
    if (path === "/projects" && req.method === "GET") {
      return res.status(200).json(mockProjects);
    }

    if (path === "/documents" && req.method === "GET") {
      return res.status(200).json(mockDocuments);
    }

    if (path === "/folders" && req.method === "GET") {
      return res.status(200).json(mockFolders);
    }

    if (path === "/equipment" && req.method === "GET") {
      return res.status(200).json(mockEquipment);
    }

    if (path === "/equipment-types" && req.method === "GET") {
      const mockEquipmentTypes = [
        { id: 1, name: "Generadores", category: "energy", description: "Equipos generadores de energía eléctrica" },
        { id: 2, name: "Compresores", category: "tools", description: "Equipos de compresión de aire" },
        { id: 3, name: "Bombas", category: "hydraulic", description: "Sistemas de bombeo de fluidos" }
      ];
      return res.status(200).json(mockEquipmentTypes);
    }

    if (path === "/users" && req.method === "GET") {
      const usersWithoutPasswords = mockUsers.map(({ password, ...user }) => user);
      return res.status(200).json(usersWithoutPasswords);
    }

    return res.status(404).json({ message: "Endpoint no encontrado" });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      message: "Error interno",
      error: error.message 
    });
  }
}
