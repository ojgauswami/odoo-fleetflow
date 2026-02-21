const express = require('express');
const router = express.Router();
const db = require('../db');

// GET dashboard KPIs + active trips
router.get('/', async (req, res) => {
    try {
        // KPI 1: Active Fleet (vehicles On Trip)
        const [activeFleet] = await db.query(
            "SELECT COUNT(*) AS count FROM vehicles WHERE status = 'On Trip'"
        );

        // KPI 2: Maintenance Alerts (vehicles In Shop)
        const [maintAlerts] = await db.query(
            "SELECT COUNT(*) AS count FROM vehicles WHERE status = 'In Shop'"
        );

        // KPI 3: Pending Cargo (sum of cargo weight for dispatched trips)
        const [pendingCargo] = await db.query(
            "SELECT COALESCE(SUM(cargo_weight_kg), 0) AS total FROM trips WHERE status = 'Dispatched'"
        );

        // Active trips (Dispatched)
        const [activeTrips] = await db.query(`
      SELECT t.*, v.plate, v.model AS vehicle_model, d.name AS driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE t.status = 'Dispatched'
      ORDER BY t.created_at DESC
    `);

        res.json({
            kpis: {
                activeFleet: activeFleet[0].count,
                maintenanceAlerts: maintAlerts[0].count,
                pendingCargo: parseFloat(pendingCargo[0].total)
            },
            activeTrips
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = router;
