import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },

    name: {
      type: String, // group name
    },

    groupPic: {
      type: String,
      default: "",
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    unreadCount: {
      type: Map,
      of: Number, // userId -> unread count
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
