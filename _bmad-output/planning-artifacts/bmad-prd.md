---
stepsCompleted: [1]
inputDocuments: ["_bmad-output/brainstorming/brainstorming-session-2026-02-22.md"]
session_topic: 'The Word-Bridge Builder: PRD'
---

# Product Requirement Document (PRD): The Word-Bridge Builder

**Reference Context:** This document builds upon the brainstorming session dated 2026-02-22.

## 1. Product Vision
**The Word-Bridge Builder** is an immersive educational platformer designed to make spelling mastery an adventurous experience. Players take on the role of a character (Robot or Adventurer) whose progress depends on their ability to materialize physical bridges through correct spelling. It blends platforming mechanics with immediate physical feedback to reinforce learning.

## 2. Core Gameplay Loop
The gameplay is defined by the following repeating cycle:
1.  **Encounter Gap:** The player reaches a chasm that cannot be jumped across.
2.  **Spell Word:** A prompt appears (e.g., a picture or partial word). The player must spell the word correctly.
3.  **Materialize Bridge:** 
    *   **Correct Spelling:** A solid bridge materializes (Steel or Diamond). It is safe and stable.
    *   **Incorrect Spelling:** A fragile bridge materializes (Paper or Glass). 
4.  **Cross or Fall:** The player attempts to cross. Correct bridges hold firm; incorrect bridges shatter or collapse under the character's weight.

## 3. Functional Requirements

### 3.1 Physics-based Material Logic
*   Bridges must have distinct physical properties based on spelling accuracy.
*   **Steel/Diamond:** Infinite durability, supports character weight.
*   **Paper/Glass:** Low durability, shatter/tear animations, trigger character fall upon weight detection.
*   **Environmental Match:** The material and aesthetics of the bridge must match the level theme (e.g., 'OCEAN' level = Coral bridge).

### 3.2 Hint & Power-up Systems
*   **Hint (Lightbulb):** Shows a picture-hint or reveals one correct letter. Limits may apply per level.
*   **Power-up (Jetpack):** Allows for temporary flight or speed boosts to navigate difficult platforming sections between spelling challenges.

### 3.3 Progress Tracking
*   **Star System:** Players earn stars based on spelling accuracy and completion time per level.
*   **Unlockable Themes:** Correct spellings contribute to unlocking new worlds (e.g., Space, Jungle, Underwater).

## 4. Content Strategy: Sample Word List
Words are categorized to provide a smooth learning curve.

| Difficulty | Word | Category | Missing Letters (Easy) |
| :--- | :--- | :--- | :--- |
| **Easy** | CAT | Animals | C _ T |
| **Easy** | SUN | Nature | S _ N |
| **Easy** | RED | Colors | R _ D |
| **Easy** | FISH | Animals | F _ S H |
| **Easy** | BOOK | Objects | B _ _ K |
| **Medium** | BRIDGE | Infrastructure | B R _ _ G E |
| **Medium** | FOREST | Environment | F _ R _ S T |
| **Medium** | ROCKET | Space | R _ C K _ T |
| **Medium** | OCEAN | Water | O _ _ A N |
| **Medium** | APPLE | Food | A _ P _ E |
| **Hard** | DIAMOND | Materials | D _ _ M _ N D |
| **Hard** | ADVENTURER| Persona | A _ V _ N _ _ R E R |
| **Hard** | ATMOSPHERE| Science | A _ M _ S _ _ E R E |
| **Hard** | PLATFORM | Gaming | P L _ _ F _ R M |
| **Hard** | LIGHTBULB | Objects | L _ _ H T _ _ L B |

## 5. User Personas

### 5.1 'The Learner' (Child)
*   **Age:** 5–10 years.
*   **Goal:** To learn spelling in a fun, non-punitive way (visual feedback rather than just "Wrong" text).
*   **Need:** Engaging visuals, clear instructions, and a sense of progression.

### 5.2 'The Facilitator' (Parent/Teacher)
*   **Goal:** To monitor progress and identify words the child struggles with.
*   **Need:** Easy-to-understand progress reports and the ability to adjust difficulty levels.
