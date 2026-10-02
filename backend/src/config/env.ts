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
    host: process.env.POSTGRES_HOST || "localhost",
    url: process.env.DATABASE_URL || "postgres://tafsil:tafsil_dev_secret@localhost:5432/tafsil_db",
    directUrl: process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL || "postgres://tafsil:tafsil_dev_secret@localhost:5432/tafsil_db",
    user: process.env.POSTGRES_USER || "tafsil",
    password: process.env.POSTGRES_PASSWORD || "tafsil_dev_secret",
    database: process.env.POSTGRES_DB || "tafsil_db",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "dev-only-insecure-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  auth: {
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || "net.tafsil.app",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
    },
  },

  rateLimit: {
    general: parseInt(process.env.RATE_LIMIT_GENERAL || "60", 10),
  },

  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
