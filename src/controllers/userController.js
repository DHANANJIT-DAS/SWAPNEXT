import User from "../models/userModel.js";
import { signupSchema ,loginSchema } from "../schema/userSchema.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";



const generateAccessAndRefressToken = async function (userId){
    try{
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateAccessToken();

        user.refreshToken=refreshToken;

        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken};

    }
    catch(error){
        console.log("error is",error);
    }
}

// Sign Up
const getSignUpUser = function(req,res){

    res.render("./userView/userSignup.ejs");

}

const signUpUser = async function(req,res){

    const {error,value} = signupSchema.validate(req.body);

    if (error) {
        const errorMessage = error.details[0].message;
        return res.status(400).render("./userView/userSignup.ejs", { error: errorMessage });
    }

    try {

        const existedUser=await User.findOne({email:value.email});

        if(existedUser){
            return res.status(400).render("./userView/userSignup.ejs", { error: "Email already exist" });
        }

        
        const newUser = await User.create(value);
        
        
        const {accessToken,refreshToken} = await generateAccessAndRefressToken(newUser._id);

        const options={
            httpOnly:true,
            secure:true,
        }

        res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).redirect("/api/v1/products/");


    } catch (err) {

        res.status(500).send("Server Error");

    }
}


// Log In

const getLoginUser = function (req,res){
    res.render("./userView/userLogin.ejs");
}

const loginUser = async function(req,res){

    const { error, value } = loginSchema.validate(req.body);

    if(error){
        const errorMessage = error.details[0].message;
        return res.status(400).render("userLogin.ejs", { error: errorMessage });
    }

    const user= await User.findOne({email: value.email});

    if(!user){
        return res.status(400).render("userLogin.ejs",{error:"Invalid email or password"});
    }

    const isPasswordValid= await user.isPasswordCorrect(value.password);

    if(!isPasswordValid){
        return res.status(400).render("userLogin.ejs",{error:"Invalid email or password"});
    }

    const {accessToken,refreshToken} = await generateAccessAndRefressToken(user._id);

    const options={
        httpOnly:true,
        secure:true,
    }

    res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).redirect("/api/v1/products/");


}


const logOutUser = async function (req,res){

    const userId = req.user._id;

    await User.findByIdAndUpdate(userId,{
        refreshToken:undefined,
    });


    const options={
        httpOnly:true,
        secure:true,
    }

    res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).redirect("/api/v1/products");
}





// User Update

const getUserProfile = function (req,res){

    res.render("/userView/userProfile.ejs");
}

const getUpdateUserProfile = function (req,res){
    res.render("./userView/updateProfile.ejs");
}

const updateUserProfile = async function (req,res){

    const user=await User.findById(req.user._id);

    const avatarLocalPath = req.file?.path;

    if(avatarLocalPath){

        const avatarURL= await uploadOnCloudinary(avatarLocalPath);

        user.avatar=avatarURL || null;
        await user.save();


    }

    res.redirect("/api/v1/users/profile");
}



const getUserWatchList = async function (req,res){

    const userId = req.user._id;

    const user=await User.findById(userId).populate("watchList");

    res.render("./userView/showWatchList.ejs",{watchList:user.watchList});

}


export {getSignUpUser,signUpUser,getLoginUser,loginUser,logOutUser,getUserProfile,getUpdateUserProfile,updateUserProfile,
    getUserWatchList
};



