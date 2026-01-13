
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'siecacaria',
  password: process.env.DB_PASSWORD || 'Gegerminal180',
  database: process.env.DB_NAME || 'siecacaria',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 30, 
  queueLimit: 0,
  timezone: '-03:00',
  dateStrings: true, // Crucial para evitar o erro de Incorrect datetime value
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 60000
});

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ SRE DATABASE CONNECTED & SYNCED');
        connection.release();
    } catch (err) {
        console.error('❌ SRE CRITICAL: DATABASE ACCESS DENIED.', err.message);
        console.error('DICA SRE: Se estiver em Docker, mude DB_HOST para o nome do serviço.');
    }
};

testConnection();

export default pool;
