const express = require('express');

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/mark-all-read', protect, markAllAsRead);
router.patch('/:id/read', protect, markAsRead);
router.delete(
  "/:id",
  protect,
  deleteNotification
);
module.exports = router;