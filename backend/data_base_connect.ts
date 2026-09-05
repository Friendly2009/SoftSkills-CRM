import 'dotenv/config';
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || process.env.DB_ROLE || 'root', 
  password: process.env.DB_PASSWORD || '19614141_Kirill',
  database: process.env.DB_NAME || 'cheapcrm',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
});

export default pool;
