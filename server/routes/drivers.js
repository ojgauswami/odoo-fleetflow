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
            query += ' AND (name LIKE ? OR license_number LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        const validSortCols = ['name', 'completion_rate_percent', 'safety_score_percent', 'complaints_count', 'status'];
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
        const { name, license_number, license_expiry_date } = req.body;

        if (!name || !license_number || !license_expiry_date) {
            return res.status(400).json({ error: 'Name, license number, and license expiry date are required' });
        }

        const [result] = await db.query(
            'INSERT INTO drivers (name, license_number, license_expiry_date) VALUES (?, ?, ?)',
            [name, license_number, license_expiry_date]
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

module.exports = router;
