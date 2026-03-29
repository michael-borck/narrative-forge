import { useAppStore } from './stores/appStore'
import InputPanel from './components/InputPanel'
import GenerationPanel from './components/GenerationPanel'
import PreviewPlayer from './components/PreviewPlayer'
import NodeGraphView from './components/NodeGraphView'
import ExportPanel from './components/ExportPanel'
import SettingsPanel from './components/SettingsPanel'

type View = 'input' | 'generation' | 'graph' | 'preview' | 'export' | 'settings'

function App(): React.ReactElement {
  const view = useAppStore((s) => s.currentView)
  const setView = useAppStore((s) => s.setCurrentView)
  const projectName = useAppStore((s) => s.projectName)

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">NarrativeForge</h1>
        {projectName && <span className="project-name">{projectName}</span>}
        <nav className="app-nav">
          <NavButton view="input" current={view} onClick={setView}>Input</NavButton>
          <NavButton view="generation" current={view} onClick={setView}>Generate</NavButton>
          <NavButton view="graph" current={view} onClick={setView}>Graph</NavButton>
          <NavButton view="preview" current={view} onClick={setView}>Preview</NavButton>
          <NavButton view="export" current={view} onClick={setView}>Export</NavButton>
          <NavButton view="settings" current={view} onClick={setView}>Settings</NavButton>
        </nav>
      </header>
      <main className="app-main">
        {view === 'input' && <InputPanel />}
        {view === 'generation' && <GenerationPanel />}
        {view === 'graph' && <NodeGraphView />}
        {view === 'preview' && <PreviewPlayer />}
        {view === 'export' && <ExportPanel />}
        {view === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}

function NavButton({
  view,
  current,
  onClick,
  children
}: {
  view: View
  current: View
  onClick: (v: View) => void
  children: React.ReactNode
}) {
  return (
    <button
      className={`nav-btn ${current === view ? 'active' : ''}`}
      onClick={() => onClick(view)}
    >
      {children}
    </button>
  )
}

export default App
