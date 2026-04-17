import User from "../models/userModel.js";
import { signupSchema ,loginSchema } from "../schema/userSchema.js";
import {upload} from "../middlewares/multer.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";



const getUserBecomeSeller = async function (req,res){
    res.render("/sellerView/becomeSeller.ejs");
}

const userBecomeSeller = async function (req,res){
    const user=req.body.user;


    res.redirect("/api/v1/products");
}


export { getUserBecomeSeller,userBecomeSeller};