import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { AppEnv, authMiddleware } from "./middleware/auth";
import { userApi } from "./routes/user";
import "./instrument";

// import "dotenv/config";
import { User } from "@supabase/supabase-js"; // Or whatever type your authUser is
// --- NOTE ON AppType ---
// To avoid a circular dependency (frontend -> shared -> backend -> shared),
// we export AppType directly from the 'backend' package.
// The frontend will import this type for its hono/client.
// 'shared' will only contain platform-agnostic types like Zod schemas.
import * as Sentry from "@sentry/node";

try {
  foo();
} catch (e) {
  Sentry.captureException(e);
}
// Pass this to Hono
const app = new Hono<AppEnv>(); // <-- Use AppEnv
// --- Middleware ---
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "/api/*",
  cors({
    origin: "*", // Adjust for production
  })
);

// --- Public Routes ---
app.get("/", (c) => {
  return c.json({
    message: "Hello! This is the Bun/Hono/Drizzle/Supabase API.",
  });
});

// --- API Routes ---
// All routes under /api are protected by auth middleware
const api = app.basePath("/api");
api.use("*", authMiddleware());
api.route("/user", userApi);

// --- Server ---
const port = parseInt(process.env.PORT || "3000");
console.log(`Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};

// --- Export AppType for hono/client ---
export type AppType = typeof api;
