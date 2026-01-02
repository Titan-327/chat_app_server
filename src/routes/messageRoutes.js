import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  sendMessage,
  getMessages,
  markAsRead,
} from "../controllers/messageController.js";
import upload from "../config/multer.js";
const router = express.Router();


router.post(
  "/",
  protect,
  upload.single("media"),
  sendMessage
);

//router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);
router.put("/read", protect, markAsRead);

export default router;
