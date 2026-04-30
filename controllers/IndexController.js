const path = require("path");
const db = require("./../data_base_connect.js");
const crypto = require("crypto");
const { json } = require("body-parser");
const { Connection } = require("mysql2");

exports.index = (req, res) => {
  // первая страница
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
};
exports.signup = (req, res) => {
  // страница регистрации
  res.sendFile(path.join(__dirname, "..", "views", "signuppage.html"));
};
exports.APIsignup = async (req, res) => {
  // Функция добавления новой компании и администратора
  const { fullName, email, phone, companyName, adminKey } = req.body;

  const userKey = crypto.randomBytes(4).toString("hex");

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [compResult] = await connection.query(
      `INSERT INTO company (name, access_key_admin, access_key_user) VALUES (?, ?, ?)`,
      [companyName, adminKey, userKey],
    );
    const companyId = compResult.insertId;

    const userDescription = `Phone: ${phone}, Email: ${email}`;
    const [userResult] = await connection.query(
      `INSERT INTO users (company_id, full_name, role, description) VALUES (?, ?, ?, ?)`,
      [companyId, fullName, "admin", userDescription],
    );
    const userId = userResult.insertId;

    const [[dbCompany]] = await connection.query(
      "SELECT * FROM company WHERE id = ?",
      [companyId],
    );
    const [[dbUser]] = await connection.query(
      "SELECT * FROM users WHERE id = ?",
      [userId],
    );

    await connection.commit();

    req.session.company_id = dbCompany.id;
    req.session.company_name = dbCompany.name;
    req.session.key_admin = dbCompany.access_key_admin;
    req.session.key_user = dbCompany.access_key_user;

    req.session.user_id = dbUser.id;
    req.session.user_full_name = dbUser.full_name;
    req.session.role = dbUser.role; // Устанавливаем 'admin'
    req.session.user_description = dbUser.description;

    console.log(
      `Администратор ${fullName} и компания ${companyName} успешно созданы`,
    );
    return res.redirect("/dashboard");
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Ошибка при регистрации:", error);
    res.status(500).send("Ошибка сервера при регистрации");
  } finally {
    if (connection) connection.release();
  }
};

exports.signin = (req, res) => {
  //страница авторизации
  res.sendFile(path.join(__dirname, "..", "views", "signinpage.html"));
};

exports.APIsignin = async (req, res) => {
  const { name, key } = req.body;
  let connection;

  try {
    connection = await db.getConnection();

    const [companies] = await connection.query(
      "SELECT * FROM company WHERE name = ? AND (access_key_admin = ? OR access_key_user = ?)",
      [name, key, key],
    );

    if (companies.length > 0) {
      const currentCompany = companies[0];

      const userRole =
        currentCompany.access_key_admin === key ? "admin" : "user";
      req.session.role = userRole;

      req.session.company_id = currentCompany.id;
      req.session.company_name = currentCompany.name;
      req.session.key_admin = currentCompany.access_key_admin;
      req.session.key_user = currentCompany.access_key_user;

      const [users] = await connection.query(
        "SELECT * FROM users WHERE company_id = ? AND role = ? LIMIT 1",
        [currentCompany.id, userRole],
      );

      if (users.length > 0) {
        const currentUser = users[0];

        req.session.user_id = currentUser.id;
        req.session.user_full_name = currentUser.full_name;
        req.session.user_description = currentUser.description;
        req.session.db_user_role = currentUser.role;
      }

      console.log(`Вход выполнен: ${name} (${req.session.role})`);
      return res.redirect("/dashboard");
    }

    console.log("Неверное имя компании или ключ");
    return res.redirect("/signin");
  } catch (ex) {
    console.error("Ошибка при попытке входа: " + ex);
    return res.status(500).send("server error");
  } finally {
    if (connection) connection.release();
  }
};
exports.APIaddteacher = async (req, res) => {
  try {
    const { fullname, birthday, gender, contacts, description } = req.body;

    let connection;
    connection = await db.getConnection();

    await connection.query(
      `INSERT INTO teachers 
        (avatar, fullname, birthday, company_id, gender, contacts, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        " ",
        fullname,
        birthday,
        req.session.company_id,
        gender,
        contacts,
        description,
      ],
    );

    connection.commit();
    return res.redirect('/teachers');
  } catch (ex) {
    console.log(ex);
    connection.rollback();
  } finally {
    if (connection) connection.release();
  }
};

exports.dashboard = (req, res) => {
  //ДОРАБОТАТЬ БЕЗОПАСНОСТЬ
  return res.sendFile(
    path.join(__dirname, "..", "views", "user", "dashboard.html"),
  );
};
exports.clients = (req, res) => {
  return res.sendFile(
    path.join(__dirname, "..", "views", "user", "clients.html"),
  );
};
exports.teachers = (req, res) => {
  return res.sendFile(
    path.join(__dirname, "..", "views", "user", "teachers.html"),
  );
};
