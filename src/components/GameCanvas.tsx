import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { GameEngine } from '../game/GameEngine';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/constants';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile / touch device
    const check = () => {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const narrow = window.innerWidth < 768;
      setIsMobile(touch || narrow);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Touch button handlers
  const handleTouchStart = (side: 'left' | 'right') => (e: React.TouchEvent) => {
    e.preventDefault();
    if (side === 'left') engineRef.current?.setTouchLeft(true);
    else engineRef.current?.setTouchRight(true);
  };

  const handleTouchEnd = (side: 'left' | 'right') => (e: React.TouchEvent) => {
    e.preventDefault();
    if (side === 'left') engineRef.current?.setTouchLeft(false);
    else engineRef.current?.setTouchRight(false);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#e0e6ee',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '9 / 16',
          height: '100%',
          maxHeight: '100dvh',
          maxWidth: '100vw',
          boxShadow: 3,
          borderRadius: { xs: 0, sm: 2 },
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            touchAction: 'none',
          }}
        />

        {/* On-screen touch controls */}
        {isMobile && (
          <>
            <Box
              component="button"
              onTouchStart={handleTouchStart('left')}
              onTouchEnd={handleTouchEnd('left')}
              onTouchCancel={handleTouchEnd('left')}
              sx={{
                position: 'absolute',
                bottom: 80,
                left: 16,
                zIndex: 100,
                width: 94,
                height: 94,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.8)',
                background: 'rgba(59,130,246,0.5)',
                color: '#FFFFFF',
                fontSize: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                touchAction: 'none',
                backdropFilter: 'blur(4px)',
                transition: 'transform 0.08s ease, background 0.08s ease',
                '&:active': {
                  transform: 'scale(0.92)',
                  background: 'rgba(59,130,246,0.9)',
                },
              }}
            >
              {'\u25C0'}
            </Box>
            <Box
              component="button"
              onTouchStart={handleTouchStart('right')}
              onTouchEnd={handleTouchEnd('right')}
              onTouchCancel={handleTouchEnd('right')}
              sx={{
                position: 'absolute',
                bottom: 80,
                right: 16,
                zIndex: 100,
                width: 94,
                height: 94,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.8)',
                background: 'rgba(59,130,246,0.5)',
                color: '#FFFFFF',
                fontSize: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                touchAction: 'none',
                backdropFilter: 'blur(4px)',
                transition: 'transform 0.08s ease, background 0.08s ease',
                '&:active': {
                  transform: 'scale(0.92)',
                  background: 'rgba(59,130,246,0.9)',
                },
              }}
            >
              {'\u25B6'}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
