import bcrypt from 'bcrypt';
import { pool, closePool } from '../config/database.js';

const SALT_ROUNDS = 10;

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  try {
    // Hash the default password
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);
    
    // Insert manager account
    await pool.query(
      `INSERT INTO users (name, email, employee_code, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['John Manager', 'manager@company.com', '1000001', passwordHash, 'manager']
    );
    console.log('✓ Manager account created');
    
    // Insert employee accounts
    const employees = [
      ['Alice Smith', 'alice.smith@company.com', '2000001'],
      ['Bob Johnson', 'bob.johnson@company.com', '2000002'],
      ['Carol Williams', 'carol.williams@company.com', '2000003'],
      ['David Brown', 'david.brown@company.com', '2000004'],
    ];
    
    for (const [name, email, employeeCode] of employees) {
      await pool.query(
        `INSERT INTO users (name, email, employee_code, password_hash, role) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [name, email, employeeCode, passwordHash, 'employee']
      );
    }
    console.log('✓ Employee accounts created');
    
    // Get user IDs for creating vacation requests
    const { rows: users } = await pool.query(
      'SELECT id, email FROM users WHERE role = $1 ORDER BY id',
      ['employee']
    );
    
    if (users.length >= 4) {
      // Get manager ID for approval tracking
      const { rows: managers } = await pool.query(
        'SELECT id FROM users WHERE role = $1 LIMIT 1',
        ['manager']
      );
      const managerId = managers[0]?.id;

      // Insert sample vacation requests with manager notes for processed ones
      const requests = [
        [users[0].id, '2024-12-20', '2024-12-27', 'Christmas holiday', 'approved', 'Enjoy your holidays!', managerId],
        [users[0].id, '2025-01-15', '2025-01-19', 'Personal time off', 'pending', null, null],
        [users[1].id, '2024-11-10', '2024-11-15', 'Family vacation', 'approved', 'Have a great trip!', managerId],
        [users[1].id, '2025-02-01', '2025-02-07', 'Winter break', 'pending', null, null],
        [users[2].id, '2024-12-01', '2024-12-05', 'Medical appointment', 'rejected', 'Please reschedule - we need full coverage this week.', managerId],
        [users[2].id, '2025-03-10', '2025-03-14', 'Spring vacation', 'pending', null, null],
        [users[3].id, '2025-01-20', '2025-01-25', 'Conference attendance', 'approved', 'Approved for professional development.', managerId],
      ];
      
      for (const [userId, startDate, endDate, reason, status, managerNotes, approvedBy] of requests) {
        await pool.query(
          `INSERT INTO vacation_requests (user_id, start_date, end_date, reason, status, manager_notes, approved_by, approved_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, ${status !== 'pending' ? 'CURRENT_TIMESTAMP' : 'NULL'})`,
          [userId, startDate, endDate, reason, status, managerNotes, approvedBy]
        );
      }
      console.log('✓ Sample vacation requests created');

      // Update vacation_days_used for employees with approved requests
      await pool.query(`
        UPDATE users u
        SET vacation_days_used = COALESCE((
          SELECT SUM(
            EXTRACT(DAY FROM (vr.end_date - vr.start_date)) + 1
          )
          FROM vacation_requests vr
          WHERE vr.user_id = u.id 
          AND vr.status = 'approved'
        ), 0)
        WHERE u.role = 'employee'
      `);
      console.log('✓ Vacation balances calculated');
    }
    
    console.log('\n📋 Seed Summary:');
    console.log('   Default password for all users: password123');
    console.log('   Manager: manager@company.com');
    console.log('   Employees: alice.smith@company.com, bob.johnson@company.com, etc.');
    
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✓ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Seeding error:', error);
      process.exit(1);
    });
}

export { seedDatabase };
