import { useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useSupabaseClient } from '../lib/supabase'

export const useUserSync = () => {
  const { user } = useUser()
  const { getAuthenticatedClient } = useSupabaseClient()

  useEffect(() => {
    const syncUser = async () => {
      if (!user) return

      const supabase = await getAuthenticatedClient()
      
      // Upsert user profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          username: user.username,
          full_name: user.fullName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) console.error('Error syncing user:', error)
    }

    syncUser()
  }, [user])
}
