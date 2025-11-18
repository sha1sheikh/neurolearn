import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { supabase } from './lib/supabase'
import './App.css'

type ThemeKey = 'calm' | 'contrast' | 'dark'
type LearningMode = 'text' | 'audio' | 'visual' | 'gamified' | 'math'
type TaskStatus = 'not-started' | 'in-progress' | 'done'
type QuizKey = 'sensory' | 'attention' | 'intake'

type PreferenceState = {
  fontFamily: string
  textScale: number
  letterSpacing: number
  lineHeight: number
  theme: ThemeKey
  sensoryReduced: boolean
  focusMode: boolean
}

const fontChoices = [
  { label: 'Lexend', value: '"Lexend", "Inter", system-ui, -apple-system, sans-serif' },
  { label: 'Atkinson Hyperlegible', value: '"Atkinson Hyperlegible", "Inter", system-ui, sans-serif' },
  { label: 'OpenDyslexic', value: '"OpenDyslexic", "Atkinson Hyperlegible", sans-serif' },
  { label: 'Space Grotesk', value: '"Space Grotesk", "Segoe UI", sans-serif' },
]

const themePalette: Record<
  ThemeKey,
  { label: string; description: string; accent: string; surface: string; elevation: string }
> = {
  calm: {
    label: 'Calm sunrise',
    description: 'Gentle lilac + cream, balanced contrast',
    accent: '#7c6cf6',
    surface: '#f7f4ff',
    elevation: '#ffffff',
  },
  contrast: {
    label: 'High contrast',
    description: 'Indigo + ochre, WCAG-ready',
    accent: '#2f2a85',
    surface: '#fdf6e9',
    elevation: '#fff9ef',
  },
  dark: {
    label: 'Deep focus',
    description: 'Low-light slate with neon accents',
    accent: '#70e4ff',
    surface: '#0b132b',
    elevation: '#111b3a',
  },
}

const learningModeContent: Record<
  LearningMode,
  { title: string; lead: string; body: string[]; meta?: string }
> = {
  text: {
    title: 'Simplified text mode',
    lead: 'Sentences stay under 12 words, headings chunk information, and key terms are bolded.',
    body: [
      'Neurons share information using small electrical signals.',
      'Think of dendrites as tree branches that listen for messages.',
      'Axons are long cables that send messages forward.',
    ],
    meta: 'Reading time: 2 min · Best for dyslexia + focus drift',
  },
  audio: {
    title: 'Audio mode',
    lead: 'Friendly narrator keeps a neutral tone. Speed + pitch stay adjustable.',
    body: [
      'Narrator: "In neurons, information flows in one direction — like a relay race."',
      'Pause markers every 90 seconds keep listening light.',
      'Soft chimes indicate topic changes.',
    ],
    meta: 'Voice pack: Neutral | Speed: 0.85x',
  },
  visual: {
    title: 'Visual storyboard',
    lead: 'Icons + timelines replace dense paragraphs.',
    body: [
      'Panel 1 — Neuron overview with colour-coded parts.',
      'Panel 2 — Signal journey mapped as a subway line.',
      'Panel 3 — Brain areas light up when they activate.',
    ],
    meta: 'Great for autism profiles preferring predictability.',
  },
  gamified: {
    title: 'Gamified mission',
    lead: 'Micro-challenges turn revision into a low-pressure quest.',
    body: [
      'Mission: "Guide a signal through the neuron correctly."',
      'Rewards: focus streaks, gentle confetti, badges you can hide.',
      'Adaptive difficulty keeps questions short when attention dips.',
    ],
    meta: '3 XP · Sensory-safe animations',
  },
  math: {
    title: 'Step-by-step breakdown',
    lead: 'Math-heavy ideas slow down into bite-sized moves.',
    body: [
      '1. Identify what the question gives you.',
      '2. Translate numbers into a visual bar or grid.',
      '3. Solve one micro-step at a time with hints.',
    ],
    meta: 'Optimised for dyscalculia support.',
  },
}

