import { useMemo } from 'react'
import { useAppStore } from '../stores/appStore'

export default function NodeGraphView() {
  const outline = useAppStore((s) => s.storyOutline)
  const inkSource = useAppStore((s) => s.inkSource)

  // Parse a basic graph from the ink source if no outline is available
  const parsedNodes = useMemo(() => {
    if (outline) {
      return outline.nodes
    }
    // Basic parsing: extract knot names from ink source
    const knots: { id: string; title: string; summary: string }[] = []
    const knotRegex = /^===\s*(\w+)\s*===/gm
    let match
    while ((match = knotRegex.exec(inkSource)) !== null) {
      knots.push({
        id: match[1],
        title: match[1].replace(/_/g, ' '),
        summary: ''
      })
    }
    return knots
  }, [outline, inkSource])

  const parsedEdges = useMemo(() => {
    if (outline) return outline.edges
    // Basic parsing: extract diverts from ink source
    const edges: { from: string; to: string; choiceText: string }[] = []
    const sections = inkSource.split(/^===\s*(\w+)\s*===/gm)
    for (let i = 1; i < sections.length; i += 2) {
      const knotName = sections[i]
      const content = sections[i + 1] || ''
      const divertRegex = /\*\s*\[([^\]]*)\][^]*?->\s*(\w+)/g
      let match
      while ((match = divertRegex.exec(content)) !== null) {
        edges.push({
          from: knotName,
          to: match[2],
          choiceText: match[1]
        })
      }
    }
    return edges
  }, [outline, inkSource])

  if (!inkSource && !outline) {
    return (
      <div className="panel">
        <h2 className="panel-title">Story Graph</h2>
        <p className="panel-subtitle">Generate a story first to see the node graph.</p>
      </div>
    )
  }

  return (
    <div className="panel" style={{ maxWidth: '100%' }}>
      <h2 className="panel-title">Story Graph</h2>
      <p className="panel-subtitle">
        {parsedNodes.length} nodes, {parsedEdges.length} connections
      </p>

      <div className="graph-container" style={{ padding: 24, overflow: 'auto' }}>
        {/* Phase 1: Simple list view. Phase 2 will use React Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {parsedNodes.map((node) => {
            const outgoing = parsedEdges.filter((e) => e.from === node.id)
            return (
              <div
                key={node.id}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 16
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{node.title}</div>
                {node.summary && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
                    {node.summary}
                  </div>
                )}
                {outgoing.length > 0 && (
                  <div style={{ fontSize: 13 }}>
                    {outgoing.map((e, i) => (
                      <div key={i} style={{ color: 'var(--accent)', marginTop: 4 }}>
                        &rarr; {e.choiceText} &rarr; <span style={{ color: 'var(--text-secondary)' }}>{e.to}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
