import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { GameEngine } from '../game/GameEngine';
import { GAME_WIDTH, GAME_HEIGHT, STATE } from '../game/constants';

function checkTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    navigator.maxTouchPoints > 0
  );
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isTouch, setIsTouch] = useState<boolean>(checkTouchDevice);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.onStateChange = (newState) => {
      setIsPlaying(newState === STATE.PLAYING);
    };

    engine.start();
    window.focus();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const updateDevice = () => setIsTouch(checkTouchDevice());
    window.addEventListener('resize', updateDevice);
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

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

  const handleMouseDown = (side: 'left' | 'right') => () => {
    if (side === 'left') engineRef.current?.setTouchLeft(true);
    else engineRef.current?.setTouchRight(true);
  };

  const handleMouseUp = (side: 'left' | 'right') => () => {
    if (side === 'left') engineRef.current?.setTouchLeft(false);
    else engineRef.current?.setTouchRight(false);
  };

  const btnSx = (side: 'left' | 'right') => ({
    position: 'absolute' as const,
    bottom: { xs: 72, sm: 84 },
    [side]: { xs: 18, sm: 26 },
    zIndex: 100,
    width: { xs: 88, sm: 98 },
    height: { xs: 88, sm: 98 },
    borderRadius: '50%',
    border: '2.5px solid rgba(255, 255, 255, 0.85)',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.72) 0%, rgba(29, 78, 216, 0.82) 100%)',
    color: '#FFFFFF',
    fontSize: { xs: 38, sm: 44 },
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    touchAction: 'none',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
    transition: 'transform 0.08s ease, background 0.08s ease',
    '&:active': {
      transform: 'scale(0.90)',
      background: 'radial-gradient(circle, rgba(29, 78, 216, 0.9) 0%, rgba(30, 58, 138, 0.95) 100%)',
    },
  });

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        // On mobile: seamlessly match the sky blue. On PC/Itch: stylish dark gaming backdrop
        background: {
          xs: 'linear-gradient(180deg, #a3d4f5 0%, #6bb6e8 55%, #2e7bc7 100%)',
          md: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 65%, #020617 100%)',
        },
        backgroundColor: { xs: '#6bb6e8', md: '#0f172a' },
        overflow: 'hidden',
        p: { xs: 0, md: 2 },
      }}
    >
      {/* Game Window Container */}
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '9 / 16',
          height: { xs: '100%', md: 'auto' },
          maxHeight: { xs: '100dvh', md: 'min(94dvh, 880px)' },
          width: { xs: 'auto', md: 'auto' },
          maxWidth: { xs: '100vw', md: '500px' },
          boxShadow: {
            xs: 'none',
            md: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(59, 130, 246, 0.25)',
          },
          borderRadius: { xs: 0, md: '20px' },
          border: { xs: 'none', md: '2px solid rgba(255, 255, 255, 0.14)' },
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          tabIndex={0}
          onClick={() => window.focus()}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            touchAction: 'none',
            outline: 'none',
          }}
        />

        {/* Touch controls — shown on mobile or touch-enabled devices during gameplay */}
        {isPlaying && (isTouch || typeof window !== 'undefined') && (
          <>
            <Box
              component="button"
              onTouchStart={handleTouchStart('left')}
              onTouchEnd={handleTouchEnd('left')}
              onTouchCancel={handleTouchEnd('left')}
              onMouseDown={handleMouseDown('left')}
              onMouseUp={handleMouseUp('left')}
              onMouseLeave={handleMouseUp('left')}
              aria-label="Move Left"
              sx={btnSx('left')}
            >
              {'\u25C0'}
            </Box>

            <Box
              component="button"
              onTouchStart={handleTouchStart('right')}
              onTouchEnd={handleTouchEnd('right')}
              onTouchCancel={handleTouchEnd('right')}
              onMouseDown={handleMouseDown('right')}
              onMouseUp={handleMouseUp('right')}
              onMouseLeave={handleMouseUp('right')}
              aria-label="Move Right"
              sx={btnSx('right')}
            >
              {'\u25B6'}
            </Box>
          </>
        )}
      </Box>

      {/* PC / Itch.io Keyboard hint bar */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          gap: 1.5,
          mt: 1.5,
          px: 2.5,
          py: 0.75,
          borderRadius: '9999px',
          bgcolor: 'rgba(30, 41, 59, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#94a3b8',
            fontSize: '0.82rem',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
          }}
        >
          <span style={{ color: '#60a5fa', fontWeight: 600 }}>[A / D]</span> or{' '}
          <span style={{ color: '#60a5fa', fontWeight: 600 }}>[← / →]</span> Move
          <span style={{ color: '#475569', margin: '0 4px' }}>•</span>
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>[P / ESC]</span> Pause
        </Typography>
      </Box>
    </Box>
  );
}
