import mssql from 'mssql';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getConnection } from '../config/db.js';

dotenv.config();

const MUSIC_DIR = path.join(process.cwd(), 'nhac');
const ADMIN_ID = 'user_admin_001';

async function scan() {
  console.log(' Scanning local music directory...');

  if (!fs.existsSync(MUSIC_DIR)) {
    console.error(` Directory not found: ${MUSIC_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(MUSIC_DIR).filter(f => f.endsWith('.mp3'));
  console.log(`🎵 Found ${files.length} mp3 files.`);

  let pool;
  try {
    pool = await getConnection();

    // --- CLEANUP ---
    console.log('🧹 Cleaning up old local track entries...');
    // Delete from dependent tables first (listening_history, playlist_tracks, track_likes)
    // All local tracks start with 'track_local_'
    await pool.request().query("DELETE FROM listening_history WHERE track_id LIKE 'track_local_%'");
    await pool.request().query("DELETE FROM playlist_tracks WHERE track_id LIKE 'track_local_%'");
    await pool.request().query("DELETE FROM track_likes WHERE track_id LIKE 'track_local_%'");
    await pool.request().query("DELETE FROM tracks WHERE id LIKE 'track_local_%'");
    await pool.request().query("DELETE FROM storage_objects WHERE id LIKE 'storage_track_local_%'");
    console.log('✅ Cleanup finished.');

  } catch (err) {
    console.error('❌ Database connection or cleanup failed', err);
    process.exit(1);
  }

  for (const file of files) {
    const filePath = `/nhac/${file}`;
    const title = path.parse(file).name;
    const trackId = `track_local_${crypto.createHash('md5').update(file).digest('hex').substring(0, 8)}`;
    const storageId = `storage_${trackId}`;

    try {
      // Check if storage object exists
      const checkStorage = await pool.request()
        .input('path', mssql.NVarChar, filePath)
        .query('SELECT id FROM storage_objects WHERE path = @path');

      if (checkStorage.recordset.length === 0) {
        console.log(` Registering new track: ${title}`);

        // Insert Storage Object
        await pool.request()
          .input('id', mssql.VarChar, storageId)
          .input('owner', mssql.VarChar, ADMIN_ID)
          .input('type', mssql.VarChar, 'audio')
          .input('path', mssql.NVarChar, filePath)
          .query(`
            INSERT INTO storage_objects (id, owner_user_id, object_type, path, status)
            VALUES (@id, @owner, @type, @path, 'active')
          `);

        // Insert Track
        await pool.request()
          .input('id', mssql.VarChar, trackId)
          .input('uploader', mssql.VarChar, ADMIN_ID)
          .input('title', mssql.NVarChar, title)
          .input('artist', mssql.NVarChar, 'Local Artist')
          .input('audioId', mssql.VarChar, storageId)
          .query(`
            INSERT INTO tracks (id, uploader_user_id, title, slug, main_artist, audio_object_id, visibility, status)
            VALUES (@id, @uploader, @title, @id, @artist, @audioId, 'PUBLIC', 'APPROVED')
          `);
      } else {
        // console.log(`⏭ Skipping existing track: ${title}`);
      }
    } catch (err) {
      console.error(` Error processing ${file}:`, err);
    }
  }

  console.log('✨ Scanning and registration completed!');
  process.exit(0);
}

scan();
