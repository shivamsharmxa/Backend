const Notification = require("../models/Notification");

const sendNotification = async ({
  io,
  recipientId,
  senderId,
  type,
  message,
  link,
}) => {
  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId,
    type,
    message,
    link,
  });

  io.to(recipientId.toString()).emit("new-notification", notification);
};

module.exports = sendNotification;
