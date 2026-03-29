import { compileInk } from './inkCompiler'

/**
 * Exports a standalone HTML file that plays the story.
 * The inkjs runtime is loaded from a CDN in the exported file.
 */
export async function exportStandaloneHTML(
  inkSource: string,
  title: string
): Promise<string> {
  const compiledJson = await compileInk(inkSource)

  // Escape the JSON for embedding in a script tag
  const escapedJson = JSON.stringify(compiledJson)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — NarrativeForge</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    background: #1a1a2e;
    color: #e0e0e0;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 40px 20px;
  }
  #story {
    max-width: 650px;
    width: 100%;
  }
  h1 {
    font-size: 28px;
    margin-bottom: 32px;
    color: #a78bfa;
    text-align: center;
  }
  .text p {
    font-size: 18px;
    line-height: 1.8;
    margin-bottom: 16px;
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 24px;
  }
  .choice {
    padding: 14px 20px;
    background: #252547;
    border: 1px solid #3a3a5c;
    border-radius: 8px;
    color: #e0e0e0;
    cursor: pointer;
    font-size: 16px;
    font-family: inherit;
    text-align: left;
    transition: all 0.15s;
  }
  .choice:hover {
    border-color: #a78bfa;
    background: rgba(167, 139, 250, 0.1);
  }
  .ending {
    text-align: center;
    padding: 32px;
    color: #888;
    font-style: italic;
    font-size: 18px;
  }
  .restart {
    display: block;
    margin: 24px auto;
    padding: 12px 28px;
    background: #a78bfa;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    font-family: inherit;
  }
  .restart:hover { background: #8b6fdf; }
  .meta {
    text-align: center;
    color: #555;
    font-size: 12px;
    margin-top: 48px;
  }
</style>
</head>
<body>
<div id="story">
  <h1>${escapeHtml(title)}</h1>
  <div id="content"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/inkjs@2.3.0/dist/ink.js"></script>
<script>
(function() {
  var storyJson = ${escapedJson};
  var story = new inkjs.Story(storyJson);
  var content = document.getElementById('content');

  function continueStory() {
    var textDiv = document.createElement('div');
    textDiv.className = 'text';
    while (story.canContinue) {
      var line = story.Continue().trim();
      if (line) {
        var p = document.createElement('p');
        p.textContent = line;
        textDiv.appendChild(p);
      }
    }
    content.appendChild(textDiv);

    if (story.currentChoices.length > 0) {
      var choicesDiv = document.createElement('div');
      choicesDiv.className = 'choices';
      story.currentChoices.forEach(function(choice, i) {
        var btn = document.createElement('button');
        btn.className = 'choice';
        btn.textContent = choice.text;
        btn.addEventListener('click', function() {
          choicesDiv.remove();
          story.ChooseChoiceIndex(i);
          continueStory();
        });
        choicesDiv.appendChild(btn);
      });
      content.appendChild(choicesDiv);
    }

    if (!story.canContinue && story.currentChoices.length === 0) {
      var endDiv = document.createElement('div');
      endDiv.className = 'ending';
      endDiv.textContent = '\\u2014 End of Story \\u2014';
      content.appendChild(endDiv);
      var restartBtn = document.createElement('button');
      restartBtn.className = 'restart';
      restartBtn.textContent = 'Play Again';
      restartBtn.addEventListener('click', function() { location.reload(); });
      content.appendChild(restartBtn);
    }

    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  continueStory();

  var meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = 'Created with NarrativeForge';
  document.getElementById('story').appendChild(meta);
})();
</script>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
