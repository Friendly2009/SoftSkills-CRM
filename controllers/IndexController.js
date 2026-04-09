const path = require("path");
exports.index = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
};
exports.signup = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "signuppage.html"));
};
exports.APIsignup = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "user", "dashboard.html"));
};
exports.signin = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "signinpage.html"));
};
exports.APIsignin = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "signinpage.html"));
};
