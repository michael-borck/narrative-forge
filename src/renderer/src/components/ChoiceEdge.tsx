import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps
} from '@xyflow/react'

function ChoiceEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12
  })

  const label = (data as any)?.choiceText || ''
  const condition = (data as any)?.condition || ''

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ stroke: '#7c6ef0', strokeWidth: 2 }} />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="choice-edge-label"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all'
            }}
          >
            {condition && <span className="edge-condition">{condition}</span>}
            <span>{label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(ChoiceEdgeComponent)