const aiHelpers = [
  {
    title: 'Smart Summary',
    detail: 'AI trims essays into short, dyslexia-friendly chunks.',
    snippet: 'Key idea → Neurons pass signals in one direction. Supporting fact → Axons act like insulated cables.',
  },
  {
    title: 'Flashcard Builder',
    detail: 'Auto-build cards with visual or text backs.',
    snippet: 'Q: What protects axons? | A: Myelin — a fatty layer that boosts speed.',
  },
  {
    title: 'Adaptive Quiz',
    detail: 'Difficulty responds to attention drift in under 3 prompts.',
    snippet: '"Pick the picture showing the synapse gap." · +1 gentle hint unlocked.',
  },
  {
    title: 'Explain Differently',
    detail: 'Switch to metaphors, stories, or spoken walkthroughs.',
    snippet: 'Metaphor: "Neurons are relay runners passing glowing batons."',
  },
]

type Task = {
  id: number
  title: string
  steps: string[]
  status: TaskStatus
}

const defaultTasks: Task[] = [
  {
    id: 1,
    title: 'Biology mock prep',
    status: 'in-progress',
    steps: ['Skim module overview', 'Generate flashcards', 'Schedule recap for Friday'],
  },
  {
    id: 2,
    title: 'Executive function practice',
    status: 'not-started',
    steps: ['Pick breathable task size', 'Switch on focus timer', 'Check-in with energy meter'],
  },
]

const POMODORO_PRESETS = { focus: 25, break: 5 } as const

const routineBlueprint = {
  morning: ['Check todays focus cue', 'Skim schedule visual', 'Complete grounding exercise'],
  evening: ['Log wins in journal', 'Set tomorrows top 3', 'Run 5-min calm down audio'],
}

const onboardingQuestions: Array<{
  id: QuizKey
  prompt: string
  description: string
  options: { value: string; label: string; support: string }[]
}> = [
  {
    id: 'sensory',
    prompt: 'How should the interface feel right now?',
    description: 'We adapt colour, contrast, and motion to match your sensory load.',
    options: [
      { value: 'lowStim', label: 'Calm + soft', support: 'Minimal animation · muted palette · reading ruler on' },
      { value: 'balanced', label: 'Balanced contrast', support: 'Standard interface with gentle highlights' },
      { value: 'highContrast', label: 'High contrast', support: 'Bold outlines · maximum clarity · crisp edges' },
    ],
  },
  {
    id: 'attention',
    prompt: 'How is your attention today?',
    description: 'We can shorten modules, activate focus mode, or extend sessions.',
    options: [
      { value: 'micro', label: 'Short bursts', support: '10–12 min sprints + extra reminders' },
      { value: 'steady', label: 'Steady pacing', support: '25 min cycles + regular check-ins' },
      { value: 'deep', label: 'Locked-in mode', support: 'Longer sessions + darker theme' },
    ],
  },
  {
    id: 'intake',
    prompt: 'What helps the most with this topic?',
    description: 'We will prioritise that format in the multi-mode canvas.',
    options: [
      { value: 'visual', label: 'Visual guides', support: 'Storyboards, diagrams, timelines' },
      { value: 'audio', label: 'Audio walkthroughs', support: 'Calm narration with speed + pitch control' },
      { value: 'text', label: 'Simplified text', support: 'Short sentences + highlighted verbs' },
    ],
  },
]

