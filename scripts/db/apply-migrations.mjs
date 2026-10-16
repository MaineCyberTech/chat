#!/usr/bin/env node
/**
 * Applies the self-hosted database schema to a plain PostgreSQL instance.
 *
 * Order is significant:
 *   1. supabase/bootstrap/*.sql   - roles + the `auth` schema shim. The
 *      application migrations create FKs into `auth.users` and the RLS policies
 *      call `auth.uid()`, so this MUST come first. Idempotent by design, so it
 *      is re-applied every run.
 *   2. supabase/migrations/*.sql  - the application schema, in the order given
 *      by supabase/migrations/migrations.list (the same manifest CI enforces).
 *      Applied migrations are recorded in `public.schema_migrations` and skipped
 *      on later runs, so this is safe to run on every deploy.
 *   3. supabase/seeds/*.sql       - demo data (--seed).
 *
 * Uses `psql` rather than a Node driver so it behaves identically to the CI
 * migration/rollback jobs and needs no extra dependency.
 *
 * Usage:
 *   DATABASE_URL=postgres://user:pass@host:5432/chat node scripts/db/apply-migrations.mjs
 *   DATABASE_URL=... node scripts/db/apply-migrations.mjs --seed
 *   DATABASE_URL=... node scripts/db/apply-migrations.mjs --status
 *   DATABASE_URL=... node scripts/db/apply-migrations.mjs --baseline     # mark existing schema
 *   DATABASE_URL=... node scripts/db/apply-migrations.mjs --force        # re-apply all
 *   DATABASE_URL=... node scripts/db/apply-migrations.mjs --dry-run
 *
 * Without psql on the host, apply through a running container instead
 * (DATABASE_URL is then only used for its user and database name):
 *   DATABASE_URL=postgres://postgres:postgres@localhost:5432/chat \
 *     node scripts/db/apply-migrations.mjs --docker chat-postgres-dev
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SUPABASE_DIR = join(ROOT, "supabase");
const BOOTSTRAP_DIR = join(SUPABASE_DIR, "bootstrap");
const MIGRATIONS_DIR = join(SUPABASE_DIR, "migrations");
const SEEDS_DIR = join(SUPABASE_DIR, "seeds");
const MANIFEST = join(MIGRATIONS_DIR, "migrations.list");

const TRACKING_TABLE = "public.schema_migrations";

const argv = process.argv.slice(2);
const args = new Set(argv);
const DRY_RUN = args.has("--dry-run");
const WITH_SEEDS = args.has("--seed");
const FORCE = args.has("--force");
const STATUS_ONLY = args.has("--status");
// Records every migration in the manifest as applied without running it. For a
// database that was migrated before this tracking table existed.
const BASELINE = args.has("--baseline");

// `--docker <container>` applies each file by piping it to psql *inside* a
// running container, so operators do not need psql on the host.
const dockerIndex = argv.indexOf("--docker");
const DOCKER_CONTAINER = dockerIndex === -1 ? null : argv[dockerIndex + 1];
if (dockerIndex !== -1 && !DOCKER_CONTAINER) {
  console.error("error: --docker requires a container name, e.g. --docker chat-postgres-dev");
  process.exit(1);
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function containerTarget(databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    user: decodeURIComponent(url.username || "postgres"),
    database: url.pathname.replace(/^\//, "") || "postgres",
  };
}

/** Runs one SQL statement and returns stdout (trimmed). */
function psqlQuery(databaseUrl, sql) {
  if (DOCKER_CONTAINER) {
    const { user, database } = containerTarget(databaseUrl);
    return execFileSync(
      "docker",
      [
        "exec",
        "-i",
        DOCKER_CONTAINER,
        "psql",
        "-U",
        user,
        "-d",
        database,
        "--no-psqlrc",
        "-t",
        "-A",
        "-c",
        sql,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    )
      .toString()
      .trim();
  }
  return execFileSync("psql", [databaseUrl, "--no-psqlrc", "-t", "-A", "-c", sql], {
    stdio: ["ignore", "pipe", "pipe"],
  })
    .toString()
    .trim();
}

function psqlFiles(databaseUrl, files) {
  for (const file of files) {
    const label = file.replace(`${ROOT}/`, "").replace(`${ROOT}\\`, "");
    if (DRY_RUN) {
      console.log(`  [dry-run] ${label}`);
      continue;
    }
    process.stdout.write(`  applying ${label} ... `);

    const commonArgs = ["--no-psqlrc", "--quiet", "--set", "ON_ERROR_STOP=1"];

    let command;
    let commandArgs;
    let options;
    if (DOCKER_CONTAINER) {
      // Inside the container the file is not on disk, so stream it over stdin.
      const { user, database } = containerTarget(databaseUrl);
      command = "docker";
      commandArgs = [
        "exec",
        "-i",
        DOCKER_CONTAINER,
        "psql",
        "-U",
        user,
        "-d",
        database,
        ...commonArgs,
        "--file",
        "-",
      ];
      options = { stdio: ["pipe", "pipe", "pipe"], input: readFileSync(file) };
    } else {
      command = "psql";
      commandArgs = [databaseUrl, ...commonArgs, "--file", file];
      options = { stdio: ["ignore", "pipe", "pipe"] };
    }

    try {
      execFileSync(command, commandArgs, options);
      console.log("ok");
    } catch (err) {
      console.log("FAILED");
      const stderr = err.stderr ? err.stderr.toString() : "";
      const stdout = err.stdout ? err.stdout.toString() : "";
      if (stdout.trim()) console.error(stdout.trim());
      if (stderr.trim()) console.error(stderr.trim());
      fail(`migration failed: ${label}`);
    }
  }
}

function listSql(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(dir, f));
}

