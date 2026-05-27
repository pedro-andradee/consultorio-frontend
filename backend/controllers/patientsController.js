export default class PatientsController {
    constructor(patientsService) {
        this.service = patientsService;
        this.list = this.list.bind(this);
        this.getById = this.getById.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }

    async list(req, res) {
        try {
            const items = await this.service.findAll(req.query);
            res.status(200).json(items);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao listar pacientes', error: err.message });
        }
    }

    async getById(req, res) {
        try {
            const id = req.params.id;
            const item = await this.service.findById(id);
            if (!item) return res.status(404).json({ message: 'Paciente não encontrado' });
            res.status(200).json(item);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao obter paciente', error: err.message });
        }
    }

    async create(req, res) {
        try {
            const { name, email, phone, dateOfBirth, origin, observations } = req.body;
            const payload = {
                name,
                email,
                phone,
                dateOfBirth,
                origin,
                observations
            };
            const created = await this.service.create(payload);
            res.status(201).json(created);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao criar paciente', error: err.message });
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const data = req.body;
            const updated = await this.service.update(id, data);
            if (!updated) return res.status(404).json({ message: 'Paciente não encontrado' });
            res.status(200).json(updated);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao atualizar paciente', error: err.message });
        }
    }

    async remove(req, res) {
        try {
            const id = req.params.id;
            const removed = await this.service.delete(id);
            if (!removed) return res.status(404).json({ message: 'Paciente não encontrado' });
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ message: 'Erro ao remover paciente', error: err.message });
        }
    }
}
