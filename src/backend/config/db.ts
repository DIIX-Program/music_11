import mssql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

/**
 * SQL Server Configuration
 * Connection pooling is essential for performance to avoid the overhead
 * of establishing a new connection for every request.
 */
const config: mssql.config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'musicdb',
  options: {
    encrypt: false, // Set to true if using Azure or SSL
    trustServerCertificate: true, // Specific for local development with self-signed certs
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Singleton Pool instance to be shared across the application
let pool: mssql.ConnectionPool | null = null;

/**
 * Ensures a connection pool is available and returns it.
 * This pattern prevents multiple pools from being created.
 */
export async function getConnection(): Promise<mssql.ConnectionPool> {
  try {
    if (pool) {
      if (pool.connected) {
        return pool;
      }
      // If pool exists but not connected, try to reconnect
      await pool.close();
      pool = null;
    }

    pool = await new mssql.ConnectionPool(config).connect();
    console.log('Connected to SQL Server Pool');
    return pool;
  } catch (err) {
    console.error(' SQL Server connection error:', err);
    // In production, you might want to alert here
    throw err;
  }
}
