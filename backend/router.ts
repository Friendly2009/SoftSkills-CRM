import { Router } from "express";
import { getusers, checkconnect, getglobalinfo, adduser } from "./controllers/UsersController.js"; 
import { APIsignup, APIsignin } from './controllers/AuthController.js'

const router: Router = Router();

router.get('/checkconnect', checkconnect);

router.post("/signin", APIsignin);
router.post("/signup", APIsignup);

router.get("/getusers", getusers);

router.get("/getglobalinfo", getglobalinfo);

router.post("/adduser", adduser);


export default router;