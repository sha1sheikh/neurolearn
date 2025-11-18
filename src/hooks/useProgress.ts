import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { trackProgress } from '../services/supabase/progress'

export const useProgress = () => {
  const { user } = useUser()
  const [isTracking, setIsTracking] = useState(false)

  const logProgress = async (
    contentId: string, 
    formatUsed: string, 
    timeSpent: number
  ) => {
    if (!user) return
    
    setIsTracking(true)
    try {
      await trackProgress(user.id, contentId, formatUsed, timeSpent)
    } catch (error) {
      console.error('Error logging progress:', error)
    } finally {
      setIsTracking(false)
    }
  }

  return { logProgress, isTracking }
}
