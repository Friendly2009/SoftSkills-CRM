import { Router } from "express";
import { getusers, adduser, deluser, resetuser } from "./controllers/UsersController.js"; 
import { getglobalinfo, checkconnect, getallsession} from "./controllers/BackController.js"
import { APIsignup, APIsignin } from './controllers/AuthController.js'
import { APIGetClients, addclient, delclient, updateClient } from './controllers/ClientController.js'
import { getgroups, creategroup, deleteGroup, updategroup } from './controllers/GroupController.js'
const router: Router = Router();

router.get('/checkconnect', checkconnect);
router.get('/getsession', getallsession);
router.get("/getglobalinfo", getglobalinfo);

router.post("/signin", APIsignin);
router.post("/signup", APIsignup);

router.post("/adduser", adduser);
router.get("/getusers", getusers);
router.delete("/deluser/:id", deluser);
router.post('/resetuser', resetuser);

router.get("/getclient", APIGetClients);
router.post('/addclients', addclient);
router.delete('/delclients/:id', delclient);
router.patch('/updateclient/:id', updateClient);

router.get("/getgroups", getgroups);
router.post('/creategroup', creategroup);
router.delete('/deletegroup/:id', deleteGroup);
router.patch('/updategroup/:id', updategroup);
export default router;