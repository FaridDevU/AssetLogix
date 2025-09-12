// 🎯 DATOS MOCK PARA DEMO - Reemplaza la base de datos real
// Perfecto para portfolio y demostración en Vercel

export interface MockUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  password: string;
  createdAt: Date;
  status: string;
  avatar: string | null;
  customRoleId: number | null;
}

export interface MockDocument {
  id: number;
  name: string;
  description: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: number;
  folderId: number | null;
  tags: string[];
  isPublic: boolean;
}

export interface MockProject {
  id: number;
  name: string;
  description: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  budget: number | null;
  managerId: number;
  createdAt: Date;
}

export interface MockFolder {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  createdAt: Date;
  createdBy: number;
}

// 👤 USUARIOS DE PRUEBA
export const mockUsers: MockUser[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@assetlogix.com",
    name: "Administrador Demo",
    role: "admin",
    password: "admin123", // En demo real esto estaría hasheado
    createdAt: new Date("2024-01-01"),
    status: "active",
    avatar: null,
    customRoleId: null
  },
  {
    id: 2,
    username: "manager",
    email: "manager@assetlogix.com", 
    name: "Gerente de Proyectos",
    role: "manager",
    password: "manager123",
    createdAt: new Date("2024-01-15"),
    status: "active",
    avatar: null,
    customRoleId: null
  },
  {
    id: 3,
    username: "usuario",
    email: "usuario@assetlogix.com",
    name: "Usuario Regular",
    role: "user", 
    password: "user123",
    createdAt: new Date("2024-02-01"),
    status: "active",
    avatar: null,
    customRoleId: null
  }
];

// 📁 CARPETAS DE PRUEBA
export const mockFolders: MockFolder[] = [
  {
    id: 1,
    name: "Documentos Corporativos",
    description: "Documentación oficial de la empresa",
    parentId: null,
    createdAt: new Date("2024-01-01"),
    createdBy: 1
  },
  {
    id: 2,
    name: "Proyectos Activos",
    description: "Documentos de proyectos en desarrollo",
    parentId: null,
    createdAt: new Date("2024-01-05"),
    createdBy: 1
  },
  {
    id: 3,
    name: "Manuales Técnicos",
    description: "Guías y manuales de equipos",
    parentId: 1,
    createdAt: new Date("2024-01-10"),
    createdBy: 2
  }
];

// 📄 DOCUMENTOS DE PRUEBA
export const mockDocuments: MockDocument[] = [
  {
    id: 1,
    name: "Manual de Usuarios - AssetLogix",
    description: "Guía completa para el uso del sistema AssetLogix",
    filePath: "/demo/manual-usuarios.pdf",
    fileSize: 2048576,
    mimeType: "application/pdf",
    uploadedAt: new Date("2024-01-15"),
    uploadedBy: 1,
    folderId: 1,
    tags: ["manual", "usuarios", "guía"],
    isPublic: true
  },
  {
    id: 2,
    name: "Especificaciones Técnicas - Sistema",
    description: "Documentación técnica del sistema de gestión",
    filePath: "/demo/especificaciones-tecnicas.docx",
    fileSize: 1536000,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    uploadedAt: new Date("2024-01-20"),
    uploadedBy: 2,
    folderId: 3,
    tags: ["técnico", "especificaciones", "sistema"],
    isPublic: false
  },
  {
    id: 3,
    name: "Plan de Implementación 2024",
    description: "Cronograma y plan de trabajo para la implementación",
    filePath: "/demo/plan-implementacion-2024.xlsx",
    fileSize: 512000,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    uploadedAt: new Date("2024-02-01"),
    uploadedBy: 2,
    folderId: 2,
    tags: ["plan", "implementación", "2024", "cronograma"],
    isPublic: true
  },
  {
    id: 4,
    name: "Políticas de Seguridad",
    description: "Documento con las políticas de seguridad informática",
    filePath: "/demo/politicas-seguridad.pdf",
    fileSize: 768000,
    mimeType: "application/pdf",
    uploadedAt: new Date("2024-02-10"),
    uploadedBy: 1,
    folderId: 1,
    tags: ["seguridad", "políticas", "informática"],
    isPublic: false
  }
];

// 🏗️ PROYECTOS DE PRUEBA
export const mockProjects: MockProject[] = [
  {
    id: 1,
    name: "Implementación AssetLogix",
    description: "Proyecto principal de implementación del sistema de gestión de activos",
    status: "en_progreso",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-06-30"),
    budget: 50000,
    managerId: 2,
    createdAt: new Date("2023-12-15")
  },
  {
    id: 2,
    name: "Migración de Datos",
    description: "Migración de datos del sistema legacy al nuevo AssetLogix",
    status: "completado",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-03-31"),
    budget: 15000,
    managerId: 2,
    createdAt: new Date("2024-01-20")
  },
  {
    id: 3,
    name: "Capacitación de Usuarios",
    description: "Programa de capacitación para usuarios del sistema",
    status: "planificado",
    startDate: new Date("2024-07-01"),
    endDate: new Date("2024-08-15"),
    budget: 8000,
    managerId: 1,
    createdAt: new Date("2024-02-15")
  },
  {
    id: 4,
    name: "Optimización de Procesos",
    description: "Revisión y optimización de procesos operativos",
    status: "en_progreso",
    startDate: new Date("2024-03-01"),
    endDate: null,
    budget: null,
    managerId: 2,
    createdAt: new Date("2024-02-28")
  }
];

