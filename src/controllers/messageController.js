import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import { getIO } from "../config/socket.js";

/* ======================================================
   SEND MESSAGE
====================================================== */
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, type } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: "ChatId required" });
    }

    let mediaUrl = null;
    let messageType = type || "text";

    if (req.file) {
      mediaUrl = req.file.path;
      messageType = req.file.mimetype.startsWith("video")
        ? "video"
        : "image";
    }

    // 1. Fetch Chat & Validate
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.unreadCount) {
      chat.unreadCount = new Map();
    }

    // 2. Initialize Message (Do not save yet)
    const message = new Message({
      chatId,
      sender: req.user._id,
      content,
      type: messageType,
      mediaUrl,
      readBy: [req.user._id], // Sender always reads their own message
    });

    // 3. Socket Logic: Check who is online in this specific chat room
    const io = getIO();
    const chatRoomId = `chat:${chatId}`;
    const chatRoom = io.sockets.adapter.rooms.get(chatRoomId) || new Set();

    // Iterate over members to update read status & unread counts
    chat.members.forEach((memberId) => {
      // Skip sender
      if (memberId.toString() === req.user._id.toString()) return;

      let isUserInChat = false;

      // Check if this member has a socket active in the room
      for (const socketId of chatRoom) {
        const socket = io.sockets.sockets.get(socketId);
        // Ensure your socket connection logic sets socket.userId = user._id
        if (socket?.userId === memberId.toString()) {
          isUserInChat = true;
          break;
        }
      }

      if (isUserInChat) {
        // 🔥 User is LOOKING at the chat right now -> Add to readBy immediately
        message.readBy.push(memberId);
      } else {
        // 🔥 User is NOT looking -> Increment their unread count
        const prev = chat.unreadCount.get(memberId.toString()) || 0;
        chat.unreadCount.set(memberId.toString(), prev + 1);
      }
    });

    // 4. Save Changes to DB
    await message.save();
    
    chat.lastMessage = message._id;
    await chat.save();

    // 5. Populate AFTER saving to ensure 'readBy' is current
    const fullMessage = await message.populate("sender", "name profilePic");

    // 6. Emit to Chat Room (Real-time Message)
    // Because we populated AFTER adding readBy, the sender receives the message
    // with the recipient ALREADY in the readBy array (Double Blue Ticks instantly)
    io.to(chatRoomId).emit("message:new", fullMessage);

    // 7. Emit Notifications (Unread Counts) to users NOT in the chat
    chat.members.forEach((memberId) => {
      const memberIdStr = memberId.toString();
      
      // We send this to everyone so their "Chat List" preview updates
      io.to(`user:${memberIdStr}`).emit("chat:update", {
        chatId,
        lastMessage: fullMessage,
        unreadCount: chat.unreadCount.get(memberIdStr) || 0,
      });
    });

    res.status(201).json(fullMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   GET MESSAGES
====================================================== */
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId })
      .populate("sender", "name profilePic")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   MARK AS READ
====================================================== */
export const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.body;

    // 1. Update Chat Unread Count
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.unreadCount.set(req.user._id.toString(), 0);
    await chat.save();

    // 2. Update Messages (Add user to readBy if not already there)
    await Message.updateMany(
      {
        chatId,
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      }
    );

    const io = getIO();

    // 3. Notify the specific chat room (updates ticks to blue for others)
    io.to(`chat:${chatId}`).emit("message:read", {
      chatId,
      userId: req.user._id,
    });

    // 4. Notify the user's personal room (clears unread badge in chat list)
    io.to(`user:${req.user._id}`).emit("chat:update", {
      chatId,
      unreadCount: 0,
    });

    res.json({ message: "Chat marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};