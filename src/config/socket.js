import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io;

export const initSocket = (server) => {
  // 🔥 ALLOWED ORIGINS (Sync with app.js)
  const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:3000",
    process.env.CLIENT_URL // Load from .env for production
  ];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins, // Accepts the array
      credentials: true,
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000, // Connection stability help
  });

  io.on("connection", async (socket) => {
    try {
      // console.log("🟢 Socket attempting auth:", socket.id);

      const token = socket.handshake.auth?.token;

      if (!token) {
        // console.log("❌ Socket rejected: no token");
        socket.disconnect();
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to socket
      socket.userId = decoded.id;
      socket.join(`user:${decoded.id}`);

      // console.log("✅ Socket authenticated:", decoded.id);

      // Mark online
      await User.findByIdAndUpdate(decoded.id, {
        status: "online",
      });

      // Broadcast online status
      io.emit("user:status", {
        userId: decoded.id,
        status: "online",
      });

      /* ---------- CHAT EVENTS ---------- */

      socket.on("chat:join", (chatId) => {
        socket.join(`chat:${chatId}`);
        // console.log(`📥 ${decoded.id} joined chat:${chatId}`);
      });

      socket.on("chat:leave", (chatId) => {
        socket.leave(`chat:${chatId}`);
        // console.log(`📤 ${decoded.id} left chat:${chatId}`);
      });

      socket.on("typing:start", ({ chatId, user }) => {
        socket.to(`chat:${chatId}`).emit("typing:start", {
          chatId,
          user,
        });
      });

      socket.on("typing:stop", ({ chatId, user }) => {
        socket.to(`chat:${chatId}`).emit("typing:stop", {
          chatId,
          user,
        });
      });

      // Handle Disconnect
      socket.on("disconnect", async () => {
        // console.log("🔴 Socket disconnected:", decoded.id);

        const lastSeen = new Date();

        await User.findByIdAndUpdate(decoded.id, {
          status: "offline",
          lastSeen,
        });

        io.emit("user:status", {
          userId: decoded.id,
          status: "offline",
          lastSeen,
        });
      });
    } catch (err) {
      console.log("❌ Socket auth error:", err.message);
      socket.disconnect();
    }
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};