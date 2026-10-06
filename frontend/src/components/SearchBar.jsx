import React, { useState, useEffect, useRef } from 'react';

export default function SearchBar({ onSearch, initialQuery, onBack }) {
  const [val, setVal] = useState(initialQuery || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setVal(initialQuery || '');
  }, [initialQuery]);

  useEffect(() => {
    // In MVP, we show the banner every time to make testing easy
    // Documented in context_momentsort.md: in production this uses a 1-week delay
    setShowTooltip(true);
    console.log('[Analytics] Event: search_banner_shown');
  }, []);

  useEffect(() => {
    if (!showTooltip) return;
    
    const handleGlobalInteraction = () => {
      setShowTooltip(false);
    };
    
    // Capture events in the capturing phase so it triggers even if child elements stop propagation
    document.addEventListener('mousedown', handleGlobalInteraction, { capture: true });
    document.addEventListener('touchstart', handleGlobalInteraction, { capture: true });
    
    return () => {
      document.removeEventListener('mousedown', handleGlobalInteraction, { capture: true });
      document.removeEventListener('touchstart', handleGlobalInteraction, { capture: true });
    };
  }, [showTooltip]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (val.trim()) {
      if (showTooltip) {
        console.log('[Analytics] Event: search_banner_converted');
        setShowTooltip(false);
      }
      if (inputRef.current) {
        inputRef.current.blur();
      }
      onSearch(val);
    }
  };

  const dismissTooltip = () => {
    console.log('[Analytics] Event: search_banner_dismissed');
    setShowTooltip(false);
  };

  return (
    <>
      {/* Dark overlay backdrop when focused */}
      {isFocused && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 99,
            transition: 'opacity 0.2s'
          }}
        />
      )}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative', zIndex: 100 }}>
        {onBack && (
          <button type="button" onClick={onBack} style={{ color: '#fff', padding: '8px', cursor: 'pointer', background: 'transparent', border: 'none' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        )}
        
        <div style={{
          flex: 1,
          background: '#1f1f1f',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          padding: '12px 20px',
          border: isFocused ? '1px solid #4b5563' : '1px solid #333',
          transition: 'border-color 0.2s'
        }}>
          <svg width="20" height="20" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px' }}>
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            ref={inputRef}
            type="text"
            value={val}
            onChange={e => setVal(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search your photos"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '16px',
              width: '100%',
              outline: 'none'
            }}
          />
          
          {val.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents input from losing focus
                setVal('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          )}
        </div>
        
        {/* Floating Tooltip pointing to search bar */}
        {showTooltip && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 14px)',
            left: onBack ? '48px' : '24px',
            background: '#3b82f6', // Bright Google-style blue
            color: '#fff',
            padding: '14px 16px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            width: '280px',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Tooltip Arrow */}
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '24px',
              width: '0',
              height: '0',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid #3b82f6'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 600, fontSize: '15px' }}>✨ New: Improved Search</span>
              <button 
                type="button"
                onClick={dismissTooltip}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0', opacity: 0.8, fontSize: '16px' }}
              >
                ✕
              </button>
            </div>
            <span style={{ fontSize: '14px', opacity: 0.9, lineHeight: 1.4 }}>
              Searching is faster than scrolling! Try describing what you're looking for.
            </span>
          </div>
        )}
      </form>
    </>
  );
}
