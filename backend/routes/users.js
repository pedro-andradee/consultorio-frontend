import express from 'express';
import UsersService from '../services/usersService.js';
import UsersController from '../controllers/usersController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();
const service = new UsersService();
const controller = new UsersController(service);

router.post('/login', (req, res) => controller.login(req, res));
router.post('/register', (req, res) => controller.register(req, res));

router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const users = await service.findAll(req.query);
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar usuários', error: err.message });
    }
});

router.get('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const user = await service.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao obter usuário', error: err.message });
    }
});

router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const updated = await service.update(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar usuário', error: err.message });
    }
});

router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const removed = await service.delete(req.params.id);
        if (!removed) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: 'Erro ao remover usuário', error: err.message });
    }
});

router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { name, password, type = 'receptionist', isAdmin = false } = req.body;
        if (!name || !password) {
            return res.status(400).json({ message: 'Nome e senha são obrigatórios' });
        }
        const hashed = await controller.hashPassword(password);
        const newUser = await service.createUser(name, hashed, type, isAdmin);
        res.status(201).json(newUser);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar usuário', error: err.message });
    }
});

export default router;
