<template>
  <div class="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">
      {{ isRegistering ? 'Register New Agent' : 'Enter Token' }}
    </h2>

    <!-- Network Status Indicator -->
    <div class="mb-4 p-3 rounded-lg" :class="networkStatusClass">
      <div class="flex items-center">
        <div class="w-3 h-3 rounded-full mr-2" :class="networkIndicatorClass"></div>
        <span class="text-sm font-medium">{{ networkStatusText }}</span>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="authStore.error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ authStore.error }}
      <button @click="authStore.clearError" class="float-right text-red-600 hover:text-red-800">×</button>
    </div>

    <!-- Token Input Form -->
    <form v-if="!isRegistering" @submit.prevent="handleTokenSubmit" class="space-y-4">
      <div>
        <label for="token" class="block text-sm font-medium text-gray-700 mb-2">
          SpaceTraders Token
        </label>
        <input
          id="token"
          v-model="tokenInput"
          type="text"
          placeholder="Enter your bearer token..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="authStore.isLoading"
          required
        />
      </div>
      
      <button
        type="submit"
        :disabled="authStore.isLoading || !tokenInput.trim()"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ authStore.isLoading ? 'Validating...' : 'Set Token' }}
      </button>
    </form>

    <!-- Registration Form -->
    <form v-else @submit.prevent="handleRegistration" class="space-y-4">
      <div>
        <label for="agentSymbol" class="block text-sm font-medium text-gray-700 mb-2">
          Agent Symbol
        </label>
        <input
          id="agentSymbol"
          v-model="registrationData.symbol"
          type="text"
          placeholder="Enter agent symbol (3-14 chars)..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="authStore.isLoading"
          maxlength="14"
          minlength="3"
          pattern="[A-Z0-9_-]+"
          required
        />
        <p class="text-xs text-gray-500 mt-1">Use uppercase letters, numbers, underscores, and hyphens only</p>
      </div>

      <div>
        <label for="faction" class="block text-sm font-medium text-gray-700 mb-2">
          Starting Faction
        </label>
        <select
          id="faction"
          v-model="registrationData.faction"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="authStore.isLoading"
          required
        >
          <option value="">Select a faction...</option>
          <option value="COSMIC">Cosmic Collective</option>
          <option value="VOID">Void Runners</option>
          <option value="GALACTIC">Galactic Alliance</option>
          <option value="QUANTUM">Quantum Federation</option>
          <option value="DOMINION">Star Dominion</option>
        </select>
      </div>
      
      <button
        type="submit"
        :disabled="authStore.isLoading || !registrationData.symbol.trim() || !registrationData.faction"
        class="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ authStore.isLoading ? 'Registering...' : 'Register Agent' }}
      </button>
    </form>

    <!-- Toggle Button -->
    <div class="mt-6 text-center">
      <button
        @click="toggleMode"
        class="text-blue-600 hover:text-blue-800 text-sm underline"
        :disabled="authStore.isLoading"
      >
        {{ isRegistering ? 'Already have a token? Sign in' : 'Need an account? Register new agent' }}
      </button>
    </div>

    <!-- Queue Status -->
    <div v-if="queueStats.pending > 0" class="mt-6 p-3 bg-yellow-100 border border-yellow-400 rounded">
      <h3 class="text-sm font-medium text-yellow-800 mb-2">Offline Queue Status</h3>
      <div class="text-xs text-yellow-700 space-y-1">
        <div>Pending: {{ queueStats.pending }}</div>
        <div>Processing: {{ queueStats.processing }}</div>
        <div>Completed: {{ queueStats.completed }}</div>
        <div>Failed: {{ queueStats.failed }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { actionQueue } from '@/services/actionQueue'

const authStore = useAuthStore()

// Form state
const isRegistering = ref(false)
const tokenInput = ref('')
const registrationData = ref({
  symbol: '',
  faction: ''
})

// Queue stats
const queueStats = computed(() => actionQueue.status.stats)

// Network status
const networkStatus = computed(() => authStore.networkStatus)

const networkStatusClass = computed(() => {
  return networkStatus.value.isOnline 
    ? 'bg-green-100 border border-green-400'
    : 'bg-red-100 border border-red-400'
})

const networkIndicatorClass = computed(() => {
  return networkStatus.value.isOnline 
    ? 'bg-green-500'
    : 'bg-red-500'
})

const networkStatusText = computed(() => {
  if (!networkStatus.value.isOnline) return 'Offline - Actions will be queued'
  if (networkStatus.value.hasToken) return 'Online - Ready'
  return 'Online - Authentication required'
})

// Methods
function toggleMode() {
  isRegistering.value = !isRegistering.value
  authStore.clearError()
}

async function handleTokenSubmit() {
  try {
    await authStore.setToken(tokenInput.value.trim())
    // Success will be handled by the parent component
  } catch (error) {
    console.error('Token validation failed:', error)
  }
}

async function handleRegistration() {
  try {
    await authStore.registerNewAgent(
      registrationData.value.symbol.toUpperCase(),
      registrationData.value.faction
    )
    // Success will be handled by the parent component
  } catch (error) {
    console.error('Registration failed:', error)
  }
}

// Initialize
onMounted(async () => {
  // Try to load stored authentication
  await authStore.loadStoredAuth()
})
</script>
