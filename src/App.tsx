import TriangleSimulator from './components/TriangleSimulator'
import './App.css'

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
