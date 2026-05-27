export default class TreatmentsController {
    constructor(treatmentsService) {
        this.service = treatmentsService;
        this.list = this.list.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }

    async list(req, res) {
        try {
            const { patientId } = req.query;
            if (!patientId) return res.status(400).json({ message: 'patientId é obrigatório' });
            const items = await this.service.findByPatientId(patientId);
            res.status(200).json(items);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao listar tratamentos', error: err.message });
        }
    }

    async create(req, res) {
        try {
            const { patientId, dentistId, agendaId, descricao, detalhes, dente, valor } = req.body;
            if (!patientId || !dentistId || !descricao) {
                return res.status(400).json({ message: 'patientId, dentistId e descricao são obrigatórios' });
            }
            const created = await this.service.create({ patientId, dentistId, agendaId, descricao, detalhes, dente, valor });
            res.status(201).json(created);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao criar tratamento', error: err.message });
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const { dentistId, agendaId, descricao, detalhes, dente, valor } = req.body;
            if (!dentistId || !descricao) {
                return res.status(400).json({ message: 'dentistId e descricao são obrigatórios' });
            }
            const updated = await this.service.update(id, { dentistId, agendaId, descricao, detalhes, dente, valor });
            if (!updated) return res.status(404).json({ message: 'Tratamento não encontrado' });
            res.status(200).json(updated);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao atualizar tratamento', error: err.message });
        }
    }

    async remove(req, res) {
        try {
            const id = req.params.id;
            const removed = await this.service.delete(id);
            if (!removed) return res.status(404).json({ message: 'Tratamento não encontrado' });
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ message: 'Erro ao remover tratamento', error: err.message });
        }
    }
}
