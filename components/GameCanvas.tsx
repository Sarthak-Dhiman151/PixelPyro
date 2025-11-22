import React, { useRef, useEffect, useCallback } from 'react';
import { PIXEL_SIZE, STAR_COUNT, FIRECRACKER_TYPES } from '../constants';
import { GameState, GameCallbacks } from '../types';
import { Particle, Firework, Boy, createSubBurst } from '../game/entities';
import { SoundManager } from '../services/soundManager';

interface GameCanvasProps {
  gameStarted: boolean;
  currentType: string;
  onMoonHit: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ gameStarted, currentType, onMoonHit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastLaunchRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  
  const gameState = useRef<GameState>({
    width: 0,
    height: 0,
    particles: [],
    fireworks: [],
    boy: null,
    moonHits: 0,
    finaleTimer: 0,
    shakeTimer: 0,
    parents: { active: false, timer: 0, text: '' },
    stars: []
  });

  // --- Drawing Helpers ---
  const generateStars = (width: number, height: number) => {
    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.6, 
        size: Math.random() > 0.8 ? 2 : 1, 
        brightness: Math.random() * 0.5 + 0.5, 
        flickerSpeed: Math.random() * 0.05 + 0.01 
      });
    }
    return stars;
  };

  const drawStars = (ctx: CanvasRenderingContext2D, stars: any[]) => {
    const time = Date.now() / 1000;
    stars.forEach(star => {
      const flicker = Math.sin(time * star.flickerSpeed * 100) * 0.2;
      const alpha = Math.max(0.2, Math.min(1, star.brightness + flicker));
      ctx.fillStyle = `rgba(255, 255, 220, ${alpha})`;
      ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
    });
  };

  const drawHouse = (ctx: CanvasRenderingContext2D, height: number, boy: any, parents: any) => {
    const floorY = height - 10;
    // Modern House Configuration
    const startX = 20;
    const hW = 120; 
    const hH = 130;
    const startY = floorY - hH;

    // 1. Main Structure - Modern Geometric Blocks
    
    // Left Tall Block (White/Stucco)
    ctx.fillStyle = '#e2e8f0'; // Off-white
    ctx.fillRect(startX, startY, hW * 0.5, hH); 
    
    // Right Lower Block (Dark Grey/Concrete)
    ctx.fillStyle = '#334155'; // Slate
    ctx.fillRect(startX + hW * 0.5, startY + hH * 0.3, hW * 0.5, hH * 0.7);

    // Roof Details (Flat roofs)
    ctx.fillStyle = '#0f172a'; 
    ctx.fillRect(startX - 4, startY - 2, hW * 0.5 + 4, 4); // Top roof cap
    ctx.fillRect(startX + hW * 0.5, startY + hH * 0.3 - 2, hW * 0.5 + 4, 4); // Lower roof cap

    // 2. Door (Wood accent)
    const dW = 24; 
    const dH = 45; 
    const dX = startX + 15; 
    const dY = floorY - dH;
    
    ctx.fillStyle = '#7c2d12'; // Dark wood
    ctx.fillRect(dX, dY, dW, dH);
    // Door Frame
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.strokeRect(dX, dY, dW, dH);
    // Handle
    ctx.fillStyle = '#cbd5e1'; // Silver
    ctx.fillRect(dX + 4, dY + 20, 2, 10); // Vertical modern handle

    // Parents Animation Logic
    if (parents && parents.active) {
        const shake = Math.sin(Date.now() / 25) * 2; // Fast jitter
        const pX = dX + 4 + shake; 
        const pY = dY + 10;
        
        // Parent Body (Red for anger)
        ctx.fillStyle = '#dc2626'; 
        ctx.fillRect(pX, pY + 12, 16, 28);
        
        // Parent Head
        ctx.fillStyle = '#ffccaa';
        ctx.fillRect(pX, pY, 16, 12);
        
        // Angry Eyebrows
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pX + 3, pY + 4); ctx.lineTo(pX + 7, pY + 6); // Left \
        ctx.moveTo(pX + 13, pY + 4); ctx.lineTo(pX + 9, pY + 6); // Right /
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(pX + 4, pY + 6, 2, 2);
        ctx.fillRect(pX + 10, pY + 6, 2, 2);
        
        // Yelling Mouth
        ctx.fillRect(pX + 6, pY + 9, 4, 2);

        // Bubble
        const bubbleText = parents.text;
        ctx.font = '10px "Press Start 2P"';
        const textWidth = ctx.measureText(bubbleText).width;
        const bubbleW = textWidth + 12;
        const bubbleH = 22;
        const bubbleX = pX + 8 - (bubbleW / 2); 
        const bubbleY = pY - bubbleH - 8;

        // Bubble Box
        ctx.fillStyle = '#fff'; 
        ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(bubbleX, bubbleY, bubbleW, bubbleH);
        
        // Bubble Tail
        ctx.beginPath();
        ctx.moveTo(pX + 6, bubbleY + bubbleH);
        ctx.lineTo(pX + 12, bubbleY + bubbleH);
        ctx.lineTo(pX + 8, bubbleY + bubbleH + 6);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = '#d60000'; // Angry Red Text
        ctx.fillText(bubbleText, bubbleX + 6, bubbleY + 15);
    }

    // 3. Windows
    
    // Upper Window (Lit when hiding)
    const wx = startX + 10;
    const wy = startY + 20;
    const wW = hW * 0.5 - 20;
    const wH = 40;

    ctx.fillStyle = '#1e293b'; // Frame
    ctx.fillRect(wx - 2, wy - 2, wW + 4, wH + 4);
    
    if (boy && boy.isHiding) { 
        ctx.fillStyle = '#fcd34d'; // Warm light
        ctx.shadowBlur = 20; ctx.shadowColor = '#fcd34d'; 
    } else { 
        ctx.fillStyle = '#475569'; // Unlit glass
        ctx.shadowBlur = 0; 
    }
    ctx.fillRect(wx, wy, wW, wH);
    ctx.shadowBlur = 0;

    // Window Reflection (Diagonal sheen)
    if (!boy?.isHiding) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.moveTo(wx, wy + wH);
        ctx.lineTo(wx + wW, wy);
        ctx.lineTo(wx + wW, wy + 15);
        ctx.lineTo(wx + 15, wy + wH);
        ctx.fill();
    }

    // Lower Wide Window (Right block)
    const lwx = startX + hW * 0.5 + 10;
    const lwy = startY + hH * 0.3 + 20;
    const lwW = hW * 0.5 - 20;
    const lwH = 30;

    ctx.fillStyle = '#1e293b'; // Frame
    ctx.fillRect(lwx - 2, lwy - 2, lwW + 4, lwH + 4);
    ctx.fillStyle = '#0f172a'; // Darker glass
    ctx.fillRect(lwx, lwy, lwW, lwH);

    // 4. Modern Planter
    ctx.fillStyle = '#78350f'; // Wood planter
    ctx.fillRect(startX + hW * 0.5, floorY - 12, hW * 0.5, 12);
    // Plants
    ctx.fillStyle = '#166534';
    for(let i=0; i<5; i++) {
        ctx.beginPath();
        ctx.arc(startX + hW * 0.5 + 10 + (i*10), floorY - 12, 6, Math.PI, 0);
        ctx.fill();
    }
  };

  const drawMoon = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const mx = width * 0.85;
      const my = height * 0.15;
      const r = 45;
      
      // Atmospheric Glow
      const gradient = ctx.createRadialGradient(mx, my, r, mx, my, r * 3.5);
      gradient.addColorStop(0, 'rgba(255, 255, 220, 0.1)'); // Reduced opacity
      gradient.addColorStop(0.5, 'rgba(255, 255, 220, 0.05)');
      gradient.addColorStop(1, 'rgba(255, 255, 220, 0)');
      ctx.fillStyle = gradient; 
      ctx.beginPath(); ctx.arc(mx, my, r * 3.5, 0, Math.PI * 2); ctx.fill();

      // Moon Base
      ctx.fillStyle = '#e2e2d0'; // Less bright, more greyish/natural
      ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();

      // Craters
      ctx.fillStyle = '#a0a090'; // Darker craters
      ctx.globalAlpha = 0.3;

      const craters = [
          { x: -15, y: -10, s: 10 },
          { x: 20, y: 5, s: 8 },
          { x: -5, y: 25, s: 6 },
          { x: 15, y: -20, s: 5 },
          { x: -25, y: 10, s: 4 },
          { x: 5, y: -5, s: 3 }
      ];

      craters.forEach(c => {
          ctx.beginPath(); 
          ctx.arc(mx + c.x, my + c.y, c.s, 0, Math.PI * 2); 
          ctx.fill();
      });
      
      ctx.globalAlpha = 1.0;
  };

  const triggerParents = useCallback(() => {
      const parents = gameState.current.parents;
      if (!parents.active) {
          parents.active = true;
          parents.timer = 200; 
          const texts = ['>:O', '>:|', '(>_<)', '#@&%!', '!!!', 'STOP!'];
          parents.text = texts[Math.floor(Math.random() * texts.length)];
          SoundManager.playTone(120, 'sawtooth', 0.4, 0.2); 
          if (gameState.current.boy && !gameState.current.boy.isHiding) {
              gameState.current.boy.runHide();
          }
      }
  }, []);

  const shakeScreen = useCallback((duration: number) => {
      gameState.current.shakeTimer = duration;
  }, []);

  // --- Core Loop ---
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, fireworks, particles, boy, parents, stars } = gameState.current;

    if (!width || !height) {
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    // Logic Updates
    if (parents.active) {
        parents.timer--;
        if (parents.timer <= 0) parents.active = false;
    }

    if (gameState.current.finaleTimer > 0) {
        gameState.current.finaleTimer--;
        if (gameState.current.finaleTimer % 15 === 0) {
            const aerialTypes = FIRECRACKER_TYPES.filter(t => t.category === 'Aerial');
            const randomType = aerialTypes[Math.floor(Math.random() * aerialTypes.length)];
            const rx = Math.random() * width;
            const ry = height * (0.1 + Math.random() * 0.4);
            gameState.current.fireworks.push(new Firework(rx, height - 10, randomType.id, ry, width));
        }
    }

    // Shake Logic (CSS Transform for better performance/look)
    if (gameState.current.shakeTimer > 0) {
        const intensity = Math.min(gameState.current.shakeTimer, 10);
        const dx = (Math.random() - 0.5) * intensity;
        const dy = (Math.random() - 0.5) * intensity;
        canvas.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        gameState.current.shakeTimer--;
    } else if (canvas.style.transform !== 'none') {
        canvas.style.transform = 'none';
    }

    // Draw Background (Trails)
    ctx.fillStyle = 'rgba(5, 5, 16, 0.2)';
    ctx.fillRect(0, 0, width, height);

    drawStars(ctx, stars);
    drawMoon(ctx, width, height);
    drawHouse(ctx, height, boy, parents);

    ctx.fillStyle = '#111';
    ctx.fillRect(0, height - 10, width, 10);

    if (boy) {
      // Update now takes particles for sparkler effect
      boy.update(fireworks, particles, width);
      boy.draw(ctx, particles);
    }

    const callbacks: GameCallbacks = { triggerParents, shakeScreen };

    // Update Fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update(particles, fireworks, boy, callbacks);
      fireworks[i].draw(ctx);
      if (fireworks[i].dead) fireworks.splice(i, 1);
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      // Pass bounds and particles array for complex updates (Dragon logic)
      particles[i].update({width, height}, particles);
      particles[i].draw(ctx);
      if (particles[i].life <= 0) {
        if (particles[i].hasSubBurst) {
          createSubBurst(particles[i], particles);
        }
        particles.splice(i, 1);
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [triggerParents, shakeScreen]);

  // --- Handlers ---
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;
    const parent = canvasRef.current.parentElement;
    if (!parent) return;
    
    const rect = parent.getBoundingClientRect();
    canvasRef.current.width = rect.width;
    canvasRef.current.height = rect.height;
    
    gameState.current.width = rect.width;
    gameState.current.height = rect.height;
    gameState.current.stars = generateStars(rect.width, rect.height);

    if (!gameState.current.boy) {
      gameState.current.boy = new Boy(100, rect.height - 10 - (PIXEL_SIZE * 6));
    } else {
      gameState.current.boy.baseY = rect.height - 10 - (PIXEL_SIZE * 6);
      if (!gameState.current.boy.isHiding) gameState.current.boy.y = gameState.current.boy.baseY;
    }
  }, []);

  const processInput = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    
    SoundManager.init();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { width, height, boy } = gameState.current;

    // Check Moon
    const mx = width * 0.85;
    const my = height * 0.15;
    const distMoon = Math.sqrt(Math.pow(x - mx, 2) + Math.pow(y - my, 2));
    if (distMoon < 50) {
      gameState.current.fireworks.push(new Firework(mx, my, 'moon_shot', height, width));
      gameState.current.moonHits = (gameState.current.moonHits || 0) + 1;
      if (gameState.current.moonHits >= 3) {
          gameState.current.moonHits = 0;
          gameState.current.finaleTimer = 300; 
          onMoonHit();
      }
      return;
    }

    // Check Boy Interaction
    if (boy && !boy.isHiding &&
        x >= boy.x && x <= boy.x + boy.width &&
        y >= boy.y - 10 && y <= boy.y + boy.height) {
      boy.interact();
      return;
    }

    // Launch Firework
    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      gameState.current.fireworks.push(new Firework(x, y, currentType, height, width));
    }
  };

  const handleInput = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gameStarted) return;
    
    // Throttle move events
    if (e.type === 'mousemove' || e.type === 'touchmove') {
        if (Date.now() - lastLaunchRef.current < 80) return; // Throttle to ~12fps spawn rate for dragging
    }
    lastLaunchRef.current = Date.now();
    
    let clientX, clientY;
    if ('changedTouches' in e) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    processInput(clientX, clientY);
  };

  // Helper wrappers for drag support
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
      isDraggingRef.current = true;
      handleInput(e);
  };

  const handleEnd = () => {
      isDraggingRef.current = false;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      handleInput(e);
  };

  // --- Effects ---
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (gameStarted) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameStarted, animate]);

  return (
    <div className="flex-1 relative w-full overflow-hidden bg-[#050510] border-b-4 border-white box-border touch-none">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full block image-pixelated"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
    </div>
  );
};