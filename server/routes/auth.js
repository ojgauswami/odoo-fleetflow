const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (username.trim().length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username.trim()]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = users[0];

        // Password check: 'super123' for Super Admin, 'password123' for others
        const expectedPassword = user.role === 'Super Admin' ? 'super123' : 'password123';
        if (password !== expectedPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/users — list all users (for Super Admin panel)
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, role, created_at FROM users ORDER BY id');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/auth/users — Super Admin creates a new user
router.post('/users', async (req, res) => {
    try {
        const { username, role } = req.body;
        if (!username || !role) {
            return res.status(400).json({ error: 'Username and role are required' });
        }

        // Username validation
        if (username.trim().length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
            return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
        }

        const validRoles = ['Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
        }

        // Check duplicate
        const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Default password: password123
        await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username.trim(), 'placeholder', role]
        );

        const [newUser] = await db.query('SELECT id, username, role, created_at FROM users WHERE username = ?', [username.trim()]);
        res.status(201).json(newUser[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/auth/users/:id — Super Admin updates a user's username and/or role
router.put('/users/:id', async (req, res) => {
    try {
        const { username, role } = req.body;
        const { id } = req.params;

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        // Cannot change Super Admin's role
        if (users[0].role === 'Super Admin') {
            return res.status(403).json({ error: 'Cannot modify the Super Admin account' });
        }

        const validRoles = ['Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

        const fields = [];
        const params = [];

        // Update username if provided
        if (username !== undefined && username.trim() !== users[0].username) {
            if (username.trim().length < 3) {
                return res.status(400).json({ error: 'Username must be at least 3 characters' });
            }
            if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
                return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
            }
            // Check uniqueness
            const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username.trim(), id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            fields.push('username = ?');
            params.push(username.trim());
        }

        // Update role if provided
        if (role !== undefined) {
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
            }
            fields.push('role = ?');
            params.push(role);
        }

        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

        params.push(id);
        await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
        const [updated] = await db.query('SELECT id, username, role, created_at FROM users WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/auth/users/:id — Super Admin deletes a user
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        if (users[0].role === 'Super Admin') {
            return res.status(403).json({ error: 'Cannot delete the Super Admin account' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: `User ${users[0].username} deleted successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
