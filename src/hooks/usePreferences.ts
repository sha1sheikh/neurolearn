import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { savePreferences, getPreferences } from '../services/supabase/preferences'
import type { UserPreferences, PreferencesUpdate } from '../types/preferences'

export const usePreferences = () => {
  const { user } = useUser()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    if (!user) return
    
    try {
      const data = await getPreferences(user.id)
      // If no preferences exist, set defaults
      if (!data) {
        setPreferences({
          user_id: user.id,
          font_size: 16,
          font_family: 'Inter',
          line_spacing: 1.5,
          theme: 'light',
          focus_mode: false,
          sensory_reduced: false
        })
      } else {
        setPreferences(data)
      }
    } catch (err) {
      setError(err as Error)
      console.error('Error loading preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (newPreferences: PreferencesUpdate) => {
    if (!user) return
    
    try {
      const updated = await savePreferences(user.id, newPreferences)
      if (updated) {
        setPreferences(updated)
      }
    } catch (err) {
      setError(err as Error)
      console.error('Error updating preferences:', err)
    }
  }

  return { preferences, loading, error, updatePreferences }
}
