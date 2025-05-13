const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { authenticateToken } = require("../middleware/auth");

// Get all notifications for the current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      status: "pending",
    })
      .populate("sender", "username avatar")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Mark notification as read
router.patch("/:id/read", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id,
      },
      { read: true },
      { new: true }
    ).populate("sender", "username avatar");

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Error updating notification" });
  }
});

// Delete a notification
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification" });
  }
});

module.exports = router;
