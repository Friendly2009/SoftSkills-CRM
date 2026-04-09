const express = require('express');
const router = express.Router();
const controller = require('../controllers/IndexController');

router.get('/', controller.index);

router.get('/signup', controller.signup);
router.get('/api/signup', controller.APIsignup);

router.get('/signin',controller.signin);
router.get('/api/signin',controller.APIsignin);

module.exports = router;