import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { GameEngine } from '../game/GameEngine';
import { GAME_WIDTH, GAME_HEIGHT, STATE } from '../game/constants';

function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    navigator.maxTouchPoints > 0
  );
}

function isWideScreen(): boolean {
  return window.matchMedia
    ? window.matchMedia('(min-width: 1024px)').matches
    : window.innerWidth >= 1024;
}

function computeDesktop(): boolean {
  return isWideScreen() && !isTouchDevice();
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(computeDesktop);
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
    const onResize = () => setIsDesktop(computeDesktop());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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

  const btnSx = (side: 'left' | 'right') => {
    const base = {
      position: 'absolute' as const,
      bottom: 80,
      [side]: 16,
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
    };
    if (isDesktop) {
      return { ...base, width: 150, height: 150, fontSize: 68, bottom: 48, [side]: 28 };
    }
    return base;
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
          tabIndex={0}
          onClick={() => window.focus()}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            touchAction: 'none',
            outline: 'none',
          }}
        />

        {/* On-screen controls — visible only while playing */}
        {isPlaying && (
          <Box
            component="button"
            onTouchStart={handleTouchStart('left')}
            onTouchEnd={handleTouchEnd('left')}
            onTouchCancel={handleTouchEnd('left')}
            onMouseDown={handleMouseDown('left')}
            onMouseUp={handleMouseUp('left')}
            onMouseLeave={handleMouseUp('left')}
            sx={btnSx('left')}
          >
            {'\u25C0'}
          </Box>
        )}

        {isPlaying && (
          <Box
            component="button"
            onTouchStart={handleTouchStart('right')}
            onTouchEnd={handleTouchEnd('right')}
            onTouchCancel={handleTouchEnd('right')}
            onMouseDown={handleMouseDown('right')}
            onMouseUp={handleMouseUp('right')}
            onMouseLeave={handleMouseUp('right')}
            sx={btnSx('right')}
          >
            {'\u25B6'}
          </Box>
        )}
      </Box>
    </Box>
  );
}
