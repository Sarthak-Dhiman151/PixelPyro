
import { 
  Rocket, Sparkles, Loader2, Zap, Bomb, Star, CircleDot, 
  Wifi, Sun, Package, Flame, ChevronsUp, Wind, Crown, Ghost, Droplets, Layers,
  Cloud, Flower2, Link, Flower, Flag
} from 'lucide-react';
import { Category, FireworkDef } from './types';

export const PIXEL_SIZE = 4;
export const STAR_COUNT = 100; 

export const CATEGORIES: Category[] = [
  { id: 'Aerial', name: 'Aerial', icon: Rocket, color: '#ff5555' },
  { id: 'Ground', name: 'Ground', icon: Flame, color: '#55ffff' },
  { id: 'Bombs', name: 'Bombs', icon: Bomb, color: '#ffaa00' }
];

export const FIRECRACKER_TYPES: FireworkDef[] = [
  // AERIAL
  { id: 'rocket', name: 'Rocket', color: '#ff5555', icon: Rocket, category: 'Aerial' },
  { id: 'flower_shot', name: 'Flower Shot', color: '#ff69b4', icon: Flower2, category: 'Aerial' },
  { id: 'indian_skyshot', name: 'Tiranga', color: '#ff9933', icon: Flag, category: 'Aerial' },
  { id: 'japanese_skyshot', name: 'Hanabi', color: '#ff66b2', icon: Flower, category: 'Aerial' },
  { id: 'cross_sky_shot', name: 'Cross Sky', color: '#3399ff', icon: Wind, category: 'Aerial' },
  { id: 'cyclone', name: 'Cyclone', color: '#00ffcc', icon: Wind, category: 'Aerial' },
  { id: 'skyshot', name: 'Sky Shot', color: '#8888ff', icon: Star, category: 'Aerial' },
  { id: 'dragon', name: 'Dragon Shot', color: '#ff3333', icon: Ghost, category: 'Aerial' },
  { id: 'twinkler', name: 'Twinkler', color: '#e0ccff', icon: Sparkles, category: 'Aerial' },
  { id: 'palm', name: 'Palm Tree', color: '#ffd700', icon: Sun, category: 'Aerial' },
  { id: 'mega_shot', name: '50kg Skyshot', color: '#ff0055', icon: Crown, category: 'Aerial' }, 
  
  // GROUND
  { id: 'anar', name: 'Anar', color: '#55ffff', icon: Flame, category: 'Ground' },
  { id: 'flower_pot', name: 'Flower Pot', color: '#e91e63', icon: Flower2, category: 'Ground' },
  { id: 'chakri', name: 'Chakri', color: '#55ff55', icon: Loader2, category: 'Ground' },
  { id: 'fountain_shot', name: 'Fountain', color: '#ff9933', icon: ChevronsUp, category: 'Ground' },
  { id: 'smoke_bomb', name: 'Smoke Bomb', color: '#607d8b', icon: Cloud, category: 'Ground' },
  { id: 'arc', name: 'Arc Shot', color: '#0088ff', icon: Wifi, category: 'Ground' },

  // BOMBS
  { id: 'sutli', name: 'Sutli', color: '#ffaa00', icon: Bomb, category: 'Bombs' },
  { id: 'garland', name: 'Garland', color: '#f44336', icon: Link, category: 'Bombs' },
  { id: 'double_bomb', name: 'Double Bomb', color: '#9933ff', icon: Layers, category: 'Bombs' },
  { id: 'petrol_bomb', name: 'Petrol Bomb', color: '#ff5500', icon: Droplets, category: 'Bombs' },
  { id: 'ladi', name: 'Ladi', color: '#ff55ff', icon: Zap, category: 'Bombs' },
  { id: 'c4', name: 'C4', color: '#aaaaaa', icon: Package, category: 'Bombs' },
  { id: 'flash_bang', name: 'Flash Bang', color: '#FFD700', icon: Sun, category: 'Bombs' },
  { id: 'smoke_grenade', name: 'Smoke Grenade', color: '#808080', icon: Wind, category: 'Bombs' },
  { id: 'molotov', name: 'Molotov', color: '#FF4500', icon: Flame, category: 'Bombs' }
];
