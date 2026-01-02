import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { accessChat } from "../controllers/chatController.js";
import { getUserChats } from "../controllers/chatController.js";
import {
  createGroup,
  addToGroup,
  removeFromGroup,
  makeAdmin,
  leaveGroup,
  updateGroupIcon
} from "../controllers/chatController.js";
import upload from "../config/multer.js";
const router = express.Router();

router.post("/", protect, accessChat);


router.get("/", protect, getUserChats);


// Add this route
router.put("/group/icon", protect, upload.single("image"), updateGroupIcon);
router.post("/group", protect, createGroup);
router.put("/group/add", protect, addToGroup);
router.put("/group/remove", protect, removeFromGroup);
router.put("/group/make-admin", protect, makeAdmin);
router.put("/group/leave", protect, leaveGroup);
export default router;
