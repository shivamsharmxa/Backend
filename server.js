require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// ✅ Connect to MongoDB first
const connectDB = require("./config/db");
connectDB();

// ✅ Load models
require("./models/User");
require("./models/Follow");
require("./models/Notification");

// ✅ Load routes after models
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const groupRoutes = require("./routes/groupRoutes");
const jobRoutes = require("./routes/jobRoutes");
const jobFilterRoutes = require("./routes/jobFilterRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const followRouter = require("./routes/followRoutes"); // ✅ this takes io
const userRoutes = require("./routes/userRoutes");

const app = express();

// ✅ CORS Setup (before routes)
app.use(
  cors({
    origin: "http://localhost:3000", // Frontend is running on port 3000
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend is running on port 3000
    credentials: true,
  },
});

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/follow", followRouter(io)); // Pass io to the follow router
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/jobs", jobRoutes, jobFilterRoutes);

// ✅ Socket.IO logic
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("joinUser", async (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);

    // Send initial follow statuses when user joins
    try {
      const Follow = require("./models/Follow");
      const following = await Follow.find({ follower: userId });
      const followers = await Follow.find({ following: userId });

      socket.emit("followStatusUpdate", {
        following: following.map((f) => f.following),
        followers: followers.map((f) => f.follower),
      });
    } catch (error) {
      console.error("Error sending initial follow statuses:", error);
    }
  });

  socket.on("joinGroups", (groupIds) => {
    groupIds.forEach((groupId) => {
      socket.join(groupId);
      console.log(`User joined group ${groupId}`);
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// ✅ Optional: make io available in req.app.get("io")
app.set("io", io);

// ✅ Start the server
const PORT = 3002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
