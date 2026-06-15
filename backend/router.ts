import { Router } from "express";
import { getusers, adduser } from "./controllers/UsersController.js"; 
import { getglobalinfo, checkconnect, getallsession} from "./controllers/BackController.js"
import { APIsignup, APIsignin } from './controllers/AuthController.js'

const router: Router = Router();

router.get('/checkconnect', checkconnect);
router.get('/getsession', getallsession);

router.post("/signin", APIsignin);
router.post("/signup", APIsignup);

router.get("/getusers", getusers);

router.get("/getglobalinfo", getglobalinfo);

router.post("/adduser", adduser);



export default router;