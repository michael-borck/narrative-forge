import { useAppStore } from '../stores/appStore'
import { PROMPTS } from './prompts'
import { compileInk } from './inkCompiler'

interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callAI(messages: AIMessage[]): Promise<string> {
  const { aiProvider, apiKey, ollamaUrl, ollamaModel } = useAppStore.getState()

  const provider = aiProvider === 'auto'
    ? (apiKey ? 'claude' : 'ollama')
    : aiProvider

  if (provider === 'claude') {
    return callClaude(messages, apiKey)
  } else if (provider === 'openai') {
    return callOpenAI(messages, apiKey)
  } else {
    return callOllama(messages, ollamaUrl, ollamaModel)
  }
}

async function callClaude(messages: AIMessage[], apiKey: string): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system')?.content || ''
  const nonSystemMessages = messages.filter((m) => m.role !== 'system')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemMsg,
      messages: nonSystemMessages.map((m) => ({
        role: m.role,
        content: m.content
      }))
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function callOpenAI(messages: AIMessage[], apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 8192
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function callOllama(messages: AIMessage[], url: string, model: string): Promise<string> {
  const response = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Ollama error (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.message.content
}

/**
 * Main generation pipeline. Runs stages 1-6 sequentially.
 * If `resumeAfterClarification` is true, skips to stage 3.
 */
export async function generateStory(resumeAfterClarification = false): Promise<void> {
  const store = useAppStore.getState()
  const { inputMode, inputText, storyLength, protagonistType, tone } = store
  const log = (msg: string) => useAppStore.getState().addGenerationLog(msg)

  if (!resumeAfterClarification) {
    store.clearGenerationLog()

    // ─── Stage 1: Analysis ───
    store.setGenerationStage('analysis')
    log('[Stage 1] Analyzing source material...')

    const analysisPrompt = PROMPTS.analysis
      .replace('{{inputMode}}', inputMode)
      .replace('{{inputText}}', inputText)

    const analysis = await callAI([
      { role: 'system', content: PROMPTS.system },
      { role: 'user', content: analysisPrompt }
    ])
    log('Analysis complete.')

    // ─── Stage 2: Clarification ───
    store.setGenerationStage('clarification')
    log('[Stage 2] Generating clarification questions...')

    const clarificationPrompt = PROMPTS.clarification
      .replace('{{analysis}}', analysis)
      .replace('{{inputMode}}', inputMode)

    const clarificationRaw = await callAI([
      { role: 'system', content: PROMPTS.system },
      { role: 'user', content: clarificationPrompt }
    ])

    // Parse questions from response
    const questions = parseClarificationQuestions(clarificationRaw)
    store.setClarificationQuestions(questions)
    log(`Generated ${questions.length} clarification questions.`)
    log('Awaiting user input...')

    // Pause here — the UI will call generateStory(true) to resume
    return
  }

  // ─── Stage 3: Outline ───
  const storeNow = useAppStore.getState()
  const log2 = (msg: string) => useAppStore.getState().addGenerationLog(msg)

  storeNow.setGenerationStage('outline')
  log2('[Stage 3] Generating story outline...')

  const answers = storeNow.clarificationQuestions
    .map((q) => `Q: ${q.question}\nA: ${q.answer || '(no preference)'}`)
    .join('\n\n')

  const outlinePrompt = PROMPTS.outline
    .replace('{{inputMode}}', storeNow.inputMode)
    .replace('{{inputText}}', storeNow.inputText)
    .replace('{{storyLength}}', storeNow.storyLength)
    .replace('{{answers}}', answers)
    .replace('{{protagonistType}}', storeNow.protagonistType)
    .replace('{{tone}}', storeNow.tone)

  const outlineRaw = await callAI([
    { role: 'system', content: PROMPTS.system },
    { role: 'user', content: outlinePrompt }
  ])

  // Try to parse JSON outline
  try {
    const jsonMatch = outlineRaw.match(/```json\s*([\s\S]*?)```/) || outlineRaw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const json = jsonMatch[1] || jsonMatch[0]
      const outline = JSON.parse(json)
      storeNow.setStoryOutline(outline)
      log2(`Outline: ${outline.nodes?.length || 0} nodes, ${outline.edges?.length || 0} edges`)
    }
  } catch {
    log2('(Could not parse structured outline, continuing with text outline)')
  }

  // ─── Stage 4: Ink Generation ───
  storeNow.setGenerationStage('ink-generation')
  log2('[Stage 4] Generating Ink source...')

  const inkPrompt = PROMPTS.inkGeneration
    .replace('{{outline}}', outlineRaw)
    .replace('{{inputMode}}', storeNow.inputMode)
    .replace('{{inputText}}', storeNow.inputText)
    .replace('{{storyLength}}', storeNow.storyLength)

  const inkRaw = await callAI([
    { role: 'system', content: PROMPTS.system + '\n\n' + PROMPTS.inkSyntaxRef },
    { role: 'user', content: inkPrompt }
  ])

  // Extract ink source from code blocks if present
  let inkSource = inkRaw
  const inkMatch = inkRaw.match(/```ink\s*([\s\S]*?)```/)
  if (inkMatch) {
    inkSource = inkMatch[1].trim()
  } else {
    const genericMatch = inkRaw.match(/```\s*([\s\S]*?)```/)
    if (genericMatch) {
      inkSource = genericMatch[1].trim()
    }
  }

  storeNow.setInkSource(inkSource)
  log2(`Generated ${inkSource.split('\n').length} lines of Ink source.`)

  // ─── Stage 5: Review Pass ───
  storeNow.setGenerationStage('review')
  log2('[Stage 5] Reviewing for errors and inconsistencies...')

  const reviewPrompt = PROMPTS.review.replace('{{inkSource}}', inkSource)

  const reviewResult = await callAI([
    { role: 'system', content: PROMPTS.system + '\n\n' + PROMPTS.inkSyntaxRef },
    { role: 'user', content: reviewPrompt }
  ])

  // If review suggests corrections, apply them
  const correctedMatch = reviewResult.match(/```ink\s*([\s\S]*?)```/)
  if (correctedMatch) {
    const corrected = correctedMatch[1].trim()
    if (corrected.length > inkSource.length * 0.5) {
      storeNow.setInkSource(corrected)
      inkSource = corrected
      log2('Applied corrections from review.')
    }
  } else {
    log2('Review passed with no corrections needed.')
  }

  // ─── Stage 6: Compile and Validate ───
  storeNow.setGenerationStage('compile')
  log2('[Stage 6] Compiling Ink source...')

  let compiled = false
  let retries = 0
  let currentSource = useAppStore.getState().inkSource

  while (!compiled && retries < 3) {
    try {
      const json = await compileInk(currentSource)
      useAppStore.getState().setCompiledStoryJson(json)
      compiled = true
      log2('[Done] Story compiled successfully!')
    } catch (err) {
      retries++
      const errMsg = err instanceof Error ? err.message : String(err)
      log2(`[Error] Compilation failed (attempt ${retries}/3): ${errMsg}`)

      if (retries < 3) {
        log2('Asking AI to fix compilation errors...')
        const fixPrompt = `The following Ink source failed to compile with this error:\n\n${errMsg}\n\nHere is the Ink source:\n\`\`\`ink\n${currentSource}\n\`\`\`\n\nPlease fix the errors and return the complete corrected Ink source in a \`\`\`ink code block.`

        const fixResult = await callAI([
          { role: 'system', content: PROMPTS.system + '\n\n' + PROMPTS.inkSyntaxRef },
          { role: 'user', content: fixPrompt }
        ])

        const fixMatch = fixResult.match(/```ink\s*([\s\S]*?)```/)
        if (fixMatch) {
          currentSource = fixMatch[1].trim()
          useAppStore.getState().setInkSource(currentSource)
          log2('Applied AI fix, retrying compilation...')
        }
      }
    }
  }

  if (!compiled) {
    useAppStore.getState().setGenerationStage('error')
    useAppStore.getState().setError('Failed to compile story after 3 attempts. You can manually edit the Ink source above.')
    return
  }

  useAppStore.getState().setGenerationStage('done')
}

function parseClarificationQuestions(raw: string): { id: string; question: string; answer: string }[] {
  const lines = raw.split('\n').filter((l) => l.trim())
  const questions: { id: string; question: string; answer: string }[] = []

  for (const line of lines) {
    // Match numbered questions like "1. ..." or "- ..."
    const match = line.match(/^(?:\d+[\.\)]\s*|-\s*|\*\s*)(.+)/)
    if (match) {
      questions.push({
        id: `q${questions.length + 1}`,
        question: match[1].trim(),
        answer: ''
      })
    }
  }

  // If no structured questions found, treat whole response as questions
  if (questions.length === 0 && raw.trim()) {
    questions.push({
      id: 'q1',
      question: raw.trim(),
      answer: ''
    })
  }

  return questions.slice(0, 5)
}
