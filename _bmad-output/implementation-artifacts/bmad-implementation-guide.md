# Implementation Guide: The Word-Bridge Builder (Phase 5)

This document serves as the roadmap for the implementation stage of 'The Word-Bridge Builder'.

## 1. Project Directory Tree

```
The_word_bridge_builder/
├── assets/
│   ├── sprites/
│   │   ├── robot/
│   │   ├── bridge/
│   │   └── background/
│   └── audio/
│       ├── effects/
│       └── music/
├── src/
│   ├── engine/
│   │   └── word_engine.py      # Core spelling logic
│   ├── physics/
│   │   └── bridge_physics.py    # Material & interaction logic
│   ├── ui/
│   │   └── spelling_ui.py      # Letter interaction & UI
│   └── main.py                 # Game entry point
├── data/
│   └── levels.json             # Level & word data
└── _bmad-output/
    ├── planning-artifacts/     # Phase 1-4 output
    └── implementation-artifacts/ # Phase 5+ output
```

## 2. Core Logic Script (Pseudo-code)

### Function: `CheckSpelling()`
The heart of the 'Material Switch' system. This function determines if the bridge is solid or fragile based on the player's performance.

```python
# Function: CheckSpelling()
# Result: Updates BridgeStatus to Solid_Steel or Broken_Paper.

def CheckSpelling(user_input, target_word):
    """
    Validates user input and transforms the bridge material.
    """
    # Normalize strings for comparison
    input_str = user_input.strip().upper()
    target_str = target_word.strip().upper()

    if input_str == target_str:
        # Success State
        BridgeStatus = "Solid_Steel"
        PlaySound("Success_Chime")
        ApplyMaterialProperties(material="Steel", durability=float('inf'), friction=0.8)
        NotifyHUD("Spelling Correct! Bridge is SOLID.")
    else:
        # Failure State
        BridgeStatus = "Broken_Paper"
        PlaySound("Error_Thud")
        ApplyMaterialProperties(material="Paper", durability=0.5, friction=0.2)
        NotifyHUD("Spelling Error! Bridge is FRAGILE.")
    
    # Trigger visual transformation in the physics system
    TriggerBridgeTransformation(BridgeStatus)
    
    return BridgeStatus
```

## 3. Story-to-Code Mapping

| Story | Code Module | Description |
| :--- | :--- | :--- |
| **Story 1: Bridge Skeleton** | `bridge_physics.py` / `spelling_ui.py` | Renders the initial hollow bridge structure. |
| **Story 2: Letter Interaction** | `spelling_ui.py` | Handles tap/drag events for letter placement. |
| **Story 3: Material Transformation** | `word_engine.py` / `bridge_physics.py` | Logic for `CheckSpelling()` and material swap. |
| **Story 4: Successful Crossing** | `main.py` / `bridge_physics.py` | Character movement across `Solid_Steel`. |
| **Story 5: Bridge Collapse** | `main.py` / `bridge_physics.py` | Gravity-driven collapse on `Broken_Paper`. |
| **Story 6: Lightbulb Hint** | `spelling_ui.py` / `levels.json` | Displays hint image from level data. |
| **Story 7: Star Progression** | `word_engine.py` | Saves level completion and star count. |

## 4. Asset Checklist (Forest Level)

### 🌲 Sprites
- [ ] **Robot:** Idle, Walk, Fall, Win.
- [ ] **Bridge:** 
    - [ ] Skeleton (Blueprint look)
    - [ ] Steel (Metallic panels)
    - [ ] Paper (Scattered sheets, torn edges)
- [ ] **Background:** Forest tileset (grass, trees, chasm), Parallax layers.

### 🔊 Sounds
- [ ] **Spelling:** Correct (Chime), Incorrect (Buzz/Thud).
- [ ] **Materialization:** Metal (Clang), Paper (Rustle).
- [ ] **Interaction:** Footsteps (Metal, Paper), Falling (Whoosh), Splash (Water in chasm).
