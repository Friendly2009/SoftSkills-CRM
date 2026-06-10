import { Router } from "express";
import { getUsers, checkConnect } from "./controllers/UsersController.js"; 
import { APIsignup, APIsignin } from './controllers/AuthController.js'
const router: Router = Router();

router.get('/checkconnect', checkConnect);

router.post("/getusers", getUsers);

router.post("/signin", APIsignin);
router.post("/signin", APIsignup);



export default router;