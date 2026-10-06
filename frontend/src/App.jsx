import './App.css'

function App() {
  return (
    <>
      <div style={{ padding: '2rem', textAlign: 'center', marginTop: '20vh' }}>
        <h1>MomentSort</h1>
        <p>Your photos, sorted.</p>
      </div>

      <nav className="bottom-nav">
        <button className="nav-btn active">
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="nav-label">Home</span>
        </button>
      </nav>
    </>
  )
}

export default App
