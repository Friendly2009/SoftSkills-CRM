const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "19614141_Kirill",
  database: "crm",
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
