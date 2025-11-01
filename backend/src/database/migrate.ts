import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool, closePool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Read the schema SQL file
    const schemaPath = join(__dirname, 'schema.sql');
    const schemaSql = await readFile(schemaPath, 'utf-8');
    
    // Execute the schema
    await pool.query(schemaSql);
    
    console.log('✓ Database schema created successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('✓ Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Migration error:', error);
      process.exit(1);
    });
}

export { runMigrations };
