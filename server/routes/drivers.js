const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all drivers
router.get('/', async (req, res) => {
    try {
        const { search, status, sortBy, sortOrder } = req.query;
        let query = 'SELECT * FROM drivers WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (name LIKE ? OR license_number LIKE ? OR mobile LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        const validSortCols = ['name', 'completion_rate_percent', 'safety_score_percent', 'complaints_count', 'status', 'license_expiry_date'];
        if (sortBy && validSortCols.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
        } else {
            query += ' ORDER BY name ASC';
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
});

// POST create driver
router.post('/', async (req, res) => {
    try {
        const { name, license_number, license_expiry_date, mobile, email } = req.body;

        if (!name || !license_number || !license_expiry_date) {
            return res.status(400).json({ error: 'Name, license number, and license expiry date are required' });
        }

        // Validate name
        if (name.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }

        // Validate mobile if provided
        if (mobile && !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({ error: 'Mobile number must be exactly 10 digits' });
        }

        // Validate email if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate license expiry date
        const expiryDate = new Date(license_expiry_date);
        if (isNaN(expiryDate.getTime())) {
            return res.status(400).json({ error: 'Invalid license expiry date' });
        }

        const [result] = await db.query(
            'INSERT INTO drivers (name, license_number, license_expiry_date, mobile, email) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), license_number.trim(), license_expiry_date, mobile || null, email || null]
        );

        const [newDriver] = await db.query('SELECT * FROM drivers WHERE id = ?', [result.insertId]);
        res.status(201).json(newDriver[0]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'A driver with this license number already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to create driver' });
    }
});

// PUT update driver
router.put('/:id', async (req, res) => {
    try {
        const { name, license_number, license_expiry_date, mobile, email, status } = req.body;
        const { id } = req.params;

        const [drivers] = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);
        if (drivers.length === 0) return res.status(404).json({ error: 'Driver not found' });

        const fields = [];
        const params = [];

        if (name !== undefined) {
            if (name.trim().length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
            fields.push('name = ?'); params.push(name.trim());
        }
        if (license_number !== undefined) {
            fields.push('license_number = ?'); params.push(license_number.trim());
        }
        if (license_expiry_date !== undefined) {
            fields.push('license_expiry_date = ?'); params.push(license_expiry_date);
        }
        if (mobile !== undefined) {
            if (mobile && !/^\d{10}$/.test(mobile)) return res.status(400).json({ error: 'Mobile number must be exactly 10 digits' });
            fields.push('mobile = ?'); params.push(mobile || null);
        }
        if (email !== undefined) {
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });
            fields.push('email = ?'); params.push(email || null);
        }
        if (status !== undefined) {
            if (!['On Duty', 'Suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
            fields.push('status = ?'); params.push(status);
        }

        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

        params.push(id);
        await db.query(`UPDATE drivers SET ${fields.join(', ')} WHERE id = ?`, params);

        const [updated] = await db.query('SELECT * FROM drivers WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'A driver with this license number already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to update driver' });
    }
});

module.exports = router;
