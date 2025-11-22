import { LucideIcon } from 'lucide-react';

export type CategoryType = 'Aerial' | 'Ground' | 'Bombs';

export interface Category {
  id: CategoryType;
  name: string;
  icon: LucideIcon;
  color: string;
}

export interface FireworkDef {
  id: string;
  name: string;
  color: string;
  icon: LucideIcon;
  category: CategoryType;
}

export interface Vector {
  x: number;
  y: number;
}

export interface GameState {
  width: number;
  height: number;
  particles: any[]; // Using any to avoid circular dependency with classes, handled in GameCanvas
  fireworks: any[];
  boy: any | null;
  moonHits: number;
  finaleTimer: number;
  shakeTimer: number;
  parents: {
    active: boolean;
    timer: number;
    text: string;
  };
  stars: {
    x: number;
    y: number;
    size: number;
    brightness: number;
    flickerSpeed: number;
  }[];
}

export interface GameCallbacks {
  triggerParents: () => void;
  shakeScreen: (duration: number) => void;
}