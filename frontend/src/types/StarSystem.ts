/**
 * StarSystem.ts
 * Epic 3 — Story 7: Star Progression
 *
 * Manages star earning, storage and world-unlock logic.
 *
 * Stars per level:
 *   ★★★ — Correct word, no hint used          (3 stars)
 *   ★★☆ — Correct word, hint used             (2 stars)
 *   ★☆☆ — Correct word after retrying         (1 star)
 *   ☆☆☆ — Skipped / never solved              (0 stars — not yet implemented)
 *
 * A new world unlocks when the player has earned enough stars across the worlds
 * already visited. Each world requires 10 stars to unlock the next.
 */

export interface LevelStarResult {
    /** Stars awarded for this level (0–3) */
    stars: number;
    /** Whether this was a new personal best for this level */
    isNewBest: boolean;
}

export interface StarSystemState {
    /** Total stars ever earned (accumulates, never decreases) */
    totalStars: number;
    /** Per-level best star count, keyed by levelIndex */
    levelBests: Record<number, number>;
}

// ── Constants ──────────────────────────────────────────────────────────────

/** Stars needed to unlock each world (index = worldId - 1) */
export const WORLD_STAR_THRESHOLDS = [0, 10, 20, 30, 40];

// ── Calculation helpers ────────────────────────────────────────────────────

/**
 * Calculate stars for a successfully completed level.
 * @param hintUsed  Whether the player triggered the lightbulb hint
 * @param retried   Whether the player retried (got it wrong at least once)
 */
export function calcStars(hintUsed: boolean, retried: boolean): number {
    if (retried) return 1;
    if (hintUsed) return 2;
    return 3;
}

/**
 * Check whether a world index (0-based) is unlocked given total stars.
 */
export function isWorldUnlocked(worldIndex: number, totalStars: number): boolean {
    return totalStars >= (WORLD_STAR_THRESHOLDS[worldIndex] ?? 0);
}

/**
 * Stars needed to unlock the next world from the current one.
 * Returns null if all worlds are already unlocked.
 */
export function starsToNextWorld(currentWorldIndex: number, totalStars: number): number | null {
    const nextThreshold = WORLD_STAR_THRESHOLDS[currentWorldIndex + 1];
    if (nextThreshold == null) return null;          // already at last world
    const gap = nextThreshold - totalStars;
    return gap > 0 ? gap : null;
}

// ── State management ───────────────────────────────────────────────────────

const STORAGE_KEY = 'wbb_star_state';

export function loadStarState(): StarSystemState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as StarSystemState;
    } catch {
        // ignore parse error
    }
    return { totalStars: 0, levelBests: {} };
}

export function saveStarState(state: StarSystemState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // ignore storage error
    }
}

/**
 * Record a level result and return updated state + metadata.
 */
export function recordLevelResult(
    state: StarSystemState,
    levelIndex: number,
    stars: number
): { nextState: StarSystemState; result: LevelStarResult } {
    const prev = state.levelBests[levelIndex] ?? 0;
    const isNewBest = stars > prev;

    const gained = isNewBest ? stars - prev : 0;   // only add incremental improvement
    const nextState: StarSystemState = {
        totalStars: state.totalStars + gained,
        levelBests: {
            ...state.levelBests,
            [levelIndex]: Math.max(prev, stars),
        },
    };

    return { nextState, result: { stars, isNewBest } };
}
