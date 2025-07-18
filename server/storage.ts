import {
  User,
  InsertUser,
  Folder,
  InsertFolder,
  FolderPermission,
  InsertFolderPermission,
  Document,
  InsertDocument,
  DocumentVersion,
  InsertDocumentVersion,
  DocumentActivity,
  InsertDocumentActivity,
  EquipmentType,
  InsertEquipmentType,
  Equipment,
  InsertEquipment,
  MaintenanceSchedule,
  InsertMaintenanceSchedule,
  MaintenanceIntervention,
  InsertMaintenanceIntervention,
  MaintenanceAttachment,
  InsertMaintenanceAttachment,
  IotDevice,
  InsertIotDevice,
  IotSensor,
  InsertIotSensor,
  SensorReading,
  InsertSensorReading,
  MaintenancePrediction,
  InsertMaintenancePrediction,
  PredictionEvidence,
  InsertPredictionEvidence,
  AlertNotification,
  InsertAlertNotification,
  Comment,
  InsertComment,
  Task,
  InsertTask,
  Reaction,
  InsertReaction,
  Project,
  InsertProject,
  ProjectManager,
  InsertProjectManager,
  ProjectDocument,
  InsertProjectDocument,
  ProjectMember,
  InsertProjectMember,
  Role,
  InsertRole
} from '@shared/schema';
import { db } from './db';
import { eq, desc, gte, lt, and } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(roles: string[]): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  changeUserStatus(id: number, status: string): Promise<User | undefined>;
  assignCustomRoleToUser(userId: number, roleId: number): Promise<User | undefined>;
  
  // Roles y permisos
  getAllRoles(): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, data: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: number): Promise<boolean>;
  getUserWithPermissions(userId: number): Promise<User & { permissions?: Role }>;
  
  // Folders
  createFolder(folder: InsertFolder): Promise<Folder>;
  getFolder(id: number): Promise<Folder | undefined>;
  getFolders(parentId?: number): Promise<Folder[]>;
  updateFolder(id: number, data: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  
  // Permisos de carpetas
  getFolderPermission(folderId: number, userId: number): Promise<FolderPermission | undefined>;
  getFolderPermissionsByUser(userId: number): Promise<FolderPermission[]>;
  getFolderPermissionsByFolder(folderId: number): Promise<FolderPermission[]>;
  createFolderPermission(permission: InsertFolderPermission): Promise<FolderPermission>;
  updateFolderPermission(id: number, permission: Partial<InsertFolderPermission>): Promise<FolderPermission | undefined>;
  deleteFolderPermission(id: number): Promise<boolean>;
  hasPermissionToViewFolder(folderId: number, userId: number): Promise<boolean>;
  
  // Documents
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(folderId?: number): Promise<Document[]>;
  updateDocument(id: number, data: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  searchDocuments(query: string): Promise<Document[]>;
  
  // Document Versions
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  getDocumentVersions(documentId: number): Promise<DocumentVersion[]>;
  getDocumentVersion(id: number): Promise<DocumentVersion | undefined>;
  
  // Document Activity
  logDocumentActivity(activity: InsertDocumentActivity): Promise<DocumentActivity>;
  getDocumentActivity(documentId: number): Promise<DocumentActivity[]>;
  getRecentActivity(limit?: number): Promise<DocumentActivity[]>;
  
  // Equipment Types
  createEquipmentType(type: InsertEquipmentType): Promise<EquipmentType>;
  getEquipmentTypes(): Promise<EquipmentType[]>;
  getEquipmentType(id: number): Promise<EquipmentType | undefined>;
  getEquipmentByType(typeId: number): Promise<Equipment[]>;
  deleteEquipmentType(id: number): Promise<boolean>;
  
  // Equipment
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  getEquipment(id: number): Promise<Equipment | undefined>;
  getEquipmentByCode(code: string): Promise<Equipment | undefined>;
  getAllEquipment(): Promise<Equipment[]>;
  updateEquipment(id: number, data: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipment(id: number): Promise<boolean>;
  searchEquipment(query: string): Promise<Equipment[]>;
  
  // Maintenance Schedules
  createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule>;
  getMaintenanceSchedules(equipmentId?: number): Promise<MaintenanceSchedule[]>;
  getMaintenanceSchedule(id: number): Promise<MaintenanceSchedule | undefined>;
  updateMaintenanceSchedule(id: number, data: Partial<InsertMaintenanceSchedule>): Promise<MaintenanceSchedule | undefined>;
  deleteMaintenanceSchedule(id: number): Promise<boolean>;
  getUpcomingMaintenances(days: number): Promise<MaintenanceSchedule[]>;
  
  // Maintenance Interventions
  createMaintenanceIntervention(intervention: InsertMaintenanceIntervention): Promise<MaintenanceIntervention>;
  getMaintenanceInterventions(equipmentId?: number): Promise<MaintenanceIntervention[]>;
  getMaintenanceIntervention(id: number): Promise<MaintenanceIntervention | undefined>;
  updateMaintenanceIntervention(id: number, data: Partial<InsertMaintenanceIntervention>): Promise<MaintenanceIntervention | undefined>;
  deleteMaintenanceIntervention(id: number): Promise<boolean>;
  getRecentInterventions(limit?: number): Promise<MaintenanceIntervention[]>;
  getPastInterventions(page?: number, pageSize?: number): Promise<MaintenanceIntervention[]>;
  
  // Maintenance Attachments
  createMaintenanceAttachment(attachment: InsertMaintenanceAttachment): Promise<MaintenanceAttachment>;
  getMaintenanceAttachments(interventionId: number): Promise<MaintenanceAttachment[]>;
  getMaintenanceAttachment(id: number): Promise<MaintenanceAttachment | undefined>;
  deleteMaintenanceAttachment(id: number): Promise<boolean>;
  
  // IoT Devices
  createIotDevice(device: InsertIotDevice): Promise<IotDevice>;
  getIotDevices(): Promise<IotDevice[]>;
  getIotDevice(id: number): Promise<IotDevice | undefined>;
  getIotDeviceByApiKey(apiKey: string): Promise<IotDevice | undefined>;
  updateIotDevice(id: number, data: Partial<IotDevice>): Promise<IotDevice | undefined>;
  deleteIotDevice(id: number): Promise<boolean>;

  // IoT Sensors
  createIotSensor(sensor: InsertIotSensor): Promise<IotSensor>;
  getIotSensors(equipmentId?: number): Promise<IotSensor[]>;
  getIotSensor(id: number): Promise<IotSensor | undefined>;
  updateIotSensor(id: number, data: Partial<IotSensor>): Promise<IotSensor | undefined>;
  deleteIotSensor(id: number): Promise<boolean>;

  // Sensor Readings
  createSensorReading(reading: InsertSensorReading): Promise<SensorReading>;
  getSensorReadings(sensorId?: number, startDate?: Date, endDate?: Date, limit?: number): Promise<SensorReading[]>;
  getSensorReading(id: number): Promise<SensorReading | undefined>;

  // Maintenance Predictions
  createMaintenancePrediction(prediction: InsertMaintenancePrediction): Promise<MaintenancePrediction>;
  getMaintenancePredictions(equipmentId?: number, status?: string): Promise<MaintenancePrediction[]>;
  getMaintenancePrediction(id: number): Promise<MaintenancePrediction | undefined>;
  updateMaintenancePrediction(id: number, data: Partial<MaintenancePrediction>): Promise<MaintenancePrediction | undefined>;

  // Prediction Evidence
  createPredictionEvidence(evidence: InsertPredictionEvidence): Promise<PredictionEvidence>;
  getPredictionEvidence(predictionId: number): Promise<PredictionEvidence[]>;

  // Alert Notifications
  createAlertNotification(notification: InsertAlertNotification): Promise<AlertNotification>;
  getAlertNotifications(userId: number, status?: string): Promise<AlertNotification[]>;
  getAlertNotification(id: number): Promise<AlertNotification | undefined>;
  updateAlertNotification(id: number, data: Partial<AlertNotification>): Promise<AlertNotification | undefined>;
  deleteAlertNotification(id: number): Promise<boolean>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByDocument(documentId: number): Promise<Comment[]>;
  getCommentsByEquipment(equipmentId: number): Promise<Comment[]>;
  getCommentsByMaintenance(maintenanceId: number): Promise<Comment[]>;
  getCommentReplies(parentId: number): Promise<Comment[]>;
  updateComment(id: number, data: Partial<Comment>): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;

  // Tasks
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByDocument(documentId: number): Promise<Task[]>;
  getTasksByEquipment(equipmentId: number): Promise<Task[]>;
  getTasksByMaintenance(maintenanceId: number): Promise<Task[]>;
  getTasksByAssignee(assignedToId: number): Promise<Task[]>;
  getTasksByCreator(createdById: number): Promise<Task[]>;
  updateTask(id: number, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Reactions
  createReaction(reaction: InsertReaction): Promise<Reaction>;
  getReactionsByComment(commentId: number): Promise<{emoji: string, count: number}[]>;
  getReactionsByTask(taskId: number): Promise<{emoji: string, count: number}[]>;
  getUserReactionsByComment(userId: number, commentId: number): Promise<string[]>;
  getUserReactionsByTask(userId: number, taskId: number): Promise<string[]>;
  toggleReaction(userId: number, emoji: string, commentId?: number, taskId?: number): Promise<Reaction | null>;
  deleteReaction(id: number): Promise<boolean>;
  
  // Projects (Obras)
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Project Managers
  addProjectManager(manager: InsertProjectManager): Promise<ProjectManager>;
  getProjectManagers(projectId: number): Promise<ProjectManager[]>;
  removeProjectManager(id: number): Promise<boolean>;
  
  // Project Documents
  addProjectDocument(document: InsertProjectDocument): Promise<ProjectDocument>;
  getProjectDocuments(projectId: number): Promise<ProjectDocument[]>;
  removeProjectDocument(id: number): Promise<boolean>;
  
  // Project Members
  getProjectsByUserId(userId: number): Promise<Project[]>;
  isProjectManager(projectId: number, userId: number): Promise<boolean>;
  isProjectMember(projectId: number, userId: number): Promise<boolean>;
  getProjectMembers(projectId: number): Promise<ProjectMember[]>;
  getProjectMemberById(id: number): Promise<ProjectMember | undefined>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  updateProjectMember(id: number, data: Partial<ProjectMember>): Promise<ProjectMember | undefined>;
  removeProjectMember(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private folders: Map<number, Folder>;
  private documents: Map<number, Document>;
  private documentVersions: Map<number, DocumentVersion>;
  private documentActivities: Map<number, DocumentActivity>;
  private equipmentTypes: Map<number, EquipmentType>;
  private equipments: Map<number, Equipment>;
  private maintenanceSchedules: Map<number, MaintenanceSchedule>;
  private maintenanceInterventions: Map<number, MaintenanceIntervention>;
  private maintenanceAttachments: Map<number, MaintenanceAttachment>;
  private iotDevices: Map<number, IotDevice>;
  private iotSensors: Map<number, IotSensor>;
  private sensorReadings: Map<number, SensorReading>;
  private maintenancePredictions: Map<number, MaintenancePrediction>;
  private predictionEvidence: Map<number, PredictionEvidence>;
  private alertNotifications: Map<number, AlertNotification>;
  private comments: Map<number, Comment>;
  private tasks: Map<number, Task>;
  private reactions: Map<number, Reaction>;
  private projects: Map<number, Project>;
  private projectManagers: Map<number, ProjectManager>;
  private projectDocuments: Map<number, ProjectDocument>;
  private projectMembers: Map<number, ProjectMember>;
  private folderPermissions: Map<number, FolderPermission>;
  
  private userIdCounter: number;
  private folderIdCounter: number;
  private documentIdCounter: number;
  private documentVersionIdCounter: number;
  private documentActivityIdCounter: number;
  private equipmentTypeIdCounter: number;
  private equipmentIdCounter: number;
  private maintenanceScheduleIdCounter: number;
  private maintenanceInterventionIdCounter: number;
  private maintenanceAttachmentIdCounter: number;
  private iotDeviceIdCounter: number;
  private iotSensorIdCounter: number;
  private sensorReadingIdCounter: number;
  private maintenancePredictionIdCounter: number;
  private predictionEvidenceIdCounter: number;
  private alertNotificationIdCounter: number;
  private commentIdCounter: number;
  private taskIdCounter: number;
  private reactionIdCounter: number;
  private projectIdCounter: number;
  private projectManagerIdCounter: number;
  private projectDocumentIdCounter: number;
  private projectMemberIdCounter: number;
  private folderPermissionIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.folders = new Map();
    this.documents = new Map();
    this.documentVersions = new Map();
    this.documentActivities = new Map();
    this.equipmentTypes = new Map();
    this.equipments = new Map();
    this.maintenanceSchedules = new Map();
    this.maintenanceInterventions = new Map();
    this.maintenanceAttachments = new Map();
    this.iotDevices = new Map();
    this.iotSensors = new Map();
    this.sensorReadings = new Map();
    this.maintenancePredictions = new Map();
    this.predictionEvidence = new Map();
    this.alertNotifications = new Map();
    this.comments = new Map();
    this.tasks = new Map();
    this.reactions = new Map();
    this.projects = new Map();
    this.projectManagers = new Map();
    this.projectDocuments = new Map();
    this.projectMembers = new Map();
    this.folderPermissions = new Map();
    
    this.userIdCounter = 1;
    this.folderIdCounter = 1;
    this.documentIdCounter = 1;
    this.documentVersionIdCounter = 1;
    this.documentActivityIdCounter = 1;
    this.equipmentTypeIdCounter = 1;
    this.equipmentIdCounter = 1;
    this.maintenanceScheduleIdCounter = 1;
    this.maintenanceInterventionIdCounter = 1;
    this.maintenanceAttachmentIdCounter = 1;
    this.iotDeviceIdCounter = 1;
    this.iotSensorIdCounter = 1;
    this.sensorReadingIdCounter = 1;
    this.maintenancePredictionIdCounter = 1;
    this.predictionEvidenceIdCounter = 1;
    this.alertNotificationIdCounter = 1;
    this.commentIdCounter = 1;
    this.taskIdCounter = 1;
    this.reactionIdCounter = 1;
    this.projectIdCounter = 1;
    this.projectManagerIdCounter = 1;
    this.projectDocumentIdCounter = 1;
    this.projectMemberIdCounter = 1;
    this.folderPermissionIdCounter = 1;

    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create admin user (pre-hashed password for 'admin123')
    this.createUser({
      username: 'admin@example.com',
      password: '2d2da392cbd3c177f1c59e56b036177f0d171e4b5a54b23accb600a9b7a5c4ec88b21f1a2d1c78109e5641a775e7811c796dc32c0e053429cad51e01c1623b5f.44b5223c76af5c996db32d2bafc7e9b5',
      email: 'admin@example.com',
      name: 'Carlos Rodríguez',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    });

    // Create technician user (pre-hashed password for 'tech123')
    this.createUser({
      username: 'tecnico@example.com',
      password: '8b27de3de0a0dfa8a33f9fa02f8fab8aac6c3d778f32f3aa13a5ffabd0eb35cd03f62cb0c44d10c0ae50c709c76d6ad8dcdc8443436ce36886b33a13628eaa85.9857e84c668c881e303eed0b061ebc30',
      email: 'tecnico@example.com',
      name: 'Juan Pérez',
      role: 'technician',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    });

    // Create regular user (pre-hashed password for 'user123')
    this.createUser({
      username: 'user@example.com',
      password: '0bc6ff736a75f50ae5c70b83d616663090d702a54fc6873d5f366fe8b04f0f15bd5aaa1e9a6bb1e68dad5e96ea5b7ab8d6c33fe5123dddf2d1c87a71cfb75fe7.5c3a286b85ec8b9dc3818d86e2a355d6',
      email: 'user@example.com',
      name: 'Laura Martínez',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80'
    });

    // Create root folder
    const rootFolder = this.createFolder({
      name: 'Documentos',
      path: '/',
      createdBy: 1,
    });

    // Create subfolders
    const techFolder = this.createFolder({
      name: 'Técnicos',
      path: '/Técnicos',
      parentId: rootFolder.id,
      createdBy: 1,
    });
    
    // Crear permisos para las carpetas
    // Permiso del administrador en la carpeta raíz (propietario)
    this.createFolderPermission({
      folderId: rootFolder.id,
      userId: 1,
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      isOwner: true
    });
    
    // Permisos del técnico en la carpeta Técnicos
    this.createFolderPermission({
      folderId: techFolder.id,
      userId: 2,
      canView: true,
      canEdit: true,
      canDelete: false,
      canShare: true,
      isOwner: false
    });

    this.createFolder({
      name: 'Manuales de Operación',
      path: '/Técnicos/Manuales de Operación',
      parentId: 2,
      createdBy: 1,
    });

    // Create equipment types
    this.createEquipmentType({
      name: 'Compresor',
      description: 'Equipos de compresión de aire'
    });

    this.createEquipmentType({
      name: 'Motor',
      description: 'Motores eléctricos'
    });

    this.createEquipmentType({
      name: 'Hidráulico',
      description: 'Sistemas hidráulicos'
    });

    this.createEquipmentType({
      name: 'Refrigeración',
      description: 'Unidades de refrigeración'
    });

    // Create equipment
    this.createEquipment({
      name: 'Compresor Industrial #101',
      code: 'COMP-101',
      typeId: 1,
      status: 'operational',
      location: 'Planta A',
      installationDate: new Date('2020-05-10'),
      specifications: { power: '75kW', pressure: '16 bar', capacity: '10 m³/min' },
      photo: 'https://images.unsplash.com/photo-1580901368919-7738efb0f87e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80'
    });

    this.createEquipment({
      name: 'Motor Eléctrico #42',
      code: 'MTR-042',
      typeId: 2,
      status: 'maintenance',
      location: 'Planta B',
      installationDate: new Date('2021-08-23'),
      specifications: { power: '30kW', voltage: '480V', rpm: '1750' },
      photo: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80'
    });

    this.createEquipment({
      name: 'Sistema Hidráulico #8',
      code: 'HYD-008',
      typeId: 3,
      status: 'maintenance',
      location: 'Planta A',
      installationDate: new Date('2019-03-05'),
      specifications: { pressure: '320 bar', flow: '120 l/min', tank: '200 l' },
      photo: 'https://images.unsplash.com/photo-1581093806997-124204d9fa9d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80'
    });

    // Create maintenance schedules
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(11, 30, 0, 0);

    this.createMaintenanceSchedule({
      equipmentId: 1,
      type: 'preventive',
      frequency: 'monthly',
      nextDate: tomorrow,
      description: 'Revisión general del compresor',
      reminderDays: 2
    });

    this.createMaintenanceSchedule({
      equipmentId: 2,
      type: 'preventive',
      frequency: 'quarterly',
      nextDate: nextWeek,
      description: 'Revisión y mantenimiento del motor',
      reminderDays: 3
    });

    // Create maintenance interventions
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    this.createMaintenanceIntervention({
      equipmentId: 1,
      scheduleId: 1,
      type: 'preventive',
      status: 'completed',
      startDate: yesterday,
      endDate: yesterday,
      technician: 2,
      findings: 'Funcionamiento normal, se realizó limpieza de filtros',
      actions: 'Limpieza y ajuste de componentes',
      parts: { 'Filtro de aire': 1, 'Aceite lubricante': '5L' }
    });

    this.createMaintenanceIntervention({
      equipmentId: 2,
      scheduleId: 2,
      type: 'corrective',
      status: 'completed',
      startDate: twoDaysAgo,
      endDate: twoDaysAgo,
      technician: 2,
      findings: 'Sobrecalentamiento en rodamientos',
      actions: 'Reemplazo de rodamientos y verificación de alineación',
      parts: { 'Rodamientos': 2, 'Grasa especial': '500g' }
    });

    // Create comments
    const comment1 = this.createComment({
      content: 'El compresor está funcionando bien después del mantenimiento',
      userId: 1,
      equipmentId: 1
    });
    
    const comment2 = this.createComment({
      content: 'Se recomienda realizar revisión del filtro cada 3 meses',
      userId: 2,
      equipmentId: 1
    });
    
    const comment3 = this.createComment({
      content: 'Hay que verificar la temperatura del motor regularmente',
      userId: 2,
      equipmentId: 2
    });
    
    // Create tasks
    this.createTask({
      title: 'Revisar filtros del compresor',
      description: 'Realizar inspección y limpieza de los filtros',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      assignedToId: 2,
      createdById: 1,
      equipmentId: 1
    });
    
    this.createTask({
      title: 'Calibrar sensores del motor',
      description: 'Calibrar los sensores de temperatura y vibración',
      status: 'pending',
      priority: 'high',
      dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      assignedToId: 2,
      createdById: 1,
      equipmentId: 2
    });
    
    // Create reactions
    this.createReaction({
      emoji: '👍',
      userId: 1,
      commentId: 1
    });
    
    this.createReaction({
      emoji: '👏',
      userId: 3,
      commentId: 1
    });
    
    this.createReaction({
      emoji: '👍',
      userId: 2,
      commentId: 2
    });
    
    // Create folder permissions
    this.createFolderPermission({
      userId: 1,
      folderId: 1,
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      isOwner: true
    });
    
    this.createFolderPermission({
      userId: 2,
      folderId: 2,
      canView: true,
      canEdit: true,
      canDelete: false,
      canShare: false,
      isOwner: false
    });
    
    this.createFolderPermission({
      userId: 3,
      folderId: 1,
      canView: true,
      canEdit: false,
      canDelete: false,
      canShare: false,
      isOwner: false
    });
  }
  
  // USERS
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(roles: string[]): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      roles.includes(user.role)
    );
  }
  
  // FOLDERS
  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const id = this.folderIdCounter++;
    const now = new Date();
    const folder: Folder = {
      ...insertFolder,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.folders.set(id, folder);
    return folder;
  }
  
  async getFolder(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }
  
  async getFolders(parentId?: number): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(folder => 
      parentId === undefined ? true : folder.parentId === parentId
    );
  }
  
  async updateFolder(id: number, data: Partial<InsertFolder>): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (!folder) return undefined;
    
    const updatedFolder: Folder = {
      ...folder,
      ...data,
      updatedAt: new Date()
    };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }
  
  async deleteFolder(id: number): Promise<boolean> {
    return this.folders.delete(id);
  }
  
  // FOLDER PERMISSIONS
  async getFolderPermission(folderId: number, userId: number): Promise<FolderPermission | undefined> {
    return Array.from(this.folderPermissions.values()).find(
      (permission) => permission.folderId === folderId && permission.userId === userId
    );
  }
  
  async getFolderPermissionsByUser(userId: number): Promise<FolderPermission[]> {
    return Array.from(this.folderPermissions.values()).filter(
      (permission) => permission.userId === userId
    );
  }
  
  async getFolderPermissionsByFolder(folderId: number): Promise<FolderPermission[]> {
    return Array.from(this.folderPermissions.values()).filter(
      (permission) => permission.folderId === folderId
    );
  }
  
  async createFolderPermission(permission: InsertFolderPermission): Promise<FolderPermission> {
    const id = this.folderPermissionIdCounter++;
    const now = new Date();
    const folderPermission: FolderPermission = {
      ...permission,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.folderPermissions.set(id, folderPermission);
    return folderPermission;
  }
  
  async updateFolderPermission(id: number, permission: Partial<InsertFolderPermission>): Promise<FolderPermission | undefined> {
    const existingPermission = this.folderPermissions.get(id);
    if (!existingPermission) return undefined;
    
    const updatedPermission: FolderPermission = {
      ...existingPermission,
      ...permission,
      updatedAt: new Date()
    };
    this.folderPermissions.set(id, updatedPermission);
    return updatedPermission;
  }
  
  async deleteFolderPermission(id: number): Promise<boolean> {
    return this.folderPermissions.delete(id);
  }
  
  async hasPermissionToViewFolder(folderId: number, userId: number): Promise<boolean> {
    // Check if user has direct permission for this folder
    const directPermission = await this.getFolderPermission(folderId, userId);
    if (directPermission?.canView) {
      return true;
    }
    
    // Check if user is admin (role = 'admin')
    const user = await this.getUser(userId);
    if (user?.role === 'admin') {
      return true;
    }
    
    // Check parent folders recursively (permissions inherit from parent to child)
    const folder = await this.getFolder(folderId);
    if (folder?.parentId) {
      return this.hasPermissionToViewFolder(folder.parentId, userId);
    }
    
    return false;
  }
  
  // DOCUMENTS
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const now = new Date();
    const document: Document = {
      ...insertDocument,
      id,
      currentVersion: 1,
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, document);
    return document;
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getDocuments(folderId?: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => 
      folderId === undefined ? true : doc.folderId === folderId
    );
  }
  
  async updateDocument(id: number, data: Partial<InsertDocument>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument: Document = {
      ...document,
      ...data,
      updatedAt: new Date()
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }
  
  async searchDocuments(query: string): Promise<Document[]> {
    query = query.toLowerCase();
    return Array.from(this.documents.values()).filter(
      doc => doc.name.toLowerCase().includes(query)
    );
  }
  
  // DOCUMENT VERSIONS
  async createDocumentVersion(insertVersion: InsertDocumentVersion): Promise<DocumentVersion> {
    const id = this.documentVersionIdCounter++;
    const version: DocumentVersion = {
      ...insertVersion,
      id,
      createdAt: new Date()
    };
    this.documentVersions.set(id, version);
    
    // Update current version in the document
    const document = await this.getDocument(version.documentId);
    if (document) {
      await this.updateDocument(document.id, { currentVersion: version.version });
    }
    
    return version;
  }
  
  async getDocumentVersions(documentId: number): Promise<DocumentVersion[]> {
    return Array.from(this.documentVersions.values())
      .filter(version => version.documentId === documentId)
      .sort((a, b) => b.version - a.version);
  }
  
  async getDocumentVersion(id: number): Promise<DocumentVersion | undefined> {
    return this.documentVersions.get(id);
  }
  
  // DOCUMENT ACTIVITY
  async logDocumentActivity(insertActivity: InsertDocumentActivity): Promise<DocumentActivity> {
    const id = this.documentActivityIdCounter++;
    const activity: DocumentActivity = {
      ...insertActivity,
      id,
      createdAt: new Date()
    };
    this.documentActivities.set(id, activity);
    return activity;
  }
  
  async getDocumentActivity(documentId: number): Promise<DocumentActivity[]> {
    return Array.from(this.documentActivities.values())
      .filter(activity => activity.documentId === documentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getRecentActivity(limit = 10): Promise<DocumentActivity[]> {
    return Array.from(this.documentActivities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  // EQUIPMENT TYPES
  async createEquipmentType(insertType: InsertEquipmentType): Promise<EquipmentType> {
    const id = this.equipmentTypeIdCounter++;
    const type: EquipmentType = {
      ...insertType,
      id,
    };
    this.equipmentTypes.set(id, type);
    return type;
  }
  
  async getEquipmentTypes(): Promise<EquipmentType[]> {
    return Array.from(this.equipmentTypes.values());
  }
  
  async getEquipmentType(id: number): Promise<EquipmentType | undefined> {
    return this.equipmentTypes.get(id);
  }
  
  async getEquipmentByType(typeId: number): Promise<Equipment[]> {
    const result: Equipment[] = [];
    for (const equipment of this.equipment.values()) {
      if (equipment.typeId === typeId) {
        result.push(equipment);
      }
    }
    return result;
  }
  
  async deleteEquipmentType(id: number): Promise<boolean> {
    return this.equipmentTypes.delete(id);
  }
  
  // EQUIPMENT
  async createEquipment(insertEquipment: InsertEquipment): Promise<Equipment> {
    const id = this.equipmentIdCounter++;
    const now = new Date();
    const equipment: Equipment = {
      ...insertEquipment,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.equipments.set(id, equipment);
    return equipment;
  }
  
  async getEquipment(id: number): Promise<Equipment | undefined> {
    return this.equipments.get(id);
  }
  
  async getEquipmentByCode(code: string): Promise<Equipment | undefined> {
    return Array.from(this.equipments.values()).find(
      equipment => equipment.code === code
    );
  }
  
  async getAllEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipments.values());
  }
  
  async updateEquipment(id: number, data: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const equipment = this.equipments.get(id);
    if (!equipment) return undefined;
    
    const updatedEquipment: Equipment = {
      ...equipment,
      ...data,
      updatedAt: new Date()
    };
    this.equipments.set(id, updatedEquipment);
    return updatedEquipment;
  }
  
  async deleteEquipment(id: number): Promise<boolean> {
    return this.equipments.delete(id);
  }
  
  async searchEquipment(query: string): Promise<Equipment[]> {
    query = query.toLowerCase();
    return Array.from(this.equipments.values()).filter(
      equipment => equipment.name.toLowerCase().includes(query) || 
                  equipment.code.toLowerCase().includes(query)
    );
  }
  
  // MAINTENANCE SCHEDULES
  async createMaintenanceSchedule(insertSchedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule> {
    const id = this.maintenanceScheduleIdCounter++;
    const now = new Date();
    const schedule: MaintenanceSchedule = {
      ...insertSchedule,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.maintenanceSchedules.set(id, schedule);
    return schedule;
  }
  
  async getMaintenanceSchedules(equipmentId?: number): Promise<MaintenanceSchedule[]> {
    return Array.from(this.maintenanceSchedules.values())
      .filter(schedule => equipmentId === undefined ? true : schedule.equipmentId === equipmentId)
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  }
  
  async getMaintenanceSchedule(id: number): Promise<MaintenanceSchedule | undefined> {
    return this.maintenanceSchedules.get(id);
  }
  
  async updateMaintenanceSchedule(id: number, data: Partial<InsertMaintenanceSchedule>): Promise<MaintenanceSchedule | undefined> {
    const schedule = this.maintenanceSchedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule: MaintenanceSchedule = {
      ...schedule,
      ...data,
      updatedAt: new Date()
    };
    this.maintenanceSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }
  
  async deleteMaintenanceSchedule(id: number): Promise<boolean> {
    return this.maintenanceSchedules.delete(id);
  }
  
  async getUpcomingMaintenances(days: number): Promise<MaintenanceSchedule[]> {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    return Array.from(this.maintenanceSchedules.values())
      .filter(schedule => {
        const scheduleDate = new Date(schedule.nextDate);
        return scheduleDate >= today && scheduleDate <= futureDate;
      })
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  }
  
  // MAINTENANCE INTERVENTIONS
  async createMaintenanceIntervention(insertIntervention: InsertMaintenanceIntervention): Promise<MaintenanceIntervention> {
    const id = this.maintenanceInterventionIdCounter++;
    const now = new Date();
    const intervention: MaintenanceIntervention = {
      ...insertIntervention,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.maintenanceInterventions.set(id, intervention);
    return intervention;
  }
  
  async getMaintenanceInterventions(equipmentId?: number): Promise<MaintenanceIntervention[]> {
    return Array.from(this.maintenanceInterventions.values())
      .filter(intervention => equipmentId === undefined ? true : intervention.equipmentId === equipmentId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }
  
  async getMaintenanceIntervention(id: number): Promise<MaintenanceIntervention | undefined> {
    return this.maintenanceInterventions.get(id);
  }
  
  async updateMaintenanceIntervention(id: number, data: Partial<InsertMaintenanceIntervention>): Promise<MaintenanceIntervention | undefined> {
    const intervention = this.maintenanceInterventions.get(id);
    if (!intervention) return undefined;
    
    const updatedIntervention: MaintenanceIntervention = {
      ...intervention,
      ...data,
      updatedAt: new Date()
    };
    this.maintenanceInterventions.set(id, updatedIntervention);
    return updatedIntervention;
  }
  
  async deleteMaintenanceIntervention(id: number): Promise<boolean> {
    return this.maintenanceInterventions.delete(id);
  }
  
  async getRecentInterventions(limit = 10): Promise<MaintenanceIntervention[]> {
    return Array.from(this.maintenanceInterventions.values())
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
      .slice(0, limit);
  }
  
  async getPastInterventions(page = 1, pageSize = 10): Promise<MaintenanceIntervention[]> {
    // Intervenciones que ocurrieron antes de los últimos 14 días
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const pastInterventions = Array.from(this.maintenanceInterventions.values())
      .filter(intervention => intervention.startDate < twoWeeksAgo)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    
    const offset = (page - 1) * pageSize;
    return pastInterventions.slice(offset, offset + pageSize);
  }
  
  // MAINTENANCE ATTACHMENTS
  async createMaintenanceAttachment(insertAttachment: InsertMaintenanceAttachment): Promise<MaintenanceAttachment> {
    const id = this.maintenanceAttachmentIdCounter++;
    const attachment: MaintenanceAttachment = {
      ...insertAttachment,
      id,
      createdAt: new Date()
    };
    this.maintenanceAttachments.set(id, attachment);
    return attachment;
  }
  
  async getMaintenanceAttachments(interventionId: number): Promise<MaintenanceAttachment[]> {
    return Array.from(this.maintenanceAttachments.values())
      .filter(attachment => attachment.interventionId === interventionId);
  }
  
  async getMaintenanceAttachment(id: number): Promise<MaintenanceAttachment | undefined> {
    return this.maintenanceAttachments.get(id);
  }
  
  async deleteMaintenanceAttachment(id: number): Promise<boolean> {
    return this.maintenanceAttachments.delete(id);
  }

  // IOT DEVICES
  async createIotDevice(device: InsertIotDevice): Promise<IotDevice> {
    const id = this.iotDeviceIdCounter++;
    const now = new Date();
    const iotDevice: IotDevice = {
      ...device,
      id,
      createdAt: now,
      updatedAt: now,
      lastCommunication: null
    };
    this.iotDevices.set(id, iotDevice);
    return iotDevice;
  }

  async getIotDevices(): Promise<IotDevice[]> {
    return Array.from(this.iotDevices.values());
  }

  async getIotDevice(id: number): Promise<IotDevice | undefined> {
    return this.iotDevices.get(id);
  }

  async getIotDeviceByApiKey(apiKey: string): Promise<IotDevice | undefined> {
    return Array.from(this.iotDevices.values()).find(
      device => device.apiKey === apiKey
    );
  }

  async updateIotDevice(id: number, data: Partial<IotDevice>): Promise<IotDevice | undefined> {
    const device = this.iotDevices.get(id);
    if (!device) return undefined;
    
    const updatedDevice: IotDevice = {
      ...device,
      ...data,
      updatedAt: new Date()
    };
    this.iotDevices.set(id, updatedDevice);
    return updatedDevice;
  }

  async deleteIotDevice(id: number): Promise<boolean> {
    return this.iotDevices.delete(id);
  }

  // IOT SENSORS
  async createIotSensor(sensor: InsertIotSensor): Promise<IotSensor> {
    const id = this.iotSensorIdCounter++;
    const now = new Date();
    const iotSensor: IotSensor = {
      ...sensor,
      id,
      createdAt: now,
      updatedAt: now,
      lastCommunication: null,
      minThreshold: sensor.minThreshold || null,
      maxThreshold: sensor.maxThreshold || null,
      criticalMinThreshold: sensor.criticalMinThreshold || null,
      criticalMaxThreshold: sensor.criticalMaxThreshold || null
    };
    this.iotSensors.set(id, iotSensor);
    return iotSensor;
  }

  async getIotSensors(equipmentId?: number): Promise<IotSensor[]> {
    return Array.from(this.iotSensors.values())
      .filter(sensor => equipmentId === undefined ? true : sensor.equipmentId === equipmentId);
  }

  async getIotSensor(id: number): Promise<IotSensor | undefined> {
    return this.iotSensors.get(id);
  }

  async updateIotSensor(id: number, data: Partial<IotSensor>): Promise<IotSensor | undefined> {
    const sensor = this.iotSensors.get(id);
    if (!sensor) return undefined;
    
    const updatedSensor: IotSensor = {
      ...sensor,
      ...data,
      updatedAt: new Date()
    };
    this.iotSensors.set(id, updatedSensor);
    return updatedSensor;
  }

  async deleteIotSensor(id: number): Promise<boolean> {
    return this.iotSensors.delete(id);
  }

  // SENSOR READINGS
  async createSensorReading(reading: InsertSensorReading): Promise<SensorReading> {
    const id = this.sensorReadingIdCounter++;
    const sensorReading: SensorReading = {
      ...reading,
      id,
      timestamp: reading.timestamp || new Date(),
      status: reading.status || 'normal'
    };
    this.sensorReadings.set(id, sensorReading);
    return sensorReading;
  }

  async getSensorReadings(sensorId?: number, startDate?: Date, endDate?: Date, limit = 100): Promise<SensorReading[]> {
    let readings = Array.from(this.sensorReadings.values());
    
    // Filter by sensor ID if provided
    if (sensorId !== undefined) {
      readings = readings.filter(reading => reading.sensorId === sensorId);
    }
    
    // Filter by date range if provided
    if (startDate) {
      readings = readings.filter(reading => reading.timestamp >= startDate);
    }
    if (endDate) {
      readings = readings.filter(reading => reading.timestamp <= endDate);
    }
    
    // Sort by timestamp (most recent first) and limit
    return readings
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getSensorReading(id: number): Promise<SensorReading | undefined> {
    return this.sensorReadings.get(id);
  }

  // MAINTENANCE PREDICTIONS
  async createMaintenancePrediction(prediction: InsertMaintenancePrediction): Promise<MaintenancePrediction> {
    const id = this.maintenancePredictionIdCounter++;
    const now = new Date();
    const maintenancePrediction: MaintenancePrediction = {
      ...prediction,
      id,
      createdAt: now,
      updatedAt: now,
      status: prediction.status || 'pending',
      confidence: Number(prediction.confidence),
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedBy: null,
      resolvedAt: null
    };
    this.maintenancePredictions.set(id, maintenancePrediction);
    return maintenancePrediction;
  }

  async getMaintenancePredictions(equipmentId?: number, status?: string): Promise<MaintenancePrediction[]> {
    let predictions = Array.from(this.maintenancePredictions.values());
    
    // Filter by equipment ID if provided
    if (equipmentId !== undefined) {
      predictions = predictions.filter(prediction => prediction.equipmentId === equipmentId);
    }
    
    // Filter by status if provided
    if (status) {
      predictions = predictions.filter(prediction => prediction.status === status);
    }
    
    // Sort by created date (most recent first)
    return predictions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMaintenancePrediction(id: number): Promise<MaintenancePrediction | undefined> {
    return this.maintenancePredictions.get(id);
  }

  async updateMaintenancePrediction(id: number, data: Partial<MaintenancePrediction>): Promise<MaintenancePrediction | undefined> {
    const prediction = this.maintenancePredictions.get(id);
    if (!prediction) return undefined;
    
    const updatedPrediction: MaintenancePrediction = {
      ...prediction,
      ...data,
      updatedAt: new Date()
    };
    this.maintenancePredictions.set(id, updatedPrediction);
    return updatedPrediction;
  }

  // PREDICTION EVIDENCE
  async createPredictionEvidence(evidence: InsertPredictionEvidence): Promise<PredictionEvidence> {
    const id = this.predictionEvidenceIdCounter++;
    const now = new Date();
    const predictionEvidence: PredictionEvidence = {
      ...evidence,
      id,
      createdAt: now
    };
    this.predictionEvidence.set(id, predictionEvidence);
    return predictionEvidence;
  }

  async getPredictionEvidence(predictionId: number): Promise<PredictionEvidence[]> {
    return Array.from(this.predictionEvidence.values())
      .filter(evidence => evidence.predictionId === predictionId);
  }

  // ALERT NOTIFICATIONS
  async createAlertNotification(notification: InsertAlertNotification): Promise<AlertNotification> {
    const id = this.alertNotificationIdCounter++;
    const now = new Date();
    const alertNotification: AlertNotification = {
      ...notification,
      id,
      createdAt: now,
      status: 'unread',
      readAt: null,
      sendEmail: notification.sendEmail || false,
      sendSms: notification.sendSms || false,
      emailSent: false,
      smsSent: false
    };
    this.alertNotifications.set(id, alertNotification);
    return alertNotification;
  }

  async getAlertNotifications(userId: number, status?: string): Promise<AlertNotification[]> {
    let notifications = Array.from(this.alertNotifications.values())
      .filter(notification => notification.recipientId === userId);
    
    // Filter by status if provided
    if (status) {
      notifications = notifications.filter(notification => notification.status === status);
    }
    
    // Sort by created date (most recent first)
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAlertNotification(id: number): Promise<AlertNotification | undefined> {
    return this.alertNotifications.get(id);
  }

  async updateAlertNotification(id: number, data: Partial<AlertNotification>): Promise<AlertNotification | undefined> {
    const notification = this.alertNotifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification: AlertNotification = {
      ...notification,
      ...data
    };
    this.alertNotifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async deleteAlertNotification(id: number): Promise<boolean> {
    return this.alertNotifications.delete(id);
  }

  // COMMENTS
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.comments.set(id, newComment);
    return newComment;
  }

  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByDocument(documentId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => 
      comment.documentId === documentId
    );
  }

  async getCommentsByEquipment(equipmentId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => 
      comment.equipmentId === equipmentId
    );
  }

  async getCommentsByMaintenance(maintenanceId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => 
      comment.maintenanceId === maintenanceId
    );
  }

  async getCommentReplies(parentId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(comment => 
      comment.parentId === parentId
    );
  }

  async updateComment(id: number, data: Partial<Comment>): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    const updatedComment: Comment = {
      ...comment,
      ...data,
      updatedAt: new Date()
    };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // TASKS
  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const newTask: Task = {
      ...task,
      id,
      completedAt: null,
      completedById: null,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByDocument(documentId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.documentId === documentId
    );
  }

  async getTasksByEquipment(equipmentId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.equipmentId === equipmentId
    );
  }

  async getTasksByMaintenance(maintenanceId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.maintenanceId === maintenanceId
    );
  }

  async getTasksByAssignee(assignedToId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.assignedToId === assignedToId
    );
  }

  async getTasksByCreator(createdById: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => 
      task.createdById === createdById
    );
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = {
      ...task,
      ...data,
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // REACTIONS
  async createReaction(reaction: InsertReaction): Promise<Reaction> {
    const id = this.reactionIdCounter++;
    const newReaction: Reaction = {
      ...reaction,
      id,
      createdAt: new Date()
    };
    this.reactions.set(id, newReaction);
    return newReaction;
  }

  async getReactionsByComment(commentId: number): Promise<{emoji: string, count: number}[]> {
    const reactions = Array.from(this.reactions.values()).filter(reaction =>
      reaction.commentId === commentId
    );
    
    const emojiCounts = new Map<string, number>();
    for (const reaction of reactions) {
      const count = emojiCounts.get(reaction.emoji) || 0;
      emojiCounts.set(reaction.emoji, count + 1);
    }
    
    return Array.from(emojiCounts.entries()).map(([emoji, count]) => ({
      emoji,
      count
    }));
  }

  async getReactionsByTask(taskId: number): Promise<{emoji: string, count: number}[]> {
    const reactions = Array.from(this.reactions.values()).filter(reaction =>
      reaction.taskId === taskId
    );
    
    const emojiCounts = new Map<string, number>();
    for (const reaction of reactions) {
      const count = emojiCounts.get(reaction.emoji) || 0;
      emojiCounts.set(reaction.emoji, count + 1);
    }
    
    return Array.from(emojiCounts.entries()).map(([emoji, count]) => ({
      emoji,
      count
    }));
  }

  async getUserReactionsByComment(userId: number, commentId: number): Promise<string[]> {
    const reactions = Array.from(this.reactions.values()).filter(reaction =>
      reaction.userId === userId && reaction.commentId === commentId
    );
    return reactions.map(reaction => reaction.emoji);
  }

  async getUserReactionsByTask(userId: number, taskId: number): Promise<string[]> {
    const reactions = Array.from(this.reactions.values()).filter(reaction =>
      reaction.userId === userId && reaction.taskId === taskId
    );
    return reactions.map(reaction => reaction.emoji);
  }

  async toggleReaction(userId: number, emoji: string, commentId?: number, taskId?: number): Promise<Reaction | null> {
    // Validate parameters
    if (!commentId && !taskId) {
      throw new Error('Se requiere un commentId o taskId');
    }
    
    // Check if the reaction already exists
    const existingReaction = Array.from(this.reactions.values()).find(reaction =>
      reaction.userId === userId && 
      reaction.emoji === emoji && 
      (commentId ? reaction.commentId === commentId : true) && 
      (taskId ? reaction.taskId === taskId : true)
    );
    
    if (existingReaction) {
      // If it exists, remove it
      this.reactions.delete(existingReaction.id);
      return null;
    } else {
      // If it doesn't exist, create it
      const insertReaction: InsertReaction = {
        userId,
        emoji,
        commentId,
        taskId
      };
      return this.createReaction(insertReaction);
    }
  }

  async deleteReaction(id: number): Promise<boolean> {
    return this.reactions.delete(id);
  }
  
  // PROJECTS (OBRAS)
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date();
    const newProject: Project = {
      ...project,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = {
      ...project,
      ...data,
      updatedAt: new Date()
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // PROJECT MANAGERS
  async addProjectManager(manager: InsertProjectManager): Promise<ProjectManager> {
    const id = this.projectManagerIdCounter++;
    const newManager: ProjectManager = {
      ...manager,
      id,
      createdAt: new Date()
    };
    this.projectManagers.set(id, newManager);
    return newManager;
  }
  
  async getProjectManagers(projectId: number): Promise<ProjectManager[]> {
    return Array.from(this.projectManagers.values())
      .filter(manager => manager.projectId === projectId);
  }
  
  async removeProjectManager(id: number): Promise<boolean> {
    return this.projectManagers.delete(id);
  }
  
  // PROJECT DOCUMENTS
  async addProjectDocument(document: InsertProjectDocument): Promise<ProjectDocument> {
    const id = this.projectDocumentIdCounter++;
    const newDocument: ProjectDocument = {
      ...document,
      id,
      createdAt: new Date()
    };
    this.projectDocuments.set(id, newDocument);
    return newDocument;
  }
  
  async getProjectDocuments(projectId: number): Promise<ProjectDocument[]> {
    return Array.from(this.projectDocuments.values())
      .filter(doc => doc.projectId === projectId);
  }
  
  async removeProjectDocument(id: number): Promise<boolean> {
    return this.projectDocuments.delete(id);
  }
  
  // Project Members
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    // Obtener todos los proyectos donde el usuario es miembro o gestor
    const projectsAsMember = Array.from(this.projectMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.projectId);
      
    const projectsAsManager = Array.from(this.projectManagers.values())
      .filter(manager => manager.userId === userId)
      .map(manager => manager.projectId);
      
    // Combinar los IDs únicos
    const projectIds = [...new Set([...projectsAsMember, ...projectsAsManager])];
    
    // Devolver los proyectos correspondientes
    return Array.from(this.projects.values())
      .filter(project => projectIds.includes(project.id));
  }
  
  async isProjectManager(projectId: number, userId: number): Promise<boolean> {
    return Array.from(this.projectManagers.values()).some(
      manager => manager.projectId === projectId && manager.userId === userId
    );
  }
  
  async isProjectMember(projectId: number, userId: number): Promise<boolean> {
    return Array.from(this.projectMembers.values()).some(
      member => member.projectId === projectId && member.userId === userId
    );
  }
  
  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return Array.from(this.projectMembers.values()).filter(
      member => member.projectId === projectId
    );
  }
  
  async getProjectMemberById(id: number): Promise<ProjectMember | undefined> {
    return this.projectMembers.get(id);
  }
  
  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    // Verificar si ya existe este usuario como miembro
    const existingMember = Array.from(this.projectMembers.values()).find(
      m => m.projectId === member.projectId && m.userId === member.userId
    );
    
    if (existingMember) {
      throw new Error("El usuario ya es miembro de este proyecto");
    }
    
    const newMember = {
      id: this.projectMemberIdCounter++,
      createdAt: new Date(),
      projectId: member.projectId,
      userId: member.userId,
      role: member.role || "member",
      permissions: member.permissions || ["view"],
      addedBy: member.addedBy,
      updatedAt: new Date()
    };
    
    this.projectMembers.set(newMember.id, newMember);
    return newMember;
  }
  
  async updateProjectMember(id: number, data: Partial<ProjectMember>): Promise<ProjectMember | undefined> {
    const member = this.projectMembers.get(id);
    if (!member) {
      return undefined;
    }
    
    const updatedMember = {
      ...member,
      ...data,
      updatedAt: new Date()
    };
    
    this.projectMembers.set(id, updatedMember);
    return updatedMember;
  }
  
  async removeProjectMember(id: number): Promise<boolean> {
    if (!this.projectMembers.has(id)) {
      return false;
    }
    
    this.projectMembers.delete(id);
    return true;
  }
}

// Implementamos una versión simplificada usando MemStorage temporalmente
import { db } from './db';
import { eq, like, desc, or, and, ne, asc, inArray, sql } from 'drizzle-orm';
import connectPg from 'connect-pg-simple';
import session from 'express-session';
import { pool } from './db';
import * as schema from '@shared/schema';
import { RolesStorage } from './storage/rolesStorage';
import { ProjectEquipmentStorage } from './storage/projectEquipmentStorage';

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Simplificamos el tipo para evitar errores
  private rolesStorage: RolesStorage;
  private projectEquipmentStorage: ProjectEquipmentStorage;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    this.rolesStorage = new RolesStorage();
    this.projectEquipmentStorage = new ProjectEquipmentStorage();
  }
  
  // Métodos delegados para la gestión de roles
  async getAllRoles(): Promise<schema.Role[]> {
    return this.rolesStorage.getAllRoles();
  }
  
  async getRole(id: number): Promise<schema.Role | undefined> {
    return this.rolesStorage.getRole(id);
  }
  
  async getRoleByName(name: string): Promise<schema.Role | undefined> {
    return this.rolesStorage.getRoleByName(name);
  }
  
  async createRole(role: schema.InsertRole): Promise<schema.Role> {
    return this.rolesStorage.createRole(role);
  }
  
  async updateRole(id: number, data: Partial<schema.InsertRole>): Promise<schema.Role | undefined> {
    return this.rolesStorage.updateRole(id, data);
  }
  
  async deleteRole(id: number): Promise<boolean> {
    return this.rolesStorage.deleteRole(id);
  }
  
  async assignCustomRoleToUser(userId: number, roleId: number): Promise<schema.User | undefined> {
    return this.rolesStorage.assignCustomRoleToUser(userId, roleId);
  }
  
  async getUserWithPermissions(userId: number): Promise<schema.User & { permissions?: schema.Role }> {
    return this.rolesStorage.getUserWithPermissions(userId);
  }
  
  // Métodos delegados para la gestión de equipos en proyectos
  async getProjectEquipment(projectId: number): Promise<schema.ProjectEquipment[]> {
    return this.projectEquipmentStorage.getProjectEquipment(projectId);
  }
  
  async getProjectEquipmentById(id: number): Promise<schema.ProjectEquipment | undefined> {
    return this.projectEquipmentStorage.getProjectEquipmentById(id);
  }
  
  async createProjectEquipment(data: schema.InsertProjectEquipment): Promise<schema.ProjectEquipment> {
    return this.projectEquipmentStorage.createProjectEquipment(data);
  }
  
  async updateProjectEquipment(id: number, data: Partial<schema.InsertProjectEquipment>): Promise<schema.ProjectEquipment | undefined> {
    return this.projectEquipmentStorage.updateProjectEquipment(id, data);
  }
  
  async deleteProjectEquipment(id: number): Promise<boolean> {
    return this.projectEquipmentStorage.deleteProjectEquipment(id);
  }
  
  async getEquipmentCurrentAssignments(equipmentId: number): Promise<schema.ProjectEquipment[]> {
    return this.projectEquipmentStorage.getEquipmentCurrentAssignments(equipmentId);
  }
  
  async getEquipmentAssignmentHistory(equipmentId: number): Promise<schema.ProjectEquipment[]> {
    return this.projectEquipmentStorage.getEquipmentAssignmentHistory(equipmentId);
  }
  
  // Users
  async getUser(id: number): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }
  
  async createUser(insertUser: schema.InsertUser): Promise<schema.User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }
  
  async getAllUsers(): Promise<schema.User[]> {
    return await db.select().from(schema.users);
  }

  async getUsersByRole(roles: string[]): Promise<schema.User[]> {
    return await db.select().from(schema.users).where(is => roles.includes(is.role));
  }
  
  async updateUserRole(id: number, role: string): Promise<schema.User | undefined> {
    const [user] = await db.update(schema.users)
      .set({ role })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }
  
  async updateUserStatus(id: number, status: string): Promise<schema.User | undefined> {
    const [user] = await db.update(schema.users)
      .set({ status })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }
  
  // Implementaciones simplificadas para todas las otras funciones
  // Folders
  async createFolder(insertFolder: schema.InsertFolder): Promise<schema.Folder> {
    const [folder] = await db.insert(schema.folders).values(insertFolder).returning();
    return folder;
  }
  
  async getFolder(id: number): Promise<schema.Folder | undefined> {
    const [folder] = await db.select().from(schema.folders).where(eq(schema.folders.id, id));
    return folder;
  }
  
  async getFolders(parentId?: number): Promise<schema.Folder[]> {
    if (parentId) {
      return await db.select().from(schema.folders).where(eq(schema.folders.parentId, parentId));
    } else {
      return await db.select().from(schema.folders);
    }
  }
  
  async updateFolder(id: number, data: Partial<schema.InsertFolder>): Promise<schema.Folder | undefined> {
    const [folder] = await db.update(schema.folders).set(data).where(eq(schema.folders.id, id)).returning();
    return folder;
  }
  
  async deleteFolder(id: number): Promise<boolean> {
    await db.delete(schema.folders).where(eq(schema.folders.id, id));
    return true;
  }
  
  // Documents
  async createDocument(insertDocument: schema.InsertDocument): Promise<schema.Document> {
    const [document] = await db.insert(schema.documents).values(insertDocument).returning();
    return document;
  }
  
  async getDocument(id: number): Promise<schema.Document | undefined> {
    const [document] = await db.select().from(schema.documents).where(eq(schema.documents.id, id));
    return document;
  }
  
  async getDocuments(folderId?: number): Promise<schema.Document[]> {
    if (folderId) {
      return await db.select().from(schema.documents).where(eq(schema.documents.folderId, folderId));
    } else {
      return await db.select().from(schema.documents);
    }
  }
  
  async updateDocument(id: number, data: Partial<schema.InsertDocument>): Promise<schema.Document | undefined> {
    const [document] = await db.update(schema.documents).set(data).where(eq(schema.documents.id, id)).returning();
    return document;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    await db.delete(schema.documents).where(eq(schema.documents.id, id));
    return true;
  }
  
  async searchDocuments(query: string): Promise<schema.Document[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(schema.documents).where(
      or(
        like(schema.documents.name, searchTerm),
        like(schema.documents.path, searchTerm)
      )
    );
  }
  
  // Document Versions
  async createDocumentVersion(insertVersion: schema.InsertDocumentVersion): Promise<schema.DocumentVersion> {
    const [version] = await db.insert(schema.documentVersions).values(insertVersion).returning();
    return version;
  }
  
  async getDocumentVersions(documentId: number): Promise<schema.DocumentVersion[]> {
    return await db.select()
      .from(schema.documentVersions)
      .where(eq(schema.documentVersions.documentId, documentId));
  }
  
  async getDocumentVersion(id: number): Promise<schema.DocumentVersion | undefined> {
    const [version] = await db.select().from(schema.documentVersions).where(eq(schema.documentVersions.id, id));
    return version;
  }
  
  // Document Activity
  async logDocumentActivity(insertActivity: schema.InsertDocumentActivity): Promise<schema.DocumentActivity> {
    const [activity] = await db.insert(schema.documentActivity).values(insertActivity).returning();
    return activity;
  }
  
  async getDocumentActivity(documentId: number): Promise<schema.DocumentActivity[]> {
    return await db.select()
      .from(schema.documentActivity)
      .where(eq(schema.documentActivity.documentId, documentId));
  }
  
  async getRecentActivity(limit = 10): Promise<schema.DocumentActivity[]> {
    return await db.select()
      .from(schema.documentActivity)
      .limit(limit);
  }
  
  // Equipment Types
  async createEquipmentType(insertType: schema.InsertEquipmentType): Promise<schema.EquipmentType> {
    const [type] = await db.insert(schema.equipmentTypes).values(insertType).returning();
    return type;
  }
  
  async getEquipmentTypes(): Promise<schema.EquipmentType[]> {
    return await db.select().from(schema.equipmentTypes);
  }
  
  async getEquipmentType(id: number): Promise<schema.EquipmentType | undefined> {
    const [type] = await db.select().from(schema.equipmentTypes).where(eq(schema.equipmentTypes.id, id));
    return type;
  }
  
  async getEquipmentByType(typeId: number): Promise<schema.Equipment[]> {
    return await db.select().from(schema.equipment).where(eq(schema.equipment.typeId, typeId));
  }
  
  async deleteEquipmentType(id: number): Promise<boolean> {
    await db.delete(schema.equipmentTypes).where(eq(schema.equipmentTypes.id, id));
    return true;
  }
  
  // Equipment
  async createEquipment(insertEquipment: schema.InsertEquipment): Promise<schema.Equipment> {
    const [equip] = await db.insert(schema.equipment).values(insertEquipment).returning();
    return equip;
  }
  
  async getEquipment(id: number): Promise<schema.Equipment | undefined> {
    const [equip] = await db.select().from(schema.equipment).where(eq(schema.equipment.id, id));
    return equip;
  }
  
  async getEquipmentByCode(code: string): Promise<schema.Equipment | undefined> {
    const [equip] = await db.select().from(schema.equipment).where(eq(schema.equipment.code, code));
    return equip;
  }
  
  async getAllEquipment(): Promise<schema.Equipment[]> {
    return await db.select().from(schema.equipment);
  }
  
  async updateEquipment(id: number, data: Partial<schema.InsertEquipment>): Promise<schema.Equipment | undefined> {
    const [equip] = await db.update(schema.equipment).set(data).where(eq(schema.equipment.id, id)).returning();
    return equip;
  }
  
  async deleteEquipment(id: number): Promise<boolean> {
    await db.delete(schema.equipment).where(eq(schema.equipment.id, id));
    return true;
  }
  
  async searchEquipment(query: string): Promise<schema.Equipment[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(schema.equipment).where(
      or(
        like(schema.equipment.name, searchTerm),
        like(schema.equipment.code, searchTerm)
      )
    );
  }
  
  // Maintenance Schedules
  async createMaintenanceSchedule(insertSchedule: schema.InsertMaintenanceSchedule): Promise<schema.MaintenanceSchedule> {
    const [schedule] = await db.insert(schema.maintenanceSchedules).values(insertSchedule).returning();
    return schedule;
  }
  
  async getMaintenanceSchedules(equipmentId?: number): Promise<schema.MaintenanceSchedule[]> {
    if (equipmentId) {
      return await db.select().from(schema.maintenanceSchedules).where(eq(schema.maintenanceSchedules.equipmentId, equipmentId));
    } else {
      return await db.select().from(schema.maintenanceSchedules);
    }
  }
  
  async getMaintenanceSchedule(id: number): Promise<schema.MaintenanceSchedule | undefined> {
    const [schedule] = await db.select().from(schema.maintenanceSchedules).where(eq(schema.maintenanceSchedules.id, id));
    return schedule;
  }
  
  async updateMaintenanceSchedule(id: number, data: Partial<schema.InsertMaintenanceSchedule>): Promise<schema.MaintenanceSchedule | undefined> {
    const [schedule] = await db.update(schema.maintenanceSchedules).set(data).where(eq(schema.maintenanceSchedules.id, id)).returning();
    return schedule;
  }
  
  async deleteMaintenanceSchedule(id: number): Promise<boolean> {
    await db.delete(schema.maintenanceSchedules).where(eq(schema.maintenanceSchedules.id, id));
    return true;
  }
  
  async getUpcomingMaintenances(days: number): Promise<schema.MaintenanceSchedule[]> {
    return await db.select().from(schema.maintenanceSchedules);
  }
  
  // Maintenance Interventions
  async createMaintenanceIntervention(insertIntervention: schema.InsertMaintenanceIntervention): Promise<schema.MaintenanceIntervention> {
    const [intervention] = await db.insert(schema.maintenanceInterventions).values(insertIntervention).returning();
    return intervention;
  }
  
  async getMaintenanceInterventions(
    params?: {
      equipmentId?: number;
      type?: string;
      equipmentTypeId?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<schema.MaintenanceIntervention[]> {
    const { equipmentId, type, equipmentTypeId, startDate, endDate } = params || {};
    
    // Base query
    let query = db.select({
      intervention: schema.maintenanceInterventions,
      equipment: {
        id: schema.equipment.id,
        typeId: schema.equipment.typeId,
      }
    })
    .from(schema.maintenanceInterventions)
    .leftJoin(schema.equipment, eq(schema.maintenanceInterventions.equipmentId, schema.equipment.id));
    
    // Apply filters
    const filters = [];
    
    if (equipmentId !== undefined) {
      filters.push(eq(schema.maintenanceInterventions.equipmentId, equipmentId));
    }
    
    if (type !== undefined) {
      filters.push(eq(schema.maintenanceInterventions.type, type));
    }
    
    if (equipmentTypeId !== undefined) {
      filters.push(eq(schema.equipment.typeId, equipmentTypeId));
    }
    
    if (startDate !== undefined) {
      filters.push(gte(schema.maintenanceInterventions.startDate, startDate));
    }
    
    if (endDate !== undefined) {
      filters.push(lt(schema.maintenanceInterventions.startDate, endDate));
    }
    
    // Add filters to query
    if (filters.length > 0) {
      const combinedFilter = filters.reduce((acc, filter) => and(acc, filter));
      query = query.where(combinedFilter);
    }
    
    // Execute query
    const result = await query;
    
    // Transform to expected return type
    return result.map(r => r.intervention);
  }
  

  
  async getMaintenanceIntervention(id: number): Promise<schema.MaintenanceIntervention | undefined> {
    const [intervention] = await db.select().from(schema.maintenanceInterventions).where(eq(schema.maintenanceInterventions.id, id));
    return intervention;
  }
  
  async updateMaintenanceIntervention(id: number, data: Partial<schema.InsertMaintenanceIntervention>): Promise<schema.MaintenanceIntervention | undefined> {
    const [intervention] = await db.update(schema.maintenanceInterventions).set(data).where(eq(schema.maintenanceInterventions.id, id)).returning();
    return intervention;
  }
  
  async deleteMaintenanceIntervention(id: number): Promise<boolean> {
    await db.delete(schema.maintenanceInterventions).where(eq(schema.maintenanceInterventions.id, id));
    return true;
  }
  
  async getRecentInterventions(limit = 10): Promise<schema.MaintenanceIntervention[]> {
    // Intervenciones de los últimos 14 días (2 semanas)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    return await db
      .select()
      .from(schema.maintenanceInterventions)
      .where(gte(schema.maintenanceInterventions.startDate, twoWeeksAgo))
      .orderBy(desc(schema.maintenanceInterventions.startDate))
      .limit(limit);
  }
  
  async getPastInterventions(page = 1, pageSize = 10): Promise<schema.MaintenanceIntervention[]> {
    // Intervenciones que ocurrieron antes de los últimos 14 días
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const offset = (page - 1) * pageSize;
    
    return await db
      .select()
      .from(schema.maintenanceInterventions)
      .where(lt(schema.maintenanceInterventions.startDate, twoWeeksAgo))
      .orderBy(desc(schema.maintenanceInterventions.startDate))
      .limit(pageSize)
      .offset(offset);
  }
  
  // Maintenance Attachments
  async createMaintenanceAttachment(insertAttachment: schema.InsertMaintenanceAttachment): Promise<schema.MaintenanceAttachment> {
    const [attachment] = await db.insert(schema.maintenanceAttachments).values(insertAttachment).returning();
    return attachment;
  }
  
  async getMaintenanceAttachments(interventionId: number): Promise<schema.MaintenanceAttachment[]> {
    return await db.select().from(schema.maintenanceAttachments).where(eq(schema.maintenanceAttachments.interventionId, interventionId));
  }
  
  async getMaintenanceAttachment(id: number): Promise<schema.MaintenanceAttachment | undefined> {
    const [attachment] = await db.select().from(schema.maintenanceAttachments).where(eq(schema.maintenanceAttachments.id, id));
    return attachment;
  }
  
  async deleteMaintenanceAttachment(id: number): Promise<boolean> {
    await db.delete(schema.maintenanceAttachments).where(eq(schema.maintenanceAttachments.id, id));
    return true;
  }

  // IoT Devices
  async createIotDevice(device: schema.InsertIotDevice): Promise<schema.IotDevice> {
    const [iotDevice] = await db.insert(schema.iotDevices).values(device).returning();
    return iotDevice;
  }

  async getIotDevices(): Promise<schema.IotDevice[]> {
    return await db.select().from(schema.iotDevices);
  }

  async getIotDevice(id: number): Promise<schema.IotDevice | undefined> {
    const [device] = await db.select().from(schema.iotDevices).where(eq(schema.iotDevices.id, id));
    return device;
  }

  async getIotDeviceByApiKey(apiKey: string): Promise<schema.IotDevice | undefined> {
    const [device] = await db.select().from(schema.iotDevices).where(eq(schema.iotDevices.apiKey, apiKey));
    return device;
  }

  async updateIotDevice(id: number, data: Partial<schema.IotDevice>): Promise<schema.IotDevice | undefined> {
    const [device] = await db.update(schema.iotDevices).set(data).where(eq(schema.iotDevices.id, id)).returning();
    return device;
  }

  async deleteIotDevice(id: number): Promise<boolean> {
    await db.delete(schema.iotDevices).where(eq(schema.iotDevices.id, id));
    return true;
  }

  // IoT Sensors
  async createIotSensor(sensor: schema.InsertIotSensor): Promise<schema.IotSensor> {
    const [iotSensor] = await db.insert(schema.iotSensors).values(sensor).returning();
    return iotSensor;
  }

  async getIotSensors(equipmentId?: number): Promise<schema.IotSensor[]> {
    if (equipmentId) {
      return await db.select().from(schema.iotSensors).where(eq(schema.iotSensors.equipmentId, equipmentId));
    } else {
      return await db.select().from(schema.iotSensors);
    }
  }

  async getIotSensor(id: number): Promise<schema.IotSensor | undefined> {
    const [sensor] = await db.select().from(schema.iotSensors).where(eq(schema.iotSensors.id, id));
    return sensor;
  }

  async updateIotSensor(id: number, data: Partial<schema.IotSensor>): Promise<schema.IotSensor | undefined> {
    const [sensor] = await db.update(schema.iotSensors).set(data).where(eq(schema.iotSensors.id, id)).returning();
    return sensor;
  }

  async deleteIotSensor(id: number): Promise<boolean> {
    await db.delete(schema.iotSensors).where(eq(schema.iotSensors.id, id));
    return true;
  }

  // Sensor Readings
  async createSensorReading(reading: schema.InsertSensorReading): Promise<schema.SensorReading> {
    const [sensorReading] = await db.insert(schema.sensorReadings).values(reading).returning();
    return sensorReading;
  }

  async getSensorReadings(sensorId?: number, startDate?: Date, endDate?: Date, limit = 100): Promise<schema.SensorReading[]> {
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (sensorId) {
      conditions.push(`sensor_id = $${paramIndex}`);
      params.push(sensorId);
      paramIndex++;
    }
    
    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(startDate.toISOString());
      paramIndex++;
    }
    
    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(endDate.toISOString());
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const query = `
      SELECT * FROM sensor_readings
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;
    
    const result = await db.execute(query, params);
    return result.rows as schema.SensorReading[];
  }

  async getSensorReading(id: number): Promise<schema.SensorReading | undefined> {
    const [reading] = await db.select().from(schema.sensorReadings).where(eq(schema.sensorReadings.id, id));
    return reading;
  }

  // Maintenance Predictions
  async createMaintenancePrediction(prediction: schema.InsertMaintenancePrediction): Promise<schema.MaintenancePrediction> {
    const [maintenancePrediction] = await db.insert(schema.maintenancePredictions).values(prediction).returning();
    return maintenancePrediction;
  }

  async getMaintenancePredictions(equipmentId?: number, status?: string): Promise<schema.MaintenancePrediction[]> {
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (equipmentId) {
      conditions.push(`equipment_id = $${paramIndex}`);
      params.push(equipmentId);
      paramIndex++;
    }
    
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const query = `
      SELECT * FROM maintenance_predictions
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    const result = await db.execute(query, params);
    return result.rows as schema.MaintenancePrediction[];
  }

  async getMaintenancePrediction(id: number): Promise<schema.MaintenancePrediction | undefined> {
    const [prediction] = await db.select().from(schema.maintenancePredictions).where(eq(schema.maintenancePredictions.id, id));
    return prediction;
  }

  async updateMaintenancePrediction(id: number, data: Partial<schema.MaintenancePrediction>): Promise<schema.MaintenancePrediction | undefined> {
    const [prediction] = await db.update(schema.maintenancePredictions).set(data).where(eq(schema.maintenancePredictions.id, id)).returning();
    return prediction;
  }

  // Prediction Evidence
  async createPredictionEvidence(evidence: schema.InsertPredictionEvidence): Promise<schema.PredictionEvidence> {
    const [predictionEvidence] = await db.insert(schema.predictionEvidence).values(evidence).returning();
    return predictionEvidence;
  }

  async getPredictionEvidence(predictionId: number): Promise<schema.PredictionEvidence[]> {
    return await db.select().from(schema.predictionEvidence).where(eq(schema.predictionEvidence.predictionId, predictionId));
  }

  // Alert Notifications
  async createAlertNotification(notification: schema.InsertAlertNotification): Promise<schema.AlertNotification> {
    const [alertNotification] = await db.insert(schema.alertNotifications).values(notification).returning();
    return alertNotification;
  }

  async getAlertNotifications(userId: number, status?: string): Promise<schema.AlertNotification[]> {
    let query = `
      SELECT * FROM alert_notifications 
      WHERE recipient_id = $1 
      ${ status ? 'AND status = $2' : '' }
      ORDER BY created_at DESC
    `;
    
    let result;
    if (status) {
      result = await db.execute(query, [userId, status]);
    } else {
      result = await db.execute(query, [userId]);
    }
    
    return result.rows as schema.AlertNotification[];
  }

  async getAlertNotification(id: number): Promise<schema.AlertNotification | undefined> {
    const [notification] = await db.select().from(schema.alertNotifications).where(eq(schema.alertNotifications.id, id));
    return notification;
  }

  async updateAlertNotification(id: number, data: Partial<schema.AlertNotification>): Promise<schema.AlertNotification | undefined> {
    const [notification] = await db.update(schema.alertNotifications).set(data).where(eq(schema.alertNotifications.id, id)).returning();
    return notification;
  }

  async deleteAlertNotification(id: number): Promise<boolean> {
    await db.delete(schema.alertNotifications).where(eq(schema.alertNotifications.id, id));
    return true;
  }

  // Comments
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(schema.comments).values(comment).returning();
    return newComment;
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(schema.comments).where(eq(schema.comments.id, id));
    return comment;
  }

  async getCommentsByDocument(documentId: number): Promise<Comment[]> {
    return db.select().from(schema.comments).where(eq(schema.comments.documentId, documentId));
  }

  async getCommentsByEquipment(equipmentId: number): Promise<Comment[]> {
    return db.select().from(schema.comments).where(eq(schema.comments.equipmentId, equipmentId));
  }

  async getCommentsByMaintenance(maintenanceId: number): Promise<Comment[]> {
    return db.select().from(schema.comments).where(eq(schema.comments.maintenanceId, maintenanceId));
  }

  async getCommentReplies(parentId: number): Promise<Comment[]> {
    return db.select().from(schema.comments).where(eq(schema.comments.parentId, parentId));
  }

  async updateComment(id: number, data: Partial<Comment>): Promise<Comment | undefined> {
    const [updatedComment] = await db.update(schema.comments)
      .set(data)
      .where(eq(schema.comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    await db.delete(schema.comments).where(eq(schema.comments.id, id));
    return true;
  }

  // Tasks
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(schema.tasks).values(task).returning();
    return newTask;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    return task;
  }

  async getTasksByDocument(documentId: number): Promise<Task[]> {
    return db.select().from(schema.tasks).where(eq(schema.tasks.documentId, documentId));
  }

  async getTasksByEquipment(equipmentId: number): Promise<Task[]> {
    return db.select().from(schema.tasks).where(eq(schema.tasks.equipmentId, equipmentId));
  }

  async getTasksByMaintenance(maintenanceId: number): Promise<Task[]> {
    return db.select().from(schema.tasks).where(eq(schema.tasks.maintenanceId, maintenanceId));
  }

  async getTasksByAssignee(assignedToId: number): Promise<Task[]> {
    return db.select().from(schema.tasks).where(eq(schema.tasks.assignedToId, assignedToId));
  }

  async getTasksByCreator(createdById: number): Promise<Task[]> {
    return db.select().from(schema.tasks).where(eq(schema.tasks.createdById, createdById));
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task | undefined> {
    const [updatedTask] = await db.update(schema.tasks)
      .set(data)
      .where(eq(schema.tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
    return true;
  }

  // Reactions
  async createReaction(reaction: InsertReaction): Promise<Reaction> {
    const [newReaction] = await db.insert(schema.reactions).values(reaction).returning();
    return newReaction;
  }

  async getReactionsByComment(commentId: number): Promise<{emoji: string, count: number}[]> {
    const result = await db
      .select({
        emoji: schema.reactions.emoji,
        count: count()
      })
      .from(schema.reactions)
      .where(eq(schema.reactions.commentId, commentId))
      .groupBy(schema.reactions.emoji);
    return result;
  }

  async getReactionsByTask(taskId: number): Promise<{emoji: string, count: number}[]> {
    const result = await db
      .select({
        emoji: schema.reactions.emoji,
        count: count()
      })
      .from(schema.reactions)
      .where(eq(schema.reactions.taskId, taskId))
      .groupBy(schema.reactions.emoji);
    return result;
  }

  async getUserReactionsByComment(userId: number, commentId: number): Promise<string[]> {
    const reactions = await db
      .select({ emoji: schema.reactions.emoji })
      .from(schema.reactions)
      .where(and(
        eq(schema.reactions.userId, userId),
        eq(schema.reactions.commentId, commentId)
      ));
    return reactions.map(r => r.emoji);
  }

  async getUserReactionsByTask(userId: number, taskId: number): Promise<string[]> {
    const reactions = await db
      .select({ emoji: schema.reactions.emoji })
      .from(schema.reactions)
      .where(and(
        eq(schema.reactions.userId, userId),
        eq(schema.reactions.taskId, taskId)
      ));
    return reactions.map(r => r.emoji);
  }

  async toggleReaction(userId: number, emoji: string, commentId?: number, taskId?: number): Promise<Reaction | null> {
    // Verificar si ya existe la reacción
    const conditions = and(
      eq(schema.reactions.userId, userId),
      eq(schema.reactions.emoji, emoji),
      commentId ? eq(schema.reactions.commentId, commentId) : undefined,
      taskId ? eq(schema.reactions.taskId, taskId) : undefined
    );
    
    const [existingReaction] = await db
      .select()
      .from(schema.reactions)
      .where(conditions);
    
    if (existingReaction) {
      // Si existe, eliminarla
      await db.delete(schema.reactions).where(eq(schema.reactions.id, existingReaction.id));
      return null;
    } else {
      // Si no existe, crearla
      const [newReaction] = await db.insert(schema.reactions).values({
        userId,
        emoji,
        commentId: commentId || null,
        taskId: taskId || null,
        createdAt: new Date()
      }).returning();
      return newReaction;
    }
  }

  async deleteReaction(id: number): Promise<boolean> {
    await db.delete(schema.reactions).where(eq(schema.reactions.id, id));
    return true;
  }

  // Projects (Obras)
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(schema.projects).values({
      ...project,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return db.select().from(schema.projects).orderBy(desc(schema.projects.createdAt));
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db.update(schema.projects)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(schema.projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    await db.delete(schema.projects).where(eq(schema.projects.id, id));
    return true;
  }

  // Project Managers
  async addProjectManager(manager: InsertProjectManager): Promise<ProjectManager> {
    const [newManager] = await db.insert(schema.projectManagers).values({
      ...manager,
      createdAt: new Date()
    }).returning();
    return newManager;
  }

  async getProjectManagers(projectId: number): Promise<ProjectManager[]> {
    return db.select()
      .from(schema.projectManagers)
      .where(eq(schema.projectManagers.projectId, projectId));
  }

  async removeProjectManager(id: number): Promise<boolean> {
    await db.delete(schema.projectManagers).where(eq(schema.projectManagers.id, id));
    return true;
  }

  // Project Documents
  async addProjectDocument(document: InsertProjectDocument): Promise<ProjectDocument> {
    const [newDocument] = await db.insert(schema.projectDocuments).values({
      ...document,
      createdAt: new Date()
    }).returning();
    return newDocument;
  }

  async getProjectDocuments(projectId: number): Promise<ProjectDocument[]> {
    return db.select()
      .from(schema.projectDocuments)
      .where(eq(schema.projectDocuments.projectId, projectId));
  }

  async removeProjectDocument(id: number): Promise<boolean> {
    await db.delete(schema.projectDocuments).where(eq(schema.projectDocuments.id, id));
    return true;
  }
  
  // Project Members
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    // Primero, obtenemos los IDs de proyectos donde el usuario es miembro
    const memberProjects = await db
      .select({ projectId: schema.projectMembers.projectId })
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.userId, userId));
      
    // Luego, obtenemos los IDs de proyectos donde el usuario es manager
    const managerProjects = await db
      .select({ projectId: schema.projectManagers.projectId })
      .from(schema.projectManagers)
      .where(eq(schema.projectManagers.userId, userId));
      
    // Combinamos los IDs de proyectos únicos
    const projectIds = [...new Set([
      ...memberProjects.map(p => p.projectId), 
      ...managerProjects.map(p => p.projectId)
    ])];
    
    if (projectIds.length === 0) {
      return [];
    }
    
    // Obtenemos los detalles completos de todos esos proyectos
    return db
      .select()
      .from(schema.projects)
      .where(inArray(schema.projects.id, projectIds));
  }
  
  async isProjectManager(projectId: number, userId: number): Promise<boolean> {
    const managers = await db
      .select()
      .from(schema.projectManagers)
      .where(
        and(
          eq(schema.projectManagers.projectId, projectId),
          eq(schema.projectManagers.userId, userId)
        )
      );
      
    return managers.length > 0;
  }
  
  async isProjectMember(projectId: number, userId: number): Promise<boolean> {
    const members = await db
      .select()
      .from(schema.projectMembers)
      .where(
        and(
          eq(schema.projectMembers.projectId, projectId),
          eq(schema.projectMembers.userId, userId)
        )
      );
      
    return members.length > 0;
  }
  
  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return db
      .select()
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, projectId));
  }
  
  async getProjectMemberById(id: number): Promise<ProjectMember | undefined> {
    const [member] = await db
      .select()
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.id, id));
      
    return member;
  }
  
  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    // Verificar si ya existe un miembro con esta combinación de projectId y userId
    const existingMembers = await db
      .select()
      .from(schema.projectMembers)
      .where(
        and(
          eq(schema.projectMembers.projectId, member.projectId),
          eq(schema.projectMembers.userId, member.userId)
        )
      );
      
    if (existingMembers.length > 0) {
      throw new Error("El usuario ya es miembro de este proyecto");
    }
    
    // Insertar el nuevo miembro
    const [newMember] = await db
      .insert(schema.projectMembers)
      .values({
        ...member,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
      
    return newMember;
  }
  
  async updateProjectMember(id: number, data: Partial<ProjectMember>): Promise<ProjectMember | undefined> {
    const [updatedMember] = await db
      .update(schema.projectMembers)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(schema.projectMembers.id, id))
      .returning();
      
    return updatedMember;
  }
  
  async removeProjectMember(id: number): Promise<boolean> {
    await db
      .delete(schema.projectMembers)
      .where(eq(schema.projectMembers.id, id));
      
    return true;
  }
}

export const storage = new DatabaseStorage();
