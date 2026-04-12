const db = require("./../data_base_connect.js");
const responseOfUser = await fetch('data/getUser');

let name_infoHTML = document.getElementById('name_info');
let user_data = await responseOfUser.json();
name_infoHTML.textContent = user_data.role 
