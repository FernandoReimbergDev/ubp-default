import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function getDBConnection(): Promise<mysql.PoolConnection> {
  const connection = await pool.getConnection();
  await initializeDatabase(connection); // ainda é seguro chamar isso
  return connection;
}

async function initializeDatabase(conn: mysql.PoolConnection) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS access_token (
      id INT AUTO_INCREMENT PRIMARY KEY,
      token VARCHAR(1000) NOT NULL,
      expiresIn VARCHAR(255) NOT NULL,
      application VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
}
