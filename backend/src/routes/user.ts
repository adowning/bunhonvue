import { Hono } from "hono";
// import { db } from "@my-app/db";
// import { users } from "@my-app/db";
// import { eq } from "drizzle-orm";
import { AppEnv } from "../middleware/auth";

const app = new Hono<AppEnv>();

// GET /api/user/me
// Fetches the user profile from *our* local db, not Supabase auth
app.get("/me", async (c) => {
  const authUser = c.get("authUser"); // From auth middleware

  if (!authUser) {
    return c.json({ error: "No authenticated user found" }, 401);
  }

  try {
    // TODO: Add database logic here once workspace resolution is fixed
    // For now, return a mock user for testing
    const mockUser = {
      id: 1,
      authId: authUser.id,
      email: authUser.email!,
      displayName: authUser.user_metadata?.full_name || authUser.email,
      createdAt: new Date()
    };

    return c.json(mockUser);
  } catch (err: any) {
    console.error("Error fetching/creating local user:", err.message);
    return c.json({ error: "Database error", details: err.message }, 500);
  }
});

export const userApi = app;
