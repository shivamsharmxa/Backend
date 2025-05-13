const express = require("express");
const Follow = require("../models/Follow");
const Notification = require("../models/Notification");
const { authenticateToken } = require("../middleware/auth");

const createFollowRouter = (io) => {
  const router = express.Router();

  // Send follow request
  router.post("/request", authenticateToken, async (req, res) => {
    try {
      const { recipientId } = req.body;
      const senderId = req.user._id;

      // Check if request already exists
      const existingRequest = await Notification.findOne({
        sender: senderId,
        recipient: recipientId,
        type: "FOLLOW_REQUEST",
        status: "pending",
      });

      if (existingRequest) {
        return res.status(400).json({ message: "Follow request already sent" });
      }

      // Create notification for follow request
      const notification = new Notification({
        type: "FOLLOW_REQUEST",
        sender: senderId,
        recipient: recipientId,
        status: "pending",
      });

      await notification.save();

      // Emit socket event to recipient
      io.to(recipientId.toString()).emit("notification", {
        type: "FOLLOW_REQUEST",
        senderId,
        senderName: req.user.username,
        notificationId: notification._id,
      });

      res.status(201).json({ message: "Follow request sent" });
    } catch (error) {
      res.status(500).json({ message: "Error sending follow request" });
    }
  });

  // Accept follow request
  router.post("/accept", authenticateToken, async (req, res) => {
    try {
      const { notificationId } = req.body;

      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: req.user._id,
        type: "FOLLOW_REQUEST",
        status: "pending",
      });

      if (!notification) {
        return res.status(404).json({ message: "Follow request not found" });
      }

      // Create follow relationship
      const follow = new Follow({
        follower: notification.sender,
        following: notification.recipient,
      });

      await follow.save();

      // Update notification status
      notification.status = "accepted";
      await notification.save();

      // Create notification for sender
      const acceptNotification = new Notification({
        type: "FOLLOW_ACCEPTED",
        sender: req.user._id,
        recipient: notification.sender,
        status: "accepted",
      });

      await acceptNotification.save();

      // Emit socket events for both users
      io.to(notification.sender.toString()).emit("notification", {
        type: "FOLLOW_ACCEPTED",
        accepterId: req.user._id,
        accepterName: req.user.username,
      });

      // Send updated follow status to both users
      const [senderFollowing, senderFollowers] = await Promise.all([
        Follow.find({ follower: notification.sender }),
        Follow.find({ following: notification.sender }),
      ]);

      const [recipientFollowing, recipientFollowers] = await Promise.all([
        Follow.find({ follower: notification.recipient }),
        Follow.find({ following: notification.recipient }),
      ]);

      io.to(notification.sender.toString()).emit("followStatusUpdate", {
        following: senderFollowing.map((f) => f.following),
        followers: senderFollowers.map((f) => f.follower),
      });

      io.to(notification.recipient.toString()).emit("followStatusUpdate", {
        following: recipientFollowing.map((f) => f.following),
        followers: recipientFollowers.map((f) => f.follower),
      });

      res.json({ message: "Follow request accepted" });
    } catch (error) {
      res.status(500).json({ message: "Error accepting follow request" });
    }
  });

  // Reject follow request
  router.post("/reject", authenticateToken, async (req, res) => {
    try {
      const { notificationId } = req.body;

      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipient: req.user._id,
          type: "FOLLOW_REQUEST",
          status: "pending",
        },
        { status: "rejected" },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ message: "Follow request not found" });
      }

      res.json({ message: "Follow request rejected" });
    } catch (error) {
      res.status(500).json({ message: "Error rejecting follow request" });
    }
  });

  // Unfollow user
  router.delete("/", authenticateToken, async (req, res) => {
    try {
      const { recipientId } = req.body;
      const senderId = req.user._id;

      await Follow.findOneAndDelete({
        follower: senderId,
        following: recipientId,
      });

      // Send updated follow status to both users
      const [senderFollowing, senderFollowers] = await Promise.all([
        Follow.find({ follower: senderId }),
        Follow.find({ following: senderId }),
      ]);

      const [recipientFollowing, recipientFollowers] = await Promise.all([
        Follow.find({ follower: recipientId }),
        Follow.find({ following: recipientId }),
      ]);

      io.to(senderId.toString()).emit("followStatusUpdate", {
        following: senderFollowing.map((f) => f.following),
        followers: senderFollowers.map((f) => f.follower),
      });

      io.to(recipientId.toString()).emit("followStatusUpdate", {
        following: recipientFollowing.map((f) => f.following),
        followers: recipientFollowers.map((f) => f.follower),
      });

      res.json({ message: "Unfollowed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error unfollowing user" });
    }
  });

  return router;
};

module.exports = createFollowRouter;
