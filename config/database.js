
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
  connectionLimit: 20, // Aumentado para suportar picos
  queueLimit: 0,
  timezone: '-03:00', // SRE FIX: Força timezone Brasil para compatibilidade total
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000 // Aumentado para 20s para evitar quedas em boot de VPS
});

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ SRE: DATABASE PROTOCOL OPERATIONAL');
        connection.release();
    } catch (err) {
        console.error('❌ SRE CRITICAL: DATABASE ACCESS DENIED. Verifique se o MySQL Server está ATIVO na VPS.', err.message);
    }
};

testConnection();

export default pool;
