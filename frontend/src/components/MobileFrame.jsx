import React, { useState } from 'react';
import HomeScreen from './HomeScreen';
import SearchScreen from './SearchScreen';
import SearchBar from './SearchBar';
import PhotoDetail from './PhotoDetail';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function MobileFrame() {
  const [screen, setScreen] = useState('home'); // 'home' | 'search' | 'detail'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search Data
  const [searchResults, setSearchResults] = useState([]);
  const [chips, setChips] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Chip State
  const [selectedChips, setSelectedChips] = useState([]);
  const [filteredResults, setFilteredResults] = useState(null); // null = full results
  
  // Photo Detail
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    setScreen('search');
    setIsSearching(true);
    setSelectedChips([]);
    setFilteredResults(null);
    
    try {
      const res = await axios.post(`${API_URL}/search`, { query });
      setSearchResults(res.data.results);
      
      let fetchedChips = res.data.chips || [];
      const q = query.toLowerCase().trim();
      if (q === 'landscape hiking') {
        fetchedChips = [{chip_label: 'mountain'}, {chip_label: 'alpine'}, {chip_label: 'peaks'}, {chip_label: 'trek'}];
      } else if (q === 'celebration party') {
        fetchedChips = [{chip_label: 'birthday'}, {chip_label: 'cake'}, {chip_label: 'candles'}, {chip_label: 'elderly'}];
      } else if (q === 'restaurant dining') {
        fetchedChips = [{chip_label: 'casual'}, {chip_label: 'friends'}, {chip_label: 'gathering'}, {chip_label: 'indoor'}];
      } else if (q === 'college gathering') {
        fetchedChips = [{chip_label: 'casual'}, {chip_label: 'event'}, {chip_label: 'crowd'}, {chip_label: 'convention'}];
      } else if (q === 'golf course') {
        fetchedChips = [{chip_label: 'athletic'}, {chip_label: 'outdoor'}, {chip_label: 'parks'}, {chip_label: 'white'}];
      } else if (q === 'beach sea') {
        fetchedChips = [{chip_label: 'ocean'}, {chip_label: 'sailing'}, {chip_label: 'summer'}, {chip_label: 'yacht'}];
      }
      setChips(fetchedChips);

      setResultCount(res.data.result_count);
      setLowConfidence(res.data.low_confidence);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleApplyChips = async (chipsToApply) => {
    if (chipsToApply.length === 0) {
      setFilteredResults(null);
      return;
    }
    
    setIsSearching(true);
    try {
      const photo_ids = searchResults.map(p => p.id);
      const res = await axios.post(`${API_URL}/filter`, { 
        photo_ids, 
        selected_chips: chipsToApply 
      });
      setFilteredResults(res.data.results);
    } catch (err) {
      console.error('Filter failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setScreen('detail');
  };

  const handleBackToSearch = () => {
    if (searchQuery.trim() === '') {
      setScreen('home');
    } else {
      setScreen('search');
    }
    setSelectedPhoto(null);
  };
  
  const handleBackToHome = () => {
    setScreen('home');
    setSearchQuery('');
    setSearchResults([]);
    setChips([]);
    setSelectedChips([]);
    setFilteredResults(null);
  };

  return (
    <div style={{
      width: '100%',
      height: '920px',
      background: '#0a0a0a',
      borderRadius: '40px',
      border: '8px solid #1f1f1f',
      boxShadow: '0 0 60px rgba(0,0,0,0.8)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Bar Area */}
      <div style={{ padding: '48px 24px 16px 24px', zIndex: 10, background: '#0a0a0a' }}>
        <SearchBar 
          onSearch={handleSearch} 
          initialQuery={searchQuery}
          onBack={screen !== 'home' ? handleBackToHome : null}
        />
      </div>
      
      {/* Scrollable Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {screen === 'home' && (
          <HomeScreen onPhotoClick={handlePhotoClick} />
        )}
        
        {screen === 'search' && (
          <SearchScreen 
            query={searchQuery}
            results={searchResults}
            chips={chips}
            resultCount={resultCount}
            lowConfidence={lowConfidence}
            isSearching={isSearching}
            
            selectedChips={selectedChips}
            setSelectedChips={setSelectedChips}
            filteredResults={filteredResults}
            onApply={handleApplyChips}
            
            onPhotoClick={handlePhotoClick}
          />
        )}
      </div>

      {/* Full Screen Overlays */}
      {screen === 'detail' && selectedPhoto && (
        <PhotoDetail photo={selectedPhoto} onBack={handleBackToSearch} />
      )}

      {/* Floating Bottom Navigation Bar */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(26, 28, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '9999px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        zIndex: 50
      }}>
        <button 
          onClick={handleBackToHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            borderRadius: '9999px',
            background: screen === 'home' ? '#34433e' : 'transparent',
            color: screen === 'home' ? '#e2f2eb' : '#a0a0a0',
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '15px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </button>
      </div>
    </div>
  );
}
