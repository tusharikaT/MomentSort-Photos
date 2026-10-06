import React from 'react';
import MobileFrame from './MobileFrame';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

export default function DesktopWrapper() {
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      setScale(Math.min(scaleX, scaleY, 1));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      width: '100vw', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        width: '1920px',
        height: '1080px',
        transform: `scale(${scale})`,
        transformOrigin: 'center center'
      }}>
        <LeftPanel />
        
        <div style={{
          width: '560px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <MobileFrame />
        </div>
        
        <RightPanel />
      </div>
    </div>
  );
}
