import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type InputMode = 'topic' | 'lesson' | 'methodology' | 'case-study' | 'lecture-notes' | 'scenario'
export type View = 'input' | 'generation' | 'graph' | 'preview' | 'export' | 'settings'
export type AIProvider = 'claude' | 'openai' | 'ollama' | 'auto'
export type StoryLength = 'short' | 'medium' | 'long'
export type GenerationStage = 'idle' | 'analysis' | 'clarification' | 'outline' | 'ink-generation' | 'review' | 'compile' | 'done' | 'error'

export interface StoryOutlineNode {
  id: string
  title: string
  summary: string
}

export interface StoryOutlineEdge {
  from: string
  to: string
  choiceText: string
}

export interface StoryOutline {
  nodes: StoryOutlineNode[]
  edges: StoryOutlineEdge[]
  variables: { name: string; type: string; initialValue: string | number | boolean }[]
  canonPath: string[]
}

export interface ClarificationQuestion {
  id: string
  question: string
  answer: string
}

export interface AppState {
  // Navigation
  currentView: View
  setCurrentView: (view: View) => void

  // Project
  projectName: string
  setProjectName: (name: string) => void

  // Input
  inputMode: InputMode
  setInputMode: (mode: InputMode) => void
  inputText: string
  setInputText: (text: string) => void

  // AI Settings
  aiProvider: AIProvider
  setAIProvider: (provider: AIProvider) => void
  apiKey: string
  setApiKey: (key: string) => void
  ollamaUrl: string
  setOllamaUrl: (url: string) => void
  ollamaModel: string
  setOllamaModel: (model: string) => void

  // Generation state
  generationStage: GenerationStage
  setGenerationStage: (stage: GenerationStage) => void
  generationLog: string[]
  addGenerationLog: (msg: string) => void
  clearGenerationLog: () => void

  // Clarification
  clarificationQuestions: ClarificationQuestion[]
  setClarificationQuestions: (questions: ClarificationQuestion[]) => void
  updateClarificationAnswer: (id: string, answer: string) => void

  // Story data
  storyOutline: StoryOutline | null
  setStoryOutline: (outline: StoryOutline | null) => void
  inkSource: string
  setInkSource: (ink: string) => void
  compiledStoryJson: string
  setCompiledStoryJson: (json: string) => void

  // Story preferences
  storyLength: StoryLength
  setStoryLength: (length: StoryLength) => void
  protagonistType: string
  setProtagonistType: (type: string) => void
  tone: string
  setTone: (tone: string) => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Error
  error: string | null
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>()(persist((set) => ({
  // Navigation
  currentView: 'input',
  setCurrentView: (view) => set({ currentView: view }),

  // Project
  projectName: '',
  setProjectName: (projectName) => set({ projectName }),

  // Input
  inputMode: 'topic',
  setInputMode: (inputMode) => set({ inputMode }),
  inputText: '',
  setInputText: (inputText) => set({ inputText }),

  // AI Settings
  aiProvider: 'auto',
  setAIProvider: (aiProvider) => set({ aiProvider }),
  apiKey: '',
  setApiKey: (apiKey) => set({ apiKey }),
  ollamaUrl: 'http://localhost:11434',
  setOllamaUrl: (ollamaUrl) => set({ ollamaUrl }),
  ollamaModel: 'llama3.1:8b',
  setOllamaModel: (ollamaModel) => set({ ollamaModel }),

  // Generation state
  generationStage: 'idle',
  setGenerationStage: (generationStage) => set({ generationStage }),
  generationLog: [],
  addGenerationLog: (msg) => set((s) => ({ generationLog: [...s.generationLog, msg] })),
  clearGenerationLog: () => set({ generationLog: [] }),

  // Clarification
  clarificationQuestions: [],
  setClarificationQuestions: (clarificationQuestions) => set({ clarificationQuestions }),
  updateClarificationAnswer: (id, answer) =>
    set((s) => ({
      clarificationQuestions: s.clarificationQuestions.map((q) =>
        q.id === id ? { ...q, answer } : q
      )
    })),

  // Story data
  storyOutline: null,
  setStoryOutline: (storyOutline) => set({ storyOutline }),
  inkSource: '',
  setInkSource: (inkSource) => set({ inkSource }),
  compiledStoryJson: '',
  setCompiledStoryJson: (compiledStoryJson) => set({ compiledStoryJson }),

  // Story preferences
  storyLength: 'medium',
  setStoryLength: (storyLength) => set({ storyLength }),
  protagonistType: 'the reader',
  setProtagonistType: (protagonistType) => set({ protagonistType }),
  tone: 'professional',
  setTone: (tone) => set({ tone }),

  // Theme
  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  // Error
  error: null,
  setError: (error) => set({ error })
}), {
  name: 'narrativeforge-settings',
  partialize: (state) => ({
    aiProvider: state.aiProvider,
    apiKey: state.apiKey,
    ollamaUrl: state.ollamaUrl,
    ollamaModel: state.ollamaModel,
    theme: state.theme,
    storyLength: state.storyLength,
    protagonistType: state.protagonistType,
    tone: state.tone
  })
}))
