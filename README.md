# 🌉 The Word-Bridge Builder

> *An interactive educational spelling game where your words literally build the world around you.*

A browser-based game built with **React + TypeScript + Vite**, animated with **GSAP**, and powered by **Matter.js** physics. Players spell words to construct bridges — correct spelling forges solid **Steel**, wrong spelling crumbles to **Paper**.

---

## 🎮 How to Play

1. A **bridge skeleton** appears with empty slots — one per letter of the target word
2. **Drag or tap** the letter orbs at the bottom into the bridge slots
3. Fill all slots → bridge **transforms**:
   - ✅ Correct word → **Steel Bridge** — character walks across safely
   - ❌ Wrong word → **Paper Bridge** — it collapses and the character falls
4. Use the **💡 Lightbulb** button for a visual hint if you're stuck
5. Earn **★ Stars** for each level — they unlock new worlds!

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- npm

### Install & Run

```bash
# Navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser at **http://localhost:5173**

### Build for Production

```bash
cd frontend
npm run build
```

---

## 📁 Project Structure

```
The_word_bridge_builder/
│
├── 📁 _bmad-output/                    ← BMAD Planning & Design Documents
│   ├── bmad-implementation.md          ← ✅ Master project tracker
│   ├── 📁 planning-artifacts/
│   │   ├── bmad-prd.md                 ← Product Requirements Document
│   │   ├── bmad-architecture.md        ← Technical Architecture
│   │   └── bmad-stories.md             ← Epics & User Stories
│   ├── 📁 brainstorming/
│   │   └── brainstorming-session.md
│   └── 📁 implementation-artifacts/
│       └── bmad-implementation-guide.md
│
├── 📁 frontend/                        ← React/Vite Game Application
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── 📁 src/
│       ├── style.css                   ← Global design system & all styles
│       ├── main.tsx                    ← App entry point
│       │
│       ├── 📁 components/              ← All game UI components
│       │   ├── GameController.tsx      ← 🎮 Master game loop & state
│       │   ├── BridgeComponent.tsx     ← 🌉 Bridge skeleton + transforms
│       │   ├── LetterOrb.tsx           ← 🔵 Draggable letter physics orbs
│       │   ├── CharacterComponent.tsx  ← 🚶 Walking/falling character
│       │   ├── HintModal.tsx           ← 💡 Lightbulb hint overlay
│       │   └── StarDisplay.tsx         ← ★  Star UI (banner + HUD)
│       │
│       └── 📁 types/                   ← Data models & game logic
│           ├── WorldSystem.ts          ← 🌍 5 world themes & word banks
│           └── StarSystem.ts           ← ⭐ Star calculation & persistence
│
└── README.md
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI component framework |
| **TypeScript** | Type-safe development |
| **Vite** | Fast dev server & bundler |
| **GSAP** | All animations (bridge transforms, character, banners) |
| **Matter.js** | Physics engine for letter orb drag & flick |
| **CSS Custom Properties** | Dynamic world theming system |
| **localStorage** | Star progress persistence |

---

## 📖 Development Journey (BMAD Method)

This project was built using the **BMAD (Breakthrough Method of Agile AI-Driven Development)** methodology — a structured, phase-by-phase approach.

---

### Phase 1: Planning ✅

#### Step 1 — Brainstorming Session
- Defined the core concept: *spelling words = building physical bridges*
- Explored educational game mechanics, target audience (kids), and visual tone
- Output: `brainstorming-session.md`

#### Step 2 — Product Requirements Document (PRD)
- Formalised the game vision, features, and success criteria
- Defined the core loop: **Spell → Build → Cross (or Fall)**
- Output: `bmad-prd.md`

#### Step 3 — Technical Architecture
- Chose the tech stack: React + GSAP + Matter.js
- Designed the component tree and state machine
- Defined the asset pipeline and input handling strategy
- Output: `bmad-architecture.md`

#### Step 4 — Epics & User Stories
- Broke the project into 3 Epics and 7 User Stories
- Wrote the **Definition of Done** for the First Playable Prototype
- Output: `bmad-stories.md`

---

### Phase 2: Implementation ✅

---

#### 🌉 Epic 1: The Core Bridge (MVP)

**Story 1 — Bridge Skeleton**
- Created `BridgeComponent.tsx` with a stylised 2D fragile wood bridge
- Letter slots rendered as cracked planks with dashed amber borders
- Pulsing amber glow animation on empty slots creates urgency
- Slot fills with a GSAP micro-bounce and particle flash on letter drop

**Story 2 — Letter Interaction**
- Created `LetterOrb.tsx` with Matter.js physics engine underneath
- Letters presented as glowing blue orbs in a tray at the bottom
- Players can **drag** orbs across the screen and **drop** them into slots
- Collision detection determines which slot receives the letter
- Used orbs fade out so you can't accidentally drag the same letter twice

**Story 3 — Material Transformation**
- `transformMaterial('steel')` — GSAP timeline:
  - Flash of white light → bridge class switches → metallic shimmer settles → blue glow pulse
- `transformMaterial('paper')` — GSAP timeline:
  - Sepia crinkle → class switches → planks droop/wilt with stagger → bridge falls off screen
- Both transforms return a `Promise` so the game controller awaits them cleanly

---

