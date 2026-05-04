import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as notificationController from '../controllers/notificationController.js';

const router = Router();

router.use(authMiddleware);
router.get('/', notificationController.listNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markNotificationRead);

export default router;
