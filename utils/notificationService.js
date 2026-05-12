const Notification = require('../models/Notification');

let ioInstance = null;

const setSocketIo = (io) => {
  ioInstance = io;
};

const createNotification = async ({
  recipient,
  title,
  message,
  type = 'general',
  data = {},
}) => {
  if (!recipient || !title || !message) return null;

  const notification = await Notification.create({
    recipient,
    title,
    message,
    type,
    data,
  });

  if (ioInstance) {
    ioInstance.to(`user_${recipient}`).emit('newNotification', {
      notification,
    });
  }

  return notification;
};

module.exports = {
  createNotification,
  setSocketIo,
};