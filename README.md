# 🎆 Pixel Pyro

**Pixel Pyro** is a robust, production-ready interactive fireworks simulator built with **React**, **TypeScript**, and the **HTML5 Canvas API**. It combines nostalgic 8-bit pixel art aesthetics with a physics-based particle engine and procedural audio synthesis.

![Pixel Pyro Banner](https://placehold.co/800x300/050510/eab308?text=PIXEL+PYRO&font=roboto)

## ✨ Key Features

### 🚀 Diverse Arsenal of Fireworks
The game features over **20 unique types** of fireworks categorized into three distinct classes:

*   **Aerial:** High-flying rockets that paint the sky.
    *   *Includes:* The winding **Dragon**, the geometric **Flower Shot** (Rose curve pattern), the **Cyclone**, and the massive **50kg Skyshot**.
*   **Ground:** Stationary fountains and spinners.
    *   *Includes:* **Anar** (Fountain), **Chakri** (Spinning wheel), and **Flower Pots**.
*   **Bombs:** Loud, heavy-impact explosives.
    *   *Includes:* **Sutli Bomb**, **Garland** (Ladi), and **C4**.

### 🤖 Interactive NPCs & AI
The world feels alive with autonomous characters:
*   **The Boy:** An AI character with a state machine behavior. He walks, watches fireworks, **cowers** at loud explosions, **celebrates**, and occasionally lights his own sparklers or fireworks.
*   **The Angry Neighbors:** If you explode too many loud bombs near the house, the parents will appear at the door—**shaking with anger** and shouting via emoticon speech bubbles!

### 🌑 Interactive Environment
*   **Day/Night Cycle:** (Visualized via atmospheric glow).
*   **The Moon:** A dynamic celestial body. Hitting it with rockets causes it to chime. **Hit it 3 times to trigger a massive finale!**
*   **Physics:** Custom gravity, friction, wind resistance, and light trails for every particle.

### 🔊 Procedural Audio Engine
Zero external audio files are used. All sounds (explosions, whistles, crackles, thuds) are synthesized in real-time using the **Web Audio API**.
*   *Pink/White Noise generation for explosions.*
*   *Oscillators for whistles and sirens.*
*   *Dynamic filtering for distance and muffling.*

---

## 🎮 How to Play

1.  **Select a Category:** Use the bottom toolbar to choose between Aerial, Ground, or Bombs.
2.  **Choose a Type:** Select a specific firework icon (e.g., Rocket, Chakri).
3.  **Ignite:**
    *   **Tap/Click anywhere** on the sky or ground to launch that firework.
    *   Ground items stick to the floor.
    *   Aerial items launch towards your click or fly vertically.
4.  **Secrets:**
    *   Try annoy the neighbors by spamming bombs near the door.
    *   Try to hit the moon!

---

## 🛠️ Tech Stack

*   **Framework:** React 19
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Rendering:** HTML5 Canvas (2D Context) with optimized render loops.
*   **Icons:** Lucide React
*   **Fonts:** 'Press Start 2P' (Google Fonts)

## 📦 Installation & Running

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```
4.  Open `http://localhost:3000` to play.

## 🎨 Visual Gallery

| Aerial Show | Ground Chaos |
|:-----------:|:------------:|
| ![Aerial](https://placehold.co/400x300/1a1a2e/FFF?text=Aerial+Display) | ![Ground](https://placehold.co/400x300/1a1a2e/FFF?text=Ground+Chaos) |

| Dragon Shot | Flower Pattern |
|:-----------:|:--------------:|
| ![Dragon](https://placehold.co/400x300/1a1a2e/FFF?text=Dragon+Shot) | ![Flower](https://placehold.co/400x300/1a1a2e/FFF?text=Flower+Shot) |

---

*Built with ❤️ and pixels.*
