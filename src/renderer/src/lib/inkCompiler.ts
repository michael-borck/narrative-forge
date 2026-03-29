/**
 * Ink compiler for NarrativeForge.
 *
 * Uses inkjs's built-in Compiler class to compile Ink source to JSON.
 */

/**
 * Ensures the Ink source has a top-level divert to the first knot.
 * Without this, the story starts at the root and immediately ends.
 */
function ensureStartDivert(source: string): string {
  const trimmed = source.trim()

  // Check if there's already a top-level divert before the first knot
  const firstKnotIndex = trimmed.search(/^===\s*\w+\s*===/m)
  if (firstKnotIndex === -1) return source // no knots at all

  const beforeFirstKnot = trimmed.substring(0, firstKnotIndex)
  if (/^->\s*\w+/m.test(beforeFirstKnot)) return source // already has a divert

  // Find the name of the first knot
  const knotMatch = trimmed.match(/^===\s*(\w+)\s*===/m)
  if (!knotMatch) return source

  const firstKnotName = knotMatch[1]

  // Insert a divert just before the first knot
  return trimmed.substring(0, firstKnotIndex) + `-> ${firstKnotName}\n` + trimmed.substring(firstKnotIndex)
}

/**
 * Compiles Ink source to JSON using inkjs's Compiler.
 * Returns the compiled JSON string.
 */
export async function compileInk(inkSource: string): Promise<string> {
  const { Compiler } = await import('inkjs/compiler/Compiler')

  const source = ensureStartDivert(inkSource)
  const compiler = new Compiler(source)
  const story = compiler.Compile()

  if (!story) {
    throw new Error('Ink compilation failed: no story produced')
  }

  const json = story.ToJson()

  if (!json) {
    throw new Error('Ink compilation failed: could not serialize to JSON')
  }

  return json
}

/**
 * Validates Ink source without fully compiling.
 * Returns an array of error messages (empty if valid).
 */
export async function validateInk(inkSource: string): Promise<string[]> {
  try {
    await compileInk(inkSource)
    return []
  } catch (err) {
    return [err instanceof Error ? err.message : 'Unknown compilation error']
  }
}
