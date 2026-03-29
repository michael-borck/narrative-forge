# NarrativeForge - Development Guide

## Project Overview
NarrativeForge is an Electron + React + TypeScript desktop app that transforms educational source material into playable interactive fiction using the Ink scripting language.

## Tech Stack
- **Shell**: Electron + electron-vite
- **UI**: React 19, Vite, TypeScript
- **State**: Zustand
- **Story format**: Ink (via inkjs)
- **Graph editor**: @xyflow/react (Phase 2)
- **AI**: Claude API, OpenAI API, Ollama (local)

## Project Structure
```
src/
  main/          # Electron main process
  preload/       # Electron preload scripts (IPC bridge)
  renderer/
    src/
      components/  # React components
      stores/      # Zustand stores
      lib/         # AI service, Ink compiler, exporter
      styles/      # Global CSS
src/prompts/       # AI prompt templates (future: user-overridable)
resources/         # App icons and static assets
```

## Commands
- `npm run dev` — Start dev server with hot reload
- `npm run build` — Build for production
- `npm run typecheck` — Run TypeScript type checking
- `npm run lint` — Run ESLint

## Architecture Notes
- All AI calls go through `src/renderer/src/lib/aiService.ts`
- The generation pipeline has 6 stages (analysis → clarification → outline → ink-gen → review → compile)
- Ink compilation uses inkjs's built-in Compiler class
- Export produces standalone HTML with embedded inkjs runtime
- IPC bridge in preload exposes file I/O and dialog APIs to renderer
