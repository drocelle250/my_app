/**
 * SmartStock U.D — Database Setup Script
 * 
 * Runs setup.sql against your MySQL database.
 * 
 * Usage:
 *   cd my_app/Backend
 *   node database/setupDB.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs    = require("fs");
const path  = require("path");

const SQL_FILE = path.join(__dirname, "setup.sql");

async function run() {
  console.log("\n=== SmartStock U.D — Database Setup ===\n");

  const dbName = process.env.DB_NAME || "inventory_db";

  // Step 1: Connect WITHOUT database to create it
  let conn;
  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST || "localhost",
      port:     Number(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
    });
    console.log("Connected to MySQL.\n");
  } catch (err) {
    console.error("ERROR: Cannot connect to MySQL.");
    console.error("Make sure XAMPP MySQL is running and check your .env file.");
    console.error("Details:", err.message);
    process.exit(1);
  }

  // Step 2: Create database if not exists
  await conn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`  OK  Database '${dbName}' ready.\n`);
  await conn.end();

  // Step 3: Reconnect WITH the database selected
  conn = await mysql.createConnection({
    host:     process.env.DB_HOST || "localhost",
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: dbName,
  });

  // Step 4: Read SQL and extract statements properly
  const sql = fs.readFileSync(SQL_FILE, "utf8");

  // Remove single-line comments, then split on semicolons
  const cleanSql = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = cleanSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false;
      if (/^USE\s/i.test(s)) return false;
      if (/^CREATE DATABASE\b/i.test(s)) return false;
      if (/^SELECT\s/i.test(s)) return false; // skip VERIFY selects
      return true;
    });

  let success = 0, skipped = 0, failed = 0;

  for (const stmt of statements) {
    const preview = stmt.substring(0, 70).replace(/\n/g, " ");
    try {
      await conn.execute(stmt);
      console.log(`  OK  ${preview}...`);
      success++;
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        console.log(`  SKIP (duplicate): ${preview}...`);
        skipped++;
      } else {
        console.error(`  FAIL: ${preview}...`);
        console.error(`        ${err.message}`);
        failed++;
      }
    }
  }

  await conn.end();

  console.log(`\n=== Done ===`);
  console.log(`  Executed: ${success} statements`);
  console.log(`  Skipped:  ${skipped} (duplicates)`);
  if (failed > 0) console.log(`  Failed:   ${failed} (see errors above)`);
  console.log(`\nDefault login credentials:`);
  console.log(`  Admin:   admin@inventory.com   / password123`);
  console.log(`  Manager: manager@inventory.com / password123`);
  console.log(`  Staff:   staff@inventory.com   / password123`);
  console.log(`\nNow start the backend: npm run dev\n`);
}

run().catch((err) => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});
