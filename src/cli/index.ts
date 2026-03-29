#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, basename } from 'path'

// Import ink compiler and exporters
// These are loaded dynamically since they share code with the renderer
async function compileInk(source: string): Promise<string> {
  const { Compiler } = await import('inkjs/compiler/Compiler')

  // Ensure start divert exists
  const trimmed = source.trim()
  const firstKnotIndex = trimmed.search(/^===\s*\w+\s*===/m)
  let processedSource = source
  if (firstKnotIndex !== -1) {
    const beforeFirstKnot = trimmed.substring(0, firstKnotIndex)
    if (!/^->\s*\w+/m.test(beforeFirstKnot)) {
      const knotMatch = trimmed.match(/^===\s*(\w+)\s*===/m)
      if (knotMatch) {
        processedSource = trimmed.substring(0, firstKnotIndex) + `-> ${knotMatch[1]}\n` + trimmed.substring(firstKnotIndex)
      }
    }
  }

  const compiler = new Compiler(processedSource)
  const story = compiler.Compile()
  if (!story) throw new Error('Ink compilation failed')
  const json = story.ToJson()
  if (!json) throw new Error('Failed to serialize story')
  return json
}

async function exportStandaloneHTML(inkSource: string, title: string): Promise<string> {
  const compiledJson = await compileInk(inkSource)
  const escapedJson = JSON.stringify(compiledJson)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — NarrativeForge</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Georgia, serif; background: #1a1a2e; color: #e0e0e0; min-height: 100vh; display: flex; justify-content: center; padding: 40px 20px; }
#story { max-width: 650px; width: 100%; }
h1 { font-size: 28px; margin-bottom: 32px; color: #a78bfa; text-align: center; }
.text p { font-size: 18px; line-height: 1.8; margin-bottom: 16px; }
.choices { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
.choice { padding: 14px 20px; background: #252547; border: 1px solid #3a3a5c; border-radius: 8px; color: #e0e0e0; cursor: pointer; font-size: 16px; font-family: inherit; text-align: left; }
.choice:hover { border-color: #a78bfa; }
.ending { text-align: center; padding: 32px; color: #888; font-style: italic; }
.restart { display: block; margin: 24px auto; padding: 12px 28px; background: #a78bfa; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
</style>
</head>
<body>
<div id="story"><h1>${title}</h1><div id="content"></div></div>
<script src="https://cdn.jsdelivr.net/npm/inkjs@2.3.0/dist/ink.js"></script>
<script>
(function(){var s=new inkjs.Story(${escapedJson}),c=document.getElementById('content');function go(){var t=document.createElement('div');t.className='text';while(s.canContinue){var l=s.Continue().trim();if(l){var p=document.createElement('p');p.textContent=l;t.appendChild(p)}}c.appendChild(t);if(s.currentChoices.length>0){var d=document.createElement('div');d.className='choices';s.currentChoices.forEach(function(ch,i){var b=document.createElement('button');b.className='choice';b.textContent=ch.text;b.addEventListener('click',function(){d.remove();s.ChooseChoiceIndex(i);go()});d.appendChild(b)});c.appendChild(d)}if(!s.canContinue&&s.currentChoices.length===0){var e=document.createElement('div');e.className='ending';e.textContent='\\u2014 End \\u2014';c.appendChild(e);var r=document.createElement('button');r.className='restart';r.textContent='Play Again';r.addEventListener('click',function(){location.reload()});c.appendChild(r)}window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}go()})();
</script>
</body>
</html>`
}

yargs(hideBin(process.argv))
  .scriptName('narrativeforge')
  .usage('$0 <command> [options]')

  .command('validate', 'Validate an Ink source file', (yargs) => {
    return yargs.option('input', { alias: 'i', type: 'string', demandOption: true, describe: 'Path to .ink file' })
  }, async (argv) => {
    try {
      const source = await readFile(argv.input as string, 'utf-8')
      await compileInk(source)
      console.log('Valid! Story compiled successfully.')
    } catch (err) {
      console.error('Validation failed:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

  .command('export', 'Export an Ink file to another format', (yargs) => {
    return yargs
      .option('input', { alias: 'i', type: 'string', demandOption: true, describe: 'Path to .ink file' })
      .option('output', { alias: 'o', type: 'string', demandOption: true, describe: 'Output directory' })
      .option('format', { alias: 'f', type: 'string', default: 'html', describe: 'Export format: html, ink, json' })
      .option('title', { alias: 't', type: 'string', default: 'Story', describe: 'Story title' })
  }, async (argv) => {
    try {
      const source = await readFile(argv.input as string, 'utf-8')
      const outputDir = argv.output as string
      await mkdir(outputDir, { recursive: true })

      const formats = (argv.format as string).split(',')
      const title = argv.title as string
      const baseName = basename(argv.input as string, '.ink')

      for (const format of formats) {
        switch (format.trim()) {
          case 'html': {
            const html = await exportStandaloneHTML(source, title)
            const outPath = join(outputDir, `${baseName}.html`)
            await writeFile(outPath, html)
            console.log(`Exported HTML: ${outPath}`)
            break
          }
          case 'json': {
            const json = await compileInk(source)
            const outPath = join(outputDir, `${baseName}.ink.json`)
            await writeFile(outPath, json)
            console.log(`Exported JSON: ${outPath}`)
            break
          }
          case 'ink': {
            const outPath = join(outputDir, `${baseName}.ink`)
            await writeFile(outPath, source)
            console.log(`Exported Ink: ${outPath}`)
            break
          }
          default:
            console.warn(`Unknown format: ${format}`)
        }
      }
    } catch (err) {
      console.error('Export failed:', err instanceof Error ? err.message : err)
      process.exit(1)
    }
  })

  .demandCommand(1, 'You must specify a command')
  .help()
  .version('0.1.0')
  .parse()
