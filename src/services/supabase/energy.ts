import { supabase } from '../../lib/supabase'
import type { EnergyLog } from '../../types'

export const logEnergy = async (
  userId: string,
  energyLevel: number, 
  feeling: string, 
  notes?: string
): Promise<EnergyLog | null> => {
  const { data, error } = await supabase
    .from('energy_logs')
    .insert({
      user_id: userId,
      energy_level: energyLevel,
      feeling,
      notes
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error logging energy:', error)
    throw error
  }
  return data
}

export const getEnergyLogs = async (
  userId: string, 
  days: number = 7
): Promise<EnergyLog[]> => {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('energy_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching energy logs:', error)
    throw error
  }
  return data || []
}
