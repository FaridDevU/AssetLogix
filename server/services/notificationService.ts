import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

// Initialize SendGrid with API key
const initSendgrid = () => {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    return true;
  }
  console.warn('SENDGRID_API_KEY no configurada. Las notificaciones por correo no funcionarán.');
  return false;
};

// No inicializar SendGrid por ahora, simplemente simular el envío
const sendgridInitialized = false;

/**
 * Envía una notificación por correo electrónico
 */
async function sendEmailNotification({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (!sendgridInitialized) {
    console.warn('No se puede enviar correo: SendGrid no está inicializado.');
    return false;
  }

  const msg: MailDataRequired = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'notificaciones@sistemagm.com',
    subject,
    text,
    html: html || text.replace(/\n/g, '<br>'),
  };

  try {
    await sgMail.send(msg);
    console.log(`Correo enviado exitosamente a ${to}`);
    return true;
  } catch (error) {
    console.error('Error enviando correo:', error);
    return false;
  }
}

/**
 * Envía notificación de mantenimiento programado
 */
async function sendMaintenanceNotification(maintenanceId: number) {
  try {
    // Obtener datos del mantenimiento
    const [maintenance] = await db
      .select()
      .from(schema.maintenanceSchedules)
      .where(eq(schema.maintenanceSchedules.id, maintenanceId));

    if (!maintenance) {
      throw new Error(`Mantenimiento ID ${maintenanceId} no encontrado`);
    }

    // Obtener datos del equipo
    const [equipment] = await db
      .select()
      .from(schema.equipment)
      .where(eq(schema.equipment.id, maintenance.equipmentId));

    if (!equipment) {
      throw new Error(`Equipo ID ${maintenance.equipmentId} no encontrado`);
    }

    // Obtener técnicos (usuarios con rol 'technician')
    const technicians = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'technician'));

    // Obtener administradores
    const admins = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'admin'));

    // Combinar destinatarios
    const recipients = [...technicians, ...admins].map(user => user.email);

    if (recipients.length === 0) {
      console.warn('No se encontraron destinatarios para enviar notificación de mantenimiento');
      return false;
    }

    // Formatear fecha
    const maintenanceDate = new Date(maintenance.nextDate);
    const formattedDate = maintenanceDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = maintenanceDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Preparar contenido del correo
    const subject = `Mantenimiento Programado: ${equipment.name} (${equipment.code})`;
    
    const text = `
      MANTENIMIENTO PROGRAMADO
      ========================

      Se ha programado un mantenimiento ${maintenance.type === 'preventive' ? 'preventivo' : 'correctivo'} para el siguiente equipo:

      Equipo: ${equipment.name}
      Código: ${equipment.code}
      Fecha: ${formattedDate}
      Hora: ${formattedTime}

      Descripción: ${maintenance.description || 'No especificada'}

      Por favor, coordinar con el equipo para realizar este mantenimiento según lo programado.

      Este es un mensaje automático, no responder a este correo.
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #005e7a; border-bottom: 2px solid #005e7a; padding-bottom: 10px;">MANTENIMIENTO PROGRAMADO</h2>
        
        <p>Se ha programado un mantenimiento <strong>${maintenance.type === 'preventive' ? 'preventivo' : 'correctivo'}</strong> para el siguiente equipo:</p>
        
        <div style="background-color: #f7f7f7; border-left: 4px solid #005e7a; padding: 15px; margin: 20px 0;">
          <p><strong>Equipo:</strong> ${equipment.name}</p>
          <p><strong>Código:</strong> ${equipment.code}</p>
          <p><strong>Fecha:</strong> ${formattedDate}</p>
          <p><strong>Hora:</strong> ${formattedTime}</p>
        </div>
        
        <p><strong>Descripción:</strong> ${maintenance.description || 'No especificada'}</p>
        
        <p>Por favor, coordinar con el equipo para realizar este mantenimiento según lo programado.</p>
        
        <div style="font-size: 12px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Este es un mensaje automático, no responder a este correo.
        </div>
      </div>
    `;

    // Enviar correos a cada destinatario
    const emailPromises = recipients.map(recipient =>
      sendEmailNotification({
        to: recipient,
        subject,
        text,
        html,
      })
    );

    // Esperar que todos los correos se envíen
    const results = await Promise.all(emailPromises);
    
    // Si al menos un correo se envió correctamente, considerar exitoso
    return results.some(result => result === true);
  } catch (error) {
    console.error('Error en envío de notificación de mantenimiento:', error);
    return false;
  }
}

