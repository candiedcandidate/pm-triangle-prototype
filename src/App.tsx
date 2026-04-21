import { useMemo, useRef, useState } from 'react'
import './App.css'

type Point = {
  x: number
  y: number
}

type Triangle = {
  time: Point
  cost: Point
  scope: Point
}

type ConstraintValues = {
  time: number
  cost: number
  scope: number
}

type ConstraintBarProps = {
  label: string
  value: number
  color: string
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const dot = (a: Point, b: Point): number => a.x * b.x + a.y * b.y

const subtract = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y })

const closestPointOnSegment = (point: Point, start: Point, end: Point): Point => {
  const segment = subtract(end, start)
  const segmentLengthSquared = dot(segment, segment)

  if (segmentLengthSquared === 0) {
    return start
  }

  const t = clamp(dot(subtract(point, start), segment) / segmentLengthSquared, 0, 1)

  return {
    x: start.x + segment.x * t,
    y: start.y + segment.y * t,
  }
}

const distanceSquared = (a: Point, b: Point): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

const centroid = (triangle: Triangle): Point => ({
  x: (triangle.time.x + triangle.cost.x + triangle.scope.x) / 3,
  y: (triangle.time.y + triangle.cost.y + triangle.scope.y) / 3,
})

const barycentricWeights = (point: Point, triangle: Triangle): ConstraintValues => {
  const a = triangle.time
  const b = triangle.cost
  const c = triangle.scope

  const denominator =
    (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y)

  const time =
    ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) /
    denominator
  const cost =
    ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) /
    denominator
  const scope = 1 - time - cost

  return { time, cost, scope }
}

const isInsideTriangle = (point: Point, triangle: Triangle): boolean => {
  const { time, cost, scope } = barycentricWeights(point, triangle)
  const epsilon = -0.0001
  return time >= epsilon && cost >= epsilon && scope >= epsilon
}

const constrainPointToTriangle = (point: Point, triangle: Triangle): Point => {
  if (isInsideTriangle(point, triangle)) {
    return point
  }

  const edges: Array<[Point, Point]> = [
    [triangle.time, triangle.cost],
    [triangle.cost, triangle.scope],
    [triangle.scope, triangle.time],
  ]

  return edges
    .map(([start, end]) => closestPointOnSegment(point, start, end))
    .reduce((closest, candidate) =>
      distanceSquared(point, candidate) < distanceSquared(point, closest)
        ? candidate
        : closest,
    )
}

const mapPointToConstraintValues = (
  point: Point,
  triangle: Triangle,
): ConstraintValues => {
  const weights = barycentricWeights(point, triangle)
  const toScore = (weight: number): number =>
    clamp(50 + (weight - 1 / 3) * 75, 0, 100)

  return {
    time: 100 - toScore(weights.time),
    cost: 100 - toScore(weights.cost),
    scope: toScore(weights.scope),
  }
}

const TRIANGLE: Triangle = {
  time: { x: 50, y: 8 },
  cost: { x: 8, y: 92 },
  scope: { x: 92, y: 92 },
}

const HANDLE_RADIUS = 3.5

function ConstraintBar({ label, value, color }: ConstraintBarProps) {
  return (
    <div className="constraint-bar">
      <span className="constraint-label">{label}</span>
      <div className="constraint-track" aria-hidden="true">
        <div
          className="constraint-fill"
          style={{ height: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="constraint-value">{Math.round(value)}</span>
    </div>
  )
}

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
        <ConstraintBar label="Cost" value={values.cost} color="#0ea5a4" />
        <ConstraintBar label="Time" value={values.time} color="#2563eb" />
        <ConstraintBar
          label="Scope"
          value={values.scope}
          color="#22c55e"
        />
      </div>
    </div>
  )
}

function App() {
  return (
    <main className="app-shell">
      <h1>Triple Constraint Simulator</h1>
      <TriangleSimulator />
      <p className="explanation">
        Move the handle inside the triangle to explore project trade-offs.
      </p>
    </main>
  )
}

export default App
