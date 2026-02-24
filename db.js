import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file (if it exists)
dotenv.config({ path: path.join(__dirname, '.env') });

// Create a connection pool to handle multiple connections efficiently
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'unitropico_db',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Helper validation to ensure DB is connected
export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL database successfully!');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error connecting to MySQL database:', error.message);
        console.error('  Please check your .env configuration and ensure the MySQL server is running.');
        return false;
    }
};

export default pool;
