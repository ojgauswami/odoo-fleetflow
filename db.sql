-- FleetFlowAnti Database Schema
-- MySQL Relational Database

CREATE DATABASE IF NOT EXISTS fleetflowanti;
USE fleetflowanti;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Manager', 'Dispatcher') NOT NULL DEFAULT 'Dispatcher',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- VEHICLES TABLE
-- ============================================================
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    type ENUM('Trailer Truck', 'Mini', 'Tanker', 'Flatbed', 'Refrigerated', 'Container') NOT NULL,
    max_payload_kg DECIMAL(10,2) NOT NULL,
    odometer INT NOT NULL DEFAULT 0,
    status ENUM('Idle', 'On Trip', 'In Shop') NOT NULL DEFAULT 'Idle',
    acquisition_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    revenue_generated DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DRIVERS TABLE
-- ============================================================
CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(30) NOT NULL UNIQUE,
    license_expiry_date DATE NOT NULL,
    completion_rate_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    safety_score_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    complaints_count INT NOT NULL DEFAULT 0,
    status ENUM('On Duty', 'Suspended') NOT NULL DEFAULT 'On Duty',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TRIPS TABLE
-- ============================================================
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    cargo_weight_kg DECIMAL(10,2) NOT NULL,
    estimated_fuel_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('Draft', 'Dispatched', 'Completed') NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- ============================================================
-- MAINTENANCE LOGS TABLE
-- ============================================================
CREATE TABLE maintenance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    issue_service VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- ============================================================
-- EXPENSES TABLE
-- ============================================================
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    distance_km DECIMAL(10,2) NOT NULL DEFAULT 0,
    fuel_expense DECIMAL(10,2) NOT NULL DEFAULT 0,
    misc_expense DECIMAL(10,2) NOT NULL DEFAULT 0,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- ============================================================
-- MOCK DATA - Indian Context
-- ============================================================

