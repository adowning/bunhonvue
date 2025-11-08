<template>
  <div class="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
    <h2 class="text-2xl font-semibold mb-4 text-center text-white">Login</h2>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-300">Email</label>
        <input
          v-model="email"
          type="email"
          id="email"
          class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-white"
          required
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-300">Password</label>
        <input
          v-model="password"
          type="password"
          id="password"
          class="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-white"
          required
        />
      </div>
      <button
        type="submit"
        :disabled="props.loading"
        class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50"
      >
        {{ props.loading ? "Logging in..." : "Login" }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')

// Props to receive loading state from parent
const props = defineProps<{
  loading?: boolean
}>()

// Emits the login event with email and password
const emit = defineEmits<{
  login: [email: string, password: string]
}>()

const handleSubmit = () => {
  if (email.value && password.value) {
    emit('login', email.value, password.value)
  }
}
</script>