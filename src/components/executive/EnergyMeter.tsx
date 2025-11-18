import { useState } from 'react'
import { useEnergyLog } from '../../hooks/useEnergyLog'

export const EnergyMeter = () => {
  const { addEnergyLog } = useEnergyLog()
  const [energyLevel, setEnergyLevel] = useState(3)
  const [feeling, setFeeling] = useState('')

  const handleSubmit = async () => {
    await addEnergyLog(energyLevel, feeling)
    setFeeling('')
  }

  return (
    <div>
      <h3>How's your energy?</h3>
      <input
        type="range"
        min="1"
        max="5"
        value={energyLevel}
        onChange={(e) => setEnergyLevel(Number(e.target.value))}
      />
      <input
        type="text"
        placeholder="How are you feeling?"
        value={feeling}
        onChange={(e) => setFeeling(e.target.value)}
      />
      <button onClick={handleSubmit}>Log Energy</button>
    </div>
  )
}
