import { Router } from "express";
import { getusers, adduser, deluser, resetuser } from "./controllers/UsersController.js"; 
import { getglobalinfo, checkconnect, getallsession} from "./controllers/BackController.js"
import { APIsignup, APIsignin } from './controllers/AuthController.js'
import { APIGetClients } from './controllers/ClientController.js'
import { getgroups, creategroup } from './controllers/GroupController.js'
const router: Router = Router();

router.get('/checkconnect', checkconnect);
router.get('/getsession', getallsession);

router.post("/signin", APIsignin);
router.post("/signup", APIsignup);


router.get("/getglobalinfo", getglobalinfo);

router.post("/adduser", adduser);
router.get("/getusers", getusers);
router.delete("/deluser/:id", deluser);
router.post('/resetuser', resetuser);

router.get("/getclient", APIGetClients);

router.get("/getgroups", getgroups);
router.post('/creategroup', creategroup);



export default router;