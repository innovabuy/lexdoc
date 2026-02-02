import { Router } from 'express';
import { clientsController } from './clients.controller';
import { authenticate } from '@/middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Search (must be before :id route)
router.get('/search', clientsController.search.bind(clientsController));

// CRUD routes
router.get('/', clientsController.list.bind(clientsController));
router.get('/:id', clientsController.getById.bind(clientsController));
router.post('/', clientsController.create.bind(clientsController));
router.put('/:id', clientsController.update.bind(clientsController));
router.delete('/:id', clientsController.delete.bind(clientsController));

export { router as clientsRouter };
