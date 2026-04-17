import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {upload} from "../middlewares/multer.js";
import { getUserAccountSettings } from "../controllers/systemController.js";

const router=Router({mergeParams:true});


router.route("/account-settings").get(verifyJWT,getUserAccountSettings);


export default router;