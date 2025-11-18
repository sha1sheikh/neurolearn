// src/types/index.ts

// Preferences
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

// Progress
export interface UserProgress {
  id?: string
  user_id: string
  content_id: string
  completed: boolean
  time_spent: number
  format_used: 'text' | 'audio' | 'visual' | 'gamified' | 'math'
  created_at?: string
  updated_at?: string
}

// Energy Log
export interface EnergyLog {
  id?: string
  user_id: string
  energy_level: 1 | 2 | 3 | 4 | 5
  feeling: string
  notes?: string
  created_at?: string
}

// Pomodoro Session
export interface PomodoroSession {
  id?: string
  user_id: string
  duration: number
  completed: boolean
  created_at?: string
}

// Learning Content
export interface LearningContent {
  id?: string
  title: string
  simplified_text?: string
  audio_url?: string
  visual_content?: any
  created_at?: string
}

// Flashcard
export interface Flashcard {
  id?: string
  user_id: string
  content_id?: string
  question: string
  answer: string
  created_at?: string
}

// Energy Log
export interface EnergyLog {
  id?: string
  user_id: string
  energy_level: 1 | 2 | 3 | 4 | 5
  feeling: string
  notes?: string
  created_at?: string
}
