const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all expenses with trip/vehicle/driver info
router.get('/', async (req, res) => {
    try {
        const { search, status, sortBy, sortOrder } = req.query;
        let query = `
      SELECT e.*, t.origin, t.destination,
             v.plate, v.model AS vehicle_model,
             d.name AS driver_name
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      JOIN vehicles v ON e.vehicle_id = v.id
      JOIN drivers d ON e.driver_id = d.id
      WHERE 1=1
    `;
        const params = [];

        if (search) {
            query += ' AND (v.plate LIKE ? OR d.name LIKE ? OR t.origin LIKE ? OR t.destination LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status) {
            query += ' AND e.status = ?';
            params.push(status);
        }

        const validSortCols = ['distance_km', 'fuel_expense', 'misc_expense', 'status'];
        if (sortBy && validSortCols.includes(sortBy)) {
            query += ` ORDER BY e.${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
        } else {
            query += ' ORDER BY e.created_at DESC';
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// POST create expense — with full validation
router.post('/', async (req, res) => {
    try {
        const { trip_id, vehicle_id, driver_id, distance_km, fuel_expense, misc_expense } = req.body;

        if (!trip_id || !vehicle_id || !driver_id) {
            return res.status(400).json({ error: 'Trip, vehicle, and driver are required' });
        }

        // VALIDATION: No negative values
        const dist = parseFloat(distance_km) || 0;
        const fuel = parseFloat(fuel_expense) || 0;
        const misc = parseFloat(misc_expense) || 0;

        if (dist < 0) return res.status(400).json({ error: 'Distance cannot be negative' });
        if (fuel < 0) return res.status(400).json({ error: 'Fuel expense cannot be negative' });
        if (misc < 0) return res.status(400).json({ error: 'Misc expense cannot be negative' });

        // Check trip exists
        const [trips] = await db.query('SELECT * FROM trips WHERE id = ?', [trip_id]);
        if (trips.length === 0) return res.status(404).json({ error: 'Trip not found' });

        // Check vehicle exists
        const [vehicles] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
        if (vehicles.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

        // Check driver exists
        const [drivers] = await db.query('SELECT * FROM drivers WHERE id = ?', [driver_id]);
        if (drivers.length === 0) return res.status(404).json({ error: 'Driver not found' });

        const [result] = await db.query(
            `INSERT INTO expenses (trip_id, vehicle_id, driver_id, distance_km, fuel_expense, misc_expense)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [trip_id, vehicle_id, driver_id, dist, fuel, misc]
        );

        const [newExpense] = await db.query(
            `SELECT e.*, t.origin, t.destination, v.plate, d.name AS driver_name
       FROM expenses e
       JOIN trips t ON e.trip_id = t.id
       JOIN vehicles v ON e.vehicle_id = v.id
       JOIN drivers d ON e.driver_id = d.id
       WHERE e.id = ?`,
            [result.insertId]
        );
        res.status(201).json(newExpense[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});

module.exports = router;
