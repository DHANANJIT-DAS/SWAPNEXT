'use strict';
import dotenv from "dotenv";
dotenv.config({path:"./.env"});
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

const userSchema=new mongoose.Schema({

    /* ── Identity ── */

    firstName : { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 50 
    },
    lastName  : { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 50 
    },
    email : {
        type      : String,
        required  : true,
        unique    : true,
        lowercase : true,
        trim      : true,
        match     : [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Invalid email address'],
        index     : true
    },
    phone : {
        type    : String,
        trim    : true,
        default : '',
        match   : [/^\d{10}$|^$/, 'Phone must be 10 digits']
    },
    city  : { 
        type: String, 
        trim: true, 
        default: '' 
    },
    passwordHash : {
        type     : String,
        required : true,
        select   : false   // never returned in queries by default
    },
    avatar : {
        type:String, // cloudinary url
        default:""
    },
    isVerified : { 
        type: Boolean, 
        default: false, 
        index: true 
    },
    googleId   : { 
        type: String, 
        default: '', 
        index: true, 
        sparse: true 
    },
    facebookId : { 
        type: String, 
        default: '', 
        index: true, 
        sparse: true 
    },
    isSeller:{
        type:Boolean,
        default:false
    },
    refreshToken:{
        type:String,
        default:null
    },

    /* ── Account state ── */
    isActive  : { 
        type: Boolean, 
        default: true  
    },
    isBanned  : { 
        type: Boolean, 
        default: false 
    },
    banReason : { 
        type: String,  
        default: ''    
    },

    /* ── Engagement ── */
    savedListings : [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "Listing" 
        }
    ],
    unreadMessages: { 
        type: Number, 
        default: 0, 
        min: 0 
    },


},{
    timestamps:true,
    toJSON  : { virtuals: true },
    toObject: { virtuals: true }
});

/* ── Virtual: full name ── */
userSchema.virtual('name').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

// passwort encryption

userSchema.pre("save",async function(){
    if(this.isModified("passwordHash")){
        this.passwordHash= await bcrypt.hash(this.passwordHash,SALT_ROUNDS);
        return;
    }
});


userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.passwordHash);
}

/* ── Instance method: public-safe object (no hash) ── */
userSchema.methods.toSafeObject = function () {
    const obj = this.toObject({ virtuals: true });
    delete obj.passwordHash;
    delete obj.__v;
    return obj;
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