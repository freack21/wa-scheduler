
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import JsonDB from '../models/JsonDB.js';
import config from '../config/index.js';
import path from 'path';

const db = new JsonDB(path.join(process.cwd(), 'data', 'users.json'), { users: [] });

export const register = async (req, res) => {
    try {
        console.log('Register payload:', req.body);
        const { username, password } = req.body;
        if (!username || !password) {
            console.log('Missing fields');
            return res.status(400).json({ message: 'Username and password are required' });
        }

        let user = await db.findOne('users', { username });
        if (user) {
            console.log('User exists:', username);
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user = {
            id: uuidv4(),
            username,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        await db.push('users', user);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.findOne('users', { username });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, config.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await db.findOne('users', { id: req.user.id });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};
