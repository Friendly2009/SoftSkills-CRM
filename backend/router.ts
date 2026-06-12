import { Router } from "express";
import { getUsers, checkConnect, getGlobalInfo } from "./controllers/UsersController.js"; 
import { APIsignup, APIsignin } from './controllers/AuthController.js'

const router: Router = Router();

router.get('/checkconnect', checkConnect);

router.post("/getusers", getUsers);

router.post("/signin", APIsignin);
router.post("/signup", APIsignup);

router.get("/getusers", getUsers);

router.get("/getglobalinfo", getGlobalInfo);


export default router;