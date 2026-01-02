import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();

// 🔥 CRITICAL: CORS Setup
// We check against a list of allowed domains
const allowedOrigins = [
  "http://localhost:5173", // Vite Localhost
  "http://localhost:3000", // React Localhost
  process.env.CLIENT_URL,  // Your future Vercel URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // If the origin isn't in the list, technically we should block it.
        // But for debugging, you might want to log it.
        // For now, let's block specific unknown origins:
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allows headers like Authorization
  })
);

app.use(express.json());

// Routes
// Note: You added "/api" prefix here. Ensure frontend calls "/api/auth/login"
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);

// Health Check (Render needs this to know your app is alive)
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 🔥 Global Error Handler
// If any route throws an error, this catches it and sends a clean JSON response
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    // Only show stack trace in development, not production
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

export default app;