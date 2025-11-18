import { usePreferences } from '../../hooks/usePreferences'

export const FontControls = () => {
  const { preferences, updatePreferences, loading } = usePreferences()

  const handleFontSizeChange = (newSize: number) => {
    updatePreferences({ font_size: newSize })
  }

  if (loading) return <div>Loading preferences...</div>

  return (
    <div>
      <label>Font Size: {preferences?.font_size || 16}px</label>
      <input
        type="range"
        min="12"
        max="32"
        value={preferences?.font_size || 16}
        onChange={(e) => handleFontSizeChange(Number(e.target.value))}
      />
    </div>
  )
}
