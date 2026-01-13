
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CONFIGURAÇÃO DE DATABASE SRE V5.2
 * Resiliência reforçada para ambientes VPS e Docker.
 */
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
  dateStrings: true, // Garante que datas venham como strings, evitando bugs de timezone do JS
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 60000
});

const testConnection = async (retries = 5) => {
    while (retries > 0) {
        try {
            const connection = await pool.getConnection();
            console.log('✅ SRE DATABASE CONNECTED & SYNCED');
            connection.release();
            return;
        } catch (err) {
            console.error(`❌ SRE DATABASE ATTEMPT FAILED. Retries left: ${retries - 1}`, err.message);
            retries -= 1;
            if (retries === 0) {
                console.error('CRITICAL: DATABASE UNREACHABLE. Check if MySQL is running or if DB_HOST is correct.');
            } else {
                await new Promise(res => setTimeout(res, 5000)); // Espera 5s antes de tentar novamente
            }
        }
    }
};

testConnection();

export default pool;
