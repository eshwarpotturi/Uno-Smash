# UNO Multiplayer Card Game

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black.svg)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![God Mode](https://img.shields.io/badge/Superpower-God_Mode_Bullying-red.svg)](https://github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, real-time multiplayer UNO card game engineered with a **secret username-based "God Mode" superpower** designed to stealthily troll and completely bully your friends during game night.

---

## ⚡ The Ultimate USP: Secret "God Mode" Friend-Bullying Powers 😈

While this app looks and behaves like an authentic, high-stakes competitive UNO game to all regular players, the server features a hidden **Authoritative God-Mode Backdoor** keyed directly to specific usernames (`Eswar` and `Anushka`).

### 🕹️ How It Works (Stupidly Simple Diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                 🎮 ENTERING THE GAME LOBBY                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                     Checks Username
                               │
               Name has "Eswar" or "Anushka"?
                ├─── NO ─────────────────► 👶 REGULAR PLAYER (FRIENDS)
                │                          • Dealt 7 random cards
                │                          • 10-second strict turn countdown
                │                          • Must draw on bad luck
                │
                └─── YES ────────────────► 👑 GOD MODE UNLOCKED! 😈
                                           • Hand starts empty (Timer PAUSED)
                                           • Full Deck Armory opens up
                                           • Search & hand-pick ANY 7 cards
                                             (e.g., 7x Wild Draw +4!)
                                           • Unlocks mid-game "Change Hand" button
                                           • Friends wonder why you're undefeated
```

### 💥 Unfair Advantages Breakdown:
1. **The Armory (Card Picker):** Instead of getting dealt 7 random cards, God-Mode players are greeted with a full-screen deck explorer with a live search bar. You can hand-pick any 7 cards in the entire deck (e.g. stack seven `+4 Wilds`, `Skips`, or `+2 Draw Twos`).
2. **Timer Immunity:** While you are browsing and cherry-picking your lethal arsenal, the server completely freezes your turn timer so you never get rushed or timed out.
3. **Mid-Game "Change Hand" Button:** In the heat of the game, a special golden button allows you to re-open the armory and swap cards directly from the remaining deck.
4. **Automated Friend Obliteration:** When you unleash a `+2` or `+4 Wild`, the victim's turn is instantly skipped, cards are forcefully crammed into their hand, and automated humiliation messages are broadcast to the room audit log.

---

## 📑 Table of Contents

- [⚡ The Ultimate USP: Secret "God Mode"](#-the-ultimate-usp-secret-god-mode-friend-bullying-powers-)
- [1. Executive Summary](#1-executive-summary)
- [2. System Architecture](#2-system-architecture)
- [3. Key Features \& Functionalities](#3-key-features--functionalities)
- [4. Real-Time Protocol \& Socket Specifications](#4-real-time-protocol--socket-specifications)
- [5. Technology Stack](#5-technology-stack)
- [6. Directory Structure](#6-directory-structure)
- [7. Core Data Models](#7-core-data-models)
- [8. Installation \& Local Development](#8-installation--local-development)
- [9. Build, Bundling \& Deployment Strategy](#9-build-bundling--deployment-strategy)
- [10. Game Mechanics \& Rules Engine](#10-game-mechanics--rules-engine)
- [11. Enterprise Engineering Standards](#11-enterprise-engineering-standards)
- [12. Troubleshooting \& FAQs](#12-troubleshooting--faqs)
- [13. Contributing Guidelines](#13-contributing-guidelines)
- [14. License](#14-license)

---

## 1. Executive Summary

The **UNO Multiplayer Card Game** provides a full-stack, server-authoritative web platform that reproduces official UNO rules in an interactive, distributed environment.

### 💡 Stupidly Simple Overview

```
 📱 Player 1 (Mobile) ─────┐
                           │ (WebSockets)
 💻 Player 2 (Laptop) ─────┼────────► 🖥️ [NODE.JS SERVER]
                           │         (Checks rules & deals cards)
 📱 Player 3 (Tablet) ─────┘                    │
                                                ▼
                                    🔄 ALL SCREENS UPDATE IN REAL-TIME!
```
1. **Player taps a card** on their phone or laptop.
2. **Server verifies** if the move is legal.
3. **All players see the board update** instantly with zero lag.

---

## 2. System Architecture

The application adopts a **Server-Authoritative Real-Time Architecture** using an Express HTTP server paired with a bi-directional WebSocket (Socket.IO) cluster layer.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser / Mobile)                │
│  React 19 SPA • Tailwind CSS v4 • WebAudio API • Motion UI  │
└──────────────────────────────▲──────────────────────────────┘
                               │
                      WebSocket (Socket.IO)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Node.js Express Server                   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │               Socket Ingress & Handlers             │   │
│   │  - join_room          - play_card                   │   │
│   │  - start_game         - draw_card                   │   │
│   │  - disconnect         - reconnect reconciliation    │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │             Authoritative Game Engine               │   │
│   │  - Deck Generation & Fisher-Yates Shuffling         │   │
│   │  - Card Legality Validation (Color/Value/Wild)      │   │
│   │  - Direction & Turn Controller (Skip/Reverse)       │   │
│   │  - Penalty Engine (Draw 2, Wild Draw 4)             │   │
│   │  - Dynamic 10s Server Turn Timer Pool               │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────▼──────────────────────────┐   │
│   │               In-Memory Room State Map              │   │
│   │  Map<RoomID, GameRoom { players, gameState, ... }>  │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Architectural Principles
1. **Server as Single Source of Truth (SSOT):** Hand cards, draw decks, discard piles, current colors, and scores are held in server memory. Clients receive synchronized snapshots and trigger action intents.
2. **Deterministic State Transitions:** State mutations occur synchronously within the event dispatch loop to prevent race conditions during simultaneous plays.
3. **Graceful Disconnection Handling:** When a user's connection drops, the server retains the player's session and marks `isOnline: false`. Reconnecting players seamlessly re-bind to their persistent ID and active hand.

---

## 3. Key Features & Functionalities

### 👥 Room Management & Dynamic Matchmaking

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Enter Name &   │ ────► │  Lobby Waiting  │ ────► │   Host Clicks   │ ────► │  7 Cards Dealt  │
│    Room Code    │       │  (Share link)   │       │   "Start Game"  │       │  & Match Begins │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

- **Lobby System:** Players can generate unique room codes or join existing rooms via alphanumeric IDs.
- **Lobby Roster:** Real-time visibility of joined players, readiness status, and host controls.
- **One-Click Link Sharing:** Integrated clipboard utility allows instant URL sharing to bring friends into lobbies.

### 🃏 Full UNO Ruleset Implementation
- **Standard Deck Representation:** 108 cards including 4 colored suits (Red, Blue, Green, Yellow) and Wild cards.
- **Action Cards:**
  - **Skip:** Immediately advances turn past the next player.
  - **Reverse:** Flips play direction (switches between clockwise and counter-clockwise; in a 2-player game, acts as a Skip).
  - **Draw Two (+2):** Forces next player to draw 2 cards and forfeits their turn.
  - **Wild:** Allows active player to choose any of the 4 playable colors.
  - **Wild Draw Four (+4):** Forces next player to draw 4 cards, forfeits their turn, and allows color selection.
- **Automatic Discard Pile Recycling:** When the draw deck is depleted, the discard pile (excluding the top card) is automatically reshuffled back into the draw deck.

### ⏱️ Turn Automation & 10-Second Timeouts

```
                      ┌──────────────────────┐
                      │ Player's Turn Starts │
                      │   (10s timer starts) │
                      └──────────┬───────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [Plays in ≤ 10 sec]              [Timer Reaches 0s]
                 │                               │
                 │                               ▼
                 │                      ⚡ SERVER FORCES:
                 │                      - Draw 1 penalty card
                 │                      - Pass turn to next
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                      ┌──────────────────────┐
                      │   Next Player Turn   │
                      └──────────────────────┘
```

- **Enforced Pace of Play:** Each player has 10 seconds to make a valid play.
- **Audio-Visual Countdown:** Live seconds counter with animated warning indicators when 3 seconds or fewer remain.
- **Server Auto-Draw Fallback:** If a player runs out of time, the server auto-draws a card, logs the infraction, and advances to the next player.

### 👑 Authoritative Username God-Mode Engine (The Trolling System)

```
┌──────────────────────────────────────────────────────────────┐
│                  SECRET GOD-MODE FLOWCHART                   │
└──────────────────────────────┬───────────────────────────────┘
                               │
               Game Starts: Deals Initial Hands
                               │
         Player name matches 'eswar' or 'anushka'?
              ├─── NO  ──► Deals 7 random cards, starts 10s timer
              └─── YES ──► 1. Hand initialized to [] (empty)
                           2. Timer paused (turnExpiresAt = undefined)
                           3. Full-screen armory triggers on client
                           4. Emits 'eswar_choose_hand' with 7 card IDs
                           5. Server validates & assigns custom hand!
```

- **Zero Randomness for the VIP:** Normal card distribution is intercepted server-side.
- **Dynamic Hand Manipulation:** Enables real-time swapping via `eswar_choose_hand` protocol events.
- **Audit Masking:** Broadcasted game logs describe actions normally (e.g. `Eswar chose their hand!` or standard plays), leaving friends unaware of the server-level backdoor.

### 📱 Enterprise Mobile Optimization (iOS & Android)
- **Fluid Touch Scrolling:** Horizontal card rack with `-webkit-overflow-scrolling: touch` and hidden scrollbars.
- **Hover/Tap Distinction:** Media query guards (`(hover: hover)`) prevent sticky hover animations on touch screens.
- **Proactive WebAudio Unlock:** Overcomes mobile browser autoplay restrictions through early gesture listening (`touchstart`, `click`, `touchend`).
- **Viewport Ergonomics:** Styled using `touch-action: manipulation` to eliminate double-tap delay while preventing unintended zooming.

### 🔊 Interactive Audio & Visual Feedback
- **Sound Synthesis:** Built-in WebAudio synthesizer generates low-latency audio tones for turns and actions without requiring external audio asset loading.
- **Live Event Audit Log:** Monospace scrolling terminal displays every match action (plays, draws, penalties, skips, and disconnections).
- **Celebration FX:** Full-screen particle confetti triggers on game conclusion using `canvas-confetti`.

---

## 4. Real-Time Protocol & Socket Specifications

Communication between the client and server is conducted over WebSocket channels via Socket.IO events.

### 🔄 Socket Communication Flow

```
PLAYER (CLIENT)                                              SERVER (BACKEND)
      │                                                              │
      ├─────────── 1. join_room (Name, Room) ───────────────────────►│  Saves to room
      │◄────────── 2. room_update (Player list) ─────────────────────┤  Broadcasts lobby
      │                                                              │
      ├─────────── 3. start_game ───────────────────────────────────►│  Shuffles & deals 7
      │◄────────── 4. game_start (Player hands, top card) ───────────┤  Starts 10s timer
      │                                                              │
      ├─────────── 5. play_card (Card ID) ──────────────────────────►│  Validates card
      │◄────────── 6. game_update (New board state) ─────────────────┤  Broadcasts to ALL
      │                                                              │
```

### Client-to-Server (C2S) Events

| Event Name | Payload Schema | Description |
|---|---|---|
| `join_room` | `{ roomId: string, playerName: string, playerId: string }` | Joins or reconnects to a game room. |
| `start_game` | `roomId: string` | Initiates the game (requires minimum 2 players). |
| `play_card` | `{ roomId: string, cardId: string, chosenColor?: CardColor }` | Submits card play intent with optional wild color. |
| `draw_card` | `{ roomId: string, chosenCardId?: string }` | Requests a manual or penalty draw from the deck. |
| `eswar_choose_hand` | `{ roomId: string, cardIds: string[] }` | Special handler for designated custom hand selection. |

### Server-to-Client (S2C) Events

| Event Name | Payload Schema | Description |
|---|---|---|
| `room_update` | `GameRoom` | Broadcasts room roster, player join/leave, and online status changes. |
| `game_start` | `GameRoom` | Signals game initialization and delivers initial hands and top card. |
| `game_update` | `GameRoom` | Broadcasts real-time state mutation after every play, draw, or timeout. |
| `error` | `string` | Notifies the client of rejected actions (e.g., room full or mid-game join). |

---

## 5. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | Node.js | `>= 18.0.0` | Server execution environment |
| **Backend Framework** | Express | `^4.21.2` | HTTP server, static asset delivery, and routing |
| **Real-time Protocol** | Socket.IO | `^4.8.3` | Bi-directional WebSocket communication |
| **Frontend Framework**| React | `^19.0.0` | Component-based interactive user interface |
| **Build Tooling** | Vite / esbuild | `^6.2.0 / ^0.28.0` | Ultra-fast HMR and production CommonJS bundle compilation |
| **Language** | TypeScript | `~5.8.2` | End-to-end static type safety |
| **CSS Framework** | Tailwind CSS | `^4.1.14` | High-efficiency utility-first styling |
| **Animations** | Motion (Framer) | `^12.23.24` | Card transitions and physics-based interactions |
| **Icons** | Lucide React | `^0.546.0` | Scalable system interface iconography |
| **FX** | Canvas Confetti | `^1.9.4` | Particle celebration upon match victory |

---

## 6. Directory Structure

```text
├── .env.example              # Template for environment configurations
├── .gitignore                # Git exclusion directives
├── index.html                # HTML entry point with metadata
├── metadata.json             # App capability and metadata configuration
├── package.json              # Project manifest, dependencies, and build scripts
├── server.ts                 # Authoritative Express + Socket.IO server engine
├── tsconfig.json             # TypeScript compiler configuration
├── vite.config.ts            # Vite bundler & Tailwind integration setup
└── src/
    ├── App.tsx               # Main application container, UI coordinator & sockets
    ├── main.tsx              # React root entry point
    ├── index.css             # Global Tailwind v4 CSS imports and mobile resets
    ├── types.ts              # Universal TypeScript data contracts and types
    ├── components/
    │   └── Card.tsx          # Interactive Uno Card component with animations
    └── lib/
        └── utils.ts          # Classnames & Tailwind merge utilities
```

---

## 7. Core Data Models

The entire application relies on shared, immutable TypeScript definitions located in `src/types.ts`:

```typescript
export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' 
                      | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  hand: Card[];
  isReady: boolean;
  isOnline?: boolean;
}

