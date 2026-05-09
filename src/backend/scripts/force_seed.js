import fs from 'fs';
import { execSync } from 'child_process';

const dbPath = 'database.sqlite';

try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Database file deleted.');
  }
} catch (err) {
  console.error('Could not delete database file, it might be open. Attempting to seed anyway.');
}

try {
  console.log('Starting seed process...');
  execSync('npm run seed', { stdio: 'inherit' });
  console.log('Seed process completed successfully.');
} catch (err) {
  console.error('Seed process failed.');
  process.exit(1);
}
