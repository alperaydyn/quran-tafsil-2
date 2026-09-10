import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  host: process.env.HOST || "0.0.0.0",
  logLevel: process.env.LOG_LEVEL || "info",

  // PostgreSQL Connections
  db: {
    // PgBouncer pool connection URL (used for runtime application queries)
    url: process.env.DATABASE_URL || "postgres://tafsil_user_001:tafsil_user_x23@localhost:6432/tafsil_net_db",
    // Direct connection URL (used for migrations and seeds)
    directUrl: process.env.DATABASE_URL_DIRECT || "postgres://tafsil_user_001:tafsil_user_x23@localhost:5432/tafsil_net_db",
    user: process.env.POSTGRES_USER || "tafsil_user_001",
    password: process.env.POSTGRES_PASSWORD || "tafsil_user_x23",
    database: process.env.POSTGRES_DB || "tafsil_net_db",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
};
