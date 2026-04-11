const express = require('express');
const path = require('path');
const routes = require('./routes/routes.js');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/', routes); 

app.use(express.static(path.join(__dirname, "public")));


app.listen(3000, async () => {
    console.log("your server was be running on http://localhost:3000");
});