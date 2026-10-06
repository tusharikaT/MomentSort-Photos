import React from 'react';
import ChipRow from './ChipRow';

export default function SearchScreen({
  query,
  results,
  chips,
  resultCount,
  lowConfidence,
  isSearching,
  selectedChips,
  setSelectedChips,
  filteredResults,
  onApply,
  onPhotoClick
}) {
  
  const displayResults = filteredResults || results;
  const isFiltered = filteredResults !== null;

  if (isSearching) {
    return <div style={{ padding: '40px 24px', color: '#9ca3af', textAlign: 'center' }}>Searching...</div>;
  }

  if (results.length === 0) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>No results found</h3>
        <p style={{ color: '#9ca3af' }}>Try a different search like "beach" or "birthday".</p>
      </div>
    );
  }

  return (
    <div>
      {/* Banner for low confidence */}
      {lowConfidence && (
        <div style={{ background: '#3f3f46', color: '#fff', padding: '12px 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
          </svg>
          These results might not be exactly what you're looking for.
        </div>
      )}

      {/* Chips Row */}
      <ChipRow 
        chips={chips}
        selectedChips={selectedChips}
        setSelectedChips={setSelectedChips}
        onApply={onApply}
        isFiltered={isFiltered}
      />

      {/* Results Section */}
      {!isFiltered ? (
        <>
          <div style={{ padding: '24px 24px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
              Search Results
            </h2>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>
              {results.length} photos
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '0 2px 24px 2px' }}>
            {results.map(photo => (
              <div key={photo.id} onClick={() => onPhotoClick(photo)} style={{ aspectRatio: '1/1', background: '#1f1f1f', cursor: 'pointer', overflow: 'hidden' }}>
                <img src={photo.cloudinary_url} alt={photo.category} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Top section: Filtered Results */}
          <div style={{ padding: '24px 24px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0, textTransform: 'capitalize' }}>
              {selectedChips.join(' + ')}
            </h2>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>
              {filteredResults.length} photos
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '0 2px 12px 2px' }}>
            {filteredResults.map(photo => (
              <div key={photo.id} onClick={() => onPhotoClick(photo)} style={{ aspectRatio: '1/1', background: '#1f1f1f', cursor: 'pointer', overflow: 'hidden' }}>
                <img src={photo.cloudinary_url} alt={photo.category} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          
          {/* Bottom section: Remaining Results */}
          <div style={{ padding: '24px 24px 16px 24px', borderTop: '1px solid #1f1f1f' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#9ca3af', margin: 0 }}>
              Other relevant photos
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '0 2px 24px 2px' }}>
            {results.filter(photo => !filteredResults.find(f => f.id === photo.id)).map(photo => (
              <div key={photo.id} onClick={() => onPhotoClick(photo)} style={{ aspectRatio: '1/1', background: '#1f1f1f', cursor: 'pointer', overflow: 'hidden' }}>
                <img src={photo.cloudinary_url} alt={photo.category} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
