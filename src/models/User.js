import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    profilePic: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false, // OTP verification
    },

    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },

    lastSeen: {
      type: Date,
    },
    otp: {
  type: String,
},

otpExpiry: {
  type: Date,
},

  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
