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
router.get("/clients",controller.clients);
router.get("/teachers",controller.teachers);

router.post('/api/addteacher', controller.APIaddteacher);

//----------------------------data require----------------------------//
router.get('/data/getUser', data.getUser);
router.get('/data/getTeacher', data.getTeacher)
module.exports = router;