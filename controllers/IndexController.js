const path = require("path");
const db = require("./../data_base_connect.js");
const crypto = require("crypto");

exports.index = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
};
exports.signup = (req,res) => {
  res.sendFile(path.join(__dirname,"..","views","signuppage.html"));
};
exports.APIsignup = async (req, res) => {
  console.log('its work');
  const { fullName, email, phone, companyName, adminKey } = req.body;

  const userKey = crypto.randomBytes(4).toString("hex");

  let connection;
  try {
    connection = await db.pool.getConnection();
    await connection.beginTransaction();

    const [compResult] = await connection.query(
      "INSERT INTO companies (name, access_key_admin, access_key_user) VALUES (?, ?, ?)",
      [companyName, adminKey, userKey],
    );
    const companyId = compResult.insertId;

    // 2. Создаем пользователя
    const [userResult] = await connection.query(
      "INSERT INTO users (full_name, email, phone) VALUES (?, ?, ?)",
      [fullName, email, phone],
    );
    const userId = userResult.insertId;

    await connection.query(
      "INSERT INTO company_members (user_id, company_id, role) VALUES (?, ?, 'admin')",
      [userId, companyId],
    );

    await connection.commit();

    res.sendFile(path.join(__dirname, "..", "views", "user", "dashboard.html"));
  } catch (error) {
    if (connection) await connection.rollback(); 
    console.error("Ошибка при регистрации:", error);
    res.status(500).send("Ошибка сервера при создании компании");
  } finally {
    if (connection) connection.release();
  }
};

exports.signin = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "signinpage.html"));
};
exports.APIsignin = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "signinpage.html"));
};
