export default class User {
    constructor({ id, _id, name, password, type, isAdmin, blocked = false, ...rest } = {}) {
        this.id = id || _id || undefined;
        this.name = name;
        this.password = password || null;
        this.type = type || 'receptionist';
        this.isAdmin = !!isAdmin;
        this.blocked = !!blocked;
        Object.assign(this, rest);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            isAdmin: this.isAdmin,
            blocked: this.blocked
        };
    }
}