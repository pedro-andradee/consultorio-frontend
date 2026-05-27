import express from 'express';
import AppointmentsService from '../services/appointmentsService.js';
import AppointmentsController from '../controllers/appointmentsController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();
const service = new AppointmentsService();
const controller = new AppointmentsController(service);

router.get('/dentists', authenticateToken, authorizeRole('receptionist'), controller.listDentists);
router.get('/', authenticateToken, authorizeRole('receptionist'), controller.list);
router.get('/:id', authenticateToken, authorizeRole('receptionist'), controller.getById);
router.post('/', authenticateToken, authorizeRole('receptionist'), controller.create);
router.put('/:id', authenticateToken, authorizeRole('receptionist'), controller.update);
router.delete('/:id', authenticateToken, authorizeRole('receptionist'), controller.remove);

export default router;
