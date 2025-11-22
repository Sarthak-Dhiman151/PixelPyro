
import { PIXEL_SIZE, FIRECRACKER_TYPES } from '../constants';
import { SoundManager } from '../services/soundManager';
import { GameCallbacks } from '../types';

export class Particle {
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;
  friction: number;
  flicker: boolean;
  hasSubBurst: boolean | string;
  isSmoke: boolean;
  
  // New properties for behaviors
  behavior: string = 'normal';
  heading: number = 0;
  wobble: number = 0;

  constructor(x: number, y: number, color: string, velocity: {x: number, y: number}, life: number, sizeMultiplier = 1, gravity = 0.05, friction = 0.95, hasSubBurst: boolean | string = false, isSmoke: boolean = false) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = velocity.x;
    this.vy = velocity.y;
    this.life = life;
    this.maxLife = life;
    this.size = PIXEL_SIZE * sizeMultiplier;
    this.gravity = gravity;
    this.friction = friction;
    this.flicker = !isSmoke && Math.random() > 0.8;
    this.hasSubBurst = hasSubBurst;
    this.isSmoke = isSmoke;
  }

  update(bounds?: {width: number, height: number}, newParticles?: Particle[]) {
    if (this.behavior === 'dragon_head' && bounds && newParticles) {
        this.life--;
        
        // Movement Logic - Winding Path
        this.wobble += 0.2;
        
        // Change heading based on wobble (sine) and some randomness
        this.heading += Math.sin(this.wobble) * 0.15 + (Math.random() - 0.5) * 0.1;
        
        // Soft boundaries - steer back to center
        const margin = 100;
        if (this.x < margin) this.heading += 0.05;
        if (this.x > bounds.width - margin) this.heading -= 0.05;
        if (this.y < margin) this.heading += 0.05;
        if (this.y > bounds.height - 150) this.heading -= 0.05;

        const speed = 8;
        this.vx = Math.cos(this.heading) * speed;
        this.vy = Math.sin(this.heading) * speed;
        
        this.x += this.vx;
        this.y += this.vy;

        // Hard bounce safety
        if (this.x < 0 || this.x > bounds.width) {
            this.vx *= -1;
            this.x = Math.max(0, Math.min(bounds.width, this.x));
            this.heading = Math.atan2(this.vy, this.vx);
        }
        if (this.y < 0 || this.y > bounds.height) {
             this.vy *= -1;
             this.y = Math.max(0, Math.min(bounds.height, this.y));
             this.heading = Math.atan2(this.vy, this.vx);
        }

        // Emit Body Segment (Trail)
        // Pulsating color
        const hue = (Date.now() / 5 + this.life * 2) % 360;
        // Body segments persist for a bit to create the snake effect
        const bodySize = 2.0 + Math.sin(this.life * 0.2) * 0.5;
        
        const p = new Particle(
            this.x, this.y, 
            `hsl(${hue}, 100%, 50%)`, 
            {x: 0, y: 0}, 
            50, // Life of body segment
            bodySize, 
            0, // No gravity for body
            0.9
        );
        
        // Occasional fire/smoke from body
        if (Math.random() > 0.7) {
            p.flicker = true;
        }
        newParticles.push(p);
        
    } else {
        // Standard Physics
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.flicker && Math.random() > 0.5) return;
    
    // Special Dragon Head Rendering
    if (this.behavior === 'dragon_head') {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.heading);
        
        const ps = PIXEL_SIZE;
        
        // Main Head Block
        ctx.fillStyle = '#D4AF37'; // Gold
        ctx.fillRect(-ps*2, -ps*2, ps*4, ps*4);
        
        // Snout
        ctx.fillStyle = '#C5A028';
        ctx.fillRect(ps, -ps, ps*2, ps*2);
        
        // Eyes (Red and glowing)
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, -ps*2, ps, ps);
        ctx.fillRect(0, ps, ps, ps);
        
        // Horns/Whiskers
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-ps*2, -ps*3, ps, ps*2); // Top Horn
        ctx.fillRect(-ps*2, ps*2, ps, ps*2);  // Bottom Horn
        
        ctx.restore();
        return;
    }
    
    if (this.isSmoke) {
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    }
    
    ctx.fillStyle = this.color;
    if (this.isSmoke) {
        ctx.beginPath();
        ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillRect(Math.floor(this.x), Math.floor(this.y), this.size, this.size);
    }

    if (this.isSmoke) {
        ctx.globalAlpha = 1.0;
    }
  }
}

type BehaviorState = 'IDLE' | 'WALKING' | 'RUNNING_HOME' | 'HIDING' | 'PEEKING' | 'WATCHING' | 'COWERING' | 'CELEBRATING' | 'LIGHTING';

export class Boy {
  x: number;
  baseY: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  speed: number;
  
  // State Machine
  state: BehaviorState;
  stateTimer: number;
  
  // Animation
  walkFrame: number;
  facingDir: number; // 1 for right, -1 for left
  
  // Emotion Bubble
  currentEmotion: string;
  emotionTimer: number;
  
  // World constants
  houseDoorX: number;
  
  constructor(x: number, baseY: number) {
    this.x = x;
    this.baseY = baseY;
    this.y = baseY;
    this.width = PIXEL_SIZE * 3;
    this.height = PIXEL_SIZE * 6;
    this.targetX = x;
    this.speed = 0.5;
    this.walkFrame = 0;
    this.facingDir = 1;
    
    this.state = 'IDLE';
    this.stateTimer = 60;
    
    this.currentEmotion = '';
    this.emotionTimer = 0;
    this.houseDoorX = 65;
  }

  get isHiding(): boolean {
    return this.state === 'HIDING' || this.state === 'PEEKING';
  }

  runHide() {
    this.targetX = this.houseDoorX;
    this.setState('RUNNING_HOME');
  }

  setState(newState: BehaviorState, duration: number = 60) {
      if (this.state === newState && this.state !== 'WALKING') return;
      // Priority check: Don't override Hiding/Running unless safe
      if (this.state === 'RUNNING_HOME' && newState !== 'HIDING') return;
      if (this.state === 'HIDING' && newState !== 'PEEKING' && newState !== 'IDLE') return;
      
      this.state = newState;
      this.stateTimer = duration;
      
      // Reset animations
      if (newState === 'IDLE' || newState === 'WATCHING') this.walkFrame = 0;
      
      // Set emotions based on state transition
      if (newState === 'RUNNING_HOME') this.setEmotion('!!!');
      if (newState === 'COWERING') this.setEmotion('>.<');
      if (newState === 'CELEBRATING') this.setEmotion('^o^');
      if (newState === 'WATCHING') this.setEmotion('O_O');
  }

  setEmotion(emo: string, duration: number = 60) {
      this.currentEmotion = emo;
      this.emotionTimer = duration;
  }

