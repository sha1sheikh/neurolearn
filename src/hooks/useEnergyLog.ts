import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { logEnergy, getEnergyLogs } from '../services/supabase/energy'
import type { EnergyLog } from '../types'

export const useEnergyLog = () => {
  const { user } = useUser()
  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>([]) // ← Add type here
  const [loading, setLoading] = useState(false)

  const addEnergyLog = async (
    energyLevel: number, 
    feeling: string, 
    notes?: string
  ) => {
    if (!user) return
    
    try {
      await logEnergy(user.id, energyLevel, feeling, notes)
      await loadEnergyLogs() // Refresh the list
    } catch (error) {
      console.error('Error adding energy log:', error)
    }
  }

  const loadEnergyLogs = async (days: number = 7) => {
    if (!user) return
    
    setLoading(true)
    try {
      const data = await getEnergyLogs(user.id, days)
      setEnergyLogs(data || []) // ← Handle null case
    } catch (error) {
      console.error('Error loading energy logs:', error)
    } finally {
      setLoading(false)
    }
  }

  return { energyLogs, addEnergyLog, loadEnergyLogs, loading }
}
