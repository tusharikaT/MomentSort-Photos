import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function HomeScreen({ onPhotoClick }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/photos`)
      .then(res => {
        setPhotos(res.data.photos);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: '24px', color: '#9ca3af', textAlign: 'center' }}>Loading photos...</div>;
  }

  // Group by year
  const grouped = photos.reduce((acc, photo) => {
    const y = photo.year;
    if (!acc[y]) acc[y] = [];
    acc[y].push(photo);
    return acc;
  }, {});

  const sortedYears = Object.keys(grouped).sort((a,b) => b - a);

  return (
    <div style={{ padding: '0 2px 24px 2px' }}>
      {sortedYears.map(year => (
        <div key={year} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, padding: '0 22px', marginBottom: '16px', color: '#fff' }}>
            {year}
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '2px' 
          }}>
            {grouped[year].map(photo => (
              <div 
                key={photo.id}
                onClick={() => onPhotoClick(photo)}
                style={{
                  aspectRatio: '1/1',
                  background: '#1f1f1f',
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
              >
                <img 
                  src={photo.cloudinary_url} 
                  alt={photo.category}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
