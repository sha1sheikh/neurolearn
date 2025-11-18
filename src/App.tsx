import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
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
      'Narrator: “In neurons, information flows in one direction — like a relay race.”',
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
      'Mission: “Guide a signal through the neuron correctly.”',
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
    snippet: '“Pick the picture showing the synapse gap.” · +1 gentle hint unlocked.',
  },
  {
    title: 'Explain Differently',
    detail: 'Switch to metaphors, stories, or spoken walkthroughs.',
    snippet: 'Metaphor: “Neurons are relay runners passing glowing batons.”',
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
  morning: ['Check today’s focus cue', 'Skim schedule visual', 'Complete grounding exercise'],
  evening: ['Log wins in journal', 'Set tomorrow’s top 3', 'Run 5-min calm down audio'],
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
    description: 'We’ll prioritise that format in the multi-mode canvas.',
    options: [
      { value: 'visual', label: 'Visual guides', support: 'Storyboards, diagrams, timelines' },
      { value: 'audio', label: 'Audio walkthroughs', support: 'Calm narration with speed + pitch control' },
      { value: 'text', label: 'Simplified text', support: 'Short sentences + highlighted verbs' },
    ],
  },
]

function App() {
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
  const [rulerPosition, setRulerPosition] = useState(38)
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus')
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_PRESETS[pomodoroMode] * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(defaultTasks)
  const [newTask, setNewTask] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiAnswer, setAiAnswer] = useState(
    'Ask anything — NeuroLearn will answer with calm pacing, short paragraphs, and optional next-steps.',
  )
  const [energyLevel, setEnergyLevel] = useState(60)
  const [showSafeSpace, setShowSafeSpace] = useState(false)
  const [routineProgress, setRoutineProgress] = useState<Record<keyof typeof routineBlueprint, boolean[]>>({
    morning: routineBlueprint.morning.map(() => false),
    evening: routineBlueprint.evening.map(() => false),
  })
  const [quizStep, setQuizStep] = useState(0)
  const [quizResponses, setQuizResponses] = useState<Record<QuizKey, string>>({
    sensory: '',
    attention: '',
    intake: '',
  })
  const [quizComplete, setQuizComplete] = useState(false)
  const [personalizationNotes, setPersonalizationNotes] = useState<string[]>([
    'No profile yet — complete the quiz to auto-tune your dashboard.',
  ])

  useEffect(() => {
    if (!timerRunning) return
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const nextMode = pomodoroMode === 'focus' ? 'break' : 'focus'
          setPomodoroMode(nextMode)
          setTimerRunning(false)
          return POMODORO_PRESETS[nextMode] * 60
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [timerRunning, pomodoroMode])

  useEffect(() => {
    setSecondsLeft(POMODORO_PRESETS[pomodoroMode] * 60)
  }, [pomodoroMode])

  const personalizationStyle = useMemo(
    () => ({
      '--nl-font-family': preferences.fontFamily,
      '--nl-text-scale': preferences.textScale,
      '--nl-letter-spacing': `${preferences.letterSpacing}px`,
      '--nl-line-height': preferences.lineHeight,
    }),
    [preferences],
  )

  const formattedTimer = useMemo(() => {
    const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
    const seconds = String(secondsLeft % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }, [secondsLeft])

  const handleTaskToggle = (taskId: number) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        const nextStatus: TaskStatus =
          task.status === 'done' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'in-progress'
        return { ...task, status: nextStatus }
      }),
    )
  }

  const handleAddTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newTask.trim()) return
    const steps = buildMicroSteps(newTask)
    setTasks((prev) => [...prev, { id: Date.now(), title: newTask.trim(), steps, status: 'not-started' }])
    setNewTask('')
  }

  const buildMicroSteps = (title: string) => {
    const base = title.split(' ').slice(0, 3).join(' ') || 'task'
    return [
      `Define success for “${base}”`,
      `Break “${base}” into 10-min moves`,
      `Check-in with energy meter after progress`,
    ]
  }

  const handleTutorAsk = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!aiPrompt.trim()) return
    const request = aiPrompt.trim()
    setAiAnswer(
      `Thanks for sharing. Here’s a calm explanation of “${request}”:\n• Step 1 — What it is: break the idea into one short sentence.\n• Step 2 — Why it matters: connect to something you already know.\n• Step 3 — Try it: describe a tiny action you can take now.\n\nNeed it shorter, visual, or voiced? Toggle a new mode anytime.`,
    )
    setAiPrompt('')
  }

  const handleQuizSelect = (questionId: QuizKey, value: string) => {
    setQuizResponses((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleQuizBack = () => {
    setQuizStep((prev) => Math.max(0, prev - 1))
  }

  const commitPersonalisation = () => {
    const updates: Partial<PreferenceState> = {}
    const notes: string[] = []

    if (quizResponses.sensory === 'lowStim') {
      updates.sensoryReduced = true
      updates.theme = 'calm'
      updates.textScale = Math.max(preferences.textScale, 1.1)
      notes.push('Enabled sensory-reduced mode with a calm palette.')
    } else if (quizResponses.sensory === 'highContrast') {
      updates.theme = 'contrast'
      updates.sensoryReduced = false
      notes.push('Activated high-contrast colours for crisp edges.')
    } else if (quizResponses.sensory === 'balanced') {
      updates.theme = 'calm'
      notes.push('Kept balanced contrast with predictable highlights.')
    }

    if (quizResponses.attention === 'micro') {
      updates.focusMode = true
      notes.push('Focus mode stays on for short bursts.')
      setPomodoroMode('focus')
      setSecondsLeft(POMODORO_PRESETS.focus * 60)
    } else if (quizResponses.attention === 'steady') {
      updates.focusMode = false
      notes.push('Scheduled steady 25-minute cycles.')
    } else if (quizResponses.attention === 'deep') {
      updates.focusMode = true
      updates.theme = 'dark'
      notes.push('Deep-focus styling with darker surfaces.')
    }

    if (quizResponses.intake === 'visual') {
      setActiveMode('visual')
      notes.push('Prioritising visual storyboard mode.')
    } else if (quizResponses.intake === 'audio') {
      setActiveMode('audio')
      notes.push('Surfacing narrated audio mode first.')
    } else if (quizResponses.intake === 'text') {
      setActiveMode('text')
      notes.push('Keeping simplified text at the forefront.')
    }

    setPreferences((prev) => ({ ...prev, ...updates }))
    setPersonalizationNotes(notes.length ? notes : ['Profile synced — adjust controls anytime.'])
    setQuizComplete(true)
  }

  const handleQuizAdvance = () => {
    if (quizStep === onboardingQuestions.length - 1) {
      commitPersonalisation()
    } else {
      setQuizStep((prev) => prev + 1)
    }
  }

  const currentQuestion = onboardingQuestions[quizStep]
  const quizProgress =
    ((quizStep + (quizResponses[currentQuestion.id] ? 1 : 0)) / onboardingQuestions.length) * 100

  const toggleRoutineStep = (block: keyof typeof routineBlueprint, index: number) => {
    setRoutineProgress((prev) => {
      const copy = { ...prev }
      copy[block] = copy[block].map((checked, idx) => (idx === index ? !checked : checked))
      return copy
    })
  }

  const energySuggestion =
    energyLevel > 70
      ? 'Energy is bright — schedule deeper work or a creative sprint.'
      : energyLevel > 40
        ? 'Moderate energy — mix focus with short movement or hydration breaks.'
        : 'Low energy — switch to review tasks, journaling, or grounding exercises.'

  const focusStats = [
    { label: 'Focus mode minutes', value: preferences.focusMode ? '42' : '18', trend: '+12 vs last week' },
    { label: 'Modules completed', value: '8', trend: '3 visual · 2 audio · 3 gamified' },
    { label: 'Check-ins logged', value: '5', trend: 'Energy stable +12%' },
  ]

  return (
    <div
      className={`app-shell theme-${preferences.theme} ${preferences.focusMode ? 'focus-mode' : ''} ${preferences.sensoryReduced ? 'sensory-reduced' : ''}`}
      style={personalizationStyle as CSSProperties}
    >
      <header className="hero">
        <div>
          <p className="eyebrow">NeuroLearn · MVP</p>
          <h1>Adaptive learning and revision that thinks with neurodivergent brains.</h1>
          <p className="subtitle">
            Build calmer study rituals with multi-sensory content, AI summaries, predictable layouts, and executive
            function support that flexes with attention.
          </p>
          <div className="hero-actions">
            <button className="primary">Start onboarding quiz</button>
            <button className="ghost">Preview focus mode</button>
          </div>
          <ul className="hero-metrics">
            <li>
              <span>92%</span> report lower overwhelm
            </li>
            <li>
              <span>3.1×</span> retention boost in visual mode
            </li>
            <li>
              <span>WCAG 2.2</span> compliant from day one
            </li>
          </ul>
        </div>
        <div className="hero-card">
          <h2>Sensory profile snapshot</h2>
          <p>We adapt font, spacing, pacing, and colour within 90 seconds.</p>
          <dl>
            <div>
              <dt>Preferred intake</dt>
              <dd>Visual + audio alternating</dd>
            </div>
            <div>
              <dt>Attention pattern</dt>
              <dd>11-min bursts · Pomodoro assist</dd>
            </div>
            <div>
              <dt>Memory cues</dt>
              <dd>Metaphors + flashcards</dd>
            </div>
          </dl>
        </div>
      </header>

      <main>
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Interface studio</p>
              <h2>Personalise your learning surface</h2>
            </div>
            <span className="tag">{themePalette[preferences.theme].label}</span>
          </div>
          <div className="preferences-grid">
            <label className="control">
              <span>Font family</span>
              <select
                value={preferences.fontFamily}
                onChange={(event) => setPreferences((prev) => ({ ...prev, fontFamily: event.target.value }))}
              >
                {fontChoices.map((font) => (
                  <option value={font.value} key={font.label}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="control">
              <span>Text size</span>
              <input
                type="range"
                min={0.9}
                max={1.3}
                step={0.05}
                value={preferences.textScale}
                onChange={(event) => setPreferences((prev) => ({ ...prev, textScale: Number(event.target.value) }))}
              />
              <p className="control-hint">{(preferences.textScale * 100).toFixed(0)}%</p>
            </label>
            <label className="control">
              <span>Letter spacing</span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={preferences.letterSpacing}
                onChange={(event) =>
                  setPreferences((prev) => ({ ...prev, letterSpacing: Number(event.target.value) }))
                }
              />
              <p className="control-hint">{preferences.letterSpacing.toFixed(1)}px</p>
            </label>
            <label className="control">
              <span>Line height</span>
              <input
                type="range"
                min={1.2}
                max={2}
                step={0.1}
                value={preferences.lineHeight}
                onChange={(event) => setPreferences((prev) => ({ ...prev, lineHeight: Number(event.target.value) }))}
              />
              <p className="control-hint">{preferences.lineHeight.toFixed(1)}×</p>
            </label>
            <label className="control">
              <span>Colour theme</span>
              <select
                value={preferences.theme}
                onChange={(event) =>
                  setPreferences((prev) => ({ ...prev, theme: event.target.value as ThemeKey }))
                }
              >
                {Object.entries(themePalette).map(([key, theme]) => (
                  <option value={key} key={key}>
                    {theme.label} — {theme.description}
                  </option>
                ))}
              </select>
            </label>
            <div className="toggles">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.sensoryReduced}
                  onChange={(event) => setPreferences((prev) => ({ ...prev, sensoryReduced: event.target.checked }))}
                />
                Sensory-reduced mode
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={preferences.focusMode}
                  onChange={(event) => setPreferences((prev) => ({ ...prev, focusMode: event.target.checked }))}
                />
                Focus mode (hide non-essential UI)
              </label>
            </div>
          </div>
          <div className="reading-ruler">
            <div className="ruler-preview">
              <div className="ruler" style={{ top: `${rulerPosition}%` }} aria-hidden="true" />
              <p>
                NeuroLearn keeps paragraphs short, emphasises verbs, and highlights the current line with a translucent
                guide. Move the slider to place your reading ruler.
              </p>
            </div>
            <input
              type="range"
              min={5}
              max={90}
              value={rulerPosition}
              onChange={(event) => setRulerPosition(Number(event.target.value))}
              aria-label="Reading ruler position"
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header spaced">
            <div>
              <p className="eyebrow">Multi-format canvas</p>
              <h2>Switch learning modes without losing context</h2>
            </div>
            <div className="mode-tabs">
              {Object.keys(learningModeContent).map((key) => (
                <button
                  key={key}
                  className={activeMode === key ? 'active' : ''}
                  onClick={() => setActiveMode(key as LearningMode)}
                >
                  {learningModeContent[key as LearningMode].title}
                </button>
              ))}
            </div>
          </div>
          <div className="mode-content">
            <div className="mode-card">
              <h3>{learningModeContent[activeMode].title}</h3>
              <p className="mode-lead">{learningModeContent[activeMode].lead}</p>
              <ul>
                {learningModeContent[activeMode].body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {learningModeContent[activeMode].meta && <p className="mode-meta">{learningModeContent[activeMode].meta}</p>}
            </div>
            <div className="mode-side">
              <h4>Accessibility guardrails</h4>
              <ul>
                <li>WCAG contrast validated per mode</li>
                <li>Keyboard + screen reader support always on</li>
                <li>Animations respect reduced-motion preferences</li>
              </ul>
              <div className="audio-settings">
                <label>
                  Voice
                  <select>
                    <option>Neutral</option>
                    <option>Soft female</option>
                    <option>Lower pitch</option>
                  </select>
                </label>
                <label>
                  Speed
                  <input type="range" min={0.7} max={1.3} step={0.05} defaultValue={0.95} />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="panel ai-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">AI study studio</p>
              <h2>Guidance that stays calm, custom, and transparent</h2>
            </div>
            <span className="tag">Latency &lt; 3s target</span>
          </div>
          <div className="ai-grid">
            {aiHelpers.map((tool) => (
              <article key={tool.title}>
                <h3>{tool.title}</h3>
                <p>{tool.detail}</p>
                <div className="snippet">{tool.snippet}</div>
              </article>
            ))}
          </div>
          <div className="tutor">
            <div>
              <h3>Neuro-friendly tutor</h3>
              <p>Short answers by default, option to extend, pause, or switch to visual metaphors anytime.</p>
              <form onSubmit={handleTutorAsk} className="tutor-form">
                <label htmlFor="tutor-prompt">Ask a question</label>
                <textarea
                  id="tutor-prompt"
                  placeholder="e.g. Explain synapses like I’m into music."
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                />
                <button type="submit">Get calm explanation</button>
              </form>
            </div>
            <div className="tutor-response">
              <p>{aiAnswer}</p>
              <div className="response-actions">
                <button type="button">Shorter</button>
                <button type="button">More detail</button>
                <button type="button">Visual version</button>
              </div>
            </div>
          </div>
        </section>

        <section className="panel onboarding-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Onboarding quiz</p>
              <h2>Personalisation engine</h2>
              <p className="subtitle">
                Answer three quick prompts and NeuroLearn adapts spacing, colours, pacing, and default content modes.
              </p>
            </div>
            <span className="tag">
              Step {quizStep + 1} / {onboardingQuestions.length}
            </span>
          </div>
          <div className="onboarding-grid">
            <div className="quiz-card">
              <p className="quiz-prompt">{currentQuestion.prompt}</p>
              <p className="quiz-description">{currentQuestion.description}</p>
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
    </div>
  )
}

export default App
