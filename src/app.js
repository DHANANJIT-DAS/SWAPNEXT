import dotenv from "dotenv";
dotenv.config({path:"./.env"});
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { verifyJWT , checkJWT } from "./middlewares/auth.js";


const app=express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,
}));
app.use(checkJWT,(req, res, next) => {
    res.locals.currUser = req.user;
    res.locals.currPath = req.path;
    next();
});







// import routes
import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";
import systemRoute from  "./routes/systemRoutes.js";



// Route declaration
app.use("/api/v1/users",userRoute);
app.use("/api/v1/products",productRoute);
app.use("/api/v1",systemRoute);


export {app};