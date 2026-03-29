/**
 * Ink compiler for NarrativeForge.
 *
 * Phase 1 uses inkjs's built-in compiler (the Story constructor can accept
 * raw ink source via the Compiler class). For production use, we'd integrate
 * inklecate WASM or a bundled binary.
 */

/**
 * Compiles Ink source to JSON using inkjs's Compiler.
 * Returns the compiled JSON string.
 */
export async function compileInk(inkSource: string): Promise<string> {
  const { Compiler } = await import('inkjs/compiler/Compiler')

  const compiler = new Compiler(inkSource)
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
