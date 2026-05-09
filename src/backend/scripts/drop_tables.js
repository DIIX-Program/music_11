import Database from 'better-sqlite3';
const db = new Database('database.sqlite');
db.exec('DROP TABLE IF EXISTS playlist_tracks; DROP TABLE IF EXISTS playlists;');
console.log('Tables dropped successfully.');
db.close();
