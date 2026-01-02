import User from "../models/User.js";
import { getIO } from "../config/socket.js";

/* ======================================================
   GET ALL USERS (With Search & Filter)
====================================================== */
export const getAllUsers = async (req, res) => {
  try {
    // Optional: Allow searching by name or email via ?search=...
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find({
      ...keyword,
      _id: { $ne: req.user._id }, // Exclude current user
      isVerified: true,           // Only show verified users
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   UPDATE PROFILE PICTURE
====================================================== */
export const updateProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Update the user in Database
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: req.file.path }, // Cloudinary URL
      { new: true, select: "-password" }
    );

    // 🔥 REAL-TIME UPDATE: Notify all connected clients
    const io = getIO();
    io.emit("user:update", { 
      userId: updatedUser._id, 
      profilePic: updatedUser.profilePic 
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};