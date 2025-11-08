// type GetMeReturnType = AsyncReturnType<typeof getMe>
import { hc } from 'hono/client'
import type { Game } from '../../../backend/src/core/database/schema/game'
import type {
  AppType,
  TGetAllUsersType,
  TGetTransactionsParams
} from '../../../backend/src/shared/types'

type GetMeDataType = Awaited<ReturnType<typeof getMe>> // This gives us Api.Auth.UserInfo
type GetAllUsersDataType = Awaited<ReturnType<typeof getAllUsersWithBalance>> // This gives us Api.Auth.UserInfo
type GetAllGamesDataType = Awaited<ReturnType<typeof getAllGames>> // This gives us Api.Auth.UserInfo

// Helper function to get Supabase auth token
export const getSupabaseAuthHeaders = () => {
  const _token = localStorage.getItem('sb-crqbazcsrncvbnapuxcp-auth-token')
  let token
  if (_token) token = JSON.parse(_token)
  const access_token = token?.access_token

  return access_token
    ? {
        Authorization: `Bearer ${access_token}`
      }
    : { Authorization: `Bearer ` }
}

export type { GetMeDataType }

export const client = hc<AppType>('/api')

export const getMe = async () => {
  const authHeaders = getSupabaseAuthHeaders()

  const res = await client.api.me.$get(
    {},
    {
      headers: authHeaders
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch user') // Changed from 'course'
  }

  const data = await res.json()
  return data
}
export type { GetAllUsersDataType }

export const getAllUsersWithBalance = async (
  { query, page, perPage }: TGetAllUsersType // Removed: Promise<UserWithBalance[]>
) => {
  const authHeaders = getSupabaseAuthHeaders()

  const res = await client.api.users.balances.$get(
    {
      query: {
        query,
        page: String(page),
        perPage: String(perPage)
      }
    },
    {
      headers: authHeaders
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch users') // Changed from 'courses'
  }

  const users = await res.json()
  // FIX: No `as unknown` needed! The type is inferred.
  // The return type of this function will be PaginatedResponse<UserWithBalance>
  return users
}

export type { GetAllGamesDataType }

export const getAllGames = async ({ query, page, perPage, category }: any): Promise<Game[]> => {
  const authHeaders = getSupabaseAuthHeaders()
  const res = await client.api.games.$get(
    {
      query: {
        query,
        page: String(page),
        perPage: String(perPage),
        category
      }
    },
    {
      headers: authHeaders
    }
  )

  if (!res.ok) {
    throw new Error('Failed to fetch courses')
  }

  const games = (await res.json()) as { data: Game[] }
  return games.data as unknown as Game[]
}

export type { TGetTransactionsParams }

/**
 * Fetches a paginated list of transactions.
 * The Hono client ensures the `query` param is type-safe.
 */
export const getTransactions = async (params: TGetTransactionsParams) => {
  const authHeaders = getSupabaseAuthHeaders()
  // Hono client automatically handles string-ifying page/perPage
  const res = await client.api.transactions.$get({ query: params }, { headers: authHeaders })

  if (!res.ok) {
    throw new Error('Failed to fetch transactions')
  }
  // The return type is fully inferred from AppType!
  // It will be: PaginatedResponse<TransactionLog>
  return await res.json()
}

/**
 * Fetches a single transaction by ID.
 */
export const getTransactionById = async (id: string) => {
  const authHeaders = getSupabaseAuthHeaders()
  const res = await client.api.transactions[':id'].$get({ param: { id } }, { headers: authHeaders })

  if (!res.ok) {
    throw new Error('Transaction not found')
  }
  // The return type is inferred from AppType: { data: TransactionLog }
  return await res.json()
}
