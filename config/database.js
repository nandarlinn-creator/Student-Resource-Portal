const { Sequelize } = require("sequelize");

// ─── Validate required env vars ────────────────────────────────
const REQUIRED_ENV = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(
    `Missing required database environment variables: ${missing.join(", ")}`
  );
}

// ─── Build SSL config for AWS RDS ──────────────────────────────
// RDS enforces SSL by default. Set DB_SSL=false only for local dev.
const sslConfig =
  process.env.DB_SSL !== "false"
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Set true + provide CA cert for strict prod validation
        },
      }
    : {};

// ─── Sequelize Instance ────────────────────────────────────────
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306", 10),
    dialect: "mysql",
    dialectOptions: sslConfig,
    logging:
      process.env.NODE_ENV === "development"
        ? (msg) => console.log("[SQL]", msg)
        : false,
    pool: {
      max: 10,        // Max connections in pool
      min: 2,         // Keep at least 2 alive
      acquire: 30000, // Max ms to wait for a connection
      idle: 10000,    // Release connection after 10s idle
    },
    define: {
      underscored: true,       // snake_case column names
      timestamps: true,        // created_at, updated_at auto-managed
      freezeTableName: false,  // Sequelize pluralises table names automatically
    },
  }
);

module.exports = { sequelize, Sequelize };
