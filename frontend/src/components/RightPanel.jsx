import React from 'react';

export default function RightPanel() {
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
      <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '24px', color: '#9ca3af' }}>
        Don't want to browse? Try searching for:
      </h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Pill text="landscape hiking" />
        <Pill text="celebration party" />
        <Pill text="restaurant dining" />
        <Pill text="college gathering" />
        <Pill text="golf course" />
        <Pill text="beach sea" />
      </div>
    </div>
  );
}

function Pill({ text }) {
  return (
    <div style={{
      padding: '12px 24px',
      borderRadius: '30px',
      background: '#222',
      border: '1px solid #333',
      fontSize: '16px',
      color: '#e5e7eb'
    }}>
      {text}
    </div>
  );
}
