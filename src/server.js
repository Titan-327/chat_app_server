import "dotenv/config"; // ✅ Perfect, keeps env vars loaded first
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize socket
initSocket(server);

// 🔥 IMPROVEMENT: Connect to DB *before* starting the server
const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to Database:", error.message);
    process.exit(1); // Stop the process if DB fails
  }
};

startServer();