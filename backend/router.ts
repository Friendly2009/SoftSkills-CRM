import { Router } from "express";
import { getusers, adduser, deluser } from "./controllers/UsersController.js"; 
import { getglobalinfo, checkconnect, getallsession} from "./controllers/BackController.js"
import { APIsignup, APIsignin } from './controllers/AuthController.js'

const router: Router = Router();

router.get('/checkconnect', checkconnect);
router.get('/getsession', getallsession);

router.post("/signin", APIsignin);
router.post("/signup", APIsignup);


router.get("/getglobalinfo", getglobalinfo);

router.post("/adduser", adduser);
router.get("/getusers", getusers);
router.delete("/deluser/:id", deluser);



export default router;