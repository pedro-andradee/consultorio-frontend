export default class AppointmentsController {
    constructor(appointmentsService) {
        this.service = appointmentsService;
        this.list = this.list.bind(this);
        this.getById = this.getById.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
        this.listDentists = this.listDentists.bind(this);
    }

    async list(req, res) {
        try {
            const items = await this.service.findAll(req.query);
            res.status(200).json(items);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao listar agendamentos', error: err.message });
        }
    }

    async getById(req, res) {
        try {
            const id = req.params.id;
            const item = await this.service.findById(id);
            if (!item) return res.status(404).json({ message: 'Agendamento não encontrado' });
            res.status(200).json(item);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao obter agendamento', error: err.message });
        }
    }

    async create(req, res) {
        try {
            const data = req.body;
            if (data.statusId && ![1,2,3].includes(data.statusId)) {
                return res.status(400).json({ message: 'Status inválido. Deve ser 1 (Agendado), 2 (Concluído) ou 3 (Cancelado)' });
            }
            const created = await this.service.create(data);
            res.status(201).json(created);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao criar agendamento', error: err.message });
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const data = req.body;
            if (data.statusId && ![1,2,3].includes(data.statusId)) {
                return res.status(400).json({ message: 'Status inválido. Deve ser 1 (Agendado), 2 (Concluído) ou 3 (Cancelado)' });
            }
            const updated = await this.service.update(id, data);
            if (!updated) return res.status(404).json({ message: 'Agendamento não encontrado' });
            res.status(200).json(updated);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao atualizar agendamento', error: err.message });
        }
    }

    async remove(req, res) {
        try {
            const id = req.params.id;
            const removed = await this.service.delete(id);
            if (!removed) return res.status(404).json({ message: 'Agendamento não encontrado' });
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ message: 'Erro ao remover agendamento', error: err.message });
        }
    }

    async listDentists(req, res) {
        try {
            const dentists = await this.service.listDentists();
            res.status(200).json(dentists);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao listar dentistas', error: err.message });
        }
    }
}
