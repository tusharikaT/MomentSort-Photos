import React from 'react';

export default function LeftPanel() {
  return (
    <div style={{
      width: '680px',
      padding: '80px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      color: '#fff',
      flexShrink: 0
    }}>
      <h1 style={{ fontSize: '48px', fontWeight: 600, marginBottom: '24px', letterSpacing: '-1px' }}>
        MomentSort
      </h1>
      <h2 style={{ fontSize: '24px', color: '#9ca3af', marginBottom: '48px', fontWeight: 400 }}>
        The classic search navigation layer.
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>1. Describe what you remember</h3>
          <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>
            Scroll through the photos, then try to describe a moment in your own words or phrases. Don't just use singular words—this project is built to understand how you naturally think and remember!
          </p>
        </div>
        
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>2. Use the smart chips</h3>
          <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>
            Instead of typing a new query, tap the context-aware chips that appear below the search bar to instantly narrow down results.
          </p>
        </div>
        
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>3. Apply filters at once</h3>
          <p style={{ color: '#9ca3af', lineHeight: 1.6 }}>
            Select multiple chips and hit "Apply". The grid only re-renders when you're ready, saving compute and visual jarring.
          </p>
        </div>
      </div>
    </div>
  );
}
