import { useAppStore } from '../stores/appStore'

export default function SettingsPanel() {
  const aiProvider = useAppStore((s) => s.aiProvider)
  const setAIProvider = useAppStore((s) => s.setAIProvider)
  const apiKey = useAppStore((s) => s.apiKey)
  const setApiKey = useAppStore((s) => s.setApiKey)
  const ollamaUrl = useAppStore((s) => s.ollamaUrl)
  const setOllamaUrl = useAppStore((s) => s.setOllamaUrl)
  const ollamaModel = useAppStore((s) => s.ollamaModel)
  const setOllamaModel = useAppStore((s) => s.setOllamaModel)
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
    <div className="panel">
      <h2 className="panel-title">Settings</h2>
      <p className="panel-subtitle">Configure AI providers and application preferences</p>

      <div className="settings-grid">
        <div className="settings-section">
          <div className="settings-section-title">AI Provider</div>

          <div className="form-group">
            <label className="form-label">Provider</label>
            <select
              className="form-select"
              value={aiProvider}
              onChange={(e) => setAIProvider(e.target.value as any)}
            >
              <option value="auto">Auto (API with local fallback)</option>
              <option value="claude">Claude (Anthropic)</option>
              <option value="openai">OpenAI</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          {(aiProvider === 'claude' || aiProvider === 'openai' || aiProvider === 'auto') && (
            <div className="form-group">
              <label className="form-label">
                {aiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key
              </label>
              <input
                className="form-input"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Stored locally. Never sent anywhere except the API provider.
              </div>
            </div>
          )}

          {(aiProvider === 'ollama' || aiProvider === 'auto') && (
            <>
              <div className="form-group">
                <label className="form-label">Ollama URL</label>
                <input
                  className="form-input"
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ollama Model</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="llama3.1:8b"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Appearance</div>
          <div className="form-group">
            <label className="form-label">Theme</label>
            <select
              className="form-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
