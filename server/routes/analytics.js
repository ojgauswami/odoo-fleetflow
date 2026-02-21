const express = require('express');
const router = express.Router();
const db = require('../db');

// GET analytics summary — Total Fuel Cost, Fleet ROI, Utilization Rate
router.get('/summary', async (req, res) => {
    try {
        // Total Fuel Cost
        const [fuelRows] = await db.query('SELECT COALESCE(SUM(fuel_expense), 0) AS total_fuel_cost FROM expenses');
        const totalFuelCost = parseFloat(fuelRows[0].total_fuel_cost);

        // Total Maintenance Cost
        const [maintRows] = await db.query('SELECT COALESCE(SUM(cost), 0) AS total_maintenance_cost FROM maintenance_logs');
        const totalMaintenanceCost = parseFloat(maintRows[0].total_maintenance_cost);

        // Revenue & Acquisition Cost
        const [revenueRows] = await db.query(
            'SELECT COALESCE(SUM(revenue_generated), 0) AS total_revenue, COALESCE(SUM(acquisition_cost), 0) AS total_acquisition FROM vehicles'
        );
        const totalRevenue = parseFloat(revenueRows[0].total_revenue);
        const totalAcquisition = parseFloat(revenueRows[0].total_acquisition);

        // Fleet ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
        const fleetROI = totalAcquisition > 0
            ? ((totalRevenue - (totalMaintenanceCost + totalFuelCost)) / totalAcquisition * 100).toFixed(2)
            : 0;

        // Utilization Rate = vehicles On Trip / total vehicles
        const [totalVehicles] = await db.query('SELECT COUNT(*) AS total FROM vehicles');
        const [activeVehicles] = await db.query("SELECT COUNT(*) AS active FROM vehicles WHERE status = 'On Trip'");
        const utilizationRate = totalVehicles[0].total > 0
            ? ((activeVehicles[0].active / totalVehicles[0].total) * 100).toFixed(2)
            : 0;

        res.json({
            totalFuelCost,
            totalMaintenanceCost,
            totalRevenue,
            fleetROI: parseFloat(fleetROI),
            utilizationRate: parseFloat(utilizationRate),
            totalVehicles: totalVehicles[0].total,
            activeVehicles: activeVehicles[0].active
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
});

// GET fuel efficiency trend (monthly) for line chart
router.get('/fuel-trend', async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(e.created_at, '%Y-%m') AS month,
        ROUND(SUM(e.distance_km) / NULLIF(SUM(e.fuel_expense / 95), 0), 2) AS km_per_litre,
        SUM(e.distance_km) AS total_distance,
        SUM(e.fuel_expense) AS total_fuel
      FROM expenses e
      WHERE e.distance_km > 0
      GROUP BY DATE_FORMAT(e.created_at, '%Y-%m')
      ORDER BY month ASC
    `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch fuel trend' });
    }
});

// GET top 5 costliest vehicles for bar chart
router.get('/costliest-vehicles', async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT
        v.id, v.plate, v.model,
        COALESCE(m.total_maintenance, 0) AS maintenance_cost,
        COALESCE(e.total_fuel, 0) AS fuel_cost,
        COALESCE(m.total_maintenance, 0) + COALESCE(e.total_fuel, 0) AS total_cost
      FROM vehicles v
      LEFT JOIN (
        SELECT vehicle_id, SUM(cost) AS total_maintenance FROM maintenance_logs GROUP BY vehicle_id
      ) m ON v.id = m.vehicle_id
      LEFT JOIN (
        SELECT vehicle_id, SUM(fuel_expense) AS total_fuel FROM expenses GROUP BY vehicle_id
      ) e ON v.id = e.vehicle_id
      ORDER BY total_cost DESC
      LIMIT 5
    `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch costliest vehicles' });
    }
});

module.exports = router;
