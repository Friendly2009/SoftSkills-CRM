const path = require("path");
const db = require("./../data_base_connect.js");
const crypto = require("crypto");

exports.index = (req, res) => {
  // первая страница
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
};
exports.signup = (req, res) => {
  // страница регистрации
  res.sendFile(path.join(__dirname, "..", "views", "signuppage.html"));
};
exports.APIsignup = async (req, res) => {
  //функция добавления нового аккаунта в бд + мнгновенная авторизация

  const { fullName, email, phone, companyName, adminKey } = req.body;

  const userKey = crypto.randomBytes(4).toString("hex");

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [compResult] = await connection.query(
      `INSERT INTO companies (name, access_key_admin, access_key_user) VALUES (?, ?, ?)`,
      [companyName, adminKey, userKey],
    );
    const companyId = compResult.insertId;

    const [userResult] = await connection.query(
      `INSERT INTO users (full_name, email) VALUES (?, ?)`,
      [fullName, email],
    );
    const userId = userResult.insertId;

    await connection.query(
      `INSERT INTO company_members (user_id, company_id, role) VALUES (?, ?, ?)`,
      [userId, companyId, "admin"],
    );

    await connection.commit();

    res.sendFile(path.join(__dirname, "..", "views", "user", "dashboard.html"));
    console.log(`user ${fullName} has be registered`);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Ошибка при регистрации:", error);
    res.status(500).send("server error");
  } finally {
    if (connection) connection.release();
  }
};

exports.signin = (req, res) => {
  //страница авторизации
  res.sendFile(path.join(__dirname, "..", "views", "signinpage.html"));
};

exports.APIsignin = async (req, res) => {
  // функция авторизации
  const { name, key } = req.body;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [row] = await connection.query(
      "select * from companies where name = ? and (access_key_admin = ? or access_key_user = ?)",
      [name, key, key],
    );

    if (row.length > 0) {
      console.table(row);
      console.log(`\nacces key for company ${name} has been finded`);

      if (row[0].access_key_admin === key) {
        console.log("user is an admin");
        res.cookie("role", "admin", {
          maxAge: 3600000,
          httpOnly: false,
          path: "/",
        });
      } else {
        console.log("default user");
        res.json({ role: "user" });
      }

      return res.sendFile(
        path.join(__dirname, "..", "views", "user", "dashboard.html"),
      );
    }

    await connection.commit();

    res.sendFile(path.join(__dirname, "..", "views", "signinpage.html"));
  } catch (ex) {
    if (connection) {
      await connection.rollback();
    }

    console.log("error when trying to sign in " + ex);
    res.status(500).send("server error");
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
