import { db } from '../db';
import { reactions, type Reaction, type InsertReaction } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

export class ReactionService {
  /**
   * Agrega una reacción nueva
   */
  async addReaction(insertReaction: InsertReaction): Promise<Reaction> {
    const [reaction] = await db.insert(reactions).values(insertReaction).returning();
    return reaction;
  }

  /**
   * Elimina una reacción existente
   */
  async removeReaction(userId: number, emoji: string, commentId?: number, taskId?: number): Promise<boolean> {
    let conditions = and(
      eq(reactions.userId, userId),
      eq(reactions.emoji, emoji)
    );

    // Add additional condition based on whether we're looking at comments or tasks
    if (commentId !== undefined) {
      if (commentId === null) {
        conditions = and(conditions, sql`comment_id IS NULL`);
      } else {
        conditions = and(conditions, eq(reactions.commentId, commentId));
      }
    } else if (taskId !== undefined) {
      if (taskId === null) {
        conditions = and(conditions, sql`task_id IS NULL`);
      } else {
        conditions = and(conditions, eq(reactions.taskId, taskId));
      }
    } else {
      throw new Error('Se requiere un commentId o taskId');
    }

    const result = await db.delete(reactions).where(conditions).returning();
    return result.length > 0;
  }

  /**
   * Alterna una reacción (la agrega si no existe, la quita si ya existe)
   */
  async toggleReaction(userId: number, emoji: string, commentId?: number, taskId?: number): Promise<Reaction | null> {
    // Verificar si la reacción ya existe
    let conditions = and(
      eq(reactions.userId, userId),
      eq(reactions.emoji, emoji)
    );

    // Add additional condition based on whether we're looking at comments or tasks
    if (commentId !== undefined) {
      if (commentId === null) {
        conditions = and(conditions, sql`comment_id IS NULL`);
      } else {
        conditions = and(conditions, eq(reactions.commentId, commentId));
      }
    } else if (taskId !== undefined) {
      if (taskId === null) {
        conditions = and(conditions, sql`task_id IS NULL`);
      } else {
        conditions = and(conditions, eq(reactions.taskId, taskId));
      }
    } else {
      throw new Error('Se requiere un commentId o taskId');
    }

    const [existingReaction] = await db.select().from(reactions).where(conditions);

    if (existingReaction) {
      // Si ya existe, eliminarla
      await this.removeReaction(userId, emoji, commentId, taskId);
      return null;
    } else {
      // Si no existe, agregarla
      const newReaction: InsertReaction = {
        emoji,
        userId,
        commentId,
        taskId
      };
      return await this.addReaction(newReaction);
    }
  }

  /**
   * Obtiene todas las reacciones para un comentario
   */
  async getReactionsByCommentId(commentId: number): Promise<{emoji: string, count: number}[]> {
    const result = await db.execute(sql`
      SELECT emoji, COUNT(*) as count
      FROM reactions
      WHERE comment_id = ${commentId}
      GROUP BY emoji
      ORDER BY count DESC
    `);
    return result.rows as {emoji: string, count: number}[];
  }

  /**
   * Obtiene todas las reacciones para una tarea
   */
  async getReactionsByTaskId(taskId: number): Promise<{emoji: string, count: number}[]> {
    const result = await db.execute(sql`
      SELECT emoji, COUNT(*) as count
      FROM reactions
      WHERE task_id = ${taskId}
      GROUP BY emoji
      ORDER BY count DESC
    `);
    return result.rows as {emoji: string, count: number}[];
  }

  /**
   * Verifica si un usuario ha reaccionado a un comentario o tarea
   */
  async getUserReactions(userId: number, commentId?: number, taskId?: number): Promise<string[]> {
    // Build base condition
    let conditions = eq(reactions.userId, userId);

    // Add additional condition based on whether we're looking at comments or tasks
    if (commentId !== undefined) {
      if (commentId === null) {
        conditions = and(conditions, sql`comment_id IS NULL`);
      } else {
        conditions = and(conditions, eq(reactions.commentId, commentId));
      }
    } else if (taskId !== undefined) {
      if (taskId === null) {
        conditions = and(conditions, sql`task_id IS NULL`);
      } else {
        conditions = and(conditions, eq(reactions.taskId, taskId));
      }
    } else {
      throw new Error('Se requiere un commentId o taskId');
    }

    const userReactions = await db.select().from(reactions).where(conditions);
    return userReactions.map(r => r.emoji);
  }

  /**
   * Obtiene las reacciones agrupadas con indicación de si el usuario actual ha reaccionado
   */
  async getFormattedReactions(userId: number, commentId?: number, taskId?: number): Promise<{emoji: string, count: number, selected: boolean}[]> {
    let reactionsList: {emoji: string, count: number}[] = [];
    
    if (commentId !== undefined) {
      reactionsList = await this.getReactionsByCommentId(commentId);
    } else if (taskId !== undefined) {
      reactionsList = await this.getReactionsByTaskId(taskId);
    } else {
      throw new Error('Se requiere un commentId o taskId');
    }

    const userReactions = await this.getUserReactions(userId, commentId, taskId);
    
    return reactionsList.map(reaction => ({
      ...reaction,
      selected: userReactions.includes(reaction.emoji)
    }));
  }
}

// Singleton para uso en toda la aplicación
export const reactionService = new ReactionService();
