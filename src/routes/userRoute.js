import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {upload} from "../middlewares/multer.js";
import {getSignUpUser,signUpUser,getLoginUser,loginUser,logOutUser,getUserProfile,getUpdateUserProfile,updateUserProfile,
    getUserWatchList
} from "../controllers/userController.js";

const router=Router({mergeParams:true});

router.route("/signup").get(getSignUpUser);
router.route("/signup").post(signUpUser);

router.route("/login").get(getLoginUser);
router.route("/login").post(loginUser);

router.route("/logout").get(verifyJWT,logOutUser);


router.route("/profile").get(verifyJWT,getUserProfile);
router.route("/updateProfile").get(verifyJWT,getUpdateUserProfile);

router.route("/updateProfile").post(verifyJWT,upload.single("avatar"),updateUserProfile);


router.route("/watchlist").get(verifyJWT,getUserWatchList);



export default router;