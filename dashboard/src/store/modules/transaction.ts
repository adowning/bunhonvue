import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getTransactions, getTransactionById, type TGetTransactionsParams } from '@/api/client' // Adjust path

// Import the backend types! This is the single source of truth.
import type { TransactionLog } from '../../../../backend/src/core/database/schema/finance'
import type { PaginationMeta } from '../../../../backend/src/shared/types'

export const useTransactionStore = defineStore('transactions', () => {
  // --- State ---
  const transactions = ref<TransactionLog[]>([])
  const currentTransaction = ref<TransactionLog | null>(null)
  const pagination = ref<PaginationMeta | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // --- Getters (as computed) ---
  const allTransactions = computed(() => transactions.value)
  const isLoading = computed(() => loading.value)
  const paginationInfo = computed(() => pagination.value)

  // --- Actions ---

  /**
   * Fetches the paginated list of transactions
   */
  async function fetchTransactions(params: TGetTransactionsParams) {
    loading.value = true
    error.value = null
    try {
      // This response is strongly typed: PaginatedResponse<TransactionLog>
      const response = await getTransactions(params)
      transactions.value = response.data
      pagination.value = response.pagination
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch transactions'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches a single transaction by its ID
   */
  async function fetchTransaction(id: string) {
    loading.value = true
    error.value = null
    try {
      // This response is strongly typed: { data: TransactionLog }
      const response = await getTransactionById(id)
      currentTransaction.value = response.data
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch transaction'
    } finally {
      loading.value = false
    }
  }

  /**
   * Clears the currently viewed transaction
   */
  function clearCurrentTransaction() {
    currentTransaction.value = null
  }

  return {
    // State
    transactions,
    currentTransaction,
    pagination,
    loading,
    error,
    // Getters
    allTransactions,
    isLoading,
    paginationInfo,
    // Actions
    fetchTransactions,
    fetchTransaction,
    clearCurrentTransaction
  }
})
