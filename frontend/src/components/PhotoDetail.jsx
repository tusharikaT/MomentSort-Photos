import React from 'react';

export default function PhotoDetail({ photo, onBack }) {
  if (!photo) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: '#000',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Bar */}
      <div style={{
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 51
      }}>
        <button 
          onClick={onBack}
          style={{ 
            color: '#fff', 
            padding: '8px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500, background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: '14px' }}>
          {new Date(photo.year, photo.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
      </div>
      
      {/* Photo View */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', background: '#000' }}>
        <img 
          src={photo.cloudinary_url} 
          alt={photo.category}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}
