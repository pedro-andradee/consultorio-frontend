import express from 'express';
import ReportsService from '../services/reportsService.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();
const service = new ReportsService();

const handle = (fn) => async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        const filter = {
            dateFrom: dateFrom || null,
            dateTo:   dateTo   || null,
        };
        const data = await fn(filter);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao gerar relatório', error: err.message });
    }
};

router.get('/treatments-count',   authenticateToken, authorizeRole('admin'), handle(f => service.treatmentsCount(f)));
router.get('/treatments-revenue', authenticateToken, authorizeRole('admin'), handle(f => service.treatmentsRevenue(f)));
router.get('/treatments-cost',    authenticateToken, authorizeRole('admin'), handle(f => service.treatmentsCost(f)));
router.get('/patient-profiles',   authenticateToken, authorizeRole('admin'), handle(f => service.patientProfiles(f)));
router.get('/return-rate',        authenticateToken, authorizeRole('admin'), handle(f => service.returnRate(f)));
router.get('/abandonment',        authenticateToken, authorizeRole('admin'), handle(f => service.abandonment(f)));

export default router;
