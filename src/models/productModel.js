import mongoose from "mongoose";


const productSchema=new mongoose.Schema({

    title: {
        type: String,
        required: true,
    },
    description:{
        type:String,
        required:true,
    } ,
    
    images: [
        {
        url: String,
        filename: String,
        }
    ],

    price:{
        type:Number,
        required:true,
    },

    location:{
        type:String,
        required:true,
    },

    country:{
        type:String,
        required:true,
    },

    landmark:{
        type:String,
        required:true,
    },
    geometry:{
        
        type:{
            type:String,
            enum:["point"],
            required:true,
        },
        coordinates:{
            type:[Number],
            required:true,
        }
    
    },

    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: [
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
        },
    ],

    // Ownership
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true,
    },

    // Metadata / Extra Info
    category: {
        type: String,
        enum: [ "Rooms", "Iconic cities", "Mountains", "Amazing pools", "Camping", "Farms", "Arctic"],
        required: true
    },
    
    // High-level specs (matching the Airbnb "16 guests · 5 bedrooms" look)
    info: {
        guests: { type: Number, default: 2 },
        bedrooms: { type: Number, default: 1 },
        beds: { type: Number, default: 1 },
        bathrooms: { type: Number, default: 1 },
    },

    // Boolean toggles for amenities
    amenities: {
        hasWifi: { type: Boolean, default: false },
        hasAC: { type: Boolean, default: false },
        hasKitchen: { type: Boolean, default: false },
        hasParking: { type: Boolean, default: false },
        isPetFriendly: { type: Boolean, default: false },
    }


},{timestamps:true});



const Product=mongoose.model("Product",productSchema);

export default Product;