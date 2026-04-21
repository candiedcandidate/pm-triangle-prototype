export type Point = {
  x: number
  y: number
}

export type Triangle = {
  time: Point
  cost: Point
  scope: Point
}

export type ConstraintValues = {
  time: number
  cost: number
  scope: number
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

export const centroid = (triangle: Triangle): Point => ({
  x: (triangle.time.x + triangle.cost.x + triangle.scope.x) / 3,
  y: (triangle.time.y + triangle.cost.y + triangle.scope.y) / 3,
})

export const barycentricWeights = (
  point: Point,
  triangle: Triangle,
): ConstraintValues => {
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

export const isInsideTriangle = (point: Point, triangle: Triangle): boolean => {
  const { time, cost, scope } = barycentricWeights(point, triangle)
  const epsilon = -0.0001
  return time >= epsilon && cost >= epsilon && scope >= epsilon
}

export const constrainPointToTriangle = (
  point: Point,
  triangle: Triangle,
): Point => {
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

export const mapPointToConstraintValues = (
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