  checkSurroundings(fireworks: Firework[]) {
    if (this.state === 'HIDING' || this.state === 'PEEKING') return;

    let nearestDangerDist = 9999;
    let nearestBeautyDist = 9999;
    let loudestBoomDist = 9999;

    fireworks.forEach(fw => {
        const dist = Math.abs(fw.x - this.x);
        const isGround = ['anar', 'chakri', 'flower_pot', 'sutli', 'garland', 'ladi', 'c4', 'double_bomb', 'petrol_bomb', 'smoke_bomb', 'flash_bang', 'molotov'].includes(fw.type);
        const isLoud = ['sutli', 'c4', 'mega_shot', 'double_bomb', 'petrol_bomb', 'flash_bang'].includes(fw.type);
        const isAerial = !isGround;

        // Danger Logic
        if (isGround && dist < 120 && fw.life > 0) {
             nearestDangerDist = Math.min(nearestDangerDist, dist);
        }

        // Cower Logic (Active explosions nearby)
        if (isLoud && dist < 200 && fw.life < 10 && fw.life > 0) {
            loudestBoomDist = Math.min(loudestBoomDist, dist);
        }

        // Watching Logic (Rockets going up)
        if (isAerial && fw.vy < -2 && dist < 300) {
            nearestBeautyDist = Math.min(nearestBeautyDist, dist);
        }
    });

    // 1. Self Preservation
    if (nearestDangerDist < 100) {
        this.targetX = this.houseDoorX;
        this.setState('RUNNING_HOME');
        return;
    }

    // 2. Reaction to Noise
    if (loudestBoomDist < 150) {
        this.setState('COWERING', 40);
        return;
    }

    // 3. Appreciation
    if (this.state === 'IDLE' || this.state === 'WALKING') {
        if (nearestBeautyDist < 200 && Math.random() < 0.05) {
            this.setState('WATCHING', 100);
            this.facingDir = Math.sign(this.houseDoorX + 200 - this.x); // Look generally towards center
        }
    }
  }

  interact() {
    if (this.state === 'HIDING') return;
    this.setState('CELEBRATING', 60);
    this.y = this.baseY - 10; // Jump
  }

