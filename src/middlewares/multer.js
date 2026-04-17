import multer from "multer";
import path from 'path';

const storage=multer.diskStorage({
    destination: function (req,file,cb){
        cb(null,"./public/temp");
    },

    filename:function(req,file,cb){

        const extension = path.extname(file.originalname);
        
        const fileName = Date.now() + extension;
        
        cb(null,fileName);
    }
});

const upload=multer({storage});

export {upload};