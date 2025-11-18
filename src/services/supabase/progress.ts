// src/services/supabase/progress.ts
import { supabase } from '../../lib/supabase'

export const trackProgress = async (
  userId: string,
  contentId: string, 
  formatUsed: string, 
  timeSpent: number
) => {
  const { data, error } = await supabase
    .from('user_progress')
    .insert({
      user_id: userId,
      content_id: contentId,
      format_used: formatUsed,
      time_spent: timeSpent
    })
  
  if (error) {
    console.error('Error tracking progress:', error)
    throw error
  }
  return data
}

export const getProgress = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
