const mysql = require("mysql2/promise");

async function GetUsers() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "19614141_Kirill",
    database: "mylesson",
  });
  const [rows] = await connection.execute("SELECT * FROM user");

  await connection.end();
  return rows;
}
module.exports = { GetUsers };
