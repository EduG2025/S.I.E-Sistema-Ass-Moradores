
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CONFIGURAÇÃO DE DATABASE SRE V6.0
 * Resiliência reforçada contra quedas de socket e timeouts.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'siecacaria',
  password: process.env.DB_PASSWORD || 'Gegerminal180',
  database: process.env.DB_NAME || 'siecacaria',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 50, 
  queueLimit: 0,
  timezone: '-03:00',
  dateStrings: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 60000,
  // SRE: Garante que o pool tente reconectar em vez de quebrar o processo
  maxIdle: 10,
  idleTimeout: 60000
});

const testConnection = async (retries = 10) => {
    while (retries > 0) {
        try {
            const connection = await pool.getConnection();
            console.log('✅ SRE KERNEL DATABASE SYNCED | STATUS: 200 OK');
            connection.release();
            return;
        } catch (err) {
            console.error(`❌ SRE DATABASE ATTEMPT FAILED (${retries} left):`, err.message);
            
            if (err.code === 'ECONNREFUSED') {
                console.error(`DETALHE SRE: O MySQL não está respondendo em ${process.env.DB_HOST}. Verifique se o serviço está rodando (sudo systemctl status mysql).`);
            }
            
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    console.error("🛑 SRE CRITICAL: O Kernel entrará em modo degradado (DB OFFLINE).");
};

testConnection();

export default pool;
