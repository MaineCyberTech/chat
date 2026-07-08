const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
const rollbackDir = path.join(__dirname, "..", "supabase", "rollback");

if (!fs.existsSync(migrationsDir)) {
  console.error("Migrations directory not found:", migrationsDir);
  process.exit(1);
}
if (!fs.existsSync(rollbackDir)) {
  console.error("Rollback directory not found:", rollbackDir);
  process.exit(1);
}

const migrations = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
const rollbacks = new Set(fs.readdirSync(rollbackDir).filter((f) => f.endsWith("_down.sql")));

let missing = 0;

for (const migration of migrations) {
  const baseName = path.basename(migration, ".sql");
  const rollbackName = `${baseName}_down.sql`;

  if (!rollbacks.has(rollbackName)) {
    console.error(`MISSING: ${migration} has no matching rollback (expected: ${rollbackName})`);
    missing++;
  }
}

if (missing > 0) {
  console.error(`\n${missing} migration(s) missing rollback scripts.`);
  process.exit(1);
} else {
  console.log(`All ${migrations.length} migrations have matching rollback scripts.`);
}
