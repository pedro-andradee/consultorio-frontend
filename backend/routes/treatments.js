import express from 'express';
import TreatmentsService from '../services/treatmentsService.js';
import TreatmentsController from '../controllers/treatmentsController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();
const service = new TreatmentsService();
const controller = new TreatmentsController(service);

router.get('/', authenticateToken, authorizeRole('receptionist'), controller.list);
router.post('/', authenticateToken, authorizeRole('dentist'), controller.create);
router.put('/:id', authenticateToken, authorizeRole('dentist'), controller.update);
router.delete('/:id', authenticateToken, authorizeRole('dentist'), controller.remove);

export default router;