#### 👤 Epic 2: Character & World

**Story 4 — Successful Crossing**
- Created `CharacterComponent.tsx` — a hand-drawn SVG character
- On success: excitement jump → stride walk across bridge → celebration bounce on arrival
- Arm/leg swing synced to movement speed; star particle burst on landing
- `walkAcross()` returns a Promise the controller awaits

**Story 5 — Bridge Collapse / Game Over**
- On failure: character stumbles on the collapsing bridge
- GSAP rotation + fall-off-screen animation with panic arm flail
- `fallOff()` returns a Promise the controller awaits
- Failure banner shows narrative flavour text: *"The bridge couldn't hold"*

**World System**
- Created `WorldSystem.ts` with **5 world themes**:

| # | World | Accent | Words |
|---|---|---|---|
| 1 | 🌲 The Emerald Forest | Green | BRIDGE, RIVER, STONE, PLANT, CLOUD |
| 2 | 🏔️ The Frozen Peaks | Blue | FROST, SNOW, CLIMB, WIND, CAVE |
| 3 | 💎 The Crystal Caverns | Purple | LIGHT, JEWEL, DARK, ECHO, MAGIC |
| 4 | 🌊 The Sunken Reef | Teal | CORAL, WHALE, PEARL, SWIM, SHELL |
| 5 | ☁️ The Sky Citadel | Amber | STORM, WINGS, STAR, CROWN, BRAVE |

- Dynamic SVG background renders per world (trees, mountains, stalactites, coral, clouds)
- HUD level progress dots (5 per world) show active/done/pending states
- **"New World Unlocked!"** panel animates in with bounce when changing worlds
- `--world-accent` CSS custom property drives all world-specific colours

---

#### 💡 Epic 3: Assistance & Retention

**Story 6 — Lightbulb Hint**
- **💡 Hint Button** in HUD with amber badge showing uses remaining (3 per session)
- Button pulses with idle glow animation; disables during non-playing phases
- Clicking opens `HintModal.tsx` with GSAP `back.out` entrance animation
- Modal shows:
  - Large floating emoji illustration (animated bob)
  - Target word spelled out letter-by-letter with staggered reveal
  - Descriptive English sentence for every word (all 25 words covered)
  - Animated sparkles ✦ for visual flair
  - "N hints remaining" counter
  - **"Got it! ✓"** button to close
- On failure banner: blinking nudge *"💡 Tap the lightbulb for a clue!"* if hint unused

**Story 7 — Star Progression**
- Created `StarSystem.ts` with clear earning rules:

| Performance | Stars |
|---|---|
| Correct, no hint, no retry | ★★★ |
| Correct, used a hint | ★★☆ |
| Correct after retrying | ★☆☆ |

- Personal best stored per level — replaying a level can only improve your score
- All star data persists in **`localStorage`** across page refreshes
- **HUD Star Counter** `★ N` shown in top-right with warm amber glow
- **World Progress Bar** below HUD — thin fill bar showing stars to next world:

| World | Stars Needed |
|---|---|
| 🌲 The Emerald Forest | 0 (always unlocked) |
| 🏔️ The Frozen Peaks | 10 ★ |
| 💎 The Crystal Caverns | 20 ★ |
| 🌊 The Sunken Reef | 30 ★ |
| ☁️ The Sky Citadel | 40 ★ |

- Animated `StarDisplay` in result banner (GSAP stagger bounce per star)
- "Perfect! ★★★" and "New best!" labels on the banner

---

## ✅ Definition of Done — First Playable Prototype

| Criterion | Status |
|---|---|
| ✏️ Functional Spelling via tap/drag interface | ✅ Complete |
| 🌉 Bridge transforms to Steel (correct) or Paper (incorrect) | ✅ Complete |
| 🚶 Character walks across on success / falls on failure | ✅ Complete |
| 🎯 Win/Loss States with banners and flavour text | ✅ Complete |
| 🌲 At least one world environment rendered with assets | ✅ Complete (5 worlds!) |

> **The First Playable Prototype is 100% complete.** All 3 Epics and 7 Stories are implemented and verified.

---

## 🗂️ BMAD Documents

| Document | Description |
|---|---|
| [`bmad-implementation.md`](./_bmad-output/bmad-implementation.md) | Master project tracker — all epics & stories |
| [`bmad-prd.md`](./_bmad-output/planning-artifacts/bmad-prd.md) | Product Requirements Document |
| [`bmad-architecture.md`](./_bmad-output/planning-artifacts/bmad-architecture.md) | Technical Architecture |
| [`bmad-stories.md`](./_bmad-output/planning-artifacts/bmad-stories.md) | Epics & User Stories |

---

## 🎨 Design System Highlights

- **Fonts:** `Cinzel` (display/titles) + `Outfit` (body) — loaded from Google Fonts
- **Dark aesthetic:** Deep navy/forest backgrounds with world-specific sky gradients
- **Micro-animations:** Slot pulse, orb shimmer, mist drift, character idle bob, dot pulse
- **Glassmorphism:** Banners and modals use `backdrop-filter: blur` with dark translucent backgrounds
- **CSS Custom Properties:** `--world-accent`, `--world-sky`, `--world-mist-color` drive the entire theming system dynamically

---

*Built with ❤️ using the BMAD methodology*
