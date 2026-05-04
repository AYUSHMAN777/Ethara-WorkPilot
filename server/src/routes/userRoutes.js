import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import * as userController from '../controllers/userController.js';

const router = Router();

router.use(authMiddleware, roleMiddleware('Admin'));
router.get('/', userController.listUsers);

export default router;
