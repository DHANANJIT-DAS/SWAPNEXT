import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { getUserBecomeSeller,userBecomeSeller} from "../controllers/sellerController.js";


const router=Router();



router.route("/becomeSeller").get(verifyJWT,getUserBecomeSeller);
router.route("/becomeSeller").post(verifyJWT,userBecomeSeller);

export default router;