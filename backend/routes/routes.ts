import { Router } from "express";
import { index, APIsignup, APIsignin, index2 } from "../controllers/IndexController.js"; 
import { checkConnect } from "../controllers/dataController.js"; 
const router: Router = Router();

router.get("/", index);
router.get('/signin2', index2);
router.post('/signin', APIsignin);
router.post('/signup', APIsignup);

router.get('/checkConnect',checkConnect)

export default router;