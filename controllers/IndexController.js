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
  // Функция добавления новой компании и администратора в одну таблицу
  const { fullName, email, phone, companyName, adminKey } = req.body;

  // Генерируем ключ для обычных пользователей
  const userKey = crypto.randomBytes(4).toString("hex");

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Создаем компанию (согласно структуре: id, name, access_key_admin, access_key_user)
    const [compResult] = await connection.query(
      `INSERT INTO company (name, access_key_admin, access_key_user) VALUES (?, ?, ?)`,
      [companyName, adminKey, userKey]
    );
    const companyId = compResult.insertId;

    // 2. Создаем пользователя, привязывая его к компании и назначая роль
    // ВАЖНО: Добавьте колонки email и phone в таблицу users, если их там нет, 
    // так как на скриншоте видны только: id, company_id, full_name, role, description
    await connection.query(
      `INSERT INTO users (company_id, full_name, role, description) VALUES (?, ?, ?, ?)`,
      [companyId, fullName, "admin", `Phone: ${phone}, Email: ${email}`] // Пример записи доп. данных в description
    );

    await connection.commit();

    // Сохраняем данные в сессию
    req.session.role = "admin";
    req.session.companyId = companyId;

    console.log(`Администратор ${fullName} и компания ${companyName} успешно созданы`);
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
  // функция авторизации
  const { name, key } = req.body;
  let connection;

  try {
    connection = await db.getConnection();
    // Для простого SELECT транзакция (beginTransaction) обычно не требуется, 
    // но оставим структуру для единообразия

    // Ищем компанию по имени и одному из ключей
    const [companies] = await connection.query(
      "SELECT * FROM company WHERE name = ? AND (access_key_admin = ? OR access_key_user = ?)",
      [name, key, key]
    );

    if (companies.length > 0) {
      const currentCompany = companies[0];
      console.log(`Компания ${name} найдена`);

      // Проверяем, какой именно ключ подошел, чтобы выставить роль
      if (currentCompany.access_key_admin === key) {
        console.log("Вход как: admin");
        req.session.role = "admin";
      } else {
        console.log("Вход как: user");
        req.session.role = "user";
      }

      req.session.companyid = currentCompany.id;
      return res.redirect("/dashboard");
    }

    // Если ничего не нашли
    console.log("Неверное имя компании или ключ");
    return res.redirect("/signin");

  } catch (ex) {
    console.error("Ошибка при попытке входа: " + ex);
    return res.status(500).send("server error");
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