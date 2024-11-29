import express from "express"
import { AvatarSignup, AvatarLogin, getAvatar, updateAvatar, uploadAvatarPhoto } from "../controllers/avatar.controller.js";
import auth  from "../middleware/userAuth.middleware.js";
import { upload } from "../middleware/multer.middelware.js"

const router = express.Router();

router.route("/signup").post(AvatarSignup);
router.route("/login").post(AvatarLogin);
router.route("/update").post(auth,updateAvatar);
router.route("/get").get(auth,getAvatar);
router.route("/upload").post(auth,upload.single("media"),uploadAvatarPhoto);

export default router