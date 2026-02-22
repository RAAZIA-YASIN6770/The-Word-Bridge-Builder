# Technical Architecture: The Word-Bridge Builder

This document outlines the technical blueprint and system design for 'The Word-Bridge Builder'.

## 1. System Components

The application is built on the interaction between two core systems:

### 1.1 Word Engine (Spelling Logic)
*   **Role:** Manages the spelling challenge lifecycle.
*   **Responsibilities:**
    *   Retrieving word data from the schema.
    *   Managing current word state (revealed vs. hidden letters).
    *   Validating user input against the target word.
    *   Calculating accuracy score and determining bridge material.
    *   Triggering the Bridge Physics System.

### 1.2 Bridge Physics System (Material Transformation)
*   **Role:** Handles the physical manifestation and behavior of the bridge.
*   **Responsibilities:**
    *   Generating the bridge geometry across the chasm.
    *   Applying material properties (frictions, durability, density) based on `Word Engine` output.
    *   Handling collisions between the player character and the bridge.
    *   Managing destruction/shattering effects for fragile materials.

---

## 2. Material State Machine

The bridge's lifecycle is managed via a finite state machine:

| State | Transition Trigger | Outcome |
| :--- | :--- | :--- |
| **IDLE** | Level Start / Gap Reached | Waiting for spelling prompt activation. |
| **BUILDING** | Input Started | Letters are being placed; bridge is in holographic/preview state. |
| **MATERIALIZED_STEEL** | Correct Spelling | Solid collision enabled; high durability; infinite lifespan. |
| **MATERIALIZED_PAPER** | Incorrect Spelling | Weak collision; low durability; shatters/tears on character weight. |
| **DESTRUCTING** | Material Failure | Playing break animations/particles; removing collision. |

---

## 3. Data Schema

Levels and word data are stored in a structured JSON/dictionary format to allow for easy extensibility.

```json
{
  "level_id": "world1_level1",
  "theme": "FOREST",
  "words": [
    {
      "word": "BRIDGE",
      "difficulty": "MEDIUM",
      "category": "Infrastructure",
      "missing_indices": [2, 3],
      "hint_image": "assets/hints/bridge.png"
    }
  ],
  "victory_conditions": {
    "min_stars": 1,
    "time_limit": 120
  }
}
```

---

## 4. Asset Pipeline

### 4.1 Models & Textures
*   **Characters:** 3D models (or 2D sprites) for 'Robot' or 'Adventurer' with walk/idle/fall animations.
*   **Bridge Textures:**
    *   **Steel:** Metallic, reflective, grey/blue hues.
    *   **Paper:** Flat, matte, white/cream with tearing edge maps.
    *   **Glass:** Transparent, refractive, cyan tints.
    *   **Diamond:** High-specular, prismatic effects.
*   **Environment:** Tilesets matching the theme (Jungle, Space, etc.).

### 4.2 SFX (Audio)
*   **Spell Correct:** Uplifting chime or "Success" sound.
*   **Spell Incorrect:** Low-pitched thud or "Error" notification.
*   **Bridge Materialization:** Metallic "clang" for Steel; soft "rustle" for Paper.
*   **Crossing:** Rhythmic footsteps on material (clink on metal, rustle on paper).
*   **Falling:** Whistling wind effect followed by a distant splash or thud.

---

## 5. Input Handling

*   **Touch/Click Interaction:** 
    *   Users interact with "Letter Clouds" or falling letters floating in the background.
    *   Interaction triggers a `LetterSelection` event sent to the `Word Engine`.
*   **Drag-and-Drop:** (Optional/Advanced) Letters can be dragged into slots on the bridge preview.
*   **Mobile Support:** Multi-touch support for rapid typing/selection on tablets.
