export default class InvoicesController {
    constructor(invoicesService) {
        this.service = invoicesService;
        this.list = this.list.bind(this);
        this.getById = this.getById.bind(this);
        this.updatePayment = this.updatePayment.bind(this);
        this.remove = this.remove.bind(this);
    }

    async list(req, res) {
        try {
            const items = await this.service.findAll(req.query);
            res.status(200).json(items);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao listar faturas', error: err.message });
        }
    }

    async getById(req, res) {
        try {
            const id = req.params.id;
            const item = await this.service.findById(id);
            if (!item) return res.status(404).json({ message: 'Fatura não encontrada' });
            res.status(200).json(item);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao obter fatura', error: err.message });
        }
    }

    async updatePayment(req, res) {
        try {
            const id = req.params.id;
            const { pago, status } = req.body;
            if (pago === undefined && status === undefined) {
                return res.status(400).json({ message: 'Informe pago ou status para atualizar' });
            }
            const updated = await this.service.updatePayment(id, { pago, status });
            if (!updated) return res.status(404).json({ message: 'Fatura não encontrada' });
            res.status(200).json(updated);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao atualizar pagamento', error: err.message });
        }
    }

    async remove(req, res) {
        try {
            const id = req.params.id;
            const removed = await this.service.delete(id);
            if (!removed) return res.status(404).json({ message: 'Fatura não encontrada' });
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ message: 'Erro ao remover fatura', error: err.message });
        }
    }
}
