
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * S.I.E PRO - Database Connector (SRE STANDARDIZED V16.5)
 * Protocolo de Resiliência: Normalização de fluxo para Kernel V53+.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'siecacaria',
  password: process.env.DB_PASSWORD || 'Gegerminal180',
  database: process.env.DB_NAME || 'siecacaria',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 20,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000,
  /**
   * CORREÇÃO SRE: Retornamos apenas strings/números brutos. 
   * O parsing JSON é delegado ao Kernel para evitar o erro "b.filter is not a function".
   */
  typeCast: function (field, next) {
    if (field.type === 'JSON' || field.type === 'BLOB' || field.type === 'LONG_BLOB') {
        return field.string('utf8'); 
    }
    return next();
  }
});

pool.getConnection()
    .then(connection => {
        console.log('✅ SRE: DATABASE PROTOCOL OPERATIONAL V16.5');
        connection.release();
    })
    .catch(err => {
        console.error('❌ SRE CRITICAL: DATABASE ACCESS DENIED.', err.message);
    });

export default pool;
