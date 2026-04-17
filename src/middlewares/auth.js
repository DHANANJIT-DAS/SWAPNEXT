import jwt from "jsonwebtoken";
import User from "../models/userModel.js";




const verifyJWT = async function (req,res,next){

    
    try {

        const token = req.cookies?.accessToken;

        if (!token) {
            return res.render("userLogin.ejs", { message: "Please log in to continue" });
        }
        const decodedInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedInfo._id).select("-password"); // Don't fetch the password

        if (!user) {
            return res.render("userLogin.ejs", { message: "User no longer exists" });
        }
        req.user = user;
        next();

    } catch (error) {
        
        console.error("JWT Verification Error:", error.message);
        return res.render("userLogin.ejs", { message: "Session expired, please login again" });
    }

}



const checkJWT = async function (req,res,next){

    const token=req.cookies?.accessToken;

    try{
        const decodedInfo=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedInfo._id);
        req.user=user;
    }
    catch(err){
        req.user=null;
    }

    next();
}


export {verifyJWT,checkJWT};