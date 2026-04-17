import dotenv from "dotenv";
dotenv.config({path:"./.env"});
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema=new mongoose.Schema({

    fullName:{
        type:String,
        required:[true,"Fullname is required"],
        index:true,
    },
    
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true,
    },

    password:{
        type:String,
        required:[true,"Password is required"],
    },

    avatar:{
        type:String, // cloudinary url
    },

    isSeller:{
        type:Boolean,
        default:false,
    },

    refreshToken:{
        type:String,
    },

    watchList:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product",
        }
    ]


},{timestamps:true});


// passwort encryption

userSchema.pre("save",async function(){
    if(this.isModified("password")){
        this.password= await bcrypt.hash(this.password,10);
        return;
    }
});


userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
}

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESS_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESS_TOKEN_EXPIRY,
        }
    );
}


const User=mongoose.model("User",userSchema);

export default User;