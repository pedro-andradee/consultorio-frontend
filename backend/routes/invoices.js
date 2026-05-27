import express from 'express';
import InvoicesService from '../services/invoicesService.js';
import InvoicesController from '../controllers/invoicesController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();
const service = new InvoicesService();
const controller = new InvoicesController(service);

router.get('/', authenticateToken, authorizeRole('dentist'), controller.list);
router.get('/:id', authenticateToken, authorizeRole('dentist'), controller.getById);
router.patch('/:id', authenticateToken, authorizeRole('dentist'), controller.updatePayment);
router.delete('/:id', authenticateToken, authorizeRole('dentist'), controller.remove);

export default router;
