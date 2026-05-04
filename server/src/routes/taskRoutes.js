import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import * as taskController from '../controllers/taskController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', roleMiddleware('Admin'), taskController.createTask);
router.get('/project/:projectId', taskController.listTasksByProject);
router.put('/:id/status', taskController.updateTaskStatus);
router.put('/:id', taskController.updateTask);
router.delete('/:id', roleMiddleware('Admin'), taskController.deleteTask);

export default router;
