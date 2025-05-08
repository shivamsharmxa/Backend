const express = require("express");
const Group = require("../models/Group");
const Message = require("../models/Message");
const { authMiddleware } = require("../middleware/authMiddleware");
const socketMiddleware = require("../middleware/socketMiddleware"); // 🧠

const router = express.Router();
router.use(socketMiddleware); // 🧠

/* Create group */
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { name, members } = req.body;
    const group = new Group({
      name,
      members: [...members, req.user._id], // Include creator
      createdBy: req.user._id,
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    console.error("Group creation error:", error);
    res.status(500).json({ message: "Group creation failed" });
  }
});

/* Send group message */
router.post("/:groupId/message", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const message = new Message({
      sender: req.user._id,
      group: req.params.groupId,
      content,
    });

    await message.save();

    // Emit to all group members
    const group = await Group.findById(req.params.groupId);
    group.members.forEach((member) => {
      req.io.to(member.toString()).emit("newGroupMessage", message);
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Group message error:", error);
    res.status(500).json({ message: "Message sending failed" });
  }
});

/* Get group messages */
router.get("/:groupId/messages", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .sort("createdAt")
      .populate("sender", "username avatar");

    res.json(messages);
  } catch (error) {
    console.error("Group message fetch error:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

module.exports = router;
