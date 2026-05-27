const STATUS_LABELS = { 1: 'Pago', 2: 'Pendente', 3: 'Atrasado' };

export default class Invoice {
    constructor({
        ID, id,
        ID_Paciente, patientId,
        ID_Tratamento, treatmentId,
        Data, date,
        Valor, valor,
        Pago, pago,
        Pendente, pendente,
        Status, status,
        patientName,
        treatmentDescricao,
        ...rest
    } = {}) {
        this.id = id ?? ID ?? undefined;
        this.patientId = patientId ?? ID_Paciente ?? null;
        this.treatmentId = treatmentId ?? ID_Tratamento ?? null;
        const rawDate = Data ?? date ?? null;
        this.date = rawDate ? new Date(rawDate) : null;
        this.valor = Number(valor ?? Valor ?? 0);
        this.pago = Number(pago ?? Pago ?? 0);
        this.pendente = Number(pendente ?? Pendente ?? 0);
        this.status = Number(status ?? Status ?? 2);
        this.patientName = patientName ?? '';
        this.treatmentDescricao = treatmentDescricao ?? '';
        Object.assign(this, rest);
    }

    get statusLabel() {
        return STATUS_LABELS[this.status] ?? 'Pendente';
    }

    toJSON() {
        return {
            id: this.id,
            patientId: this.patientId,
            treatmentId: this.treatmentId,
            date: this.date,
            valor: this.valor,
            pago: this.pago,
            pendente: this.pendente,
            status: this.status,
            statusLabel: this.statusLabel,
            patientName: this.patientName,
            treatmentDescricao: this.treatmentDescricao
        };
    }
}
