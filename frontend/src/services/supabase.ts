import { createClient } from "@supabase/supabase-js";
import { defineConfig, loadEnv } from "vite";

// const supabaseUrl = process.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = "https://crqbazcsrncvbnapuxcp.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycWJhemNzcm5jdmJuYXB1eGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDk1MDYsImV4cCI6MjA3Njg4NTUwNn0.AQdRVvPqeK8l8NtTwhZhXKnjPIIcv_4dRU-bSZkVPs8";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is not defined in .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
