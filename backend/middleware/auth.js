import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'change_this_secret';

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de acesso necessário' });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}

export function authorizeRole(requiredRole) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Não autorizado' });
        }
        const userRole = req.user.role;
        const isAdmin = req.user.isAdmin;
        if (isAdmin || userRole === requiredRole || (requiredRole === 'receptionist' && (userRole === 'dentist' || userRole === 'admin'))) {
            next();
        } else {
            return res.status(403).json({ message: 'Acesso negado' });
        }
    };
}
