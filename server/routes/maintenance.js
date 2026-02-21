const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all maintenance logs
router.get('/', async (req, res) => {
    try {
        const { search, sortBy, sortOrder } = req.query;
        let query = `
      SELECT m.*, v.plate, v.model AS vehicle_model
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE 1=1
    `;
        const params = [];

        if (search) {
            query += ' AND (m.issue_service LIKE ? OR v.plate LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const validSortCols = ['date', 'cost', 'issue_service'];
        if (sortBy && validSortCols.includes(sortBy)) {
            query += ` ORDER BY m.${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
        } else {
            query += ' ORDER BY m.date DESC';
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch maintenance logs' });
    }
});

// POST create maintenance log — auto triggers vehicle status to "In Shop"
router.post('/', async (req, res) => {
    try {
        const { vehicle_id, issue_service, date, cost } = req.body;

        if (!vehicle_id || !issue_service || !date) {
            return res.status(400).json({ error: 'Vehicle, issue/service description, and date are required' });
        }

        const [vehicles] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
        if (vehicles.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

        const [result] = await db.query(
            'INSERT INTO maintenance_logs (vehicle_id, issue_service, date, cost) VALUES (?, ?, ?, ?)',
            [vehicle_id, issue_service, date, cost || 0]
        );

        // AUTO TRIGGER: Set vehicle status to "In Shop"
        await db.query('UPDATE vehicles SET status = "In Shop" WHERE id = ?', [vehicle_id]);

        const [newLog] = await db.query(
            `SELECT m.*, v.plate, v.model AS vehicle_model
       FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id
       WHERE m.id = ?`,
            [result.insertId]
        );
        res.status(201).json(newLog[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create maintenance log' });
    }
});

module.exports = router;
