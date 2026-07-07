import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load .env from the monorepo root (two levels up from packages/database/)
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });


const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set.');
  console.error('   Set it in your .env file as:');
  console.error('   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.mltfomdzfnpbamplzojn.supabase.co:5432/postgres');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query<{ filename: string }>(
      'SELECT filename FROM _migrations ORDER BY filename ASC'
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    // Load & sort migration files
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let applied_count = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`⏭  Skipping (already applied): ${file}`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`🔄 Applying migration: ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Applied: ${file}`);
        applied_count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed to apply ${file}:`, err);
        throw err;
      }
    }

    if (applied_count === 0) {
      console.log('✨ No new migrations to apply. Database is up to date.');
    } else {
      console.log(`\n🎉 Successfully applied ${applied_count} migration(s).`);
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

run().catch((err) => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
