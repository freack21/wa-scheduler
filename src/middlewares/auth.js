
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const verifyToken = (req, res, next) => {
    let token = req.headers['authorization']?.split(' ')[1];

    if (!token && req.query.token) {
        token = req.query.token;
    }
    
    if (!token && req.query.api_key) {
        token = req.query.api_key;
    }

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = decoded;
        next();
    });
};
