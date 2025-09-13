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
        budget: 150000,
        location: "Centro de la Ciudad",
        clientName: "Constructora Demo S.A.",
        createdBy: "admin",
        createdAt: "2024-01-15T00:00:00Z",
        updatedAt: "2024-09-15T00:00:00Z"
      },
      {
        id: 2,
        name: "Mantenimiento Equipos Q4",
        description: "Proyecto de mantenimiento preventivo trimestre 4",
        status: "active",
        progress: 30,
        startDate: "2024-10-01",
        endDate: "2024-12-31",
        budget: 25000,
        location: "Instalaciones Principales",
        clientName: "Interno",
        createdBy: "technician",
        createdAt: "2024-10-01T00:00:00Z",
        updatedAt: "2024-10-15T00:00:00Z"
      },
      {
        id: 3,
        name: "Actualización Sistema HVAC",
        description: "Modernización del sistema de climatización",
        status: "completed",
        progress: 100,
        startDate: "2024-03-01",
        endDate: "2024-08-30",
        budget: 80000,
        location: "Edificio Principal",
        clientName: "HVAC Solutions Corp",
        createdBy: "admin",
        createdAt: "2024-03-01T00:00:00Z",
        updatedAt: "2024-08-30T00:00:00Z"
      }
    ];

    // Mock documents data
    const mockDocuments = [
      {
        id: 1,
        name: "Manual de Usuario AssetLogix",
        type: "pdf",
        size: 2621440, // 2.5 MB in bytes
        uploadDate: "2024-09-01",
        category: "documentation",
        currentVersion: 1,
        originalExtension: ".pdf",
        createdAt: "2024-09-01T08:00:00Z",
        updatedAt: "2024-09-01T08:00:00Z",
        folderId: null
      },
      {
        id: 2,
        name: "Protocolo Mantenimiento Preventivo",
        type: "docx", 
        size: 911360, // 890 KB in bytes
        uploadDate: "2024-09-05",
        category: "maintenance",
        currentVersion: 2,
        originalExtension: ".docx",
        createdAt: "2024-09-05T10:30:00Z",
        updatedAt: "2024-09-15T14:20:00Z",
        folderId: 2
      },
      {
        id: 3,
        name: "Reporte Inventario Agosto 2024",
        type: "xlsx",
        size: 1258291, // 1.2 MB in bytes
        uploadDate: "2024-09-10",
        category: "inventory",
        currentVersion: 1,
        originalExtension: ".xlsx",
        createdAt: "2024-09-10T16:45:00Z",
        updatedAt: "2024-09-10T16:45:00Z",
        folderId: 3
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
        category: "energy",
        status: "operational",
        condition: "excellent",
        location: "Sala de Máquinas A",
        serialNumber: "CAT-100KW-2023-001",
        model: "CAT DE100E0",
        brand: "Caterpillar",
        purchaseDate: "2023-01-15",
        purchasePrice: 45000,
        warrantyExpiration: "2026-01-15",
        lastMaintenance: "2024-08-15",
        nextMaintenance: "2024-11-15",
        notes: "Generador de respaldo principal para el edificio",
        createdAt: "2023-01-15T00:00:00Z",
        updatedAt: "2024-08-15T00:00:00Z"
      },
      {
        id: 2,
        name: "Compresor de Aire Industrial",
        type: "compressor",
        category: "tools",
        status: "maintenance",
        condition: "good",
        location: "Taller Principal",
        serialNumber: "COMP-IND-2022-002",
        model: "Atlas Copco GA15",
        brand: "Atlas Copco",
        purchaseDate: "2022-06-20",
        purchasePrice: 12000,
        warrantyExpiration: "2025-06-20",
        lastMaintenance: "2024-09-01",
        nextMaintenance: "2024-12-01",
        notes: "En mantenimiento preventivo programado",
        createdAt: "2022-06-20T00:00:00Z",
        updatedAt: "2024-09-01T00:00:00Z"
      },
      {
        id: 3,
        name: "Bomba Centrífuga 50HP",
        type: "pump",
        category: "hydraulic",
        status: "operational",
        condition: "good",
        location: "Planta Baja",
        serialNumber: "PUMP-50HP-2021-003",
        model: "Grundfos CR64-2",
        brand: "Grundfos",
        purchaseDate: "2021-03-10",
        purchasePrice: 8500,
        warrantyExpiration: "2024-03-10",
        lastMaintenance: "2024-07-20",
        nextMaintenance: "2024-10-20",
        notes: "Sistema de agua principal del edificio",
        createdAt: "2021-03-10T00:00:00Z",
        updatedAt: "2024-07-20T00:00:00Z"
      }
    ];

    const url = new URL(req.url, "https://" + req.headers.host);
    const path = url.pathname.replace("/api", "");

    if (path === "/user" && req.method === "GET") {
      const hasSession = req.headers["x-demo-session"];
      
      if (!hasSession || hasSession !== "active") {
        return res.status(401).json({ message: "No autenticado" });
      }
      
      const demoUser = mockUsers[0];
      const { password: _, ...userResult } = demoUser;
      return res.status(200).json(userResult);
    }

    if (path === "/login" && req.method === "POST") {
      const body = req.body || {};
      const { username, password } = body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username y password requeridos" });
      }

      const user = mockUsers.find(u => 
        (u.username === username || u.email === username) && u.password === password
      );

      if (user) {
        const { password: _, ...userResult } = user;
        return res.status(200).json(userResult);
      }

      return res.status(401).json({ message: "Credenciales invalidas" });
    }

    if (path === "/logout" && req.method === "POST") {
      return res.status(200).json({ message: "Logout exitoso" });
    }

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
