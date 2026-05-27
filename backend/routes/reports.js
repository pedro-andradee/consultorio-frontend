import express from 'express';
import ReportsService from '../services/reportsService.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();
const service = new ReportsService();

const handle = (fn) => async (req, res) => {
    try {
        const data = await fn();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao gerar relatório', error: err.message });
    }
};

router.get('/treatments-count',   authenticateToken, authorizeRole('admin'), handle(() => service.treatmentsCount()));
router.get('/treatments-revenue', authenticateToken, authorizeRole('admin'), handle(() => service.treatmentsRevenue()));
router.get('/treatments-cost',    authenticateToken, authorizeRole('admin'), handle(() => service.treatmentsCost()));
router.get('/patient-profiles',   authenticateToken, authorizeRole('admin'), handle(() => service.patientProfiles()));
router.get('/return-rate',        authenticateToken, authorizeRole('admin'), handle(() => service.returnRate()));
router.get('/abandonment',        authenticateToken, authorizeRole('admin'), handle(() => service.abandonment()));

export default router;
