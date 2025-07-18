import { pgTable, text, serial, integer, boolean, timestamp, json, real, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Roles personalizados y permisos
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  // Permisos generales
  canManageUsers: boolean("can_manage_users").notNull().default(false),
  canManageRoles: boolean("can_manage_roles").notNull().default(false),
  // Permisos de documentos
  canCreateDocuments: boolean("can_create_documents").notNull().default(true),
  canViewDocuments: boolean("can_view_documents").notNull().default(true),
  canEditDocuments: boolean("can_edit_documents").notNull().default(false),
  canDeleteDocuments: boolean("can_delete_documents").notNull().default(false),
  // Permisos de carpetas
  canCreateFolders: boolean("can_create_folders").notNull().default(true),
  canViewFolders: boolean("can_view_folders").notNull().default(true),
  canEditFolders: boolean("can_edit_folders").notNull().default(false),
  canDeleteFolders: boolean("can_delete_folders").notNull().default(false),
  // Permisos de equipos
  canCreateEquipment: boolean("can_create_equipment").notNull().default(false),
  canViewEquipment: boolean("can_view_equipment").notNull().default(true),
  canEditEquipment: boolean("can_edit_equipment").notNull().default(false),
  canDeleteEquipment: boolean("can_delete_equipment").notNull().default(false),
  // Permisos de mantenimiento
  canScheduleMaintenance: boolean("can_schedule_maintenance").notNull().default(false),
  canCompleteMaintenance: boolean("can_complete_maintenance").notNull().default(false),
  // Permisos de proyectos (obras)
  canCreateProjects: boolean("can_create_projects").notNull().default(false),
  canViewProjects: boolean("can_view_projects").notNull().default(true),
  canEditProjects: boolean("can_edit_projects").notNull().default(false),
  canDeleteProjects: boolean("can_delete_projects").notNull().default(false),
  canManageProjectEquipment: boolean("can_manage_project_equipment").notNull().default(false),
  // Metadatos
  isSystemRole: boolean("is_system_role").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRoleSchema = createInsertSchema(roles).pick({
  name: true,
  description: true,
  canManageUsers: true,
  canManageRoles: true,
  canCreateDocuments: true,
  canViewDocuments: true,
  canEditDocuments: true,
  canDeleteDocuments: true,
  canCreateFolders: true,
  canViewFolders: true,
  canEditFolders: true,
  canDeleteFolders: true,
  canCreateEquipment: true,
  canViewEquipment: true,
  canEditEquipment: true,
  canDeleteEquipment: true,
  canScheduleMaintenance: true,
  canCompleteMaintenance: true,
  canCreateProjects: true,
  canViewProjects: true,
  canEditProjects: true,
  canDeleteProjects: true,
  canManageProjectEquipment: true,
  isSystemRole: true,
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

// Users and Authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // "admin", "user", "technician"
  customRoleId: integer("custom_role_id").references(() => roles.id),
  status: text("status").notNull().default("active"), // "active", "disabled", "pending"
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
  status: true,
  avatar: true,
});

// Document Management
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  parentId: integer("parent_id").references((): any => folders.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  path: true,
  parentId: true,
  createdBy: true,
});

