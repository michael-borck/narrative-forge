import { parseInkSource } from './inkParser'

/**
 * Convert Ink source to Twee3 format compatible with Twinery.org and Tweego.
 */
export function exportToTwee3(inkSource: string, title?: string): string {
  const parsed = parseInkSource(inkSource)
  const ifid = generateUUID()
  const storyTitle = title || 'Untitled Story'

  const lines: string[] = []

  // StoryData passage (required by Twee3)
  lines.push(':: StoryData')
  lines.push(JSON.stringify({
    ifid,
    format: 'Harlowe',
    'format-version': '3.3.7',
    start: parsed.topLevelDivert || (parsed.knots[0]?.id ?? 'start')
  }))
  lines.push('')

  // StoryTitle passage
  lines.push(':: StoryTitle')
  lines.push(storyTitle)
  lines.push('')

  // Convert each knot to a Twee passage
  for (const knot of parsed.knots) {
    const passageName = knot.title.replace(/_/g, ' ')
    const tags: string[] = []
    if (knot.endingType) tags.push(knot.endingType)

    const tagStr = tags.length > 0 ? ` [${tags.join(' ')}]` : ''
    lines.push(`:: ${passageName}${tagStr}`)

    // Content lines
    if (knot.content) {
      lines.push(knot.content)
    }

    // Variable assignments as Harlowe macros
    for (const va of knot.variableAssignments) {
      lines.push(`(set: $${va.variable} to ${va.expression})`)
    }

    // Choices as Twee links
    if (knot.choices.length > 0) {
      lines.push('')
      for (const choice of knot.choices) {
        const targetName = choice.target.replace(/_/g, ' ')
        if (choice.condition) {
          lines.push(`{(if: ${choice.condition})[[[${choice.text}->${targetName}]]]}`)
        } else {
          lines.push(`[[${choice.text}->${targetName}]]`)
        }
      }
    }

    lines.push('')
  }

  return lines.join('\n')
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16).toUpperCase()
  })
}
