const User = require("../models/User");
const Follow = require("../models/Follow");
const Notification = require("../models/Notification");

// Debug log to check if the file is being loaded
console.log("Loading userController.js");

// Get all users except the logged-in user
const getAllUsers = async (req, res) => {
  console.log("getAllUsers called"); // Debug log
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("-password")
      .lean();

    // Get follow status for each user
    const usersWithFollowStatus = await Promise.all(
      users.map(async (user) => {
        const isFollowing = await Follow.exists({
          follower: req.user.id,
          following: user._id,
        });
        return { ...user, isFollowing: !!isFollowing };
      })
    );

    res.json(usersWithFollowStatus);
  } catch (error) {
    console.error("Error in getAllUsers:", error); // Debug log
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Follow a user
const followUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const followerId = req.user.id;

    if (targetUserId === followerId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: followerId,
      following: targetUserId,
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Create follow relationship
    const follow = await Follow.create({
      follower: followerId,
      following: targetUserId,
    });

    // Create notification
    const notification = await Notification.create({
      recipient: targetUserId,
      sender: followerId,
      type: "FOLLOW",
      content: "started following you",
    });

    // Emit real-time notification
    const io = req.app.get("io");
    io.to(targetUserId.toString()).emit("newNotification", notification);

    res.json({ message: "Successfully followed user", follow });
  } catch (error) {
    res.status(500).json({ message: "Error following user" });
  }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const followerId = req.user.id;

    await Follow.findOneAndDelete({
      follower: followerId,
      following: targetUserId,
    });

    res.json({ message: "Successfully unfollowed user" });
  } catch (error) {
    res.status(500).json({ message: "Error unfollowing user" });
  }
};

// Get user's notifications
const getNotifications = async (req, res) => {
  console.log("getNotifications called"); // Debug log
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "username avatar")
      .sort("-createdAt")
      .lean();

    res.json(notifications);
  } catch (error) {
    console.error("Error in getNotifications:", error); // Debug log
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// Mark notifications as read
const markNotificationsAsRead = async (req, res) => {
  console.log("markNotificationsAsRead called"); // Debug log
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error in markNotificationsAsRead:", error); // Debug log
    res.status(500).json({ message: "Error marking notifications as read" });
  }
};

// Debug log to check what we're exporting
console.log("Exporting functions:", {
  getAllUsers: !!getAllUsers,
  getNotifications: !!getNotifications,
  markNotificationsAsRead: !!markNotificationsAsRead,
});

module.exports = {
  getAllUsers,
  getNotifications,
  markNotificationsAsRead,
};