-- Users (passwords are bcrypt hash of 'password123')
INSERT INTO users (username, password_hash, role) VALUES
('ramesh_mgr', '$2b$10$XvJ5YK0qX5K5K5K5K5K5KuO5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Manager'),
('priya_mgr', '$2b$10$XvJ5YK0qX5K5K5K5K5K5KuO5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Manager'),
('suresh_disp', '$2b$10$XvJ5YK0qX5K5K5K5K5K5KuO5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Dispatcher'),
('neha_disp', '$2b$10$XvJ5YK0qX5K5K5K5K5K5KuO5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 'Dispatcher');

-- Vehicles (Indian plates, Indian truck models)
INSERT INTO vehicles (plate, model, type, max_payload_kg, odometer, status, acquisition_cost, revenue_generated) VALUES
('GJ-05-BX-1234', 'Tata Prima 4928.S', 'Trailer Truck', 25000.00, 145230, 'On Trip', 3200000.00, 4800000.00),
('MH-12-AB-5678', 'Ashok Leyland 4220', 'Container', 22000.00, 98400, 'Idle', 2800000.00, 3500000.00),
('RJ-14-CD-9012', 'BharatBenz 1617R', 'Flatbed', 16000.00, 67500, 'Idle', 1800000.00, 2100000.00),
('GJ-01-EF-3456', 'Tata LPT 3521', 'Tanker', 20000.00, 112000, 'In Shop', 2500000.00, 3800000.00),
('MH-04-GH-7890', 'Eicher Pro 3019', 'Refrigerated', 12000.00, 54000, 'Idle', 2200000.00, 2900000.00),
('DL-01-JK-2345', 'Tata Ace Gold', 'Mini', 750.00, 32000, 'On Trip', 450000.00, 680000.00),
('KA-01-LM-6789', 'Mahindra Blazo X 35', 'Trailer Truck', 28000.00, 178900, 'Idle', 3500000.00, 5200000.00),
('TN-09-NP-1111', 'Ashok Leyland Boss 1920', 'Flatbed', 18000.00, 89000, 'Idle', 2100000.00, 2700000.00),
('GJ-03-QR-2222', 'Tata Signa 4825.TK', 'Trailer Truck', 30000.00, 201000, 'Idle', 3800000.00, 5900000.00),
('UP-32-ST-3333', 'BharatBenz 1015R', 'Mini', 5000.00, 41000, 'Idle', 900000.00, 1200000.00),
('MP-09-UV-4444', 'Eicher Pro 6049', 'Container', 24000.00, 134000, 'On Trip', 3000000.00, 4100000.00),
('RJ-27-WX-5555', 'Tata Ultra T.16', 'Refrigerated', 10000.00, 62000, 'Idle', 1600000.00, 1900000.00);

-- Drivers (Indian names)
INSERT INTO drivers (name, license_number, license_expiry_date, completion_rate_percent, safety_score_percent, complaints_count, status) VALUES
('Amit Bhai', 'GJ-2019-0045678', '2027-06-15', 96.50, 92.00, 1, 'On Duty'),
('Rajesh Kumar', 'MH-2020-0078912', '2026-11-30', 98.00, 95.50, 0, 'On Duty'),
('Vijay Singh', 'RJ-2018-0034567', '2025-03-20', 88.00, 78.00, 4, 'Suspended'),
('Sunil Yadav', 'DL-2021-0012345', '2027-09-10', 94.00, 90.00, 2, 'On Duty'),
('Manoj Patel', 'GJ-2019-0098765', '2027-01-25', 97.50, 94.00, 0, 'On Duty'),
('Ravi Sharma', 'KA-2020-0056789', '2026-08-18', 91.00, 88.50, 3, 'On Duty'),
('Deepak Chauhan', 'TN-2021-0043210', '2027-04-12', 99.00, 97.00, 0, 'On Duty'),
('Arjun Mehra', 'UP-2019-0087654', '2026-12-05', 93.50, 91.00, 1, 'On Duty'),
('Sanjay Gupta', 'MP-2020-0065432', '2027-07-22', 95.00, 89.00, 2, 'On Duty'),
('Kishore Nair', 'MH-2022-0021098', '2028-02-14', 100.00, 98.50, 0, 'On Duty');

-- Trips (Indian city routes)
INSERT INTO trips (vehicle_id, driver_id, origin, destination, cargo_weight_kg, estimated_fuel_cost, status, created_at, completed_at) VALUES
(1, 1, 'Surat', 'Ahmedabad', 18000.00, 12500.00, 'Dispatched', '2026-02-18 08:00:00', NULL),
(6, 4, 'Delhi', 'Jaipur', 600.00, 3500.00, 'Dispatched', '2026-02-19 06:30:00', NULL),
(11, 9, 'Indore', 'Mumbai', 20000.00, 18000.00, 'Dispatched', '2026-02-20 07:00:00', NULL),
(2, 2, 'Pune', 'Nagpur', 15000.00, 16000.00, 'Completed', '2026-02-10 09:00:00', '2026-02-12 18:00:00'),
(3, 5, 'Jaipur', 'Udaipur', 12000.00, 8500.00, 'Completed', '2026-02-08 10:00:00', '2026-02-09 16:00:00'),
(7, 6, 'Bangalore', 'Chennai', 22000.00, 14000.00, 'Completed', '2026-02-05 05:00:00', '2026-02-06 20:00:00'),
(5, 7, 'Mumbai', 'Goa', 8000.00, 9500.00, 'Completed', '2026-02-01 07:30:00', '2026-02-02 14:00:00'),
(8, 8, 'Chennai', 'Hyderabad', 14000.00, 13000.00, 'Completed', '2026-01-28 06:00:00', '2026-01-30 11:00:00'),
(9, 1, 'Ahmedabad', 'Rajkot', 25000.00, 7500.00, 'Completed', '2026-01-25 08:00:00', '2026-01-26 12:00:00'),
(10, 2, 'Lucknow', 'Varanasi', 3500.00, 4000.00, 'Completed', '2026-01-20 09:00:00', '2026-01-21 15:00:00'),
(4, 5, 'Ahmedabad', 'Vadodara', 15000.00, 5000.00, 'Completed', '2026-01-15 10:00:00', '2026-01-15 18:00:00'),
(12, 10, 'Kochi', 'Coimbatore', 7500.00, 6000.00, 'Completed', '2026-01-10 07:00:00', '2026-01-11 13:00:00'),
(2, 7, 'Mumbai', 'Surat', 18000.00, 9000.00, 'Draft', '2026-02-21 06:00:00', NULL),
(7, 8, 'Mangalore', 'Hubli', 20000.00, 7000.00, 'Draft', '2026-02-21 07:00:00', NULL);

-- Maintenance Logs
INSERT INTO maintenance_logs (vehicle_id, issue_service, date, cost) VALUES
(4, 'Engine overhaul - turbocharger replacement', '2026-02-17', 85000.00),
(1, 'Brake pad replacement and disc resurfacing', '2026-01-20', 12000.00),
(2, 'Clutch plate replacement', '2026-01-05', 18000.00),
(7, 'Full body servicing and oil change', '2025-12-15', 8500.00),
(3, 'Tyre replacement (4 nos) - Apollo Amar', '2026-02-01', 48000.00),
(9, 'Radiator repair and coolant flush', '2025-11-20', 15000.00),
(6, 'Battery replacement - Exide 65Ah', '2026-01-10', 6500.00),
(11, 'Fuel injector cleaning and calibration', '2026-02-05', 22000.00),
(5, 'AC compressor repair', '2026-01-25', 14000.00),
(8, 'Suspension leaf spring replacement', '2025-12-28', 25000.00),
(10, 'Alternator repair', '2026-02-10', 9500.00),
(12, 'Refrigeration unit maintenance', '2026-02-12', 35000.00);

-- Expenses
INSERT INTO expenses (trip_id, vehicle_id, driver_id, distance_km, fuel_expense, misc_expense, status) VALUES
(4,  2,  2,  720.00, 14500.00, 2500.00, 'Approved'),
(5,  3,  5,  395.00, 7800.00,  1200.00, 'Approved'),
(6,  7,  6,  350.00, 12500.00, 3000.00, 'Approved'),
(7,  5,  7,  590.00, 8800.00,  1800.00, 'Approved'),
(8,  8,  8,  630.00, 12000.00, 2200.00, 'Approved'),
(9,  9,  1,  220.00, 6500.00,  800.00,  'Approved'),
(10, 10, 2,  320.00, 3800.00,  600.00,  'Approved'),
(11, 4,  5,  110.00, 4200.00,  500.00,  'Approved'),
(12, 12, 10, 200.00, 5500.00,  900.00,  'Approved'),
(1,  1,  1,  0.00,   0.00,     0.00,    'Pending'),
(2,  6,  4,  0.00,   0.00,     0.00,    'Pending'),
(3,  11, 9,  0.00,   0.00,     0.00,    'Pending');
