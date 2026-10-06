import React from 'react';

export default function ChipRow({ 
  chips, 
  selectedChips, 
  setSelectedChips, 
  onApply,
  isFiltered
}) {
  if (!chips || chips.length === 0) return null;

  const toggleChip = (label) => {
    if (selectedChips.includes(label)) {
      setSelectedChips(selectedChips.filter(c => c !== label));
    } else {
      setSelectedChips([...selectedChips, label]);
    }
  };

  const handleApply = () => {
    onApply(selectedChips);
  };
  
  const handleClearAll = () => {
    setSelectedChips([]);
    onApply([]);
  };

  const hasSelection = selectedChips.length > 0;
  
  return (
    <div style={{ padding: '0 24px 16px 24px', borderBottom: '1px solid #1f1f1f' }}>
      {!isFiltered && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
          Refine Results
        </div>
      )}
      
      {/* Chips Container - Full Width */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        paddingBottom: '8px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        width: '100%'
      }}>
        {chips.map(chip => {
          const isSelected = selectedChips.includes(chip.chip_label);
          
          return (
            <button
              key={chip.chip_label}
              onClick={() => toggleChip(chip.chip_label)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: isSelected ? '1px solid #fff' : '1px solid #333',
                background: isSelected ? '#fff' : 'transparent',
                color: isSelected ? '#000' : '#fff',
                fontSize: '14px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {chip.chip_label}
              {isSelected && <span style={{ marginLeft: '6px', fontSize: '12px' }}>✕</span>}
            </button>
          );
        })}
      </div>
      
      {/* Action Row - Placed below so it doesn't break chip layout */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', minHeight: '36px' }}>
        {isFiltered && (
          <button
            onClick={handleClearAll}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: '1px solid #333',
              background: '#1f1f1f',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Clear All
          </button>
        )}
        
        <button
          onClick={handleApply}
          disabled={!hasSelection && !isFiltered}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: 'none',
            background: (!hasSelection && !isFiltered) ? '#333' : '#3b82f6',
            color: (!hasSelection && !isFiltered) ? '#666' : '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: (!hasSelection && !isFiltered) ? 'not-allowed' : 'pointer'
          }}
        >
          {isFiltered ? 'Update Filters' : 'Apply'}
        </button>
      </div>
    </div>
  );
}
