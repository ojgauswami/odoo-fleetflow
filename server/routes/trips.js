const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all trips with vehicle/driver info
router.get('/', async (req, res) => {
    try {
        const { search, status, sortBy, sortOrder } = req.query;
        let query = `
      SELECT t.*, v.plate, v.model AS vehicle_model, v.max_payload_kg,
             d.name AS driver_name, d.license_expiry_date
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE 1=1
    `;
        const params = [];

        if (search) {
            query += ' AND (t.origin LIKE ? OR t.destination LIKE ? OR v.plate LIKE ? OR d.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        const validSortCols = ['origin', 'destination', 'cargo_weight_kg', 'estimated_fuel_cost', 'status', 'created_at'];
        if (sortBy && validSortCols.includes(sortBy)) {
            query += ` ORDER BY t.${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
        } else {
            query += ' ORDER BY t.created_at DESC';
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

// POST create trip — with dispatch validation
router.post('/', async (req, res) => {
    try {
        const { vehicle_id, driver_id, origin, destination, cargo_weight_kg, estimated_fuel_cost } = req.body;

        // Basic validation
        if (!vehicle_id || !driver_id || !origin || !destination || !cargo_weight_kg) {
            return res.status(400).json({ error: 'Vehicle, driver, origin, destination, and cargo weight are required' });
        }

        // VALIDATION: No negatives
        if (parseFloat(cargo_weight_kg) <= 0) {
            return res.status(400).json({ error: 'Cargo weight must be greater than 0' });
        }
        if (estimated_fuel_cost !== undefined && parseFloat(estimated_fuel_cost) < 0) {
            return res.status(400).json({ error: 'Estimated fuel cost cannot be negative' });
        }

        // Fetch vehicle to check payload
        const [vehicles] = await db.query('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
        if (vehicles.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        const vehicle = vehicles[0];

        // VALIDATION: Block if cargo exceeds max payload
        if (parseFloat(cargo_weight_kg) > parseFloat(vehicle.max_payload_kg)) {
            return res.status(400).json({
                error: `Cargo weight (${cargo_weight_kg} kg) exceeds vehicle max payload (${vehicle.max_payload_kg} kg)`
            });
        }

        // VALIDATION: Block if vehicle is not available
        if (vehicle.status !== 'Idle') {
            return res.status(400).json({
                error: `Vehicle ${vehicle.plate} is currently "${vehicle.status}" and cannot be dispatched`
            });
        }

        // Fetch driver to check license
        const [drivers] = await db.query('SELECT * FROM drivers WHERE id = ?', [driver_id]);
        if (drivers.length === 0) return res.status(404).json({ error: 'Driver not found' });
        const driver = drivers[0];

        // VALIDATION: Block if license is expired
        const today = new Date();
        const licenseExpiry = new Date(driver.license_expiry_date);
        if (licenseExpiry < today) {
            return res.status(400).json({
                error: `Driver ${driver.name}'s license expired on ${driver.license_expiry_date}`
            });
        }

        // VALIDATION: Block if driver is suspended
        if (driver.status === 'Suspended') {
            return res.status(400).json({
                error: `Driver ${driver.name} is currently suspended`
            });
        }

        // Create trip as Dispatched
        const [result] = await db.query(
            `INSERT INTO trips (vehicle_id, driver_id, origin, destination, cargo_weight_kg, estimated_fuel_cost, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Dispatched')`,
            [vehicle_id, driver_id, origin, destination, cargo_weight_kg, estimated_fuel_cost || 0]
        );

        // AUTO TRIGGER: Set vehicle status to "On Trip"
        await db.query('UPDATE vehicles SET status = "On Trip" WHERE id = ?', [vehicle_id]);

        const [newTrip] = await db.query(
            `SELECT t.*, v.plate, v.model AS vehicle_model, d.name AS driver_name
       FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = ?`,
            [result.insertId]
        );
        res.status(201).json(newTrip[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create trip' });
    }
});

// PUT complete a trip
router.put('/:id/complete', async (req, res) => {
    try {
        const [trips] = await db.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        if (trips.length === 0) return res.status(404).json({ error: 'Trip not found' });

        const trip = trips[0];
        if (trip.status === 'Completed') {
            return res.status(400).json({ error: 'Trip is already completed' });
        }

        // Complete the trip
        await db.query(
            'UPDATE trips SET status = "Completed", completed_at = NOW() WHERE id = ?',
            [req.params.id]
        );

        // AUTO TRIGGER: Set vehicle status to "Idle"
        await db.query('UPDATE vehicles SET status = "Idle" WHERE id = ?', [trip.vehicle_id]);

        const [updated] = await db.query(
            `SELECT t.*, v.plate, v.model AS vehicle_model, d.name AS driver_name
       FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = ?`,
            [req.params.id]
        );
        res.json(updated[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to complete trip' });
    }
});

// PUT cancel a trip
router.put('/:id/cancel', async (req, res) => {
    try {
        const [trips] = await db.query('SELECT * FROM trips WHERE id = ?', [req.params.id]);
        if (trips.length === 0) return res.status(404).json({ error: 'Trip not found' });
        const trip = trips[0];
        if (trip.status === 'Completed') return res.status(400).json({ error: 'Cannot cancel a completed trip' });
        if (trip.status === 'Cancelled') return res.status(400).json({ error: 'Trip is already cancelled' });

        await db.query('UPDATE trips SET status = "Cancelled" WHERE id = ?', [req.params.id]);
        await db.query('UPDATE vehicles SET status = "Idle" WHERE id = ?', [trip.vehicle_id]);

        const [updated] = await db.query(
            `SELECT t.*, v.plate, v.model AS vehicle_model, d.name AS driver_name
       FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id
       WHERE t.id = ?`, [req.params.id]
        );
        res.json(updated[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to cancel trip' });
    }
});

module.exports = router;
