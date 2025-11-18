import { supabase } from '../../lib/supabase'
import type { UserPreferences, PreferencesUpdate } from '../../types/preferences'

export const savePreferences = async (
  userId: string, 
  preferences: PreferencesUpdate
): Promise<UserPreferences | null> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error saving preferences:', error)
    throw error
  }
  return data
}

export const getPreferences = async (userId: string): Promise<UserPreferences | null> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    // If no preferences exist yet, return null (not an error)
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}