  handleSparkler(particles: Particle[]) {
    if (['HIDING', 'PEEKING', 'COWERING', 'RUNNING_HOME'].includes(this.state)) return;

    const ps = PIXEL_SIZE;
    let hx = this.x;
    let hy = this.y;
    
    // Calculate offset relative to body center based on state animations
    let offX = 0;
    let offY = 0;

    if (this.state === 'WALKING') {
        const swing = Math.sin(this.walkFrame * 0.5) * ps;
        offX = ps * 1.5 + swing;
        offY = ps * 2;
    } else if (this.state === 'CELEBRATING') {
        offX = ps * 3;
        offY = -ps;
    } else if (this.state === 'LIGHTING') {
        offX = ps * 3; 
        offY = ps * 3;
    } else {
        // IDLE
        offX = ps * 1; 
        offY = ps * 2;
    }

    // Adjust for facing direction and convert to world space
    // Rod tip calculation
    if (this.facingDir === 1) {
        hx += offX;
        hy += offY;
        // Tip of rod
        if (this.state === 'LIGHTING') { hx += 4; hy += 4; }
        else { hx += 1; hy -= 5; }
    } else {
        hx = (this.x + this.width) - offX;
        hy += offY;
         if (this.state === 'LIGHTING') { hx -= 4; hy += 4; }
        else { hx -= 1; hy -= 5; }
    }

    // Emit sparkles
    if (Math.random() < 0.5) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.5 + 0.2;
        const p = new Particle(hx, hy, '#fff', {
            x: Math.cos(angle) * speed, 
            y: Math.sin(angle) * speed
        }, 5 + Math.random() * 8, 0.5, 0.02, 0.85);
        p.color = Math.random() > 0.5 ? '#ffd700' : '#ffffff';
        p.flicker = true;
        particles.push(p);
    }
  }

  update(fireworks: Firework[], particles: Particle[], width: number) {
    // Decrement Timers
    if (this.stateTimer > 0) this.stateTimer--;
    if (this.emotionTimer > 0) this.emotionTimer--;

    // Sparkler
    this.handleSparkler(particles);

    // AI Logic based on State
    switch (this.state) {
        case 'HIDING':
            if (this.stateTimer <= 0) {
                this.setState('PEEKING', 60);
            }
            return; // Don't process movement or sensors
            
        case 'PEEKING':
            if (this.stateTimer <= 0) {
                // Safe to emerge?
                let safe = true;
                fireworks.forEach(fw => {
                    if (Math.abs(fw.x - this.houseDoorX) < 100) safe = false;
                });
                
                if (safe) {
                    this.x = this.houseDoorX;
                    this.y = this.baseY;
                    this.targetX = this.houseDoorX + 50;
                    this.setState('WALKING', 60);
                    this.setEmotion('Safe');
                } else {
                    this.setState('HIDING', 60); // Hide again
                }
            }
            return;

        case 'RUNNING_HOME':
            this.speed = 3.5;
            if (Math.abs(this.x - this.houseDoorX) < 5) {
                this.setState('HIDING', 200);
                this.currentEmotion = '';
            }
            break;

        case 'COWERING':
            // Tremble
            this.x += (Math.random() - 0.5) * 2;
            this.speed = 0;
            break;

        case 'WATCHING':
            this.speed = 0;
            if (this.stateTimer <= 0) this.setState('IDLE');
            break;

        case 'CELEBRATING':
            this.speed = 0;
            // Jump logic
            if (this.stateTimer % 20 < 10) this.y = this.baseY - 5;
            else this.y = this.baseY;
            
            if (this.stateTimer <= 0) this.setState('IDLE');
            break;
            
        case 'LIGHTING':
             this.speed = 0;
             if (this.stateTimer === 10) {
                 // Spawn firework
                const randomType = FIRECRACKER_TYPES[Math.floor(Math.random() * FIRECRACKER_TYPES.length)];
                fireworks.push(new Firework(this.x + (this.facingDir * 20), this.baseY - 10, randomType.id, this.baseY + this.height));
                this.setEmotion('Run!');
             }
             if (this.stateTimer <= 0) {
                 // Run away after lighting
                 this.targetX = this.x - (this.facingDir * 100);
                 this.targetX = Math.max(20, Math.min(width - 20, this.targetX));
                 this.setState('RUNNING_HOME'); // Re-use running anim, but target is set above
                 this.state = 'WALKING'; // Override to normal run speed not panic speed
                 this.speed = 2;
             }
             break;

        case 'IDLE':
            this.speed = 0;
            this.checkSurroundings(fireworks);
            
            if (this.stateTimer <= 0) {
                // Decide next move
                const r = Math.random();
                // Increased chance to 30% for lighting cracker if few exist
                if (r < 0.3 && fireworks.length < 6) {
                    this.setState('LIGHTING', 60);
                } else if (r < 0.7) {
                    this.targetX = 80 + Math.random() * (width - 100);
                    this.setState('WALKING', 100 + Math.random() * 100);
                } else {
                    this.stateTimer = 60 + Math.random() * 60; // Stay idle
                }
            }
            break;

        case 'WALKING':
            this.speed = 1;
            this.checkSurroundings(fireworks);
            if (Math.abs(this.x - this.targetX) < 5 || this.stateTimer <= 0) {
                this.setState('IDLE', 60);
            }
            break;
    }

    // Movement Physics
    if (this.state !== 'IDLE' && this.state !== 'WATCHING' && this.state !== 'COWERING' && this.state !== 'LIGHTING' && this.state !== 'CELEBRATING') {
        const dist = this.targetX - this.x;
        if (Math.abs(dist) > 2) {
            const dir = Math.sign(dist);
            this.x += dir * this.speed;
            this.facingDir = dir;
            this.walkFrame++;
        }
    }
    
    // Keep within bounds
    this.x = Math.max(20, Math.min(width - 20, this.x));
  }

  draw(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    // Handle Peeking separately
    if (this.state === 'PEEKING') {
        const bX = this.houseDoorX + 10;
        const bY = this.baseY;
        const ps = PIXEL_SIZE;
        
        // Just draw head peeking out
        ctx.fillStyle = '#ffccaa'; 
        ctx.fillRect(bX, bY, ps * 3, ps * 2); // Head
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(bX + ps * 2, bY + ps * 0.5, 2, 2);
        return;
    }

    if (this.state === 'HIDING') return;

    const bX = Math.floor(this.x);
    const bY = Math.floor(this.y);
    const ps = PIXEL_SIZE;

    // Draw Bubble
    if (this.emotionTimer > 0 && this.currentEmotion) {
      ctx.font = '10px "Press Start 2P", monospace';
      const textWidth = ctx.measureText(this.currentEmotion).width;
      const bubbleW = textWidth + 10;
      const bubbleH = 20;
      const bubbleX = bX + (this.width / 2) - (bubbleW / 2);
      const bubbleY = bY - bubbleH - 10;

      ctx.fillStyle = '#fff'; ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(bubbleX, bubbleY, bubbleW, bubbleH);
      ctx.beginPath(); ctx.moveTo(bX + this.width/2 - 4, bubbleY + bubbleH); ctx.lineTo(bX + this.width/2 + 4, bubbleY + bubbleH); ctx.lineTo(bX + this.width/2, bubbleY + bubbleH + 6); ctx.fill();
      ctx.fillStyle = '#000'; ctx.fillText(this.currentEmotion, bubbleX + 5, bubbleY + 14);
    }

    // Body flip transform logic
    ctx.save();
    if (this.facingDir === -1) {
        ctx.translate(bX + this.width, bY);
        ctx.scale(-1, 1);
        ctx.translate(-bX, -bY);
    }

    // --- HEAD ---
    ctx.fillStyle = '#ffccaa'; 
    ctx.fillRect(bX, bY, ps * 3, ps * 2); 
    
    // Eyes
    ctx.fillStyle = '#000';
    if (this.state === 'COWERING') {
        // > < eyes
        // Left >
        ctx.fillRect(bX + 1, bY + 2, 2, 2); 
        ctx.fillRect(bX + 3, bY + 4, 2, 2);
        ctx.fillRect(bX + 1, bY + 6, 2, 2);
    } else if (this.state === 'WATCHING') {
        // Look up
        ctx.fillRect(bX + ps * 2, bY, 2, 2);
    } else {
        // Normal
        ctx.fillRect(bX + ps * 2, bY + ps * 0.5, 2, 2);
    }

    // --- SHIRT ---
    ctx.fillStyle = '#3366ff'; 
    ctx.fillRect(bX, bY + ps * 2, ps * 3, ps * 2); 

    // --- ARMS ---
    ctx.fillStyle = '#ffccaa';
    
    if (this.state === 'COWERING') {
        // Hands on head
        ctx.fillRect(bX - ps, bY, ps, ps); // Left ear
        ctx.fillRect(bX + ps * 3, bY, ps, ps); // Right ear
    } 
    else if (this.state === 'CELEBRATING') {
        // Hands up
        ctx.fillRect(bX - ps, bY - ps, ps, ps * 2); 
        ctx.fillRect(bX + ps * 3, bY - ps, ps, ps * 2);
        // Rod in Right Hand (which is ps*3)
        ctx.fillStyle = '#ccc';
        ctx.fillRect(bX + ps * 3, bY - ps - 5, 2, 6);
    } 
    else if (this.state === 'LIGHTING') {
        // Reaching down
        ctx.fillRect(bX + ps * 3, bY + ps * 3, ps, ps);
        // Rod angle down
        ctx.save();
        ctx.translate(bX + ps * 3.5, bY + ps * 3.5);
        ctx.rotate(Math.PI/4);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, 6, 2);
        ctx.restore();
    }
    else if (this.state === 'WALKING' || this.state === 'RUNNING_HOME') {
        // Swinging
        const swing = Math.sin(this.walkFrame * 0.5) * ps;
        const armX = bX + ps * 1.5 + swing;
        ctx.fillRect(armX, bY + ps * 2, ps, ps);
        
        // Rod logic for walking (only if not running home in panic)
        if (this.state === 'WALKING') {
            ctx.fillStyle = '#ccc';
            ctx.fillRect(armX + 1, bY + ps * 2 - 5, 2, 6);
        }
    } 
    else {
        // Idle arms
        const armX = bX + ps * 1;
        ctx.fillRect(armX, bY + ps * 2, ps, ps);
        
        // Rod in hand
        ctx.fillStyle = '#ccc';
        ctx.fillRect(armX + 1, bY + ps * 2 - 5, 2, 6);
    }

    // --- LEGS ---
    ctx.fillStyle = '#222'; 
    if (this.state === 'WALKING' || this.state === 'RUNNING_HOME') {
      if (Math.floor(this.walkFrame / 5) % 2 === 0) {
          ctx.fillRect(bX, bY + ps * 4, ps, ps * 2);
      } else {
          ctx.fillRect(bX + ps * 2, bY + ps * 4, ps, ps * 2);
      }
    } 
    else if (this.state === 'LIGHTING') {
        // Kneelingish
        ctx.fillRect(bX, bY + ps * 4, ps * 3, ps);
    }
    else {
      ctx.fillRect(bX, bY + ps * 4, ps, ps * 2); 
      ctx.fillRect(bX + ps * 2, bY + ps * 4, ps, ps * 2);
    }

    ctx.restore();
  }
}

export class Firework {
  type: string;
  x: number;
  y: number;
  targetY: number | undefined;
  dead: boolean;
  timer: number;
  height: number;
  width: number;
  vx: number;
  vy: number;
  life: number;
  gravity: number;
  
  // Specific properties
  anarVariant: number;
  anarIntensity: number;
  chakriTheme: string[];
  chakriSpeed: number;
  chakriDir: number;
  skyshotHue: number;
  skyshotType: string;
  smokeColor?: string;
  garlandProgress: number;
  flowerPotPhase: number;
  
  // Helper properties for complex fireworks
  arcTotalShots?: number;
  arcShotsRemaining?: number;
  arcShotDelay?: number;
  arcSpread?: number;
  arcHue?: number;
  fountainShots?: number;
  fountainDelay?: number;
  customHue?: number;
  customShape?: string;
  isFinale?: boolean;

