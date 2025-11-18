import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/clerk-react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Base client for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Hook to create authenticated Supabase client
export const useSupabaseClient = () => {
  const { getToken } = useAuth()

  const getAuthenticatedClient = async () => {
    const token = await getToken({ template: 'supabase' })
    
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
  }

  return { getAuthenticatedClient }
}
