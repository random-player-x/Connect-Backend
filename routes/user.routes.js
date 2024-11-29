import express from "express"
import { createUser,loginUser,getUser,updateUser,uploadMedia,getMediaUrl,deleteMediaUrl,updatedailyActiveHours } from "../controllers/user.controller.js";
import auth  from "../middleware/userAuth.middleware.js";
import { upload } from "../middleware/multer.middelware.js"

const router = express.Router();

router.route("/signup").post(createUser);
router.route("/login").post(loginUser);
router.route("/getUser").get(auth,getUser);
router.route("/update").post(auth,updateUser);
router.route("/upload/:type").post(auth,upload.single("media"),uploadMedia)
router.route("/deleteUrl/:type").delete(auth,deleteMediaUrl)
router.route("/getUrl/:type").get(auth,getMediaUrl)
router.route("/updateDailyhour").post(auth,updatedailyActiveHours)




export default router