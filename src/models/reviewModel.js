import mongoose from "mongoose";


const reviewSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    product: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"  // to track the product 
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Links the review to a specific user
    }
},{timestamps:true});

const Review = mongoose.model("Review", reviewSchema);

export {Review};