function App() {
  const { user, isLoaded } = useUser()
  const [preferences, setPreferences] = useState<PreferenceState>({
    fontFamily: fontChoices[0].value,
    textScale: 1,
    letterSpacing: 0.5,
    lineHeight: 1.6,
    theme: 'calm' as ThemeKey,
    sensoryReduced: false,
    focusMode: false,
  })
  const [activeMode, setActiveMode] = useState<LearningMode>('text')
  const [showTutor, setShowTutor] = useState(false)
  const [rulerActive, setRulerActive] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(defaultTasks)
  const [newTask, setNewTask] = useState('')
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus')
  const [timerRunning, setTimerRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_PRESETS.focus * 60)
  const [energyLevel, setEnergyLevel] = useState(65)
  const [showSafeSpace, setShowSafeSpace] = useState(false)
  const [routineProgress, setRoutineProgress] = useState({
    morning: [false, false, false],
    evening: [false, false, false],
  })
  const [quizStep, setQuizStep] = useState(0)
  const [quizResponses, setQuizResponses] = useState<Record<string, string>>({})
  const [quizComplete, setQuizComplete] = useState(false)

  // Sync user profile to Supabase when they sign in
  useEffect(() => {
    if (user) {
      syncUserProfile()
      loadUserPreferences()
    }
  }, [user])

  const syncUserProfile = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          username: user.username,
          full_name: user.fullName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) console.error('Error syncing profile:', error)
    } catch (error) {
      console.error('Error syncing user profile:', error)
    }
  }

  const loadUserPreferences = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error)
        return
      }

      if (data) {
        setPreferences({
          fontFamily: data.font_family || fontChoices[0].value,
          textScale: data.font_size ? data.font_size / 16 : 1,
          letterSpacing: data.line_spacing || 0.5,
          lineHeight: 1.6,
          theme: data.theme as ThemeKey || 'calm',
          sensoryReduced: data.sensory_reduced || false,
          focusMode: data.focus_mode || false,
        })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const saveUserPreferences = async (newPrefs: Partial<PreferenceState>) => {
    if (!user) return

    const updatedPrefs = { ...preferences, ...newPrefs }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          font_family: updatedPrefs.fontFamily,
          font_size: Math.round(updatedPrefs.textScale * 16),
          line_spacing: updatedPrefs.letterSpacing,
          theme: updatedPrefs.theme,
          sensory_reduced: updatedPrefs.sensoryReduced,
          focus_mode: updatedPrefs.focusMode,
          updated_at: new Date().toISOString()
        })

      if (error) console.error('Error saving preferences:', error)
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const logEnergyLevel = async () => {
    if (!user) return

    try {
      await supabase
        .from('energy_logs')
        .insert({
          user_id: user.id,
          energy_level: Math.ceil(energyLevel / 20), // Convert 0-100 to 1-5 scale
          feeling: energySuggestion,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging energy:', error)
    }
  }

  const logPomodoroSession = async () => {
    if (!user) return

    try {
      await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: user.id,
          duration: POMODORO_PRESETS[pomodoroMode],
          completed: secondsLeft === 0,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging pomodoro:', error)
    }
  }

  useEffect(() => {
    if (timerRunning && secondsLeft > 0) {
      const id = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000)
      return () => clearTimeout(id)
    }
    if (secondsLeft === 0 && timerRunning) {
      setTimerRunning(false)
      logPomodoroSession()
    }
  }, [timerRunning, secondsLeft])

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(secondsLeft / 60)
    const secs = secondsLeft % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [secondsLeft])

  const energySuggestion = useMemo(() => {
    if (energyLevel < 30) return 'Low energy — try safe-space mode or a short body scan.'
    if (energyLevel < 60) return 'Moderate energy — micro-tasks + regular check-ins recommended.'
    return 'High focus — leverage deep work blocks with the pomodoro timer.'
  }, [energyLevel])

  const themeVariables = useMemo<CSSProperties>(
    () => ({
      '--accent': themePalette[preferences.theme].accent,
      '--surface': themePalette[preferences.theme].surface,
      '--elevation': themePalette[preferences.theme].elevation,
      fontFamily: preferences.fontFamily,
      fontSize: `${preferences.textScale}rem`,
      letterSpacing: `${preferences.letterSpacing}px`,
      lineHeight: preferences.lineHeight,
    }),
    [preferences]
  )

  const updatePreference = <K extends keyof PreferenceState>(key: K, value: PreferenceState[K]) => {
    const newPrefs = { ...preferences, [key]: value }
    setPreferences(newPrefs)
    saveUserPreferences({ [key]: value })
  }

  const handleAddTask = (event: FormEvent) => {
    event.preventDefault()
    if (!newTask.trim()) return
    const newId = Math.max(...tasks.map((task) => task.id)) + 1
    setTasks([
      ...tasks,
      {
        id: newId,
        title: newTask,
        steps: ['Review requirements', 'Break into micro-steps', 'Schedule work blocks'],
        status: 'not-started',
      },
    ])
    setNewTask('')
  }

  const handleTaskToggle = (id: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, status: task.status === 'done' ? 'in-progress' : 'done' }
          : task
      )
    )
  }

  const toggleRoutineStep = (routineKey: keyof typeof routineBlueprint, stepIndex: number) => {
    setRoutineProgress((prev) => {
      const updated = { ...prev }
      updated[routineKey][stepIndex] = !updated[routineKey][stepIndex]
      return updated
    })
  }

  const handleQuizSelect = (id: QuizKey, value: string) => {
    setQuizResponses((prev) => ({ ...prev, [id]: value }))
  }

  const handleQuizAdvance = () => {
    if (quizStep < onboardingQuestions.length - 1) {
      setQuizStep((prev) => prev + 1)
    } else {
      setQuizComplete(true)
    }
  }

  const handleQuizBack = () => {
    if (quizStep > 0) setQuizStep((prev) => prev - 1)
  }

  const quizProgress = ((quizStep + 1) / onboardingQuestions.length) * 100
  const currentQuestion = onboardingQuestions[quizStep]

  const personalizationNotes = useMemo(() => {
    const notes = []
    if (quizResponses.sensory === 'lowStim') notes.push('Sensory-reduced palette active.')
    if (quizResponses.sensory === 'highContrast') notes.push('High-contrast theme enabled.')
    if (quizResponses.attention === 'micro') notes.push('Short sprint modules defaulted.')
    if (quizResponses.attention === 'deep') notes.push('Extended focus sessions unlocked.')
    if (quizResponses.intake === 'visual') notes.push('Visual mode auto-prioritised.')
    if (quizResponses.intake === 'audio') notes.push('Audio walkthroughs lead by default.')
    if (quizResponses.intake === 'text') notes.push('Simplified text format chosen first.')
    return notes
  }, [quizResponses])

  const focusStats = [
    { label: 'Attention streak', value: '8 days', trend: '+2 from last week' },
    { label: 'Sessions completed', value: '24 focus · 18 break', trend: 'Pomodoro adherence 85%' },
    { label: 'Burnout alerts', value: '2 this week', trend: 'Down from 5 last month' },
  ]

  if (!isLoaded) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading NeuroLearn...</p>
      </div>
    )
  }

  return (
    <div className={`app ${preferences.focusMode ? 'focus-on' : ''} ${preferences.sensoryReduced ? 'sensory-reduced' : ''}`} style={themeVariables}>
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <h1>NeuroLearn</h1>
            <p>Adaptive learning for neurodivergent minds</p>
          </div>
          <div className="auth-section">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="sign-in-button">Sign In / Sign Up</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>Welcome, {user?.firstName || 'Learner'}!</span>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      <SignedOut>
        <main style={{ padding: '3rem 1rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome to NeuroLearn</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
            A virtual learning studio designed specifically for neurodivergent students with autism, ADHD, dyslexia, and dyscalculia.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', background: '#f7f4ff', borderRadius: '8px' }}>
              <h3>🎨 Personalized Interface</h3>
              <p>Live controls for font, spacing, color contrast, and sensory-reduced layouts</p>
            </div>
            <div style={{ padding: '1.5rem', background: '#f7f4ff', borderRadius: '8px' }}>
              <h3>📚 Multi-Format Learning</h3>
              <p>Toggle between text, audio, visual storyboards, and gamified quests</p>
            </div>
            <div style={{ padding: '1.5rem', background: '#f7f4ff', borderRadius: '8px' }}>
              <h3>🤖 AI Co-Pilot</h3>
              <p>Smart summaries, flashcards, adaptive quizzes, and neuro-friendly tutoring</p>
            </div>
            <div style={{ padding: '1.5rem', background: '#f7f4ff', borderRadius: '8px' }}>
              <h3>⏰ Executive Function Hub</h3>
              <p>Pomodoro timer, task breakdown, routine builder, and energy tracking</p>
            </div>
          </div>
          <SignInButton mode="modal">
            <button style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              background: '#7c6cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
              Get Started - Sign In / Sign Up
            </button>
          </SignInButton>
        </main>
      </SignedOut>

      <SignedIn>
        <main className="app-main">
          <section className="panel hero">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Your learning studio</p>
                <h2>Hi {user?.firstName}, welcome back to your adaptive space</h2>
              </div>
            </div>
            <div className="hero-content">
              <p>
                NeuroLearn adapts in real time. Adjust fonts, spacing, themes, and toggle multi-format learning modes
                without losing progress. Everything persists so you start fresh each session.
              </p>
              <div className="hero-actions">
                <button type="button" className="primary-action">
                  Jump into today's lesson
                </button>
                <button type="button" onClick={() => setShowTutor((prev) => !prev)}>
                  {showTutor ? 'Hide AI tutor' : 'Ask AI tutor'}
                </button>
              </div>
            </div>
          </section>

          <section className="panel interface-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Personalised interface studio</p>
                <h2>Real-time controls that adapt to your sensory + cognitive load</h2>
              </div>
            </div>
            <div className="interface-controls">
              <div className="control-row">
                <label htmlFor="font-family">Font family</label>
                <select
                  id="font-family"
                  value={preferences.fontFamily}
                  onChange={(event) => updatePreference('fontFamily', event.target.value)}
                >
                  {fontChoices.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="control-row">
                <label htmlFor="text-scale">Text scale · {preferences.textScale.toFixed(2)}</label>
                <input
                  id="text-scale"
                  type="range"
                  min={0.8}
                  max={1.6}
                  step={0.05}
                  value={preferences.textScale}
                  onChange={(event) => updatePreference('textScale', Number(event.target.value))}
                />
              </div>
              <div className="control-row">
                <label htmlFor="letter-spacing">Letter spacing · {preferences.letterSpacing}px</label>
                <input
                  id="letter-spacing"
                  type="range"
                  min={0}
                  max={3}
                  step={0.5}
                  value={preferences.letterSpacing}
                  onChange={(event) => updatePreference('letterSpacing', Number(event.target.value))}
                />
              </div>
              <div className="control-row">
                <label htmlFor="line-height">Line height · {preferences.lineHeight.toFixed(1)}</label>
                <input
                  id="line-height"
                  type="range"
                  min={1.2}
                  max={2.4}
                  step={0.1}
                  value={preferences.lineHeight}
                  onChange={(event) => updatePreference('lineHeight', Number(event.target.value))}
                />
              </div>
              <div className="theme-selector">
                <p>Choose a theme</p>
                {(Object.keys(themePalette) as ThemeKey[]).map((key) => {
                  const theme = themePalette[key]
                  return (
                    <button
                      key={key}
                      type="button"
                      className={preferences.theme === key ? 'active' : ''}
                      onClick={() => updatePreference('theme', key)}
                    >
                      <strong>{theme.label}</strong>
                      <span>{theme.description}</span>
                    </button>
                  )
                })}
              </div>
              <div className="toggle-controls">
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.sensoryReduced}
                    onChange={(event) => updatePreference('sensoryReduced', event.target.checked)}
                  />
                  Sensory-reduced mode (no motion, muted palette)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={preferences.focusMode}
                    onChange={(event) => updatePreference('focusMode', event.target.checked)}
                  />
                  Focus mode (hide sidebar + notifications)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={rulerActive}
                    onChange={(event) => setRulerActive(event.target.checked)}
                  />
                  Adaptive reading ruler (follows cursor)
                </label>
              </div>
            </div>
          </section>

          <section className="panel learning-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Multi-format learning canvas</p>
                <h2>Swap modes without losing context · everything syncs across formats</h2>
              </div>
            </div>
            <div className="mode-tabs">
              {(Object.keys(learningModeContent) as LearningMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={activeMode === mode ? 'active' : ''}
                  onClick={() => setActiveMode(mode)}
                >
                  {learningModeContent[mode].title}
                </button>
              ))}
            </div>
            <article className="learning-content">
              <h3>{learningModeContent[activeMode].title}</h3>
              <p className="lead">{learningModeContent[activeMode].lead}</p>
              <ul>
                {learningModeContent[activeMode].body.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
              {learningModeContent[activeMode].meta && <p className="meta">{learningModeContent[activeMode].meta}</p>}
            </article>
            {showTutor && (
              <aside className="tutor-panel">
                <h4>AI Tutor</h4>
                <p>Ask me anything about this topic. I keep language calm, short, and switchable between formats.</p>
                <form>
                  <input placeholder="Type your question or ask me to explain differently..." />
                  <button type="submit">Send</button>
                </form>
              </aside>
            )}
          </section>

          <section className="panel ai-tools">
            <div className="panel-header">
              <div>
                <p className="eyebrow">AI-powered co-pilot tools</p>
                <h2>Summaries, flashcards, quizzes, and a neuro-friendly tutor</h2>
              </div>
            </div>
            <div className="ai-grid">
              {aiHelpers.map((helper) => (
                <article key={helper.title}>
                  <h3>{helper.title}</h3>
                  <p>{helper.detail}</p>
                  <blockquote>{helper.snippet}</blockquote>
                  <button type="button">Try this tool</button>
                </article>
              ))}
            </div>
          </section>

          <section className="panel onboarding-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Personalisation engine</p>
                <h2>Quick quiz to tailor defaults · rerun anytime</h2>
              </div>
            </div>
            <div className="quiz-container">
              <div className="quiz-form">
                <h3>{currentQuestion.prompt}</h3>
                <p>{currentQuestion.description}</p>
                <div className="quiz-options">
                  {currentQuestion.options.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      className={quizResponses[currentQuestion.id] === option.value ? 'selected' : ''}
                      onClick={() => handleQuizSelect(currentQuestion.id, option.value)}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.support}</span>
                    </button>
                  ))}
                </div>
                <div className="quiz-actions">
                  <button type="button" onClick={handleQuizBack} disabled={quizStep === 0}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleQuizAdvance}
                    disabled={!quizResponses[currentQuestion.id]}
                  >
                    {quizStep === onboardingQuestions.length - 1 ? 'Save profile' : 'Next'}
                  </button>
                </div>
                <div className="quiz-progress" aria-label="Quiz progress">
                  <div style={{ width: `${quizProgress}%` }} />
                </div>
              </div>
              <div className="quiz-summary">
                <h3>{quizComplete ? 'Profile synced' : 'Awaiting your inputs'}</h3>
                <ul>
                  {personalizationNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                {!quizComplete && <p className="quiz-status">Complete the quiz to lock in personalised defaults.</p>}
                {quizComplete && (
                  <p className="quiz-status success">You can rerun the quiz anytime to refresh your plan.</p>
                )}
              </div>
            </div>
          </section>

          <section className="panel executive-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Executive function hub</p>
                <h2>Timers, routines, and grounding tools in one calmer space</h2>
              </div>
            </div>
            <div className="executive-grid">
              <article className="pomodoro">
                <header>
                  <h3>Pomodoro with soft reminders</h3>
                  <div className="mode-switch">
                    <button
                      type="button"
                      className={pomodoroMode === 'focus' ? 'active' : ''}
                      onClick={() => setPomodoroMode('focus')}
                    >
                      Focus · {POMODORO_PRESETS.focus}m
                    </button>
                    <button
                      type="button"
                      className={pomodoroMode === 'break' ? 'active' : ''}
                      onClick={() => setPomodoroMode('break')}
                    >
                      Break · {POMODORO_PRESETS.break}m
                    </button>
                  </div>
                </header>
                <p className="timer">{formattedTimer}</p>
                <div className="timer-actions">
                  <button type="button" onClick={() => setTimerRunning((prev) => !prev)}>
                    {timerRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false)
                      setSecondsLeft(POMODORO_PRESETS[pomodoroMode] * 60)
                    }}
                  >
                    Reset
                  </button>
                </div>
                <p className="timer-hint">
                  Gentle chimes + on-screen breathing cues trigger when attention drifts.
                </p>
              </article>

              <article className="task-breakdown">
                <h3>Task breakdown assistant</h3>
                <ul>
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={task.status === 'done'}
                          onChange={() => handleTaskToggle(task.id)}
                          aria-label={`Mark ${task.title} as done`}
                        />
                        <div>
                          <p>{task.title}</p>
                          <small>{task.steps.join(' · ')}</small>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
                <form onSubmit={handleAddTask} className="task-form">
                  <label htmlFor="task-input">Add task to break down</label>
                  <input
                    id="task-input"
                    value={newTask}
                    onChange={(event) => setNewTask(event.target.value)}
                    placeholder="e.g. Revise chapter 3"
                  />
                  <button type="submit">Generate micro-steps</button>
                </form>
              </article>

              <article className="routine-builder">
                <h3>Routine builder</h3>
                {Object.entries(routineBlueprint).map(([key, steps]) => (
                  <div className="routine-block" key={key}>
                    <p className="routine-title">{key === 'morning' ? 'Morning anchoring' : 'Evening cool-down'}</p>
                    {steps.map((step, index) => (
                      <label key={step}>
                        <input
                          type="checkbox"
                          checked={routineProgress[key as keyof typeof routineBlueprint][index]}
                          onChange={() => toggleRoutineStep(key as keyof typeof routineBlueprint, index)}
                        />
                        {step}
                      </label>
                    ))}
                  </div>
                ))}
              </article>

              <article className="energy-meter">
                <h3>Energy & emotion check-in</h3>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={energyLevel}
                  onChange={(event) => setEnergyLevel(Number(event.target.value))}
                  onMouseUp={logEnergyLevel}
                />
                <p className="energy-value">Current energy: {energyLevel}%</p>
                <p className="energy-hint">{energySuggestion}</p>
                <label className="safe-space-toggle">
                  <input type="checkbox" checked={showSafeSpace} onChange={(event) => setShowSafeSpace(event.target.checked)} />
                  Safe-space mode (calming visuals + grounding)
                </label>
                {showSafeSpace && (
                  <div className="safe-space">
                    <p>Take three box breaths.</p>
                    <p>Stretch + hydrate + note one win.</p>
                  </div>
                )}
              </article>
            </div>
          </section>

          <section className="panel analytics">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Learning analytics</p>
                <h2>Progress grounded in cognitive styles, not just scores</h2>
              </div>
            </div>
            <div className="analytics-grid">
              {focusStats.map((stat) => (
                <article key={stat.label}>
                  <p>{stat.label}</p>
                  <strong>{stat.value}</strong>
                  <small>{stat.trend}</small>
                </article>
              ))}
              <article>
                <p>Mode balance</p>
                <strong>40% visual · 35% audio · 25% gamified</strong>
                <small>System nudges mode switches to reduce fatigue.</small>
              </article>
              <article>
                <p>Memory boosts</p>
                <strong>+18% recall with flashcards</strong>
                <small>AI suggests review cadence matching your retention curve.</small>
              </article>
            </div>
            <div className="accessibility-commitments">
              <h3>Accessibility commitments</h3>
              <ul>
                <li>WCAG 2.2 AA baseline, AAA targets for text + controls</li>
                <li>Fully keyboard operable · skip links · reduced motion support</li>
                <li>Works offline + caches summaries for low bandwidth sessions</li>
                <li>GDPR-ready with AES-256 encrypted profiles</li>
              </ul>
            </div>
          </section>
        </main>
      </SignedIn>
    </div>
  )
}

export default App
