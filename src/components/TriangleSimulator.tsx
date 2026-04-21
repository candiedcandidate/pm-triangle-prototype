import { useMemo, useRef, useState } from 'react'
import ConstraintBar from './ConstraintBar'
import {
  centroid,
  constrainPointToTriangle,
  mapPointToConstraintValues,
  type Point,
  type Triangle,
} from '../lib/triangleMath'

const TRIANGLE: Triangle = {
  time: { x: 50, y: 8 },
  cost: { x: 8, y: 92 },
  scope: { x: 92, y: 92 },
}

const HANDLE_RADIUS = 3.5

function TriangleSimulator() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [handle, setHandle] = useState<Point>(() => centroid(TRIANGLE))

  const values = useMemo(
    () => mapPointToConstraintValues(handle, TRIANGLE),
    [handle],
  )

  const updateHandleFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current

    if (!svg) {
      return
    }

    const svgPoint = svg.createSVGPoint()
    svgPoint.x = clientX
    svgPoint.y = clientY
    const ctm = svg.getScreenCTM()

    if (!ctm) {
      return
    }

    const transformedPoint = svgPoint.matrixTransform(ctm.inverse())

    const nextPoint = constrainPointToTriangle(
      { x: transformedPoint.x, y: transformedPoint.y },
      TRIANGLE,
    )

    setHandle(nextPoint)
  }

  return (
    <div className="simulator-layout">
      <div className="triangle-panel">
        <svg
          ref={svgRef}
          className="triangle-svg"
          viewBox="0 0 100 100"
          onPointerDown={(event) => {
            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)
            updateHandleFromPointer(event.clientX, event.clientY)
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              updateHandleFromPointer(event.clientX, event.clientY)
            }
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId)
            }
          }}
          role="img"
          aria-label="Triple constraint triangle simulator"
        >
          <polygon
            points={`${TRIANGLE.time.x},${TRIANGLE.time.y} ${TRIANGLE.cost.x},${TRIANGLE.cost.y} ${TRIANGLE.scope.x},${TRIANGLE.scope.y}`}
            className="triangle-shape"
          />

          <line
            x1={handle.x - 4}
            y1={handle.y}
            x2={handle.x + 4}
            y2={handle.y}
            className="handle-crosshair"
          />
          <line
            x1={handle.x}
            y1={handle.y - 4}
            x2={handle.x}
            y2={handle.y + 4}
            className="handle-crosshair"
          />
          <circle
            cx={handle.x}
            cy={handle.y}
            r={HANDLE_RADIUS}
            className="handle-circle"
          />

          <text x={TRIANGLE.time.x} y={TRIANGLE.time.y - 3} className="corner-label">
            Time
          </text>
          <text x={TRIANGLE.cost.x - 1} y={TRIANGLE.cost.y + 5} className="corner-label start">
            Cost
          </text>
          <text
            x={TRIANGLE.scope.x + 1}
            y={TRIANGLE.scope.y + 5}
            className="corner-label end"
          >
            Scope / Quality
          </text>
        </svg>
      </div>

      <div className="bars-panel" aria-live="polite">
        <ConstraintBar label="Time" value={values.time} color="#2563eb" />
        <ConstraintBar label="Cost" value={values.cost} color="#0ea5a4" />
        <ConstraintBar
          label="Scope / Quality"
          value={values.scope}
          color="#22c55e"
        />
      </div>
    </div>
  )
}

export default TriangleSimulator
