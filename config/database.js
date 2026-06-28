const { Sequelize } = require("sequelize");

// ── Validate required env vars ──────────────────────────────────
const REQUIRED_ENV = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(
    `Missing required database environment variables: ${missing.join(", ")}`
  );
}

// ── SSL config for AWS RDS ───────────────────────────────────────
const sslConfig =
  process.env.DB_SSL !== "false"
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {};

// ── Sequelize Instance ───────────────────────────────────────────
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306", 10),
    dialect: "mysql",
    dialectOptions: {
      ...sslConfig,
      connectTimeout: 10000, // 10s to establish TCP+auth before failing
    },
    logging:
      process.env.NODE_ENV === "development"
        ? (msg) => console.log("[SQL]", msg)
        : false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
      evict: 5000, // check for dead connections every 5s, evict stale ones
    },
    retry: {
      max: 3,            // retry failed queries up to 3 times
      match: [
        /ETIMEDOUT/,
        /ENOTFOUND/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /PROTOCOL_CONNECTION_LOST/,
        /ER_CON_COUNT_ERROR/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
      ],
      backoffBase: 500,   // wait 500ms before first retry
      backoffExponent: 1.5,
    },
    define: {
      underscored: true,
      timestamps: true,
      freezeTableName: false,
    },
  }
);

module.exports = { sequelize, Sequelize };
