const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware").authMiddleware;
const userController = require("../controllers/userController");

// Debug log to check what we're importing
console.log("Imported middleware:", !!authMiddleware);
console.log("Imported controller functions:", {
  getAllUsers: !!userController.getAllUsers,
  getNotifications: !!userController.getNotifications,
  markNotificationsAsRead: !!userController.markNotificationsAsRead,
});

// Get all users except the logged-in user
router.get("/", authMiddleware, userController.getAllUsers);

// Get user's notifications
router.get("/notifications", authMiddleware, userController.getNotifications);

// Mark notifications as read
router.put(
  "/notifications/read",
  authMiddleware,
  userController.markNotificationsAsRead
);

module.exports = router;
