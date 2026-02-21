// Run once to update the users table with all 5 roles
const db = require('./db');

async function migrate() {
    try {
        console.log('🔄 Running migration: Adding all 5 roles...');

        // ALTER the ENUM to include all roles
        await db.query(`
      ALTER TABLE users MODIFY COLUMN role
      ENUM('Super Admin', 'Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst')
      NOT NULL DEFAULT 'Dispatcher'
    `);
        console.log('✅ Role ENUM updated');

        // Insert new users (IGNORE if already exists)
        const newUsers = [
            ['admin', 'placeholder', 'Super Admin'],
            ['vikram_safety', 'placeholder', 'Safety Officer'],
            ['anita_finance', 'placeholder', 'Financial Analyst'],
        ];

        for (const [username, hash, role] of newUsers) {
            const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
            if (existing.length === 0) {
                await db.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, role]);
                console.log(`✅ Added user: ${username} (${role})`);
            } else {
                console.log(`⏭️ User already exists: ${username}`);
            }
        }

        console.log('\n🎉 Migration complete! All 5 roles are now available.');
        console.log('Users: admin (Super Admin), ramesh_mgr (Manager), priya_mgr (Manager),');
        console.log('       suresh_disp (Dispatcher), neha_disp (Dispatcher),');
        console.log('       vikram_safety (Safety Officer), anita_finance (Financial Analyst)');
        console.log('Password for all: password123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
