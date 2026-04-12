const express = require('express');
const router = express.Router();
const controller = require('../controllers/IndexController.js');
const data = require('../controllers/dataController.js');
 

router.get('/', controller.index);

router.get('/signup', controller.signup);
router.post('/api/signup', controller.APIsignup);

router.get('/signin',controller.signin);
router.post('/api/signin',controller.APIsignin);

router.get("/dashboard", controller.dashboard);

//----------------------------data require----------------------------//
router.get('/data/getUser', data.getUser);
module.exports = router;