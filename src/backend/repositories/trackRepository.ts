import { getConnection } from "../config/db.js";
import mssql from 'mssql';
import crypto from 'crypto';

export interface Track {
  id: string;
  title: string;
  main_artist: string;
  file_path: string;
  cover_url?: string;
  plays_count: number;
  created_at: string | Date;
}

/**
 * Track Repository - SQL Server Implementation
 * All methods use parameterized queries to prevent SQL injection.
 */
export const trackRepository = {
  /**
   * Fix BUG #6: Include cover_url in SELECT via JOIN
   */
  findAll: async (limit: number = 50, offset: number = 0): Promise<Track[]> => {
    const pool = await getConnection();
    const result = await pool.request()
      .input('limit', mssql.Int, limit)
      .input('offset', mssql.Int, offset)
      .query(`
        SELECT
          t.id, t.title, t.main_artist, t.plays_count, t.likes_count, t.created_at,
          s_audio.path AS file_path,
          s_img.path   AS cover_url,
          g.name       AS genre
        FROM tracks t
        JOIN storage_objects s_audio ON t.audio_object_id = s_audio.id
        LEFT JOIN storage_objects s_img ON t.cover_image_object_id = s_img.id
        LEFT JOIN genres g ON t.genre_id = g.id
        WHERE t.status = 'APPROVED' AND t.visibility = 'PUBLIC'
        ORDER BY t.plays_count DESC, t.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    return result.recordset as Track[];
  },

  /**
   * Find a track by ID (includes cover_url)
   */
  findById: async (id: string): Promise<Track | undefined> => {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', mssql.VarChar, id)
      .query(`
        SELECT
          t.id, t.title, t.main_artist, t.plays_count, t.likes_count,
          t.created_at, t.visibility, t.status, t.description, t.lyrics_lrc,
          s_audio.path AS file_path,
          s_img.path   AS cover_url,
          g.name       AS genre
        FROM tracks t
        JOIN storage_objects s_audio ON t.audio_object_id = s_audio.id
        LEFT JOIN storage_objects s_img ON t.cover_image_object_id = s_img.id
        LEFT JOIN genres g ON t.genre_id = g.id
        WHERE t.id = @id
      `);
    return result.recordset[0] as Track | undefined;
  },

  /**
   * Fix BUG #3: Removed album logic (albums table not in schema).
   * Create track with full transaction for atomicity.
   */
  create: async (track: {
    id: string;
    title: string;
    main_artist: string;
    file_path: string;
    uploader_user_id: string;
    cover_image_path?: string;
    genre?: string;
    description?: string;
    visibility?: string;
    releaseDate?: string;
    artist_id?: string;
  }): Promise<void> => {
    const pool = await getConnection();
    const tx = new mssql.Transaction(pool);
    await tx.begin();

    try {
      const audioObjectId = `audio_${track.id}`;

      // 1. Insert audio storage object
      await new mssql.Request(tx)
        .input('id',     mssql.VarChar, audioObjectId)
        .input('owner',  mssql.VarChar, track.uploader_user_id)
        .input('type',   mssql.VarChar, 'audio')
        .input('path',   mssql.VarChar, track.file_path)
        .input('status', mssql.VarChar, 'active')
        .query(`INSERT INTO storage_objects (id, owner_user_id, object_type, path, status)
                VALUES (@id, @owner, @type, @path, @status)`);

      // 2. Handle Genre lookup/create
      let genreId: string | null = null;
      if (track.genre) {
        const genreRes = await pool.request()
          .input('name', mssql.NVarChar, track.genre)
          .query("SELECT id FROM genres WHERE name = @name");

        if (genreRes.recordset[0]) {
          genreId = genreRes.recordset[0].id;
        } else {
          genreId = `genre_${crypto.randomUUID()}`;
          const slug = track.genre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          await new mssql.Request(tx)
            .input('id',   mssql.VarChar, genreId)
            .input('name', mssql.NVarChar, track.genre)
            .input('slug', mssql.VarChar, slug)
            .query("INSERT INTO genres (id, name, slug) VALUES (@id, @name, @slug)");
        }
      }

      // 3. Handle Cover Image
      let coverImageObjectId: string | null = null;
      if (track.cover_image_path) {
        coverImageObjectId = `image_${track.id}`;
        await new mssql.Request(tx)
          .input('id',     mssql.VarChar, coverImageObjectId)
          .input('owner',  mssql.VarChar, track.uploader_user_id)
          .input('type',   mssql.VarChar, 'image')
          .input('path',   mssql.VarChar, track.cover_image_path)
          .input('status', mssql.VarChar, 'active')
          .query(`INSERT INTO storage_objects (id, owner_user_id, object_type, path, status)
                  VALUES (@id, @owner, @type, @path, @status)`);
      }

      // 4. Insert Track (status = PENDING by default for moderation)
      await new mssql.Request(tx)
        .input('id',         mssql.VarChar,  track.id)
        .input('uploader',   mssql.VarChar,  track.uploader_user_id)
        .input('artistId',   mssql.VarChar,  track.artist_id || null)
        .input('title',      mssql.NVarChar, track.title)
        .input('slug',       mssql.VarChar,  track.id)
        .input('artist',     mssql.NVarChar, track.main_artist)
        .input('audioId',    mssql.VarChar,  audioObjectId)
        .input('coverId',    mssql.VarChar,  coverImageObjectId)
        .input('visibility', mssql.VarChar,  track.visibility || 'PUBLIC')
        .input('status',     mssql.VarChar,  'PENDING')
        .input('desc',       mssql.NVarChar, track.description || null)
        .input('genreId',    mssql.VarChar,  genreId)
        .input('release',    mssql.Date,     track.releaseDate || null)
        .query(`
          INSERT INTO tracks
            (id, uploader_user_id, artist_id, title, slug, main_artist, audio_object_id,
             cover_image_object_id, visibility, status, description, genre_id, release_date)
          VALUES
            (@id, @uploader, @artistId, @title, @slug, @artist, @audioId,
             @coverId, @visibility, @status, @desc, @genreId, @release)
        `);

      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  /**
   * Delete a track and its storage objects
   */
  delete: async (id: string): Promise<void> => {
    const pool = await getConnection();
    const tx = new mssql.Transaction(pool);
    await tx.begin();
    try {
      const trackRes = await pool.request()
        .input('id', mssql.VarChar, id)
        .query("SELECT audio_object_id, cover_image_object_id FROM tracks WHERE id = @id");

      if (trackRes.recordset[0]) {
        const { audio_object_id, cover_image_object_id } = trackRes.recordset[0];
        await new mssql.Request(tx).input('id', mssql.VarChar, id).query("DELETE FROM playlist_tracks WHERE track_id = @id");
        await new mssql.Request(tx).input('id', mssql.VarChar, id).query("DELETE FROM track_likes WHERE track_id = @id");
        await new mssql.Request(tx).input('id', mssql.VarChar, id).query("DELETE FROM listening_history WHERE track_id = @id");
        await new mssql.Request(tx).input('id', mssql.VarChar, id).query("DELETE FROM tracks WHERE id = @id");
        await new mssql.Request(tx).input('id', mssql.VarChar, audio_object_id).query("DELETE FROM storage_objects WHERE id = @id");
        if (cover_image_object_id) {
          await new mssql.Request(tx).input('id', mssql.VarChar, cover_image_object_id).query("DELETE FROM storage_objects WHERE id = @id");
        }
      }
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  /**
   * Increment play count only (for unauthenticated users)
   */
  incrementPlayCount: async (id: string): Promise<void> => {
    const pool = await getConnection();
    await pool.request()
      .input('id', mssql.VarChar, id)
      .query("UPDATE tracks SET plays_count = plays_count + 1 WHERE id = @id");
  },

  /**
   * Log a play in history (authenticated users) and increment play count
   */
  logPlay: async (id: string, userId: string): Promise<void> => {
    const pool = await getConnection();
    const historyId = crypto.randomUUID();

    await pool.request()
      .input('id',      mssql.VarChar, historyId)
      .input('userId',  mssql.VarChar, userId)
      .input('trackId', mssql.VarChar, id)
      .query("INSERT INTO listening_history (id, user_id, track_id) VALUES (@id, @userId, @trackId)");

    await pool.request()
      .input('id', mssql.VarChar, id)
      .query("UPDATE tracks SET plays_count = plays_count + 1 WHERE id = @id");
  },

  /**
   * Search tracks by title or artist (APPROVED + PUBLIC only)
   */
  search: async (query: string, limit: number = 20): Promise<Track[]> => {
    const pool = await getConnection();
    const term = `%${query}%`;
    const result = await pool.request()
      .input('term',  mssql.NVarChar, term)
      .input('limit', mssql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          t.id, t.title, t.main_artist, t.plays_count, t.created_at,
          s_audio.path AS file_path,
          s_img.path   AS cover_url,
          g.name       AS genre
        FROM tracks t
        JOIN storage_objects s_audio ON t.audio_object_id = s_audio.id
        LEFT JOIN storage_objects s_img ON t.cover_image_object_id = s_img.id
        LEFT JOIN genres g ON t.genre_id = g.id
        WHERE (t.title LIKE @term OR t.main_artist LIKE @term)
          AND t.status = 'APPROVED' AND t.visibility = 'PUBLIC'
        ORDER BY t.plays_count DESC
      `);
    return result.recordset as Track[];
  },

  /**
   * getLatest - Fetches newest tracks.
   */
  getLatest: async (limit: number = 10): Promise<Track[]> => {
    const pool = await getConnection();
    const result = await pool.request()
      .input('limit', mssql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          t.id, t.title, t.main_artist, t.plays_count, t.created_at,
          s_audio.path AS file_path,
          s_img.path   AS cover_url,
          g.name       AS genre
        FROM tracks t
        JOIN storage_objects s_audio ON t.audio_object_id = s_audio.id
        LEFT JOIN storage_objects s_img ON t.cover_image_object_id = s_img.id
        LEFT JOIN genres g ON t.genre_id = g.id
        WHERE t.status = 'APPROVED' AND t.visibility = 'PUBLIC'
        ORDER BY t.created_at DESC
      `);
    return result.recordset as Track[];
  },

  /**
   * findRecommended - Behavioral recommendation based on user history.
   */
  findRecommended: async (userId: string, limit: number = 10): Promise<Track[]> => {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', mssql.VarChar, userId)
      .input('limit',  mssql.Int, limit)
      .query(`
        DECLARE @historyCount INT;
        SELECT @historyCount = COUNT(*) FROM listening_history WHERE user_id = @userId;

        IF @historyCount > 0
        BEGIN
          -- Recommend based on Top 3 Genres from History
          SELECT TOP (@limit)
            t.id, t.title, t.main_artist, t.plays_count, t.likes_count, t.created_at,
            s_audio.path AS file_path,
            s_img.path   AS cover_url,
            g.name       AS genre
          FROM tracks t
          JOIN storage_objects s_audio ON t.audio_object_id = s_audio.id
          LEFT JOIN storage_objects s_img ON t.cover_image_object_id = s_img.id
          LEFT JOIN genres g ON t.genre_id = g.id
          WHERE t.genre_id IN (
            SELECT TOP 3 t2.genre_id
            FROM listening_history h
            JOIN tracks t2 ON h.track_id = t2.id
            WHERE h.user_id = @userId AND t2.genre_id IS NOT NULL
            GROUP BY t2.genre_id
            ORDER BY COUNT(*) DESC
          )
          AND t.status = 'APPROVED' AND t.visibility = 'PUBLIC'
          ORDER BY NEWID(); -- Randomize within genres for discovery
        END
        ELSE
        BEGIN
          -- Fallback to Trending if no history
          SELECT TOP (@limit)
            t.id, t.title, t.main_artist, t.plays_count, t.likes_count, t.created_at,
            s_audio.path AS file_path,
            s_img.path   AS cover_url,
            g.name       AS genre
          FROM tracks t
          JOIN storage_objects s_audio ON t.audio_object_id = s_audio.id
          LEFT JOIN storage_objects s_img ON t.cover_image_object_id = s_img.id
          LEFT JOIN genres g ON t.genre_id = g.id
          WHERE t.status = 'APPROVED' AND t.visibility = 'PUBLIC'
          ORDER BY t.plays_count DESC;
        END
      `);
    return result.recordset as Track[];
  },
  /**
   * findLocalCollection - Fetches tracks from the specific 'nhac' storage folder.
   */
  findLocalCollection: async (limit: number = 50): Promise<Track[]> => {
    const pool = await getConnection();
    const result = await pool.request()
      .input('limit', mssql.Int, limit)
      .query(`
        SELECT TOP (@limit)
          t.id, t.title, t.main_artist, t.plays_count, t.created_at,
          s_audio.path AS file_path,
          s_img.path   AS cover_url,
          g.name       AS genre
        FROM tracks t
        JOIN storage_objects s_audio ON t.audio_object_id = s_audio.id
        LEFT JOIN storage_objects s_img ON t.cover_image_object_id = s_img.id
        LEFT JOIN genres g ON t.genre_id = g.id
        WHERE s_audio.path LIKE '/nhac/%' 
          AND t.status = 'APPROVED' AND t.visibility = 'PUBLIC'
        ORDER BY t.created_at DESC
      `);
    return result.recordset as Track[];
  },

  /**
   * Increment comments count for a track
   */
  incrementCommentsCount: async (id: string, transaction?: mssql.Transaction): Promise<void> => {
    const pool = await getConnection();
    const request = transaction ? new mssql.Request(transaction) : pool.request();
    await request
      .input('id', mssql.VarChar, id)
      .query("UPDATE tracks SET comments_count = comments_count + 1 WHERE id = @id");
  }
};
