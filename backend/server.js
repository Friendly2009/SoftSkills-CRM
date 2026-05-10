const express = require('express');
const path = require('path');
const session = require('express-session');
const routes = require('./routes/routes.js');
const cors = require('cors');

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log("use json");

app.use(session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false}
}));
app.use('/', routes); 
app.use(express.static(path.join(__dirname, "..", "frontend", "public")));

app.listen(3000, async () => {
    console.log("your server was be running on http://localhost:3000");
});