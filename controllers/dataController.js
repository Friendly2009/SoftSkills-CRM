const path = require("path");
const db = require("./../data_base_connect.js");
const crypto = require("crypto");

exports.getUser = (req,res) => {
    const userRole = req.session.role;
    res.json({
         role: userRole
    });
};