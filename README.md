# NeuroLearn – Neurodiversity-First Learning & Revision MVP

NeuroLearn is a virtual learning studio for neurodivergent students (autism, ADHD, dyslexia, dyscalculia).  
This MVP demonstrates how the experience adapts in real time with multi-format content, accessibility-first UI controls, AI scaffolds, and executive function supports.

## ✨ Highlights

- **Personalised interface studio** – live controls for font, spacing, colour contrast, focus mode, sensory-reduced layouts, and an adaptive reading ruler.
- **Multi-format learning canvas** – toggle between simplified text, narrated audio, visual storyboards, gamified quests, and maths-friendly breakdowns without losing context.
- **AI co-pilot tools** – summaries, flashcards, adaptive quizzes, “explain differently” prompts, and a neuro-friendly tutor that keeps language calm, short, and switchable between formats.
- **Executive function hub** – pomodoro timer with soft reminders, task breakdown assistant, routine builder, energy/burnout meter, and a safe-space mode for grounding exercises.
- **Progress & accessibility analytics** – metrics framed around cognitive styles, sensory usage, and wellbeing signals rather than just grades.

## 🧱 Tech Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- Modern CSS (custom properties, responsive grid) with Google Fonts + OpenDyslexic for dyslexia support
- No backend/API calls yet – AI interactions are mocked to outline UX flows

## 🚀 Getting Started

```bash
npm install
npm run dev    # start local dev server
npm run build  # production build
npm run preview
```

The dev server prints a localhost URL (default `http://localhost:5173`). Hot Module Replacement (HMR) is enabled by default.

## 🧠 Product Mapping

| PRD Pillar | How it shows up in the MVP |
| --- | --- |
| Customisable Learning Interface | Font + spacing sliders, theme presets, sensory reduced/focus modes, adaptive reading ruler |
| Multi-Format Content | Tabs for simplified text, audio, visual, gamified, and step-by-step maths modes with guardrails |
| AI-Powered Tools | Smart summaries, flashcards, quizzes, explain-differently card, tutor flow with calm defaults |
| Executive Function Support | Pomodoro timer, micro-task generator, routine builder, energy/feelings tracker, safe-space toggle |
| Personalisation Engine | Hero/profile snapshot, onboarding CTA, analytics framed around cognitive preferences |

## 🔮 Next Steps

- Wire the onboarding quiz + progress persistence (Supabase/Firebase or custom backend).
- Connect real AI endpoints (OpenAI, Azure, etc.) with neurodiversity-friendly prompting.
- Add offline support + educator dashboards from the PRD’s long-term roadmap.

---

Built with ❤️ for learners who deserve interfaces that meet them where they are.
