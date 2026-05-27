import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
        this.SALT_ROUNDS = 10;
        this.jwtSecret = process.env.JWT_SECRET || 'change_this_secret';
        this.tokenExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
    }

    async hashPassword(password) {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    async validatePassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    computeAccessClaims(user) {
        const role = user.type || user.role || 'receptionist';
        return {
            role,
            isAdmin: !!user.isAdmin,
            blocked: !!user.blocked
        };
    }

    generateToken(user) {
        const subject = user.id || user._id;
        const accessClaims = this.computeAccessClaims(user);
        const payload = {
            sub: subject,
            name: user.name,
            ...accessClaims
        };
        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiresIn });
    }

    checkAccessFromClaims(claims, requiredRole = 'receptionist') {
        if (!claims) return false;
        if (claims.blocked) return false;
        if (claims.isAdmin) return true;
        const allowedRoles = {
            receptionist: ['receptionist'],
            dentist: ['dentist', 'admin'],
            admin: ['admin']
        };
        return allowedRoles[requiredRole]?.includes(claims.role) || false;
    }

    async login(req, res) {
        const { username, password } = req.body;
        try {
            const user = await this.usersService.findByUsername(username);
            if (!user) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }

            const valid = await this.validatePassword(password, user.password);
            if (!valid) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }

            if (user.blocked) {
                return res.status(403).json({ message: 'Usuário bloqueado' });
            }

            const token = this.generateToken(user);

            const safeUser = { ...user };
            delete safeUser.password;
            delete safeUser.passwordHash;
            delete safeUser.hash;

            res.set('Authorization', `Bearer ${token}`);
            res.status(200).json({ message: 'Login bem-sucedido', token, user: safeUser });
        } catch (error) {
            res.status(500).json({ message: 'Erro no servidor', error: error.message });
        }
    }

    async register(req, res) {
        const { name, password, type = 'receptionist', isAdmin = false } = req.body;
        try {
            if (!name || !password) {
                return res.status(400).json({ message: 'Nome e senha são obrigatórios' });
            }
            const hashed = await this.hashPassword(password);
            const newUser = await this.usersService.createUser(name, hashed, type, isAdmin);

            const token = this.generateToken(newUser);

            const safeUser = { ...newUser };
            delete safeUser.password;
            delete safeUser.passwordHash;
            delete safeUser.hash;

            res.set('Authorization', `Bearer ${token}`);
            res.status(201).json({ message: 'Usuário registrado com sucesso', token, user: safeUser });
        } catch (error) {
            res.status(500).json({ message: 'Erro no servidor', error: error.message });
        }
    }
}

export default UsersController;
