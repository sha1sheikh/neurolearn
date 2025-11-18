// src/pages/Dashboard.tsx
import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useUserSync } from '../hooks/useUserSync'
import type { UserPreferences } from '../types'

export const Dashboard = () => {
  const { user, isLoaded } = useUser()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  
  // Sync user to Supabase on mount
  useUserSync()

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error loading preferences:', error)
    } else {
      setPreferences(data)
    }
  }

  const savePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...newPreferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving preferences:', error)
    } else {
      setPreferences(data)
    }
  }

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in</div>
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user.firstName}!</h1>
      
      <div className="user-info">
        <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
        <p>User ID: {user.id}</p>
      </div>

      <div className="preferences">
        <h2>Your Preferences</h2>
        {preferences ? (
          <div>
            <p>Font Size: {preferences.font_size}px</p>
            <p>Theme: {preferences.theme}</p>
            <button onClick={() => savePreferences({ font_size: 18 })}>
              Increase Font Size
            </button>
          </div>
        ) : (
          <p>Loading preferences...</p>
        )}
      </div>
    </div>
  )
}