  // Cross Sky randomized properties
  crossSkyColor?: string;
  crossSkySize?: number;
  crossSkyHue?: number;

  // Double Shot State
  midPathExplosionDone: boolean;

  constructor(x: number, targetY: number | undefined, type: string, height: number, width: number = 800) {
    this.type = type;
    this.x = x;
    this.y = height - 10;
    this.targetY = targetY;
    this.dead = false;
    this.timer = 0;
    this.height = height;
    this.width = width;
    this.vx = 0;
    this.vy = 0;
    this.life = 100;
    this.gravity = 0.05;

    this.midPathExplosionDone = false;
    this.garlandProgress = 0;
    this.flowerPotPhase = 0;

    this.anarVariant = Math.floor(Math.random() * 4);
    this.anarIntensity = 0.8 + Math.random() * 0.5;
    
    const chakriThemes = [['#ff0000', '#00ff00'], ['#00ffff', '#ffff00'], ['#ff00ff', '#ffffff']];
    this.chakriTheme = chakriThemes[Math.floor(Math.random() * chakriThemes.length)];
    this.chakriSpeed = 0.2 + Math.random() * 0.2;
    this.chakriDir = Math.random() > 0.5 ? 1 : -1;
    
    this.skyshotHue = Math.floor(Math.random() * 360);
    this.skyshotType = Math.random() > 0.6 ? 'multi' : 'mono';

    // Initialization logic based on type
    if (['rocket', 'skyshot', 'twinkler', 'double', 'arc', 'spark_bomb', 'moon_shot', 'fountain_shot', 'cyclone', 'palm', 'cross_sky_shot', 'flower_shot'].includes(type)) {
      SoundManager.playLaunch();
    } else if (type === 'mega_shot' || type === 'dragon' || type === 'japanese_skyshot' || type === 'indian_skyshot') {
      SoundManager.playLaunch('heavy'); 
    } else if (['sutli', 'c4', 'double_bomb', 'petrol_bomb', 'flash_bang', 'smoke_grenade', 'molotov'].includes(type)) {
      SoundManager.playExplosion('pop', 0.1); 
    } else if (type === 'anar' || type === 'chakri' || type === 'smoke_bomb' || type === 'flower_pot') {
      SoundManager.playSparkle(0.1);
    } else if (type === 'garland') {
      SoundManager.playExplosion('pop', 0.05);
    }

    this.initMovement();
  }

  initMovement() {
    if (this.type === 'cross_sky_shot') {
        this.life = 80 + Math.floor(Math.random() * 60); 
        const startLeft = this.x < this.width / 2;
        const targetX = startLeft 
            ? (this.width * 0.6 + Math.random() * this.width * 0.3) 
            : (this.width * 0.1 + Math.random() * this.width * 0.3);
        this.vx = (targetX - this.x) / this.life; 
        this.vy = -12 - Math.random() * 6;
        this.crossSkyHue = Math.random() * 360;
        this.crossSkyColor = `hsl(${this.crossSkyHue}, 100%, 60%)`;
        this.crossSkySize = PIXEL_SIZE * (1 + Math.random() * 2); 

    } else if (this.type === 'arc') {
        this.arcTotalShots = 4 + Math.floor(Math.random() * 4);
        this.arcShotsRemaining = this.arcTotalShots;
        this.arcShotDelay = 0;
        this.life = 200;
        this.arcSpread = (Math.PI / 6) + Math.random() * (Math.PI / 4);
        this.arcHue = Math.random() * 360;
    } else if (this.type === 'fountain_shot') {
        this.fountainShots = 5 + Math.floor(Math.random() * 3); 
        this.fountainDelay = 0;
        this.life = 250;
    } else if (this.type === 'moon_shot') {
        this.vy = -18;
    } else if (this.type === 'japanese_skyshot') {
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = -14 - Math.random() * 2; 
    } else if (this.type === 'indian_skyshot') {
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = -15 - Math.random() * 3; // High launch
    } else if (this.type === 'mega_shot') {
        this.vx = (Math.random() - 0.5) * 1; 
        this.vy = -14; 
    } else if (['rocket', 'skyshot', 'twinkler', 'double', 'spark_bomb', 'cyclone', 'palm', 'dragon', 'flower_shot'].includes(this.type)) {
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -12 - Math.random() * 5;
    } else {
        // Ground items
        if (this.type === 'ladi') this.life = 120;
        else if (this.type === 'garland') this.life = 150;
        else if (this.type === 'sutli') this.life = 60;
        else if (this.type === 'anar') this.life = 80 + Math.random() * 40;
        else if (this.type === 'flower_pot') this.life = 180;
        else if (this.type === 'smoke_bomb') {
            this.life = 300 + Math.random() * 100;
            this.smokeColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
        }
        else if (this.type === 'c4') this.life = 120;
        else if (this.type === 'double_bomb') this.life = 60; 
        else if (this.type === 'double_bomb_2') this.life = 15; 
        else if (this.type === 'petrol_bomb' || this.type === 'molotov' || this.type === 'smoke_grenade') this.life = 80; 
        else if (this.type === 'flash_bang') this.life = 50;
        else this.life = 100 + Math.random() * 50;
    }
  }

