const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/authMiddleware");
const socketMiddleware = require("../middleware/socketMiddleware");

const router = express.Router();
router.use((req, res, next) => {
  console.log("Chat route accessed:", req.path);
  next();
});

router.use(socketMiddleware);
// Get all messages between two users
router.get("/messages/:userId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    })
      .sort("createdAt")
      .populate("sender receiver", "username avatar");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// Send message
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { receiver, group, content } = req.body;

    if (!content || (!receiver && !group)) {
      return res
        .status(400)
        .json({ message: "Missing content, receiver or group" });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiver || undefined,
      group: group || undefined,
      content,
    });

    await message.save();

    // Emit to the correct socket room (group or individual)
    if (receiver) {
      req.io.to(receiver).emit("newMessage", message);
    } else if (group) {
      req.io.to(group).emit("newGroupMessage", message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Message sending failed" });
  }
});

module.exports = router;
