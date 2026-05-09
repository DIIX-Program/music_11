import { getConnection } from "../config/db.js";

/**
 * Database Initialization for SQL Server
 * Instead of running sync DDL, we now verify the connection pool
 * and potentially run migrations or initial seeds asynchronously.
 */
export async function initDb() {
  try {
    console.log(' Initializing SQL Server Connection...');
    const pool = await getConnection();
    
    // In a production environment, you might run migrations here.
    // For this project, please ensure you have run the DDL script:
    // src/backend/db/setup.sql
    
    console.log(' SQL Server Ready');
  } catch (err) {
    console.error('❌ Failed to initialize SQL Server:', err);
    // Depending on your strategy, you might want the app to exit here
    // process.exit(1);
  }
}

// Re-export db as a proxy or just remove it if everything is moved to repositories
// For compatibility with any legacy code that might still import 'db'
export const db = null; 
