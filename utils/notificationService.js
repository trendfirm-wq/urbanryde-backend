const { Expo } = require('expo-server-sdk');
const Notification = require('../models/Notification');
const User = require('../models/User');

const expo = new Expo();

let ioInstance = null;

const setSocketIo = (io) => {
  ioInstance = io;
};

const sendPushNotification = async ({ recipient, title, message, data = {} }) => {
  try {
    const user = await User.findById(recipient).select('expo_push_token');

    if (!user?.expo_push_token) return;

    if (!Expo.isExpoPushToken(user.expo_push_token)) return;

    await expo.sendPushNotificationsAsync([
      {
        to: user.expo_push_token,
        sound: 'default',
        title,
        body: message,
        data,
      },
    ]);
  } catch (error) {
    console.log('Push notification error:', error.message);
  }
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

  await sendPushNotification({
    recipient,
    title,
    message,
    data: {
      type,
      ...data,
    },
  });

  return notification;
};

module.exports = {
  createNotification,
  setSocketIo,
};