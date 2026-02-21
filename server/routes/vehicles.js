const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all vehicles with optional search, filter, sort
router.get('/', async (req, res) => {
    try {
        const { search, status, type, sortBy, sortOrder } = req.query;
        let query = 'SELECT * FROM vehicles WHERE 1=1';
        const params = [];

        if (search) {
            query += ' AND (plate LIKE ? OR model LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        const validSortCols = ['plate', 'model', 'type', 'max_payload_kg', 'odometer', 'status', 'created_at'];
        if (sortBy && validSortCols.includes(sortBy)) {
            query += ` ORDER BY ${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
        } else {
            query += ' ORDER BY created_at DESC';
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
});

// GET single vehicle
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
});

// POST create vehicle
router.post('/', async (req, res) => {
    try {
        const { plate, model, type, max_payload_kg, odometer, acquisition_cost } = req.body;

        if (!plate || !model || !type || !max_payload_kg) {
            return res.status(400).json({ error: 'Plate, model, type, and max_payload_kg are required' });
        }

        const validTypes = ['Trailer Truck', 'Mini', 'Tanker', 'Flatbed', 'Refrigerated', 'Container'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        }

        if (parseFloat(max_payload_kg) <= 0) {
            return res.status(400).json({ error: 'Max payload must be greater than 0' });
        }

        const [result] = await db.query(
            'INSERT INTO vehicles (plate, model, type, max_payload_kg, odometer, acquisition_cost) VALUES (?, ?, ?, ?, ?, ?)',
            [plate, model, type, max_payload_kg, odometer || 0, acquisition_cost || 0]
        );

        const [newVehicle] = await db.query('SELECT * FROM vehicles WHERE id = ?', [result.insertId]);
        res.status(201).json(newVehicle[0]);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'A vehicle with this plate already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
});

// PUT update vehicle
router.put('/:id', async (req, res) => {
    try {
        const { plate, model, type, max_payload_kg, odometer, status } = req.body;
        const fields = [];
        const params = [];

        if (plate) { fields.push('plate = ?'); params.push(plate); }
        if (model) { fields.push('model = ?'); params.push(model); }
        if (type) { fields.push('type = ?'); params.push(type); }
        if (max_payload_kg) { fields.push('max_payload_kg = ?'); params.push(max_payload_kg); }
        if (odometer !== undefined) { fields.push('odometer = ?'); params.push(odometer); }
        if (status) { fields.push('status = ?'); params.push(status); }

        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

        params.push(req.params.id);
        await db.query(`UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?`, params);

        const [updated] = await db.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

module.exports = router;
