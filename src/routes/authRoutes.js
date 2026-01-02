import express from "express";
import {
  registerUser,
  verifyOTP,
  loginUser,
  resendOTP
} from "../controllers/authController.js";

const router = express.Router();


router.post("/resend-otp", resendOTP);

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/login", loginUser);

export default router;
