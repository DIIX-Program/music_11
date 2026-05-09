import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
try {
  db.exec('ALTER TABLE playlists ADD COLUMN cover_url TEXT;');
  console.log('Column cover_url added.');
} catch (err) {
  console.log('Column cover_url likely already exists.');
}
db.close();
