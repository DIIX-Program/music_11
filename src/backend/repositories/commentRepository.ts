import { getConnection } from "../config/db.js";
import mssql from 'mssql';

export interface Comment {
  id: string;
  user_id: string;
  track_id: string;
  content: string;
  status: string;
  created_at: string;
}

/**
 * Comment Repository - SQL Server Implementation
 */
export const commentRepository = {
  create: async (comment: Omit<Comment, "created_at" | "status">): Promise<void> => {
    const { trackRepository } = await import("./trackRepository.js");
    const pool = await getConnection();
    const transaction = new mssql.Transaction(pool);

    try {
      await transaction.begin();

      await new mssql.Request(transaction)
        .input('id', mssql.VarChar, comment.id)
        .input('userId', mssql.VarChar, comment.user_id)
        .input('trackId', mssql.VarChar, comment.track_id)
        .input('content', mssql.NVarChar, comment.content)
        .input('status', mssql.VarChar, 'APPROVED') // Default to APPROVED for instant UX
        .query("INSERT INTO comments (id, user_id, track_id, content, status) VALUES (@id, @userId, @trackId, @content, @status)");

      await trackRepository.incrementCommentsCount(comment.track_id, transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error in commentRepository.create:', error);
      throw error;
    }
  },

  findByTrackId: async (track_id: string): Promise<any[]> => {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('trackId', mssql.VarChar, track_id)
        .query(`
          SELECT c.*, u.username, u.avatar_url
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.track_id = @trackId AND c.status = 'APPROVED'
          ORDER BY c.created_at DESC
        `);
      return result.recordset;
    } catch (error) {
      console.error('Error in commentRepository.findByTrackId:', error);
      throw error;
    }
  }
};
