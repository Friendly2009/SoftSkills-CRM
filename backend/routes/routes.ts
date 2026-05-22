import { Router } from "express";
import { index, APIsignup, APIsignin } from "../controllers/IndexController.js"; 
import { APIaddteacher, APIDelTeacher } from "../controllers/IndexController.js"; 
const router: Router = Router();
router.get("/", index);
router.get('/apisignin', APIsignin);
router.get('/apisignup', APIsignup);

export default router;