const pptxgen = require('pptxgenjs');

let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';

// Slide 1: Title
let slide1 = pres.addSlide();
slide1.background = { color: '06080F' }; // App's dark theme
slide1.addText('FleetFlow', { x: 0, y: 2, w: '100%', h: 1, align: 'center', fontSize: 64, color: 'FFFFFF', bold: true });
slide1.addText('Fleet Management Reimagined', { x: 0, y: 3.2, w: '100%', h: 0.5, align: 'center', fontSize: 28, color: '7C7AFF' });
slide1.addText('Project Overhaul Presentation', { x: 0, y: 4, w: '100%', h: 0.5, align: 'center', fontSize: 18, color: 'A0AEC0' });

// Function to add standard header
const addHeader = (slide, title) => {
    slide.addText(title, { x: 0.5, y: 0.5, w: '90%', h: 0.6, fontSize: 36, color: '1A202C', bold: true, border: { type: 'bottom', pt: 2, color: '7C7AFF' } });
};

// Slide 2: Project Overview
let slide2 = pres.addSlide();
addHeader(slide2, 'Project Overview');
slide2.addText([
    { text: 'A modernized fleet management system featuring a premium Glassprism aesthetic.', options: { bullet: true } },
    { text: 'Built to manage the entire lifecycle: Vehicle Registry, Trip Dispatching, Maintenance, and Expenses.', options: { bullet: true } },
    { text: 'Provides real-time dashboards and analytics for optimal fleet utilization.', options: { bullet: true } },
    { text: 'Robust role-based access control protecting sensitive operations.', options: { bullet: true } }
], { x: 0.5, y: 1.5, w: '90%', h: 3.5, fontSize: 24, color: '4A5568', lineSpacing: 36 });

// Slide 3: Key Features & Overhaul Highlights
let slide3 = pres.addSlide();
addHeader(slide3, 'Key Features & Overhaul Highlights');
slide3.addText([
    { text: 'Glassmorphism Theme:', options: { bold: true, bullet: true } },
    { text: '  Modern UI with frosted glass panels, prismatic accents, and smooth cubic animations.' },
    { text: 'Smart Validations:', options: { bold: true, bullet: true } },
    { text: '  Real-time inline validation of payloads, dates, plate formats, and costs.' },
    { text: 'Interactive Tables:', options: { bold: true, bullet: true } },
    { text: '  Unified sortable columns and dynamic filters across all data grids.' },
    { text: 'Driver Contact Integration:', options: { bold: true, bullet: true } },
    { text: '  Mobile and email tracking seamlessly built into the dispatch workflow and performance views.' }
], { x: 0.5, y: 1.5, w: '90%', h: 3.5, fontSize: 22, color: '4A5568', spaceBefore: 10 });

// Slide 4: Technology Stack
let slide4 = pres.addSlide();
addHeader(slide4, 'Technology Stack');
slide4.addText([
    { text: 'Frontend:', options: { bold: true, bullet: true } },
    { text: '  React, React Router, Vite, Lucide Icons, Recharts' },
    { text: 'Styling:', options: { bold: true, bullet: true } },
    { text: '  Custom Vanilla CSS (Extensive Glassprism Theme System)' },
    { text: 'Backend:', options: { bold: true, bullet: true } },
    { text: '  Node.js, Express.js' },
    { text: 'Database:', options: { bold: true, bullet: true } },
    { text: '  MySQL (Relational Database)' }
], { x: 0.5, y: 1.5, w: '90%', h: 3.5, fontSize: 24, color: '4A5568', spaceBefore: 10 });

// Slide 5: Core Modules Breakdown
let slide5 = pres.addSlide();
addHeader(slide5, 'Core Modules');
slide5.addText([
    { text: 'Dashboard & Analytics: Live KPIs, active trips, and performance charts.', options: { bullet: { code: '2713' } } },
    { text: 'Vehicle Registry: Track fleet capacity, odometers, and repair status.', options: { bullet: { code: '2713' } } },
    { text: 'Trip Dispatcher: Assign trips with live capacity and driver safety validation avoiding overloading.', options: { bullet: { code: '2713' } } },
    { text: 'Maintenance & Expenses: Real-time logging of service costs and fuel expenses linked to trips.', options: { bullet: { code: '2713' } } },
    { text: 'Admin Panel: Secure user management and Super Admin CRUD controls.', options: { bullet: { code: '2713' } } }
], { x: 0.5, y: 1.5, w: '90%', h: 3.5, fontSize: 22, color: '4A5568', lineSpacing: 32 });

// Slide 6: Summary
let slide6 = pres.addSlide();
addHeader(slide6, 'Summary');
slide6.addText('FleetFlow provides a visually stunning, highly functional, and fully validated solution for modern logistics and fleet management. The recent overhaul successfully merged aesthetic excellence with robust data integrity.',
    { x: 0.5, y: 2, w: '90%', h: 2, fontSize: 28, color: '2D3748', align: 'center', italic: true });

pres.writeFile({ fileName: 'd:\\antigravity\\FleetFlow_Presentation.pptx' })
    .then(fileName => {
        console.log(`Successfully created file: ${fileName}`);
    })
    .catch(err => {
        console.error(err);
    });
