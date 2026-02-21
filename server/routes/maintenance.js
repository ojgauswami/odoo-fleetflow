const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all maintenance logs
router.get('/', async (req, res) => {
    try {
        const { search, sortBy, sortOrder } = req.query;
        let query = `
      SELECT m.*, v.plate, v.model AS vehicle_model, v.status AS vehicle_status
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

// POST create maintenance log — with validation + auto trigger
router.post('/', async (req, res) => {
    try {
        const { vehicle_id, issue_service, date, cost } = req.body;

        if (!vehicle_id || !issue_service || !date) {
            return res.status(400).json({ error: 'Vehicle, issue/service description, and date are required' });
        }

        // VALIDATION: No negative cost
        const parsedCost = parseFloat(cost) || 0;
        if (parsedCost < 0) return res.status(400).json({ error: 'Maintenance cost cannot be negative' });

        // VALIDATION: Date not in future
        const serviceDate = new Date(date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (serviceDate > tomorrow) {
            return res.status(400).json({ error: 'Service date cannot be in the future' });
        }

        const [vehicles] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
        if (vehicles.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

        // Block if vehicle is on active trip
        if (vehicles[0].status === 'On Trip') {
            return res.status(400).json({ error: 'Cannot log maintenance — vehicle is currently on trip' });
        }

        const [result] = await db.query(
            'INSERT INTO maintenance_logs (vehicle_id, issue_service, date, cost) VALUES (?, ?, ?, ?)',
            [vehicle_id, issue_service, date, parsedCost]
        );

        // AUTO TRIGGER: Set vehicle status to "In Shop"
        await db.query('UPDATE vehicles SET status = "In Shop" WHERE id = ?', [vehicle_id]);

        const [newLog] = await db.query(
            `SELECT m.*, v.plate, v.model AS vehicle_model, v.status AS vehicle_status
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

// PUT mark maintenance complete → vehicle back to Idle
router.put('/:id/complete', async (req, res) => {
    try {
        const [logs] = await db.query(
            'SELECT m.*, v.plate FROM maintenance_logs m JOIN vehicles v ON m.vehicle_id = v.id WHERE m.id = ?',
            [req.params.id]
        );
        if (logs.length === 0) return res.status(404).json({ error: 'Maintenance log not found' });

        await db.query('UPDATE vehicles SET status = "Idle" WHERE id = ?', [logs[0].vehicle_id]);
        res.json({ message: `Vehicle ${logs[0].plate} is back to Idle` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to complete maintenance' });
    }
});

module.exports = router;