// 🔄 FUNCIONES PARA SIMULAR OPERACIONES DE BASE DE DATOS
export class MockDatabase {
  private static users = [...mockUsers];
  private static documents = [...mockDocuments];
  private static projects = [...mockProjects];
  private static folders = [...mockFolders];
  private static nextUserId = mockUsers.length + 1;
  private static nextDocumentId = mockDocuments.length + 1;
  private static nextProjectId = mockProjects.length + 1;
  private static nextFolderId = mockFolders.length + 1;

  // 👤 USUARIOS
  static getUsers() {
    return this.users;
  }

  static getUserByEmail(email: string) {
    return this.users.find(user => user.email === email);
  }

  static getUserById(id: number) {
    return this.users.find(user => user.id === id);
  }

  static createUser(userData: Omit<MockUser, 'id' | 'createdAt'>) {
    const newUser: MockUser = {
      ...userData,
      id: this.nextUserId++,
      createdAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  // 📄 DOCUMENTOS
  static getDocuments() {
    return this.documents;
  }

  static getDocumentsByFolder(folderId: number | null) {
    return this.documents.filter(doc => doc.folderId === folderId);
  }

  static createDocument(docData: Omit<MockDocument, 'id' | 'uploadedAt'>) {
    const newDoc: MockDocument = {
      ...docData,
      id: this.nextDocumentId++,
      uploadedAt: new Date()
    };
    this.documents.push(newDoc);
    return newDoc;
  }

  static deleteDocument(id: number) {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index > -1) {
      return this.documents.splice(index, 1)[0];
    }
    return null;
  }

  // 🏗️ PROYECTOS
  static getProjects() {
    return this.projects;
  }

  static getProjectById(id: number) {
    return this.projects.find(project => project.id === id);
  }

  static createProject(projectData: Omit<MockProject, 'id' | 'createdAt'>) {
    const newProject: MockProject = {
      ...projectData,
      id: this.nextProjectId++,
      createdAt: new Date()
    };
    this.projects.push(newProject);
    return newProject;
  }

  static updateProject(id: number, updates: Partial<MockProject>) {
    const index = this.projects.findIndex(project => project.id === id);
    if (index > -1) {
      this.projects[index] = { ...this.projects[index], ...updates };
      return this.projects[index];
    }
    return null;
  }

  static deleteProject(id: number) {
    const index = this.projects.findIndex(project => project.id === id);
    if (index > -1) {
      return this.projects.splice(index, 1)[0];
    }
    return null;
  }

  // 📁 CARPETAS
  static getFolders() {
    return this.folders;
  }

  static getFoldersByParent(parentId: number | null) {
    return this.folders.filter(folder => folder.parentId === parentId);
  }

  static createFolder(folderData: Omit<MockFolder, 'id' | 'createdAt'>) {
    const newFolder: MockFolder = {
      ...folderData,
      id: this.nextFolderId++,
      createdAt: new Date()
    };
    this.folders.push(newFolder);
    return newFolder;
  }

  // � FUNCIONES DE USUARIOS ADICIONALES
  static updateUserRole(userId: number, newRole: string): MockUser | null {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.role = newRole;
      console.log(`✅ Usuario ${userId} actualizado a rol: ${newRole}`);
      return user;
    }
    console.log(`❌ Usuario ${userId} no encontrado`);
    return null;
  }

  static updateUserStatus(userId: number, newStatus: string): MockUser | null {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = newStatus;
      console.log(`✅ Usuario ${userId} actualizado a estado: ${newStatus}`);
      return user;
    }
    console.log(`❌ Usuario ${userId} no encontrado`);
    return null;
  }

  // �🔄 RESET (útil para testing)
  static reset() {
    this.users = [...mockUsers];
    this.documents = [...mockDocuments];
    this.projects = [...mockProjects];
    this.folders = [...mockFolders];
    this.nextUserId = mockUsers.length + 1;
    this.nextDocumentId = mockDocuments.length + 1;
    this.nextProjectId = mockProjects.length + 1;
    this.nextFolderId = mockFolders.length + 1;
  }
}

console.log("🎯 Mock Database inicializada para demo");
console.log(`📊 Datos disponibles: ${mockUsers.length} usuarios, ${mockDocuments.length} documentos, ${mockProjects.length} proyectos`);