  update(particles: Particle[], fireworks: Firework[], boy: Boy | null, callbacks: GameCallbacks) {
    // Basic movement updates
    if (this.type === 'cyclone') {
        this.vx = Math.sin(this.y * 0.1) * 6; 
        this.vy += 0.15;
        this.x += this.vx;
        this.y += this.vy;
        if (Math.random() > 0.2) particles.push(new Particle(this.x, this.y, '#00ffcc', {x:0, y:0}, 15, 0.8));
        if (this.vy >= 0 || (this.targetY && this.y <= this.targetY)) this.explode(particles, boy, fireworks, callbacks);
        return;
    }

    if (['rocket', 'skyshot', 'twinkler', 'double', 'spark_bomb', 'moon_shot', 'palm', 'mega_shot', 'mega_burst', 'dragon', 'cross_sky_shot', 'japanese_skyshot', 'indian_skyshot', 'flower_shot'].includes(this.type)) {
        this.vy += 0.15;
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'cross_sky_shot') this.life--;

        // --- PERSISTENT TRAIL LOGIC ---
        let trailChance = 0.3;
        let trailColor = '#555';
        let trailLife = 15;
        let trailSize = 1.0;
        let trailGravity = 0.02;

        if (this.type === 'dragon') {
            trailChance = 0.8;
            trailColor = `hsl(${40 + Math.random() * 20}, 100%, 50%)`;
            trailLife = 25;
            trailSize = 1.2;
        } else if (this.type === 'mega_shot') {
            trailChance = 0.9;
            trailColor = `hsl(${350 + Math.random() * 20}, 70%, 50%)`;
            trailLife = 30;
            trailSize = 1.5;
        } else if (this.type === 'rocket') {
            trailChance = 0.6;
            const lightness = 40 + Math.random() * 20;
            trailColor = `hsl(0, 0%, ${lightness}%)`;
            trailLife = 20;
        } else if (this.type === 'japanese_skyshot') {
            trailChance = 0.4;
            trailColor = '#ffd700'; // Gold trail
            trailLife = 25;
            trailSize = 1.2;
        } else if (this.type === 'indian_skyshot') {
            trailChance = 0.5;
            trailColor = '#ffcc00'; // Golden glitter
            trailLife = 20;
            trailSize = 1.0;
        } else if (this.type === 'flower_shot') {
            trailChance = 0.4;
            trailColor = '#ffb7c5'; // Light pink trail
            trailLife = 20;
            trailSize = 1.0;
        } else if (this.type === 'cross_sky_shot') {
            trailChance = 0.5;
            if (this.crossSkyHue !== undefined) {
                const hueVar = (Math.random() - 0.5) * 30;
                trailColor = `hsl(${this.crossSkyHue + hueVar}, 100%, 60%)`;
            } else {
                trailColor = this.crossSkyColor || '#fff';
            }
            trailLife = 20;
            trailSize = (this.crossSkySize || PIXEL_SIZE) / PIXEL_SIZE * 0.8;
        } else if (this.type === 'double') {
            trailColor = `hsl(${300 + Math.random() * 40}, 100%, 60%)`;
            trailChance = 0.5;
        } else {
             if (Math.random() > 0.5) {
                 trailColor = `hsl(0, 0%, ${30 + Math.random() * 20}%)`;
             }
        }

        if (Math.random() < trailChance) {
            const offsetX = (Math.random() - 0.5) * 2;
            const p = new Particle(this.x + offsetX, this.y, trailColor, {x:0, y:0}, trailLife, trailSize, trailGravity);
            if (this.type === 'indian_skyshot') p.flicker = true;
            particles.push(p);
        }

        // --- DOUBLE SHOT MID-PATH EXPLOSION ---
        if (this.type === 'double' && !this.midPathExplosionDone && this.vy > -8 && this.vy < -6) {
            this.midPathExplosionDone = true;
            SoundManager.playExplosion('standard', 0.6);
            const hue = Math.random() * 360;
            for(let i=0; i<20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 4 + 2;
                particles.push(new Particle(this.x, this.y, `hsl(${hue}, 100%, 60%)`, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 20, 1.0));
            }
        }
        
        if (this.type === 'cross_sky_shot') {
            if (this.life <= 0 || this.vy > 5) {
                this.explode(particles, boy, fireworks, callbacks);
            }
        } else {
            if (this.vy >= 0 || (this.targetY && this.y <= this.targetY)) {
                 this.explode(particles, boy, fireworks, callbacks);
            }
        }
        return;
    }

