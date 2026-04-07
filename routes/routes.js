const express = require('express');
const router = express.Router();
const controller = require('../controllers/IndexController');

router.get('/', controller.index);

router.get('/register', controller.register);

router.get('/registration', controller.registration);
module.exports = router;