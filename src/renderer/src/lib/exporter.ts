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

<script src="https://cdn.jsdelivr.net/npm/inkjs@2.3.0/dist/ink.min.js"></script>
<script>
(function() {
  var storyJson = ${escapedJson};
  var story = new inkjs.Story(storyJson);
  var content = document.getElementById('content');

  function continueStory() {
    var text = '';
    while (story.canContinue) {
      text += '<p>' + story.Continue().trim() + '</p>';
    }

    var choicesHtml = '';
    if (story.currentChoices.length > 0) {
      choicesHtml = '<div class="choices">';
      story.currentChoices.forEach(function(choice, i) {
        choicesHtml += '<button class="choice" data-index="' + i + '">' + choice.text + '</button>';
      });
      choicesHtml += '</div>';
    }

    var endHtml = '';
    if (!story.canContinue && story.currentChoices.length === 0) {
      endHtml = '<div class="ending">— End of Story —</div>';
      endHtml += '<button class="restart" onclick="location.reload()">Play Again</button>';
    }

    content.innerHTML += '<div class="text">' + text + '</div>' + choicesHtml + endHtml;

    // Scroll to new content
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    // Bind choice clicks
    var buttons = content.querySelectorAll('.choice');
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-index'));
        // Remove choices
        var choiceDiv = this.parentElement;
        choiceDiv.remove();
        story.ChooseChoiceIndex(idx);
        continueStory();
      });
    });
  }

  continueStory();

  // Add meta
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
