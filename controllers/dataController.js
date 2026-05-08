const path = require("path");
const db = require("./../data_base_connect.js");
const crypto = require("crypto");
const { teachers } = require("./IndexController.js");

exports.getUser = async (req, res) => {
  const userRole = req.session.role;
  const company_id = req.session.company_id;
  const company_name = req.session.company_name;
  const key_admin = req.session.key_admin;
  const key_user = req.session.key_user;

  const user_id = req.session.user_id;
  const full_name = req.session.user_full_name;
  const user_description = req.session.user_description;
  try {
    res.json({
      userRole: userRole,
      company_id: company_id,
      company_name: company_name,
      key_admin: key_admin,
      key_user: key_user,
      user_id: user_id,
      full_name: full_name,
      user_description: user_description,
    });
  } catch (ex) {
    console.error(ex);
    return res.status(400);
  }
};
exports.getTeacher = async (req, res) => {
  const company_id = req.session.company_id;
  let connection;
  try {
    connection = await db.getConnection();
    const [teachers] = await db.query(`SELECT * FROM teachers WHERE company_id = ?`, [company_id]);
    res.json({
      data: teachers
    });
    await connection.commit();
  } catch (ex) {
    console.error(ex);
    connection.rollback();
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
