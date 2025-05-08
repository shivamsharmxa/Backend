const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  const { userId } = req.params;
  const notifications = await Notification.find({ recipient: userId }).sort({
    createdAt: -1,
  });
  res.json(notifications);
};

exports.markAsRead = async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );
  res.json(notification);
};
