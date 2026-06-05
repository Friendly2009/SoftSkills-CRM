import { Router } from "express";
import { index, APIsignup, APIsignin, index2 } from "../controllers/IndexController.js"; 
import { APIaddteacher, APIDelTeacher } from "../controllers/IndexController.js"; 
const router: Router = Router();
router.get("/", index);
router.get('/signin2', index2);
router.post('/signin', APIsignin);
router.get('/api/signup', APIsignup);

export default router;