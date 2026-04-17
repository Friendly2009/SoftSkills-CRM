const path = require("path");
const db = require("./../data_base_connect.js");
const crypto = require("crypto");

exports.getUser = async (req, res) => {
    const userRole = req.session.role;
    const company_id = req.session.company_id;
    const company_name = req.session.company_name;
    const key_admin = req.session.key_admin;
    const key_user = req.session.key_user;

    const user_id = req.session.user_id;
    const full_name = req.session.user_full_name;
    const user_description = req.session.user_description;
    res.json({
        userRole: userRole,
        company_id: company_id,
        company_name: company_name,
        key_admin: key_admin,
        key_user: key_user,
        user_id: user_id,
        full_name: full_name,
        user_description: user_description
    });
};