/**
 * Envía recordatorio de mantenimiento próximo
 */
async function sendMaintenanceReminder(maintenanceId: number) {
  try {
    // Similar a sendMaintenanceNotification pero con texto de recordatorio
    const [maintenance] = await db
      .select()
      .from(schema.maintenanceSchedules)
      .where(eq(schema.maintenanceSchedules.id, maintenanceId));

    if (!maintenance) {
      throw new Error(`Mantenimiento ID ${maintenanceId} no encontrado`);
    }

    const [equipment] = await db
      .select()
      .from(schema.equipment)
      .where(eq(schema.equipment.id, maintenance.equipmentId));

    if (!equipment) {
      throw new Error(`Equipo ID ${maintenance.equipmentId} no encontrado`);
    }

    // Obtener técnicos y administradores
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'technician'));

    const admins = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'admin'));

    const recipients = [...users, ...admins].map(user => user.email);

    if (recipients.length === 0) {
      console.warn('No se encontraron destinatarios para enviar recordatorio de mantenimiento');
      return false;
    }

    const maintenanceDate = new Date(maintenance.nextDate);
    const formattedDate = maintenanceDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = maintenanceDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Los días que faltan para el mantenimiento
    const daysUntilMaintenance = Math.ceil(
      (maintenanceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const subject = `RECORDATORIO: Mantenimiento de ${equipment.name} en ${daysUntilMaintenance} día(s)`;
    
    const text = `
      RECORDATORIO DE MANTENIMIENTO
      ============================

      Este es un recordatorio del mantenimiento ${maintenance.type === 'preventive' ? 'preventivo' : 'correctivo'} programado en ${daysUntilMaintenance} día(s):

      Equipo: ${equipment.name}
      Código: ${equipment.code}
      Fecha: ${formattedDate}
      Hora: ${formattedTime}

      Descripción: ${maintenance.description || 'No especificada'}

      Por favor, asegúrese de preparar todo lo necesario para este mantenimiento.

      Este es un mensaje automático, no responder a este correo.
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d35400; border-bottom: 2px solid #d35400; padding-bottom: 10px;">RECORDATORIO DE MANTENIMIENTO</h2>
        
        <p>Este es un recordatorio del mantenimiento <strong>${maintenance.type === 'preventive' ? 'preventivo' : 'correctivo'}</strong> programado en <strong>${daysUntilMaintenance} día(s)</strong>:</p>
        
        <div style="background-color: #fff3e0; border-left: 4px solid #d35400; padding: 15px; margin: 20px 0;">
          <p><strong>Equipo:</strong> ${equipment.name}</p>
          <p><strong>Código:</strong> ${equipment.code}</p>
          <p><strong>Fecha:</strong> ${formattedDate}</p>
          <p><strong>Hora:</strong> ${formattedTime}</p>
        </div>
        
        <p><strong>Descripción:</strong> ${maintenance.description || 'No especificada'}</p>
        
        <p>Por favor, asegúrese de preparar todo lo necesario para este mantenimiento.</p>
        
        <div style="font-size: 12px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          Este es un mensaje automático, no responder a este correo.
        </div>
      </div>
    `;

    // Enviar correos a cada destinatario
    const emailPromises = recipients.map(recipient =>
      sendEmailNotification({
        to: recipient,
        subject,
        text,
        html,
      })
    );

    const results = await Promise.all(emailPromises);
    return results.some(result => result === true);
  } catch (error) {
    console.error('Error en envío de recordatorio de mantenimiento:', error);
    return false;
  }
}

export const notificationService = {
  sendEmailNotification,
  sendMaintenanceNotification,
  sendMaintenanceReminder,
};