export interface GameRoom {
  id: string;
  players: Player[];
  status: 'lobby' | 'starting' | 'playing' | 'ended';
  gameState: GameState | null;
}

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  status: 'lobby' | 'starting' | 'playing' | 'ended';
  winner: Player | null;
  currentColor: CardColor | null;
  currentValue: CardValue | null;
  pendingDrawCount: number;
  logs: string[];
  turnExpiresAt?: number;
}
```

---

## 8. Installation & Local Development

### Prerequisites
- **Node.js:** `v18.0.0` or higher
- **Package Manager:** `npm` (v9+) or `bun`

### Setup Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-org/uno-multiplayer.git
   cd uno-multiplayer
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *(Ensure any required variables or ports are defined.)*

4. **Launch Development Server:**
   ```bash
   npm run dev
   ```
   The development server starts up at:
   ```
   http://localhost:3000
   ```

5. **Execute Type Check & Linter:**
   ```bash
   npm run lint
   ```

---

## 9. Build, Bundling & Deployment Strategy

The application adopts an enterprise dual-compilation pipeline designed for containerized cloud deployment:

```
SOURCE CODE                                       PRODUCTION ARTIFACTS
┌──────────────┐      Vite Build                  ┌────────────────────────┐
│  React App   │ ───────────────────────────────► │ dist/                  │ (Static Client Assets)
│  (src/...)   │                                  │ (HTML, JS bundles, CSS)│
└──────────────┘                                  └────────────────────────┘
                                                               ▲
