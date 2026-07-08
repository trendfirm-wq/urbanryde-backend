const express = require('express');
const {
  getMessages,
  sendMessage,
  getDriverConversations,
  getPassengerConversations,
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
router.get(
  "/driver",
  protect,
  allowRoles("driver", "admin"),
  getDriverConversations
);

router.get(
  "/passenger",
  protect,
  allowRoles("passenger", "admin"),
  getPassengerConversations
);
module.exports = router;