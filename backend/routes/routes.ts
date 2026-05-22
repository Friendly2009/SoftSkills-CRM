import { Router } from "express";
import { index, signup, APIsignup } from "../controllers/IndexController.js"; 
import { APIaddteacher, APIDelTeacher } from "../controllers/IndexController.js"; 
const router: Router = Router();
router.get("/", index);
export default router;