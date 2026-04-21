type ConstraintBarProps = {
  label: string
  value: number
  color: string
}

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

export default ConstraintBar
