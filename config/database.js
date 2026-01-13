
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CONFIGURAÇÃO DE DATABASE SRE V5.5
 * Proteção contra ECONNREFUSED e inconsistência de timezone.
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
  dateStrings: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 60000
});

const testConnection = async (retries = 5) => {
    while (retries > 0) {
        try {
            const connection = await pool.getConnection();
            console.log('✅ SRE KERNEL DATABASE SYNCED | STATUS: 200 OK');
            connection.release();
            return;
        } catch (err) {
            console.error(`❌ SRE DATABASE ATTEMPT FAILED (${retries} left):`, err.message);
            if (err.code === 'ECONNREFUSED') {
                console.error(`DETALHE: O Kernel não conseguiu conectar em ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3306'}. O serviço MySQL está rodando?`);
            }
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
};

testConnection();

export default pool;
