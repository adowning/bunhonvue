<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "./stores/auth";
import Login from "./components/Login.vue";

const authStore = useAuthStore();
const { session, user: authUser, localUser } = storeToRefs(authStore);

const loading = ref(false);
const error = ref<string | null>(null);
const apiMessage = ref<string | null>(null);

const handleLogin = async (email: string, password: string) => {
  loading.value = true;
  error.value = null;
  await authStore.signIn(email, password).catch((err) => {
    error.value = err.message;
  });
  loading.value = false;
};

const handleLogout = async () => {
  await authStore.signOut();
};

const fetchMyProfile = async () => {
  loading.value = true;
  error.value = null;
  apiMessage.value = null;
  try {
    // This calls our backend /api/user/me endpoint
    await authStore.fetchLocalUser();
    apiMessage.value = "Successfully fetched local DB profile!";
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = `API Error: ${err.message}`;
    } else {
      error.value = "An unknown error occurred";
    }
  }
  loading.value = false;
};
</script>

<template>
  <div class="min-h-screen container mx-auto p-8 flex flex-col items-center">
    <h1 class="text-4xl font-bold mb-8 text-cyan-400">Hono + Vue + Supabase</h1>

    <div v-if="!session" class="flex justify-center">
      <Login @login="handleLogin" :loading="loading" />
    </div>

    <div v-else class="w-full max-w-2xl p-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 class="text-2xl font-semibold mb-4">Welcome!</h2>
      <p class="text-gray-300 mb-2">
        Logged in as:
        <strong class="text-cyan-400">{{ authUser?.email }}</strong>
      </p>
      <p class="text-gray-300 mb-4">
        Supabase User ID:
        <code class="text-xs bg-gray-700 p-1 rounded">{{ authUser?.id }}</code>
      </p>

      <div class="flex space-x-4 mb-6">
        <button
          @click="fetchMyProfile"
          :disabled="loading"
          class="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {{ loading ? "Fetching..." : "Fetch My API Profile" }}
        </button>
        <button
          @click="handleLogout"
          class="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>

      <div v-if="localUser" class="bg-gray-700 p-4 rounded-md">
        <h3 class="text-lg font-medium text-green-400">
          Local DB Profile Data:
        </h3>
        <pre class="text-sm text-gray-200 overflow-x-auto">{{
          JSON.stringify(localUser, null, 2)
        }}</pre>
      </div>
    </div>

    <div
      v-if="error"
      class="mt-4 w-full max-w-md p-3 bg-red-900 border border-red-700 text-red-100 rounded-md"
    >
      <strong>Error:</strong> {{ error }}
    </div>
    <div
      v-if="apiMessage"
      class="mt-4 w-full max-w-md p-3 bg-green-900 border border-green-700 text-green-100 rounded-md"
    >
      <strong>Success:</strong> {{ apiMessage }}
    </div>
  </div>
</template>