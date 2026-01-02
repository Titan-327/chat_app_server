import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { generateOTP } from "../utils/otp.js";
import sendEmail from "../utils/sendEmail.js";

/* ======================================================
   REGISTER USER
====================================================== */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // 📧 SEND PROFESSIONAL EMAIL
    const emailSubject = "Verify your account for Chat App";
    const emailBody = `
      Hello ${name},

      Thank you for registering with our app! We are excited to have you on board.

      To complete your registration, please use the following One-Time Password (OTP):

      =======================
      👉  ${otp}
      =======================

      This code is valid for 10 minutes. 

      If you did not request this verification, please ignore this email.

      Best regards,
      The Chat App Team
    `;

    await sendEmail(email, emailSubject, emailBody);

    res.status(201).json({
      message: "User registered. Verify OTP.",
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   LOGIN USER
====================================================== */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check verification
    if (!user.isVerified) {
      return res.status(403).json({ 
          message: "Account not verified. Please verify your email.", 
          code: "NOT_VERIFIED" 
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   RESEND OTP
====================================================== */
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    // 📧 SEND PROFESSIONAL EMAIL (Resend)
    const emailSubject = "New OTP Request";
    const emailBody = `
      Hello ${user.name},

      We received a request to resend your verification code.

      Here is your new One-Time Password (OTP):

      =======================
      👉  ${otp}
      =======================

      This code expires in 10 minutes.

      Best regards,
      The Chat App Team
    `;

    await sendEmail(email, emailSubject, emailBody);

    res.json({ message: "OTP resent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   VERIFY OTP
====================================================== */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};