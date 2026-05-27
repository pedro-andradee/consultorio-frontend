import express from 'express';
import PatientsService from '../services/patientsService.js';
import PatientsController from '../controllers/patientsController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();
const service = new PatientsService();
const controller = new PatientsController(service);

router.get('/', authenticateToken, authorizeRole('receptionist'), controller.list);
router.get('/:id', authenticateToken, authorizeRole('receptionist'), controller.getById);
router.post('/', authenticateToken, authorizeRole('receptionist'), controller.create);
router.put('/:id', authenticateToken, authorizeRole('receptionist'), controller.update);
router.delete('/:id', authenticateToken, authorizeRole('receptionist'), controller.remove);

export default router;
