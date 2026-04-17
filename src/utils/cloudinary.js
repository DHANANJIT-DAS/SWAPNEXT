import dotenv from "dotenv";
dotenv.config({path:"./.env"});
import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET
});


const uploadOnCloudinary = async (localFilePath)=>{

    try{
        if(!localFilePath) return null;

        const response=await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"});
        fs.unlinkSync(localFilePath); // remove the local file from server
        return response.url;
        
    }
    catch(error){
        console.log(error); // remove the local file from server
        return null;
    }
}

export {uploadOnCloudinary};