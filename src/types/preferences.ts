// src/types/preferences.ts

export interface UserPreferences {
  id?: string
  user_id: string
  font_size: number
  font_family: string
  line_spacing: number
  theme: string
  focus_mode: boolean
  sensory_reduced: boolean
  created_at?: string
  updated_at?: string
}

export interface PreferencesUpdate {
  font_size?: number
  font_family?: string
  line_spacing?: number
  theme?: string
  focus_mode?: boolean
  sensory_reduced?: boolean
}
