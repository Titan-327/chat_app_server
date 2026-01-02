import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { getAllUsers } from "../controllers/userController.js";
import upload from "../config/multer.js";
import { updateProfilePic } from "../controllers/userController.js";
const router = express.Router();
router.put(
  "/profile-pic", 
  protect, 
  upload.single("image"), // Key must match frontend FormData
  updateProfilePic
);
router.get("/", protect, getAllUsers);




export default router;
