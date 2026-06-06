import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
