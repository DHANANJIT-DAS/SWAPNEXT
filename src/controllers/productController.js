import Product from "../models/productModel.js";
import User from "../models/userModel.js";
// import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";

// const mapToken=process.env.MAP_TOKEN;
// const geocodingClint=mbxGeocoding({accessToken:mapToken});

const getAllProduct = async function (req,res){

    const allProducts = await Product.find({});

    // Transform data into: { "Shillong": [...], "Bengaluru": [...], "Kolkata": [...] }
    const groupedProducts = allProducts.reduce((acc, product) => {
        const loc = product.location || "Other Locations";
        if (!acc[loc]) acc[loc] = [];
        acc[loc].push(product);
        return acc;
    }, {});

    res.render("./productView/homePage.ejs", { groupedProducts });
    
    
}


const showProduct = async function (req,res){

    const productId = req.params.productId ;
    const product= await Product.findById(productId).populate("owner");;

    res.render("productView/showProduct.ejs",{product});
}


const toggleWatchList= async function (req,res){

    const  productId  = req.params.productId;
    const userId = req.user._id;

    const user = await User.findById(userId);
    
    // Check if the product is already in the watchlist
    const isSaved = user.watchList.some(id => id.equals(productId));

    if (isSaved) {
        // Remove from watchlist
        await User.findByIdAndUpdate(userId, { $pull: { watchList: productId } });
        
    } else {
        // Add to watchlist
        await User.findByIdAndUpdate(userId, { $addToSet: { watchList: productId } });
        
    }

    res.status(200).json({ success: true, isSaved: !isSaved });
}





// const createNewProduct = async function (req,res){

//     const { error, value } = productSchema.validate(req.body);


//     const newProduct = await Product.create(value);

//     const landmark = newProduct.landmark;
//     const response = await geocodingClint.forwardGeocode({
//         query:landmark,
//         limit:1,
//     }).send();

//     newProduct.geometry=response.body.features[0].geometry;

//     await newProduct.save();


// }


export {getAllProduct,showProduct,toggleWatchList};