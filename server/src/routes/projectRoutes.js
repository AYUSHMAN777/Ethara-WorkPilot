import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import * as projectController from '../controllers/projectController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', roleMiddleware('Admin'), projectController.createProject);
router.get('/', projectController.listProjects);
router.get('/:projectId/members', projectController.listProjectMembers);
router.get('/:id', projectController.getProject);
router.put('/:id', roleMiddleware('Admin'), projectController.updateProject);
router.delete('/:id', roleMiddleware('Admin'), projectController.deleteProject);

export default router;
