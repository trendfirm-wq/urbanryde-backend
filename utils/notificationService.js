const Notification = require('../models/Notification');

const createNotification = async ({
  recipient,
  title,
  message,
  type = 'general',
  data = {},
}) => {
  if (!recipient || !title || !message) return null;

  return await Notification.create({
    recipient,
    title,
    message,
    type,
    data,
  });
};

module.exports = {
  createNotification,
};