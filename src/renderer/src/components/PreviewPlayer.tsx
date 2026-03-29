import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import { compileInk } from '../lib/inkCompiler'

interface StoryState {
  text: string[]
  choices: { index: number; text: string }[]
  ended: boolean
  tags: string[]
}

export default function PreviewPlayer() {
  const inkSource = useAppStore((s) => s.inkSource)
  const [story, setStory] = useState<any>(null)
  const [storyState, setStoryState] = useState<StoryState>({
    text: [],
    choices: [],
    ended: false,
    tags: []
  })
  const [history, setHistory] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const continueStory = useCallback((storyInstance: any) => {
    const text: string[] = []
    const tags: string[] = []

    while (storyInstance.canContinue) {
      const line = storyInstance.Continue()
      if (line.trim()) text.push(line)
      if (storyInstance.currentTags) {
        tags.push(...storyInstance.currentTags)
      }
    }

    setStoryState({
      text,
      choices: storyInstance.currentChoices.map((c: any, i: number) => ({
        index: i,
        text: c.text
      })),
      ended: !storyInstance.canContinue && storyInstance.currentChoices.length === 0,
      tags
    })
  }, [])

  const loadStory = useCallback(async () => {
    if (!inkSource.trim()) {
      setError('No story to preview. Generate a story first.')
      return
    }

    try {
      setError(null)
      const compiled = await compileInk(inkSource)
      const { Story } = await import('inkjs/engine/Story')
      const storyInstance = new Story(compiled)
      setStory(storyInstance)
      setHistory([])
      continueStory(storyInstance)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load story')
    }
  }, [inkSource, continueStory])

  useEffect(() => {
    loadStory()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const makeChoice = (index: number) => {
    if (!story) return
    // Save state for undo
    setHistory((h) => [...h, story.state.toJson()])
    story.ChooseChoiceIndex(index)
    continueStory(story)
  }

  const undo = () => {
    if (!story || history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    story.state.LoadJson(prev)
    continueStory(story)
  }

  const restart = () => {
    if (!story) return
    story.ResetState()
    setHistory([])
    continueStory(story)
  }

  if (error) {
    return (
      <div className="panel">
        <h2 className="panel-title">Preview</h2>
        <div className="error-banner">
          <span>{error}</span>
        </div>
        <button className="btn btn-primary" onClick={loadStory}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Preview</h2>

      <div className="player-controls">
        <button className="btn btn-secondary" onClick={restart}>Restart</button>
        <button className="btn btn-secondary" onClick={undo} disabled={history.length === 0}>
          Undo
        </button>
        <button className="btn btn-secondary" onClick={loadStory}>Reload</button>
      </div>

      <div className="player-container">
        {/* Render images from tags */}
        {storyState.tags
          .filter((t) => t.startsWith('IMAGE:'))
          .map((t, i) => (
            <img
              key={i}
              src={t.replace('IMAGE:', '').trim()}
              alt=""
              style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 16 }}
            />
          ))}

        {/* Story text */}
        <div className="player-text">
          {storyState.text.map((line, i) => (
            <p key={i} style={{ marginBottom: 12 }}>{line}</p>
          ))}
        </div>

        {/* Choices */}
        {storyState.choices.length > 0 && (
          <div className="player-choices">
            {storyState.choices.map((c) => (
              <button
                key={c.index}
                className="player-choice"
                onClick={() => makeChoice(c.index)}
              >
                {c.text}
              </button>
            ))}
          </div>
        )}

        {/* Ending */}
        {storyState.ended && (
          <div className="player-ending">
            <p>-- End of Story --</p>
            <button className="btn btn-primary" onClick={restart} style={{ marginTop: 16 }}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
