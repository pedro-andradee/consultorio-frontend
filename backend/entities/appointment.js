export default class Appointment {
    constructor({ id, _id, patientId, patientName, doctorId, doctorName, date, statusId, statusName, notes = '', duracao, isTratamento, createdAt, updatedAt, ...rest } = {}) {
        this.id = id || _id || undefined;
        this.patientId = patientId || null;
        this.patientName = patientName || '';
        this.doctorId = doctorId || null;
        this.doctorName = doctorName || '';
        this.date = date ? new Date(date) : null;
        this.statusId = statusId || 1;
        this.statusName = statusName || 'Agendado';
        this.notes = notes;
        this.duracao = duracao || 60;
        this.isTratamento = isTratamento || false;
        this.createdAt = createdAt ? new Date(createdAt) : new Date();
        this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
        Object.assign(this, rest);
    }

    toJSON() {
        return {
            id: this.id,
            patientId: this.patientId,
            patientName: this.patientName,
            doctorId: this.doctorId,
            doctorName: this.doctorName,
            date: this.date,
            statusId: this.statusId,
            statusName: this.statusName,
            notes: this.notes,
            duracao: this.duracao,
            isTratamento: this.isTratamento,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
