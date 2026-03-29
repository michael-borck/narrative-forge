import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

export interface StoryNodeData {
  label: string
  content: string
  choices: { text: string; target: string }[]
  timerSeconds: number
  imagePath: string | null
  endingType: string | null
  variableAssignments: { variable: string; expression: string }[]
  isSelected: boolean
}

function StoryNodeComponent({ data }: NodeProps) {
  const d = data as unknown as StoryNodeData
  const firstLine = d.content?.split('\n')[0] || ''

  return (
    <div className={`story-node ${d.isSelected ? 'selected' : ''} ${d.endingType ? `ending-${d.endingType}` : ''}`}>
      <Handle type="target" position={Position.Top} className="story-handle" />

      <div className="story-node-header">
        <span className="story-node-title">{d.label}</span>
        <span className="story-node-badges">
          {d.timerSeconds > 0 && <span className="badge badge-timer">{d.timerSeconds}s</span>}
          {d.imagePath && <span className="badge badge-image">IMG</span>}
          {d.endingType && <span className={`badge badge-ending badge-ending-${d.endingType}`}>{d.endingType}</span>}
        </span>
      </div>

      {firstLine && (
        <div className="story-node-preview">{firstLine.substring(0, 80)}{firstLine.length > 80 ? '...' : ''}</div>
      )}

      {d.variableAssignments.length > 0 && (
        <div className="story-node-vars">
          {d.variableAssignments.slice(0, 3).map((v, i) => (
            <span key={i} className="var-chip">{v.variable}</span>
          ))}
          {d.variableAssignments.length > 3 && <span className="var-chip">+{d.variableAssignments.length - 3}</span>}
        </div>
      )}

      {d.choices.length > 0 && (
        <div className="story-node-choices">
          {d.choices.map((c, i) => (
            <div key={i} className="story-node-choice">{c.text}</div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="story-handle" />
    </div>
  )
}

export default memo(StoryNodeComponent)
