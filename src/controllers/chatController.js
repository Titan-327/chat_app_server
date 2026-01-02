import Chat from "../models/Chat.js";
import User from "../models/User.js";
import { getIO } from "../config/socket.js";

/* ======================================================
   HELPER: POPULATE & EMIT
   (Refactored duplicate logic into one function)
====================================================== */
const populateAndEmit = async (chatId, eventName) => {
  const io = getIO();
  
  const chat = await Chat.findById(chatId)
    .populate("members", "-password")
    .populate("admins", "-password")
    .populate("lastMessage");

  if (!chat) return null;

  // Emit to all members individually (so their Chat List updates)
  chat.members.forEach((member) => {
    io.to(`user:${member._id}`).emit(eventName, chat);
  });
  
  // Also emit to the specific chat room (if anyone is currently inside it)
  io.to(`chat:${chatId}`).emit(eventName, chat);

  return chat;
};

/* ======================================================
   1️⃣ ACCESS / CREATE 1-TO-1 CHAT
====================================================== */
export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "UserId required" });

    // Check if chat exists
    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [req.user._id, userId] },
    })
      .populate("members", "-password")
      .populate("lastMessage");

    if (chat) return res.json(chat);

    // Create new chat
    const newChat = await Chat.create({
      isGroup: false,
      members: [req.user._id, userId],
      unreadCount: {
        [req.user._id]: 0,
        [userId]: 0,
      },
    });

    // Reuse our helper to send the "chat:new" event
    const fullChat = await populateAndEmit(newChat._id, "chat:new");
    res.status(201).json(fullChat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   2️⃣ GET USER CHATS
====================================================== */
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate("members", "-password")
      .populate("admins", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   3️⃣ CREATE GROUP
====================================================== */
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !members || members.length < 2) {
      return res.status(400).json({ message: "Group needs name and at least 3 members" });
    }

    // Ensure creator is included and unique
    const allMembers = [...new Set([...members, req.user._id.toString()])];

    const group = await Chat.create({
      isGroup: true,
      name,
      members: allMembers,
      admins: [req.user._id],
      unreadCount: allMembers.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
    });

    const fullGroup = await populateAndEmit(group._id, "chat:new");
    res.status(201).json(fullGroup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   4️⃣ ADD USER TO GROUP
====================================================== */
export const addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat || !chat.isGroup) return res.status(404).json({ message: "Group not found" });
    if (!chat.admins.includes(req.user._id)) return res.status(403).json({ message: "Only admin can add members" });
    if (chat.members.includes(userId)) return res.status(400).json({ message: "User already in group" });

    // Update DB
    chat.members.push(userId);
    // Safe Map Update
    if (!chat.unreadCount) chat.unreadCount = new Map();
    chat.unreadCount.set(userId.toString(), 0); 
    await chat.save();

    // Use Helper
    const updatedGroup = await populateAndEmit(chatId, "group:update");
    
    // Explicitly notify the NEW user (who wasn't in the room before)
    const io = getIO();
    io.to(`user:${userId}`).emit("chat:new", updatedGroup);

    res.json(updatedGroup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   5️⃣ REMOVE USER FROM GROUP
====================================================== */
export const removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat || !chat.isGroup) return res.status(404).json({ message: "Group not found" });
    if (!chat.admins.includes(req.user._id)) return res.status(403).json({ message: "Only admin can remove members" });

    chat.members = chat.members.filter((id) => id.toString() !== userId);
    chat.admins = chat.admins.filter((id) => id.toString() !== userId);
    
    if (chat.unreadCount) chat.unreadCount.delete(userId);

    await chat.save();

    // Notify the removed user first
    const io = getIO();
    io.to(`user:${userId}`).emit("group:removed", { chatId });

    // Notify everyone else
    const updatedGroup = await populateAndEmit(chatId, "group:update");
    res.json(updatedGroup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   6️⃣ MAKE ADMIN
====================================================== */
export const makeAdmin = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat || !chat.isGroup) return res.status(404).json({ message: "Group not found" });
    if (!chat.admins.includes(req.user._id)) return res.status(403).json({ message: "Only admin can promote" });
    if (chat.admins.includes(userId)) return res.status(400).json({ message: "User already admin" });

    chat.admins.push(userId);
    await chat.save();

    const updatedGroup = await populateAndEmit(chatId, "group:update");
    res.json(updatedGroup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   7️⃣ LEAVE GROUP
====================================================== */
export const leaveGroup = async (req, res) => {
  try {
    const { chatId } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat || !chat.isGroup) return res.status(404).json({ message: "Group not found" });

    const userId = req.user._id.toString();

    // Prevent leaving if last admin
    if (chat.admins.includes(req.user._id) && chat.admins.length === 1) {
      return res.status(400).json({ message: "Assign another admin before leaving" });
    }

    chat.members = chat.members.filter((id) => id.toString() !== userId);
    chat.admins = chat.admins.filter((id) => id.toString() !== userId);
    
    if (chat.unreadCount) chat.unreadCount.delete(userId);

    await chat.save();

    // Notify self
    const io = getIO();
    io.to(`user:${userId}`).emit("group:removed", { chatId });

    // Notify others
    const updatedGroup = await populateAndEmit(chatId, "group:update");
    res.json({ message: "Left group successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   8️⃣ UPDATE GROUP ICON
====================================================== */
export const updateGroupIcon = async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!req.file) return res.status(400).json({ message: "No image provided" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isAdmin = chat.admins.some(id => id.toString() === req.user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: "Only admins can change group icon" });

    chat.groupPic = req.file.path;
    await chat.save();

    const updatedGroup = await populateAndEmit(chatId, "group:update");
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};