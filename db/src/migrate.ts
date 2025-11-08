import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";

console.log("Running migrations...");

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    await migrate(db, { migrationsFolder: "migrations" });
    console.log("Migrations applied successfully!");
  } catch (err) {
    console.error("Error applying migrations:", err);
  } finally {
    await migrationClient.end();
    process.exit(0);
  }
};

runMigrate();
