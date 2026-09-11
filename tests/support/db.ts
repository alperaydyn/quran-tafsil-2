import { Client } from "pg";

export function getTestClient(): Client {
  const connectionString = process.env.DATABASE_URL_DIRECT;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL_DIRECT is not set. Copy tests/.env.example to tests/.env and point it at a migrated+seeded database."
    );
  }
  return new Client({ connectionString });
}
