export default class Patient {
    constructor({
        ID, id, _id,
        Nome, name,
        Telefone, phone,
        Email, email,
        Data_Nascimento, dob, dateOfBirth,
        Origem, origin,
        Observacoes, observations,
        createdAt, updatedAt,
        ...rest
    } = {}) {
        this.id = id || _id || ID || undefined;
        this.name = name || Nome || '';
        this.email = email || Email || '';
        this.phone = phone || Telefone || '';
        const rawDob = Data_Nascimento ?? dob ?? dateOfBirth ?? null;
        this.dateOfBirth = rawDob ? new Date(rawDob) : null;
        this.origin = origin || Origem || null;
        this.observations = observations || Observacoes || null;
        this.createdAt = createdAt ? new Date(createdAt) : new Date();
        this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
        Object.assign(this, rest);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            dateOfBirth: this.dateOfBirth,
            origin: this.origin,
            observations: this.observations,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