// Permisos de acceso a carpetas
export const folderPermissions = pgTable("folder_permissions", {
  id: serial("id").primaryKey(),
  folderId: integer("folder_id").references(() => folders.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  canView: boolean("can_view").notNull().default(true),
  canEdit: boolean("can_edit").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  canShare: boolean("can_share").notNull().default(false),
  isOwner: boolean("is_owner").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFolderPermissionSchema = createInsertSchema(folderPermissions).pick({
  folderId: true,
  userId: true,
  canView: true,
  canEdit: true,
  canDelete: true,
  canShare: true,
  isOwner: true,
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // File type (pdf, docx, etc.)
  originalExtension: text("original_extension"), // Original file extension (.dwg, .rvt, etc.)
  size: integer("size").notNull(),
  path: text("path").notNull(),
  folderId: integer("folder_id").references(() => folders.id),
  currentVersion: integer("current_version").notNull().default(1),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  name: true,
  type: true,
  originalExtension: true,
  size: true,
  path: true,
  folderId: true,
  createdBy: true,
});

export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  version: integer("version").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).pick({
  documentId: true,
  version: true,
  path: true,
  size: true,
  createdBy: true,
});

export const documentActivity = pgTable("document_activity", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // "upload", "download", "view", "edit", "delete"
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDocumentActivitySchema = createInsertSchema(documentActivity).pick({
  documentId: true,
  userId: true,
  action: true,
  details: true,
});

// Equipment Management
export const equipmentTypes = pgTable("equipment_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertEquipmentTypeSchema = createInsertSchema(equipmentTypes).pick({
  name: true,
  description: true,
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  typeId: integer("type_id").references(() => equipmentTypes.id),
  status: text("status").notNull().default("operational"), // "operational", "maintenance", "out_of_service"
  location: text("location"),
  installationDate: timestamp("installation_date"),
  specifications: json("specifications"),
  photo: text("photo"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEquipmentSchema = createInsertSchema(equipment).pick({
  name: true,
  code: true,
  typeId: true,
  status: true,
  location: true,
  installationDate: true,
  specifications: true,
  photo: true,
  notes: true,
});

export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  type: text("type").notNull(), // "preventive", "corrective"
  frequency: text("frequency"), // "daily", "weekly", "monthly", "quarterly", "yearly"
  nextDate: timestamp("next_date").notNull(),
  description: text("description"),
  reminderDays: integer("reminder_days").default(7),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedules).pick({
  equipmentId: true,
  type: true,
  frequency: true,
  nextDate: true,
  description: true,
  reminderDays: true,
});

export const maintenanceInterventions = pgTable("maintenance_interventions", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  scheduleId: integer("schedule_id").references(() => maintenanceSchedules.id),
  type: text("type").notNull(), // "preventive", "corrective", "emergency"
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  technician: integer("technician").references(() => users.id),
  findings: text("findings"),
  actions: text("actions"),
  parts: json("parts"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMaintenanceInterventionSchema = createInsertSchema(maintenanceInterventions).pick({
  equipmentId: true,
  scheduleId: true,
  type: true,
  status: true,
  startDate: true,
  endDate: true,
  technician: true,
  findings: true,
  actions: true,
  parts: true,
});

export const maintenanceAttachments = pgTable("maintenance_attachments", {
  id: serial("id").primaryKey(),
  interventionId: integer("intervention_id").references(() => maintenanceInterventions.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMaintenanceAttachmentSchema = createInsertSchema(maintenanceAttachments).pick({
  interventionId: true,
  name: true,
  type: true,
  size: true,
  path: true,
  uploadedBy: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type FolderPermission = typeof folderPermissions.$inferSelect;
export type InsertFolderPermission = z.infer<typeof insertFolderPermissionSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;

export type DocumentActivity = typeof documentActivity.$inferSelect;
export type InsertDocumentActivity = z.infer<typeof insertDocumentActivitySchema>;

export type EquipmentType = typeof equipmentTypes.$inferSelect;
export type InsertEquipmentType = z.infer<typeof insertEquipmentTypeSchema>;

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type InsertMaintenanceSchedule = z.infer<typeof insertMaintenanceScheduleSchema>;

export type MaintenanceIntervention = typeof maintenanceInterventions.$inferSelect;
export type InsertMaintenanceIntervention = z.infer<typeof insertMaintenanceInterventionSchema>;

export type MaintenanceAttachment = typeof maintenanceAttachments.$inferSelect;
export type InsertMaintenanceAttachment = z.infer<typeof insertMaintenanceAttachmentSchema>;

// Comentarios y tareas con sistema de reacciones
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  documentId: integer("document_id").references(() => documents.id),
  equipmentId: integer("equipment_id").references(() => equipment.id),
  maintenanceId: integer("maintenance_id").references(() => maintenanceInterventions.id),
  parentId: integer("parent_id").references((): any => comments.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  userId: true,
  documentId: true,
  equipmentId: true,
  maintenanceId: true,
  parentId: true,
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // "pending", "in_progress", "completed", "cancelled"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "urgent"
  dueDate: timestamp("due_date"),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  documentId: integer("document_id").references(() => documents.id),
  equipmentId: integer("equipment_id").references(() => equipment.id),
  maintenanceId: integer("maintenance_id").references(() => maintenanceInterventions.id),
  completedAt: timestamp("completed_at"),
  completedById: integer("completed_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  assignedToId: true,
  createdById: true,
  documentId: true,
  equipmentId: true,
  maintenanceId: true,
});

// Sistema de reacciones con emojis
export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  emoji: text("emoji").notNull(), // Emoji como string (ejemplo: "👍", "❤️", "👏")
  userId: integer("user_id").references(() => users.id).notNull(),
  commentId: integer("comment_id").references(() => comments.id),
  taskId: integer("task_id").references(() => tasks.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReactionSchema = createInsertSchema(reactions).pick({
  emoji: true,
  userId: true,
  commentId: true,
  taskId: true,
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;

// IoT Integration for Predictive Maintenance
export const iotSensors = pgTable("iot_sensors", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  deviceId: text("device_id").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "temperature", "vibration", "pressure", "humidity", etc.
  units: text("units").notNull(), // "C", "Hz", "Pa", "%, etc.
  location: text("location"), // Specific location on the equipment
  minThreshold: decimal("min_threshold"), // Minimum normal value
  maxThreshold: decimal("max_threshold"), // Maximum normal value
  criticalMinThreshold: decimal("critical_min_threshold"), // Critical minimum value
  criticalMaxThreshold: decimal("critical_max_threshold"), // Critical maximum value
  status: text("status").notNull().default("active"), // "active", "inactive", "error"
  lastCommunication: timestamp("last_communication"),
  metadata: json("metadata"), // Additional sensor configuration and information
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIotSensorSchema = createInsertSchema(iotSensors).pick({
  equipmentId: true,
  deviceId: true,
  name: true,
  type: true,
  units: true,
  location: true,
  minThreshold: true,
  maxThreshold: true,
  criticalMinThreshold: true,
  criticalMaxThreshold: true,
  status: true,
  metadata: true,
});

export const sensorReadings = pgTable("sensor_readings", {
  id: serial("id").primaryKey(),
  sensorId: integer("sensor_id").references(() => iotSensors.id).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  value: decimal("value").notNull(),
  status: text("status").notNull(), // "normal", "warning", "critical"
  batteryLevel: integer("battery_level"), // Battery level in percentage
  signalStrength: integer("signal_strength"), // Signal strength
  metadata: json("metadata"), // Additional reading data
});

export const insertSensorReadingSchema = createInsertSchema(sensorReadings).pick({
  sensorId: true,
  timestamp: true,
  value: true,
  status: true,
  batteryLevel: true,
  signalStrength: true,
  metadata: true,
});

export const maintenancePredictions = pgTable("maintenance_predictions", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  predictionType: text("prediction_type").notNull(), // "failure", "degradation", "maintenance_needed"
  confidence: decimal("confidence").notNull(), // Confidence level (0-100)
  predictedDate: timestamp("predicted_date").notNull(),
  suggestedActions: text("suggested_actions"),
  status: text("status").notNull().default("open"), // "open", "acknowledged", "resolved", "false_positive"
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  generatedBy: text("generated_by").notNull(), // "algorithm", "rule_based", "manual"
  modelVersion: text("model_version"), // Version of the prediction model
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMaintenancePredictionSchema = createInsertSchema(maintenancePredictions).pick({
  equipmentId: true,
  predictionType: true,
  confidence: true,
  predictedDate: true,
  suggestedActions: true,
  status: true,
  generatedBy: true,
  modelVersion: true,
});

export const predictionEvidence = pgTable("prediction_evidence", {
  id: serial("id").primaryKey(),
  predictionId: integer("prediction_id").references(() => maintenancePredictions.id).notNull(),
  sensorId: integer("sensor_id").references(() => iotSensors.id),
  readingId: integer("reading_id").references(() => sensorReadings.id),
  evidenceType: text("evidence_type").notNull(), // "anomaly", "trend", "threshold_breach", "pattern"
  description: text("description").notNull(),
  importance: decimal("importance"), // Weight/importance of this evidence in the prediction
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPredictionEvidenceSchema = createInsertSchema(predictionEvidence).pick({
  predictionId: true,
  sensorId: true,
  readingId: true,
  evidenceType: true,
  description: true,
  importance: true,
});

export const iotDevices = pgTable("iot_devices", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "gateway", "sensor_hub", "standalone"
  location: text("location"),
  status: text("status").notNull().default("active"), // "active", "inactive", "error"
  lastCommunication: timestamp("last_communication"),
  firmwareVersion: text("firmware_version"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  apiKey: text("api_key"), // For device authentication
  metadata: json("metadata"), // Additional device configuration
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIotDeviceSchema = createInsertSchema(iotDevices).pick({
  deviceId: true,
  name: true,
  type: true,
  location: true,
  status: true,
  firmwareVersion: true,
  ipAddress: true,
  macAddress: true,
  apiKey: true,
  metadata: true,
});

export const alertNotifications = pgTable("alert_notifications", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id),
  sensorId: integer("sensor_id").references(() => iotSensors.id),
  readingId: integer("reading_id").references(() => sensorReadings.id),
  predictionId: integer("prediction_id").references(() => maintenancePredictions.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(), // "info", "warning", "critical"
  status: text("status").notNull().default("unread"), // "unread", "read", "acknowledged"
  sendEmail: boolean("send_email").default(false),
  sendSms: boolean("send_sms").default(false),
  recipientId: integer("recipient_id").references(() => users.id),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlertNotificationSchema = createInsertSchema(alertNotifications).pick({
  equipmentId: true,
  sensorId: true,
  readingId: true,
  predictionId: true,
  title: true,
  message: true,
  severity: true,
  status: true,
  sendEmail: true,
  sendSms: true,
  recipientId: true,
});

// Types for IoT and Predictive Maintenance
export type IotSensor = typeof iotSensors.$inferSelect;
export type InsertIotSensor = z.infer<typeof insertIotSensorSchema>;

export type SensorReading = typeof sensorReadings.$inferSelect;
export type InsertSensorReading = z.infer<typeof insertSensorReadingSchema>;

export type MaintenancePrediction = typeof maintenancePredictions.$inferSelect;
export type InsertMaintenancePrediction = z.infer<typeof insertMaintenancePredictionSchema>;

export type PredictionEvidence = typeof predictionEvidence.$inferSelect;
export type InsertPredictionEvidence = z.infer<typeof insertPredictionEvidenceSchema>;

export type IotDevice = typeof iotDevices.$inferSelect;
export type InsertIotDevice = z.infer<typeof insertIotDeviceSchema>;

export type AlertNotification = typeof alertNotifications.$inferSelect;
export type InsertAlertNotification = z.infer<typeof insertAlertNotificationSchema>;

// Construction Projects (Obras)
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  status: text("status").notNull().default("in_progress"), // "in_progress", "completed", "on_hold", "cancelled"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  description: text("description"),
  budget: decimal("budget"),
  clientName: text("client_name"),
  clientContact: text("client_contact"),
  image: text("image"), // URL or path to the project image
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  location: true,
  status: true,
  startDate: true,
  endDate: true,
  description: true,
  budget: true,
  clientName: true,
  clientContact: true,
  image: true,
  createdBy: true,
});

export const projectManagers = pgTable("project_managers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("manager"), // "manager", "supervisor", "lead"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectManagerSchema = createInsertSchema(projectManagers).pick({
  projectId: true,
  userId: true,
  role: true,
});

export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"), // "member", "guest", "observer"
  permissions: json("permissions").notNull().default(['view']), // array de permisos: ['view', 'edit', 'delete', etc.]
  addedBy: integer("added_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectMemberSchema = createInsertSchema(projectMembers).pick({
  projectId: true,
  userId: true,
  role: true,
  permissions: true,
  addedBy: true,
});

export const projectDocuments = pgTable("project_documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  documentType: text("document_type").notNull(), // "contract", "permit", "plan", "invoice", "other"
  description: text("description"),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectDocumentSchema = createInsertSchema(projectDocuments).pick({
  projectId: true,
  documentId: true,
  documentType: true,
  description: true,
  uploadedBy: true,
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectManager = typeof projectManagers.$inferSelect;
export type InsertProjectManager = z.infer<typeof insertProjectManagerSchema>;

export type ProjectDocument = typeof projectDocuments.$inferSelect;
export type InsertProjectDocument = z.infer<typeof insertProjectDocumentSchema>;

// Project Equipment Assignment
export const projectEquipment = pgTable("project_equipment", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  assignedDate: timestamp("assigned_date").notNull().defaultNow(),
  expectedReturnDate: timestamp("expected_return_date"),
  actualReturnDate: timestamp("actual_return_date"),
  assignedBy: integer("assigned_by").references(() => users.id).notNull(),
  status: text("status").notNull().default("assigned"), // "assigned", "in_use", "returned"
  notes: text("notes"),
  isShared: boolean("is_shared").notNull().default(false), // Indicates if equipment is shared with other projects
  authorizationCode: text("authorization_code"), // Required for shared equipment
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectEquipmentSchema = createInsertSchema(projectEquipment).pick({
  projectId: true,
  equipmentId: true,
  assignedDate: true,
  expectedReturnDate: true,
  actualReturnDate: true,
  assignedBy: true,
  status: true,
  notes: true,
  isShared: true,
  authorizationCode: true,
});

export type ProjectEquipment = typeof projectEquipment.$inferSelect;
export type InsertProjectEquipment = z.infer<typeof insertProjectEquipmentSchema>;

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
