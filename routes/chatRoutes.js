const express = require('express');
const {
  getMessages,
  sendMessage,
} = require('../controllers/chatController');

const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
  '/:bookingId/messages',
  protect,
  allowRoles('passenger', 'driver', 'admin'),
  getMessages
);

router.post(
  '/:bookingId/messages',
  protect,
  allowRoles('passenger', 'driver', 'admin'),
  sendMessage
);

module.exports = router;