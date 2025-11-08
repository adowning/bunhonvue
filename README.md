# Bun + Hono + Vue + Drizzle + Supabase Monorepo

This monorepo is a full-stack application setup using Bun workspaces.

## Packages

* `packages/db`: Contains the Drizzle ORM schema, client, and migration scripts.
* `packages/shared`: Contains shared code, primarily Zod schemas generated from the Drizzle schema via `drizzle-zod`.
* `packages/backend`: A Hono API server running on Bun. It handles auth via Supabase and serves a protected API.
* `packages/frontend`: A Vue 3 + Pinia + Vite frontend that consumes the Hono API using `hono/client`.

## Project Structure Rationale

To avoid circular dependencies, the frontend imports the Hono `AppType` directly from the `backend` package.

The `shared` package is reserved for code that is truly platform-agnostic and can be shared by both frontend and backend without creating import loops (e.g., Zod validation schemas).

**Dependency Graph:**
* `frontend` -> `backend` (for `AppType`)
* `frontend` -> `shared` (for Zod schemas)
* `backend` -> `shared` (for Zod schemas)
* `backend` -> `db` (for Drizzle client)
* `shared` -> `db` (for Drizzle schema types)

## How to Run

1.  **Install Dependencies:**
    ```bash
    bun install
    ```

2.  **Setup Supabase:**
    * Create a new Supabase project.
    * Enable Email/Password authentication.
    * Go to **Project Settings > Database** and get your **Connection string** (URI).

3.  **Environment Variables:**
    * Copy `packages/backend/.env.example` to `packages/backend/.env`.
    * Fill in `DATABASE_URL` with your Supabase connection string.
    * Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from your Supabase **Project Settings > API**.
    * Copy `packages/frontend/.env.example` to `packages/frontend/.env`.
    * Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the public anon key).
    * Set `VITE_API_URL` (default is `http://localhost:3000`).

4.  **Run Database Migrations:**
    * `cd packages/db`
    * `bun db:generate` (This generates the SQL for your schema)
    * `bun db:migrate` (This applies the migrations to your Supabase DB)
    * `cd ../..` (Return to root)

5.  **Run the Application:**
    * In one terminal, run the backend:
        ```bash
        bun --cwd packages/backend dev
        ```
    * In another terminal, run the frontend:
        ```bash
        bun --cwd packages/frontend dev
        ```

6.  **Open the App:**
    * Open your browser to the URL provided by the Vite dev server (usually `http://localhost:5173`).
    * Sign up for a new account (using your Supabase auth).
    * Log in.
    * Click "Fetch My API Profile" to test the authenticated call to your Hono backend.
