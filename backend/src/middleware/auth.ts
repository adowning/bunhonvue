import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";
// import "dotenv/config";
// import { db } from "@my-app/db";
// import { users } from "@my-app/db"; // <-- Changed from @my-app/db/schema
// import { eq } from "drizzle-orm";
import type { SelectUser } from "@my-app/shared";

// Initialize Supabase admin client (uses service key)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase URL or Service Key is not defined in .env");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// This is the new Environment definition for our app
export type AppEnv = {
  Variables: {
    dbUser: SelectUser; // This is our local DB user
    authUser: any; // This is the Supabase Auth User object
  };
};

export const authMiddleware = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized: No token provided" }, 401);
    }

    const token = authHeader.split(" ")[1];

    // 1. Verify the token with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      return c.json({ error: "Unauthorized: Invalid token" }, 401);
    }

    const authUser = data.user;
    c.set("authUser", authUser); // Set the Supabase user

    // 2. Find or create our local DB user
    try {
      // TODO: Add database logic here once workspace resolution is fixed
      // For now, just set a mock user for testing
      const dbUser: SelectUser = {
        id: 1,
        authId: authUser.id,
        email: authUser.email!,
        displayName: authUser.user_metadata?.full_name || authUser.email,
        createdAt: new Date()
      };

      // Set our local DB user in the context
      c.set("dbUser", dbUser);

      await next();
    } catch (err: any) {
      console.error("Error fetching/creating local user:", err.message);
      return c.json({ error: "Database error", details: err.message }, 500);
    }
  });
