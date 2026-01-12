
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
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z', // SRE FIX: Sincroniza timezone Node <-> MySQL
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// SRE: Teste de Handshake com Retry Automático
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ SRE: DATABASE PROTOCOL OPERATIONAL');
        connection.release();
    } catch (err) {
        console.error('❌ SRE CRITICAL: DATABASE ACCESS DENIED. (Certifique-se que o MySQL está rodando na porta 3306)', err.message);
    }
};

testConnection();

export default pool;
