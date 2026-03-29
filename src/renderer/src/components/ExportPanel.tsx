import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { exportStandaloneHTML } from '../lib/exporter'

export default function ExportPanel() {
  const inkSource = useAppStore((s) => s.inkSource)
  const projectName = useAppStore((s) => s.projectName)
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState<string | null>(null)

  const handleExportHTML = async () => {
    if (!inkSource.trim()) return
    setExporting(true)
    setExportDone(null)
    try {
      const html = await exportStandaloneHTML(inkSource, projectName || 'Story')
      const saved = await window.api.saveFile(
        `${projectName || 'story'}.html`,
        html,
        [{ name: 'HTML Files', extensions: ['html'] }]
      )
      if (saved) {
        setExportDone(saved)
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const handleExportInk = async () => {
    if (!inkSource.trim()) return
    const saved = await window.api.saveFile(
      `${projectName || 'story'}.ink`,
      inkSource,
      [{ name: 'Ink Files', extensions: ['ink'] }]
    )
    if (saved) {
      setExportDone(saved)
    }
  }

  if (!inkSource.trim()) {
    return (
      <div className="panel">
        <h2 className="panel-title">Export</h2>
        <p className="panel-subtitle">Generate a story first before exporting.</p>
      </div>
    )
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Export</h2>
      <p className="panel-subtitle">Export your story in different formats</p>

      {exportDone && (
        <div style={{
          background: 'rgba(76, 175, 124, 0.15)',
          border: '1px solid var(--success)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: 20,
          color: 'var(--success)'
        }}>
          Exported to: {exportDone}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="settings-section">
          <div className="settings-section-title">Standalone HTML</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
            A single .html file with the story player bundled. Works offline, can be uploaded to any LMS or shared via email.
          </p>
          <button className="btn btn-primary" onClick={handleExportHTML} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export HTML'}
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">Ink Source</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
            Raw .ink text file. Version-control friendly, editable in any text editor, compatible with Inky and other Ink tools.
          </p>
          <button className="btn btn-primary" onClick={handleExportInk}>
            Export .ink
          </button>
        </div>
      </div>
    </div>
  )
}
