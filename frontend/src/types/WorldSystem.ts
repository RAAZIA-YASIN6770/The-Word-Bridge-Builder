/**
 * WorldSystem.ts
 * Epic 2 — Level & World Definitions (Levels 1–5)
 *
 * Provides the 5 world themes with:
 *  - Name & emoji
 *  - CSS class for environment styling
 *  - Curated word bank for that world
 *  - Sky gradient + accent colour tokens
 */

export interface WorldTheme {
    id: number;
    name: string;
    emoji: string;
    cssClass: string;         // applied to .game-scene
    skyGradient: string;      // CSS gradient string
    accentColor: string;      // primary accent (bridges, HUD)
    moonColor: string;        // env-moon colour
    mistColor: string;        // env-mist colour
    words: { word: string; hint: string }[];
}

export const WORLDS: WorldTheme[] = [
    {
        id: 1,
        name: 'The Emerald Forest',
        emoji: '🌲',
        cssClass: 'world--forest',
        skyGradient: 'linear-gradient(180deg, #0d1b2a 0%, #1a2a1a 60%, #0a0c10 100%)',
        accentColor: '#48bb78',
        moonColor: 'radial-gradient(circle at 35% 35%, #fffbe8, #c8b860 60%, #8a7a30)',
        mistColor: 'rgba(100, 180, 120, 0.08)',
        words: [
            { word: 'BRIDGE', hint: '🌉 Build a bridge' },
            { word: 'RIVER', hint: '🌊 Flowing water' },
            { word: 'STONE', hint: '🪨 Hard rock' },
            { word: 'PLANT', hint: '🌿 Green growth' },
            { word: 'CLOUD', hint: '☁️ Sky float' },
        ],
    },
    {
        id: 2,
        name: 'The Frozen Peaks',
        emoji: '🏔️',
        cssClass: 'world--mountain',
        skyGradient: 'linear-gradient(180deg, #0a0f1a 0%, #0e2040 60%, #0a1030 100%)',
        accentColor: '#63b3ed',
        moonColor: 'radial-gradient(circle at 35% 35%, #ffffff, #b0d0f0 60%, #6090c0)',
        mistColor: 'rgba(150, 200, 255, 0.10)',
        words: [
            { word: 'FROST', hint: '❄️ Cold morning' },
            { word: 'SNOW', hint: '🌨️ White flakes' },
            { word: 'CLIMB', hint: '🧗 Scale the peak' },
            { word: 'WIND', hint: '💨 Rushing air' },
            { word: 'CAVE', hint: '🕳️ Dark hollow' },
        ],
    },
    {
        id: 3,
        name: 'The Crystal Caverns',
        emoji: '💎',
        cssClass: 'world--cave',
        skyGradient: 'linear-gradient(180deg, #0a0510 0%, #1a0830 60%, #0a0315 100%)',
        accentColor: '#b794f4',
        moonColor: 'radial-gradient(circle at 35% 35%, #e0c0ff, #9060d0 60%, #501090)',
        mistColor: 'rgba(180, 100, 255, 0.08)',
        words: [
            { word: 'LIGHT', hint: '💡 Bright idea' },
            { word: 'JEWEL', hint: '💎 Precious gem' },
            { word: 'DARK', hint: '🌑 No light' },
            { word: 'ECHO', hint: '🔊 Sound returns' },
            { word: 'MAGIC', hint: '✨ Mysterious power' },
        ],
    },
    {
        id: 4,
        name: 'The Sunken Reef',
        emoji: '🌊',
        cssClass: 'world--reef',
        skyGradient: 'linear-gradient(180deg, #051520 0%, #0a3050 60%, #051020 100%)',
        accentColor: '#4fd1c5',
        moonColor: 'radial-gradient(circle at 35% 35%, #80fff0, #20c0a0 60%, #007060)',
        mistColor: 'rgba(0, 200, 180, 0.08)',
        words: [
            { word: 'CORAL', hint: '🪸 Ocean garden' },
            { word: 'WHALE', hint: '🐋 Ocean giant' },
            { word: 'PEARL', hint: '🦪 Hidden gem' },
            { word: 'SWIM', hint: '🏊 Water motion' },
            { word: 'SHELL', hint: '🐚 Ocean armour' },
        ],
    },
    {
        id: 5,
        name: 'The Sky Citadel',
        emoji: '☁️',
        cssClass: 'world--sky',
        skyGradient: 'linear-gradient(180deg, #1a0a3a 0%, #3a1060 60%, #200840 100%)',
        accentColor: '#f6ad55',
        moonColor: 'radial-gradient(circle at 35% 35%, #ffe0a0, #f09020 60%, #a05010)',
        mistColor: 'rgba(255, 200, 100, 0.08)',
        words: [
            { word: 'STORM', hint: '⛈️ Thunder &amp; lightning' },
            { word: 'WINGS', hint: '🦅 Soaring flight' },
            { word: 'STAR', hint: '⭐ Distant light' },
            { word: 'CROWN', hint: '👑 Royal headwear' },
            { word: 'BRAVE', hint: '🛡️ Bold and fearless' },
        ],
    },
];

/** Get a flat list of all words across all worlds */
export function getAllWords(): { word: string; hint: string }[] {
    return WORLDS.flatMap(w => w.words);
}

/** Get the world for a given level index (0-based, wraps) */
export function getWorldForLevel(levelIndex: number): WorldTheme {
    const worldIdx = Math.floor(levelIndex / 5) % WORLDS.length;
    return WORLDS[worldIdx];
}

/** Get the word for a given level index (0-based, wraps) */
export function getWordForLevel(levelIndex: number): { word: string; hint: string } {
    const all = getAllWords();
    return all[levelIndex % all.length];
}