    // Complex stationary/ground logic
    this.life--;
    if (this.life <= 0 && !['arc', 'fountain_shot'].includes(this.type)) {
        this.explode(particles, boy, fireworks, callbacks);
    } else if (this.type === 'arc' || this.type === 'fountain_shot') {
        this.handleMultiShot(particles, fireworks);
    } else if (this.type === 'chakri') {
        this.handleChakri(particles);
    } else if (this.type === 'anar') {
        this.handleAnar(particles);
    } else if (this.type === 'flower_pot') {
        this.handleFlowerPot(particles);
    } else if (this.type === 'smoke_bomb') {
        this.handleSmokeBomb(particles);
    } else if (this.type === 'garland') {
        this.handleGarland(particles, boy, callbacks);
    } else if (this.type === 'ladi') {
        this.timer++;
        if (this.timer % 6 === 0) {
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 10;
            this.createMiniExplosion(this.x + offsetX, this.y + offsetY, particles, boy, callbacks);
        }
        if (this.life <= 0) this.dead = true;
    }
  }

  handleSmokeBomb(particles: Particle[]) {
    if (this.life <= 0) this.dead = true;
    if (Math.random() < 0.15) SoundManager.playSparkle(0.05);
    
    const emissionRate = 2;
    for(let i=0; i<emissionRate; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.0; 
        const speed = Math.random() * 2 + 1;
        const size = 3 + Math.random() * 3; 
        const life = 100 + Math.random() * 100;
        
        // Randomly vary the shade slightly
        // Smoke particles float UP (negative gravity)
        const p = new Particle(
            this.x, 
            this.y - 5, 
            this.smokeColor || '#888', 
            {x: Math.cos(angle) * speed * 0.5, y: Math.sin(angle) * speed}, 
            life, 
            size, 
            -0.01, // Negative gravity makes it float up
            0.96,  // Friction
            false,
            true // isSmoke
        );
        particles.push(p);
    }
  }

  handleFlowerPot(particles: Particle[]) {
      if (this.life <= 0) this.dead = true;
      if (Math.random() < 0.2) SoundManager.playSparkle(0.1);
      
      this.flowerPotPhase++;
      
      // Bloom effect: Hue shifts over time
      const hue = (this.flowerPotPhase * 2) % 360;
      const color = `hsl(${hue}, 100%, 60%)`;
      
      // Emit structured spray
      const count = 5;
      for(let i=0; i<count; i++) {
          // Wider spread than anar
          const spread = 1.5 + Math.sin(this.flowerPotPhase * 0.05) * 0.5;
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
          const speed = 6 + Math.random() * 4 + Math.sin(this.flowerPotPhase * 0.1) * 2;
          
          particles.push(new Particle(
              this.x, 
              this.y - 10, 
              color, 
              {x: Math.cos(angle) * speed * 0.6, y: Math.sin(angle) * speed}, 
              40 + Math.random() * 20, 
              1.0, 
              0.15, 
              0.92
          ));
      }
  }

  handleGarland(particles: Particle[], boy: Boy | null, callbacks: GameCallbacks) {
      // Garlands are a chain of explosions moving in one direction or zig zag
      this.timer++;
      // Explosion every 4 frames
      if (this.timer % 4 === 0) {
          this.garlandProgress += 10;
          const dir = (Math.floor(this.garlandProgress / 40) % 2 === 0) ? 1 : -1;
          
          const offsetX = (Math.random() - 0.5) * 10 + (this.garlandProgress * 0.2 * dir); 
          // Zig zag movement
          const zigX = this.x + (Math.sin(this.garlandProgress * 0.2) * 30);
          
          this.createMiniExplosion(zigX, this.y, particles, boy, callbacks);
      }
      if (this.life <= 0) this.dead = true;
  }

  handleMultiShot(particles: Particle[], fireworks: Firework[]) {
    if (this.type === 'arc') {
        if (this.life <= 0 && (this.arcShotsRemaining || 0) <= 0) this.dead = true;
        if ((this.arcShotsRemaining || 0) > 0) {
            this.arcShotDelay = (this.arcShotDelay || 0) - 1;
            if (this.arcShotDelay <= 0) {
                const shotIndex = (this.arcTotalShots || 0) - (this.arcShotsRemaining || 0);
                const fraction = shotIndex / ((this.arcTotalShots || 1) - 1);
                const angle = -Math.PI/2 + (fraction - 0.5) * (this.arcSpread || 0);
                const power = 13 + Math.random() * 3;
                
                const bomb = new Firework(this.x, this.y - 400, 'spark_bomb', this.height);
                bomb.x = this.x;
                bomb.y = this.y - 10;
                bomb.vx = Math.cos(angle) * (power * 0.4);
                bomb.vy = Math.sin(angle) * power;
                bomb.customHue = this.arcHue;
                fireworks.push(bomb);
                
                this.arcShotsRemaining = (this.arcShotsRemaining || 0) - 1;
                this.arcShotDelay = 12;
            }
        }
    }
    else if (this.type === 'fountain_shot') {
        if (this.life <= 0 && (this.fountainShots || 0) <= 0) this.dead = true;
        if ((this.fountainShots || 0) > 0) {
            this.fountainDelay = (this.fountainDelay || 0) - 1;
            if (Math.random() > 0.5) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                const speed = Math.random() * 5 + 2;
                particles.push(new Particle(this.x, this.y - 10, '#ffaa00', {x: Math.cos(angle) * speed * 0.5, y: Math.sin(angle) * speed}, 20, 0.5));
            }
            if (this.fountainDelay <= 0) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.15; 
                const power = 14 + Math.random() * 2;
                const shot = new Firework(this.x, this.y - 400, 'spark_bomb', this.height);
                shot.x = this.x;
                shot.y = this.y - 10;
                shot.vx = Math.cos(angle) * (power * 0.1);
                shot.vy = Math.sin(angle) * power;
                shot.customHue = Math.random() * 360; 
                fireworks.push(shot);
                SoundManager.playLaunch(); 
                this.fountainShots = (this.fountainShots || 0) - 1;
                this.fountainDelay = 25; 
            }
        }
    }
  }

  handleChakri(particles: Particle[]) {
    if (this.life <= 0) this.dead = true;
    if (Math.random() < 0.1) SoundManager.playSparkle(0.05); 
    this.x += (Math.random() - 0.5) * 6;
    const angle = (Date.now() * this.chakriSpeed * this.chakriDir) % (Math.PI * 2);
    const col = (Math.floor(Date.now() / 100) % 2 === 0) ? this.chakriTheme[0] : this.chakriTheme[1];
    for(let k=0; k<2; k++) {
        const a = angle + (k * Math.PI);
        particles.push(new Particle(this.x, this.y - 5, col, {x: Math.cos(a) * 7, y: Math.sin(a) * 2}, 20, 1, 0.1));
    }
  }

  handleAnar(particles: Particle[]) {
    if (this.life <= 0) this.dead = true;
    if (Math.random() < 0.1) SoundManager.playSparkle(0.05);
    const intensity = 4 * this.anarIntensity;
    for(let i=0; i<intensity; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
        const speed = (Math.random() * 9 + 4) * this.anarIntensity;
        let col;
        if (this.anarVariant === 0) col = Math.random() > 0.9 ? '#fff' : '#ffcc00';
        else if (this.anarVariant === 1) col = Math.random() > 0.9 ? '#aaf' : '#ffffff';
        else if (this.anarVariant === 2) col = Math.random() > 0.9 ? '#ffaa00' : '#ff0000';
        else col = `hsl(${Math.random() * 360}, 100%, 60%)`;
        particles.push(new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed * 0.4, y: Math.sin(angle) * speed}, 30 + Math.random() * 20, 1, 0.15, 0.9));
    }
  }

  createMiniExplosion(x: number, y: number, particles: Particle[], boy: Boy | null, callbacks: GameCallbacks) {
    if (x >= 20 && x <= 110 && y >= window.innerHeight - 120) { 
        if (callbacks && callbacks.triggerParents && Math.random() < 0.1) callbacks.triggerParents();
    }
    SoundManager.playExplosion('pop', 0.2);
    const popHue = Math.random() * 360;
    const popColor = `hsl(${popHue}, 100%, 60%)`;
    for(let i=0; i<10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.push(new Particle(x, y, popColor, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 10, 0.8));
    }
  }

  explode(particles: Particle[], boy: Boy | null, fireworks: Firework[], callbacks: GameCallbacks) {
    this.dead = true;
    const type = this.type;
    
    // Interaction logic
    if (this.x >= 20 && this.x <= 110 && this.y >= this.height - 120) {
        if (callbacks && callbacks.triggerParents) callbacks.triggerParents();
    }

    // --- TYPE SPECIFIC EXPLOSIONS ---

    if (type === 'rocket') {
      SoundManager.playExplosion('standard', 0.8);
      const hue = Math.random() * 360;
      // Increased particle count and added sparkle properties
      for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (Math.random() * 5 + 2);
          // Brighter colors (High lightness) and white mix for sparkles
          const col = Math.random() > 0.3 ? `hsl(${hue}, 100%, 70%)` : '#ffffff';
          
          const p = new Particle(
              this.x, 
              this.y, 
              col, 
              {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 
              45 + Math.random() * 20, // Longer life
              1.5 * Math.random(),     // Varied small sizes
              0.04,                    // Slightly less gravity
              0.93                     // More friction for floaty effect
          );
          p.flicker = true; // Force flicker for sparkle effect
          particles.push(p);
      }
    }
    else if (type === 'flower_shot') {
        SoundManager.playExplosion('standard', 1.0);
        const petalColor = `hsl(${Math.random() * 60 + 300}, 100%, 60%)`; // Pink/Magenta range
        const centerColor = '#ffd700'; // Gold

        // Center
        for(let i=0; i<12; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = Math.random() * 2;
            particles.push(new Particle(this.x, this.y, centerColor, {x: Math.cos(a)*s, y: Math.sin(a)*s}, 40, 1.5, 0.05, 0.9));
        }

        // Petals (Rose Curve k=5)
        const points = 80;
        for(let i=0; i<points; i++) {
            const theta = (Math.PI * 2 * i) / points;
            // r = a * cos(k * theta)
            // k=5 for 5 petals
            const rBase = Math.sin(5 * theta); // -1 to 1
            
            const r = 8 * Math.abs(rBase); // Scale it up
            
            const vx = r * Math.cos(theta);
            const vy = r * Math.sin(theta);

            // High friction to keep shape
            const p = new Particle(this.x, this.y, petalColor, {x: vx, y: vy}, 60 + Math.random()*20, 1.5, 0.04, 0.92);
            p.flicker = true;
            particles.push(p);
            
            // Fill inner part slightly
            if (i % 2 === 0) {
                 const r2 = 5 * Math.abs(rBase);
                 const vx2 = r2 * Math.cos(theta);
                 const vy2 = r2 * Math.sin(theta);
                 particles.push(new Particle(this.x, this.y, petalColor, {x: vx2, y: vy2}, 60, 1.2, 0.04, 0.92));
            }
        }
    }
    else if (type === 'japanese_skyshot') {
        SoundManager.playExplosion('heavy', 1.3);
        const baseHue = Math.random() * 360;
        // Inner Core (Pistil) - White/Gold center
        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24;
            const speed = 2.5;
            particles.push(new Particle(this.x, this.y, '#ffffff', {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 50, 1.2, 0.02, 0.94));
        }
        
        // Outer Shell (Petals) - Hanabi Style (Perfect Sphere)
        const count = 100;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 9;
            const col = `hsl(${baseHue}, 100%, 60%)`;
            // High friction (0.9) causes them to stop in a spherical formation
            const p = new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 100, 1.8, 0.035, 0.92);
            p.flicker = true;
            particles.push(p);
        }
        
        // Second Outer Shell (Tips) - Color shift
        for (let i = 0; i < count; i++) {
             const angle = (Math.PI * 2 * i) / count;
             const speed = 9.5; 
             const col = `hsl(${(baseHue + 30) % 360}, 100%, 70%)`;
             const p = new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 100, 1.8, 0.035, 0.92);
             p.flicker = true;
             particles.push(p);
        }
    }
    else if (type === 'indian_skyshot') {
        SoundManager.playExplosion('heavy', 1.2);
        
        // Indian Flag Colors: Saffron, White, Green
        const colors = ['#FF9933', '#FFFFFF', '#138808']; 
        const count = 120;

        // Outer Burst (Tricolor)
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10 + 4;
            const col = colors[Math.floor(Math.random() * colors.length)];
            
            const p = new Particle(
                this.x, 
                this.y, 
                col, 
                {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 
                70 + Math.random() * 20, 
                1.8, 
                0.04, 
                0.93
            );
            p.flicker = true;
            particles.push(p);
        }
        
        // Inner Burst (Ashoka Chakra - Blue)
        for (let i = 0; i < 30; i++) {
             const angle = Math.random() * Math.PI * 2;
             const speed = Math.random() * 4 + 1;
             const p = new Particle(
                 this.x, 
                 this.y, 
                 '#000080', // Navy Blue
                 {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 
                 60, 
                 1.5, 
                 0.03, 
                 0.95
             );
             particles.push(p);
        }
    }
    else if (type === 'skyshot') {
      SoundManager.playExplosion('standard', 0.9);
      const count = 50;
      const hue = this.skyshotHue || Math.random() * 360;
      const multi = this.skyshotType === 'multi';
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 8 + 3;
          const col = multi ? `hsl(${Math.random() * 360}, 100%, 60%)` : `hsl(${hue}, 100%, 50%)`;
          const size = 1.2 * (0.8 + Math.random() * 0.5);
          particles.push(new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 60, size, 0.05, 0.92));
      }
    }
    else if (type === 'palm') {
      SoundManager.playExplosion('heavy', 1.0);
      const count = 60;
      const hue = Math.random() * 360;
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 10 + 2;
          const col = Math.random() > 0.5 ? `hsl(${hue}, 100%, 60%)` : '#ffd700'; 
          const size = 1.5 * (0.8 + Math.random());
          const p = new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 80 + Math.random() * 20, size, 0.04, 0.91, true); 
          p.flicker = true;
          particles.push(p);
      }
    }
    else if (type === 'dragon') {
      SoundManager.playRoar(); 
      // Spawn animated Dragon Head
      // Long life to move around
      const head = new Particle(this.x, this.y, '#ffd700', {x:0, y:0}, 300, 2);
      head.behavior = 'dragon_head';
      head.gravity = 0;
      head.friction = 1;
      head.heading = -Math.PI / 2; // Start moving up
      particles.push(head);
    }
    else if (type === 'twinkler') {
      SoundManager.playSparkle(0.4);
      const count = 60;
      const hue = Math.random() * 360;
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 7 + 1;
          const col = `hsl(${hue + Math.random() * 60}, 100%, 85%)`; 
          particles.push(new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 90, 1.0, 0.01, 0.92));
      }
    }
    else if (type === 'double') {
      SoundManager.playExplosion('standard', 0.8);
      const hue1 = Math.random() * 360;
      const hue2 = (hue1 + 180) % 360;
      for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 8 + 4; 
          particles.push(new Particle(this.x, this.y, `hsl(${hue2}, 100%, 50%)`, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 50, 1.4, 0.03, 0.9));
      }
      for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 4;
          particles.push(new Particle(this.x, this.y, '#fff', {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 30, 1.0));
      }
    }
    else if (type === 'sutli') {
      SoundManager.playExplosion('sutli', 1.0);
      const count = 50;
      const hue = Math.random() * 360;
      for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 5;
        const col = Math.random() > 0.5 ? `hsl(${hue}, 70%, 40%)` : '#ffffff'; 
        particles.push(new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 15 + Math.random() * 10, 2.0));
      }
    }
    else if (type === 'c4') {
      SoundManager.playExplosion('c4', 1.2);
      if (callbacks && callbacks.shakeScreen) callbacks.shakeScreen(20);
      const count = 80;
      const hue = Math.random() * 360;
      for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 15 + 5;
        const col = Math.random() > 0.7 ? `hsl(${hue}, 100%, 50%)` : '#888888'; 
        particles.push(new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 30 + Math.random() * 20, 2.5));
      }
    }
    else if (type === 'petrol_bomb' || type === 'molotov') {
      SoundManager.playExplosion('fire', 1.0);
      const count = 100;
      const baseHue = Math.random() * 360;
      const magic = Math.random() > 0.8;
      
      for (let i = 0; i < count; i++) {
         const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2; 
         const speed = Math.random() * 8 + 2;
         const r = Math.random();
         let col;
         if (magic) {
            // Full random multicolor
            if (r > 0.6) col = `hsl(${Math.random()*360}, 100%, 60%)`;
            else if (r > 0.3) col = '#ffffff';
            else col = '#333333';
         } else {
             // Varied hue fire
             if (r > 0.6) col = `hsl(${baseHue}, 100%, 60%)`;
             else if (r > 0.3) col = `hsl(${(baseHue + 20) % 360}, 100%, 50%)`;
             else col = '#333333';
         }
         
         let p = new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed + (Math.random()-0.5)*2, y: Math.sin(angle) * speed}, 60, 1.5 + Math.random(), -0.02);
         p.flicker = true;
         particles.push(p);
      }
    }
    else if (type === 'mega_shot') {
        SoundManager.playExplosion('heavy', 1.5);
        if (callbacks && callbacks.shakeScreen) callbacks.shakeScreen(10);
        const count = 60; 
        const hue = Math.random() * 360;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 10 + 4); 
            const life = 50 + Math.random() * 20; 
            const col = Math.random() > 0.8 ? '#ffffff' : `hsl(${hue}, 100%, 60%)`;
            let p = new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, life, 2.2, 0.03, 0.95, 'mega_1');
            particles.push(p);
        }
    }
    else if (type === 'cross_sky_shot') {
        SoundManager.playExplosion('standard', 0.8);
        const count = 60;
        const color = this.crossSkyColor || '#3399ff';
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            particles.push(new Particle(this.x, this.y, color, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 50 + Math.random() * 20, 1.2 + Math.random()));
        }
    }
    else if (type === 'double_bomb') {
       SoundManager.playExplosion('standard', 1.0);
       const count = 40;
       const hue = Math.random() * 360;
       const col = `hsl(${hue}, 100%, 60%)`;
       for(let i=0; i<count; i++) {
           const angle = Math.random() * Math.PI * 2;
           const speed = Math.random() * 8 + 2;
           particles.push(new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 30, 2.0));
       }
       const bomb2 = new Firework(this.x, this.y, 'double_bomb_2', this.height);
       bomb2.x = this.x; bomb2.y = this.y; bomb2.vx = 0; bomb2.vy = 0; bomb2.life = 15;
       bomb2.customHue = (hue + 180) % 360; 
       fireworks.push(bomb2);
    }
    else if (type === 'double_bomb_2') {
       SoundManager.playExplosion('standard', 1.0);
       const count = 60;
       const hue = this.customHue !== undefined ? this.customHue : Math.random() * 360;
       const col = `hsl(${hue}, 100%, 60%)`;
       for(let i=0; i<count; i++) {
           const angle = Math.random() * Math.PI * 2;
           const speed = Math.random() * 12 + 4;
           particles.push(new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 40, 2.5));
       }
    }
    else if (type === 'cyclone') {
      SoundManager.playExplosion('standard', 0.8);
      const count = 60;
      const hue = Math.random() * 360;
      const color = `hsl(${hue}, 100%, 60%)`;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        let p = new Particle(this.x, this.y, color, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 70, 1.2, 0.05, 0.9);
        p.flicker = true;
        particles.push(p);
      }
    }
    else if (type === 'moon_shot') {
      SoundManager.playMoonChime();
      SoundManager.playExplosion('heavy', 1.2);
      const count = 80;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 9 + 3);
        const r = Math.random();
        let color = r > 0.6 ? '#ffffff' : r > 0.3 ? '#ffffe0' : '#d0e0ff';
        let p = new Particle(this.x, this.y, color, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 80, 1.5, 0.03, 0.94, true);
        p.flicker = true;
        particles.push(p);
      }
    }
    else if (type === 'flash_bang') {
        SoundManager.playExplosion('c4', 1.5);
        if (callbacks && callbacks.shakeScreen) callbacks.shakeScreen(40);
        // Intense white burst
        for(let i=0; i<80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 20 + 10;
            particles.push(new Particle(this.x, this.y, '#ffffff', {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 20 + Math.random() * 10, 2.5, 0.1));
        }
    }
    else if (type === 'smoke_grenade') {
        SoundManager.playExplosion('pop', 0.5);
        SoundManager.playSparkle(0.2); // Hiss sound
        const count = 50;
        for(let i=0; i<count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const p = new Particle(this.x, this.y, '#808080', {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 150 + Math.random() * 100, 4, -0.02, 0.95, false, true);
            particles.push(p);
        }
    }
    else {
        SoundManager.playExplosion('standard', 0.8);
        const count = 40;
        const hue = this.customHue !== undefined ? this.customHue : Math.random() * 360;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            const col = Math.random() > 0.3 ? `hsl(${hue}, 100%, 60%)` : '#ffffff';
            particles.push(new Particle(this.x, this.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 40 + Math.random()*20, 1 + Math.random()));
        }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.dead) return;
    if (this.type === 'anar') {
      ctx.fillStyle = '#f0f';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 15);
      ctx.lineTo(this.x + 5, this.y);
      ctx.lineTo(this.x - 5, this.y);
      ctx.fill();
    } else if (this.type === 'flower_pot') {
      ctx.fillStyle = '#e91e63'; // Pink pot
      ctx.beginPath();
      ctx.moveTo(this.x - 6, this.y);
      ctx.lineTo(this.x - 8, this.y - 12);
      ctx.lineTo(this.x + 8, this.y - 12);
      ctx.lineTo(this.x + 6, this.y);
      ctx.fill();
    } else if (this.type === 'smoke_bomb') {
        ctx.fillStyle = this.smokeColor || '#555';
        ctx.fillRect(this.x - 6, this.y - 15, 12, 15);
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x - 6, this.y - 2, 12, 2); // base
    } else if (this.type === 'garland') {
        // Draw a zigzag line or series of dots
        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const startX = this.x;
        const width = 60;
        for(let i=0; i<=width; i+=5) {
            const yOff = (i%10 === 0) ? 0 : -5;
            ctx.lineTo(startX + i, this.y + yOff);
        }
        ctx.stroke();
    } else if (this.type === 'chakri') {
      ctx.fillStyle = '#0f0'; ctx.fillRect(this.x - 6, this.y - 2, 12, 4);
    } else if (this.type === 'ladi') {
      ctx.fillStyle = '#ff0000'; ctx.fillRect(this.x - 20, this.y, 40, 4);
    } else if (this.type === 'arc') {
      ctx.fillStyle = '#0088ff'; ctx.fillRect(this.x - 10, this.y - 5, 20, 10);
    } else {
      ctx.fillStyle = '#fff';
      if (this.type === 'twinkler') ctx.fillStyle = '#e0ccff';
      else if (this.type === 'double') ctx.fillStyle = '#ff0099';
      else if (this.type === 'cyclone') ctx.fillStyle = '#00ffcc';
      else if (this.type === 'cross_sky_shot' && this.crossSkyColor) ctx.fillStyle = this.crossSkyColor;
      else if (this.type === 'japanese_skyshot') ctx.fillStyle = '#ff99cc';
      else if (this.type === 'indian_skyshot') ctx.fillStyle = '#ff9933';
      else if (this.type === 'flower_shot') ctx.fillStyle = '#ff69b4';
      else if (this.type === 'flash_bang') ctx.fillStyle = '#FFD700';
      else if (this.type === 'smoke_grenade') ctx.fillStyle = '#808080';
      else if (this.type === 'molotov') ctx.fillStyle = '#FF4500';
      
      let w = PIXEL_SIZE;
      let h = PIXEL_SIZE * 2;
      
      if (this.type === 'cross_sky_shot' && this.crossSkySize) {
          w = this.crossSkySize;
          h = this.crossSkySize;
      }
      
      ctx.fillRect(this.x, this.y, w, h);
    }
  }
}

export const createSubBurst = (p: Particle, particles: Particle[]) => {
  if (p.hasSubBurst === true) { 
    SoundManager.playSparkle(0.05); 
    for(let i=0; i<6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particles.push(new Particle(p.x, p.y, Math.random() > 0.5 ? '#ffffff' : p.color, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 20 + Math.random() * 10, 0.8, 0.05, 0.9));
    }
    return;
  }
  if (p.hasSubBurst === 'mega_1') {
      SoundManager.playExplosion('standard', 0.5);
      const count = 12; 
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 4 + 2;
          const col = `hsl(${Math.random() * 360}, 100%, 60%)`;
          particles.push(new Particle(p.x, p.y, col, {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 30 + Math.random() * 10, 1.2, 0.05, 0.92, 'mega_2'));
      }
      return;
  }
  if (p.hasSubBurst === 'mega_2') {
      const count = 6;
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 0.5;
          particles.push(new Particle(p.x, p.y, '#ffd700', {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed}, 80 + Math.random() * 40, 0.8, 0.08, 0.96, false));
      }
  }
};
