import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/services/supabase";
import type { Session, User } from "@supabase/supabase-js";
import type { SelectUser } from "@my-app/shared";
import { api } from "@/services/api";

export const useAuthStore = defineStore("auth", () => {
  const session = ref<Session | null>(null);
  const user = ref<User | null>(null);
  const localUser = ref<SelectUser | null>(null);

  const initializeAuthListener = () => {
    supabase.auth.getSession().then(({ data }) => {
      session.value = data.session;
      user.value = data.session?.user ?? null;
    });

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession;
      user.value = newSession?.user ?? null;

      if (_event === "SIGNED_OUT") {
        localUser.value = null;
      }
    });
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Fetches our *local* user profile from our backend API
  const fetchLocalUser = async () => {
    if (!session.value) {
      throw new Error("Not authenticated");
    }

    // Use the Hono client to call the /api/user/me endpoint
    // The relative path '/api/user/me' will be used here
    const res = await api.user.me.$get();

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to fetch profile");
    }

    const data = await res.json();
    localUser.value = data;
    return data;
  };

  return {
    session,
    user,
    localUser,
    initializeAuthListener,
    signIn,
    signOut,
    fetchLocalUser,
  };
});