function orderedMigrations() {
  if (!existsSync(MANIFEST)) {
    console.warn("warning: migrations.list not found; falling back to filename order");
    return listSql(MIGRATIONS_DIR);
  }

  const names = readFileSync(MANIFEST, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const files = [];
  const missing = [];
  for (const name of names) {
    const file = join(MIGRATIONS_DIR, name.endsWith(".sql") ? name : `${name}.sql`);
    if (!existsSync(file)) missing.push(name);
    else files.push(file);
  }
  if (missing.length > 0) {
    fail(
      `migrations.list references ${missing.length} file(s) that do not exist:\n  ${missing.join("\n  ")}`,
    );
  }

  const onDisk = listSql(MIGRATIONS_DIR).map((f) => f.split(/[\\/]/).pop());
  const unlisted = onDisk.filter(
    (f) => !names.includes(f) && !names.includes(f.replace(/\.sql$/, "")),
  );
  if (unlisted.length > 0) {
    fail(`found migration(s) on disk that are not in migrations.list:\n  ${unlisted.join("\n  ")}`);
  }

  return files;
}

function ensureTrackingTable(databaseUrl) {
  psqlQuery(
    databaseUrl,
    `create table if not exists ${TRACKING_TABLE} (
       version text primary key,
       applied_at timestamptz not null default now()
     );`,
  );
}

function appliedVersions(databaseUrl) {
  const out = psqlQuery(databaseUrl, `select version from ${TRACKING_TABLE} order by version;`);
  return new Set(out ? out.split(/\r?\n/).filter(Boolean) : []);
}

function recordApplied(databaseUrl, version) {
  psqlQuery(
    databaseUrl,
    `insert into ${TRACKING_TABLE} (version) values ('${version.replace(/'/g, "''")}')
     on conflict (version) do nothing;`,
  );
}

function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    fail("DATABASE_URL is required, e.g.\n" + "  postgres://postgres:postgres@localhost:5432/chat");
  }

  const bootstrap = listSql(BOOTSTRAP_DIR);
  const allMigrations = orderedMigrations();
  const seeds = WITH_SEEDS ? listSql(SEEDS_DIR) : [];

  if (STATUS_ONLY) {
    ensureTrackingTable(databaseUrl);
    const applied = appliedVersions(databaseUrl);
    console.log(`Applied: ${applied.size} / ${allMigrations.length}`);
    const pending = allMigrations.filter((f) => !applied.has(f.split(/[\\/]/).pop()));
    if (pending.length === 0) {
      console.log("No pending migrations.");
    } else {
      console.log("Pending:");
      pending.forEach((f) => console.log(`  ${f.split(/[\\/]/).pop()}`));
    }
    return;
  }

  if (BASELINE) {
    ensureTrackingTable(databaseUrl);
    const already = appliedVersions(databaseUrl);
    let recorded = 0;
    for (const file of allMigrations) {
      const version = file.split(/[\\/]/).pop();
      if (!already.has(version)) {
        recordApplied(databaseUrl, version);
        recorded++;
      }
    }
    console.log(
      `Baselined ${recorded} migration(s); tracking now holds ${already.size + recorded}.`,
    );
    return;
  }

  console.log(`Applying bootstrap (${bootstrap.length} file(s), idempotent)`);
  if (!DRY_RUN) ensureTrackingTable(databaseUrl);
  psqlFiles(databaseUrl, bootstrap);

  const applied = DRY_RUN ? new Set() : appliedVersions(databaseUrl);
  const pending = FORCE
    ? allMigrations
    : allMigrations.filter((f) => !applied.has(f.split(/[\\/]/).pop()));

  console.log(
    `Migrations: ${allMigrations.length} total, ${applied.size} already applied, ` +
      `${pending.length} to apply${FORCE ? " (--force)" : ""}`,
  );
  psqlFiles(databaseUrl, pending);

  if (!DRY_RUN) {
    for (const file of pending) {
      recordApplied(databaseUrl, file.split(/[\\/]/).pop());
    }
  }

  if (WITH_SEEDS) {
    console.log(`Applying seeds (${seeds.length} file(s))`);
    // Seeds are fixtures, not schema: they are re-applied on request rather than
    // tracked. Each file is written to be re-runnable, and they must be applied
    // in order because the users seed cascades into dependent tables.
    psqlFiles(databaseUrl, seeds);
  } else {
    console.log("Skipping seeds (pass --seed to load demo data)");
  }

  // PostgREST caches the schema, so tables created here are invisible to the
  // API until it reloads. Emitting this at the END of the run (after migrations
  // and seeds) is what actually refreshes the cache — the same statement inside
  // a bootstrap file fires before the application tables exist.
  if (!DRY_RUN) {
    try {
      psqlQuery(databaseUrl, "notify pgrst, 'reload schema';");
    } catch {
      // Harmless when PostgREST is not running.
    }
  }

  console.log(DRY_RUN ? "\nDry run complete." : "\nDone.");
}

main();
