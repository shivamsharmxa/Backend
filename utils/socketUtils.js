const User = require("../models/User");

const updateUserStatus = async (userId, online) => {
  try {
    await User.findByIdAndUpdate(userId, { online });
  } catch (error) {
    console.error("Error updating user status:", error);
  }
};

module.exports = {
  updateUserStatus
};