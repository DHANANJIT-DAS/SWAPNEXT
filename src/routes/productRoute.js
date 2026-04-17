import {Router} from "express";
import {getAllProduct,showProduct,toggleWatchList} from "../controllers/productController.js";
import { verifyJWT } from "../middlewares/auth.js";

const router=Router();

router.route("/").get(getAllProduct);
router.route("/:productId").get(showProduct);
router.route("/:productId/watchlist").post(verifyJWT,toggleWatchList);




export default router;