┌──────────────┐      esbuild Bundle                           │ (Served by)
│  server.ts   │ ───────────────────────────────► ┌────────────┴───────────┐
│ (Node backend│                                  │ dist/server.cjs        │ (Single Node Binary)
└──────────────┘                                  └────────────────────────┘
                                                               │
                                                       Starts with: `npm start`
                                                       Listens on: Port 3000
```

```bash
npm run build
```

### What happens during `npm run build`:
1. **Frontend Compilation:** Vite compiles and tree-shakes all React client assets into the static `dist/` directory.
2. **Backend Bundling:** `esbuild` bundles `server.ts` into a self-contained CommonJS binary at `dist/server.cjs`:
   - All relative imports are compiled at build time, eliminating ESM resolution overhead at runtime.
   - Node external packages (`express`, `socket.io`) remain externally linked via `--packages=external`.
   - Generates sourcemaps for production runtime observability.

### Production Execution:
```bash
npm start
```
Starts `dist/server.cjs` on port `3000` (`0.0.0.0`), serving both the Socket.IO real-time endpoints and static client assets.

---

## 10. Game Mechanics & Rules Engine

### 🕹️ Overall Match Flow

```
[Start Game] ────► [Deal 7 Cards to Each Player]
                           │
                           ▼
                  [Turn Evaluation] ◄──────────────────────┐
                           │                               │
             ┌─────────────┴─────────────┐                 │
             ▼                           ▼                 │
      [Player Action]            [Timeout (10s)]           │
             │                           │                 │
    ┌────────┴────────┐                  │                 │
    ▼                 ▼                  ▼                 │
[Play Valid Card] [Draw Card]    [Auto-Draw 1 Card]        │
    │                 │                  │                 │
    │                 └──────────┬───────┘                 │
    ▼                            │                         │
[Check Winner (0 cards?)]        │                         │
    │              │             │                         │
   Yes             No            │                         │
    │              │             │                         │
    ▼              └─────────────┼─────────────────────────┘
[Game Ended]                     ▼
                       [Advance Turn (Skip/Rev)]
```

### 🃏 "Can I Play This Card?" (Stupidly Simple Decision Tree)

```
             ┌─────────────────────────────┐
             │    Card You Want To Play    │
             └──────────────┬──────────────┘
                            │
               Is it a WILD or +4 WILD?
                   ├─── YES ─────────────► ✅ LEGAL! Pick color and play
                   └─── NO
                            │
               Does COLOR match top card?
                   ├─── YES ─────────────► ✅ LEGAL! Play card
                   └─── NO
                            │
               Does NUMBER / ICON match?
                   ├─── YES ─────────────► ✅ LEGAL! Play card
                   └─── NO
                            │
                            ▼
                    ❌ ILLEGAL MOVE!
                   (Must draw from deck)
```

### Action Resolutions
- **Reverse in 2-Player Matches:** In standard multi-player, reverse changes `direction = -direction`. In a 2-player match, reverse behaves identically to a **Skip** card.
- **Draw 2 & Wild Draw 4:** The penalized player immediately receives the corresponding number of cards from the deck and forfeits their turn.
- **Wild Selection:** When a Wild or Wild Draw 4 is played, an interactive color selector modal prompts the player to designate the next active color.

---

## 11. Enterprise Engineering Standards

- **Zero Client Trust:** All card choices and draws are validated against server memory. Clients cannot bypass turn order or forge card IDs.
- **Memory Leak Protection:** Disconnected rooms with 0 remaining players in lobby automatically clear active timers and are deleted from server memory.
- **Strict Linting & Clean Code:** Built with TypeScript strict checks enabled; codebase passes `tsc --noEmit` cleanly without warnings.
- **Accessibility & Contrast:** Color choices for card badges and game board elements meet WCAG AA standards.

---

## 12. Troubleshooting & FAQs

### Q: Why do I not hear sounds on mobile Safari / Chrome?
> **Answer:** Modern mobile browsers restrict audio playback until explicit user interaction occurs. The application includes a top-level listener on `touchstart` and `click` that proactively unlocks the `AudioContext`. Ensure silent mode / mute switch is turned off on your physical device.

### Q: How can multiple players test on a local network?
> **Answer:** Because the server binds to `0.0.0.0:3000`, any device connected to the same Wi-Fi network can join by navigating to your computer's local IP address (e.g., `http://192.168.1.50:3000`).

### Q: Can a player reconnect if their browser tab is accidentally reloaded?
> **Answer:** Yes. The player's unique identifier is cached in `localStorage` (`uno_player_id`). On reload, the client re-authenticates with the server and automatically resumes their active hand and game state.

```
┌──────────────────┐        Network Drop         ┌──────────────────┐
│ Player Playing   │ ──────────────────────────► │ Marked "Offline" │
│ (Hand in memory) │                             │ (Hand preserved) │
└──────────────────┘                             └────────┬─────────┘
                                                          │ Reconnect / Reload
                                                          ▼
                                                 ┌──────────────────┐
                                                 │ Reads local ID   │
                                                 │ Hand Restored!   │
                                                 └──────────────────┘
```

---

## 13. Contributing Guidelines

Contributions are welcome from the developer community. Please adhere to the following workflow:

1. **Fork the Repository:** Create your feature branch (`git checkout -b feature/amazing-feature`).
2. **Commit Changes:** Follow conventional commit messages (`feat: add custom card themes`, `fix: timer synchronization`).
3. **Verify Build & Lint:** Ensure tests and lint passes (`npm run lint && npm run build`).
4. **Open a Pull Request:** Detail the changes made, verification steps, and attach screenshots or test recordings.

---

## 14. License

Distributed under the **MIT License**. See `LICENSE` for more information.
