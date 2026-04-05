const express = require('express');
const path = require('path');
const routes = require('./routes/routes.js');
const app = express();
const { GetUsers } = require('./data_base_connect.js');

app.use(express.static(path.join(__dirname, "public")));

app.use('/',routes);

app.listen(3000, async () => {
    console.log("your server was be running on http://localhost:3000");

    try {
        const users = await GetUsers(); 
        console.table(users);
    } catch (err) {
        console.error("Ошибка при загрузке данных:", err);
    }
});