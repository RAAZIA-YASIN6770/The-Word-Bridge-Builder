/**
 * GameController.tsx
 * Orchestrates the full game loop — Epic 1 + Epic 2 + Epic 3:
 *
 *   Epic 1 (bridging):
 *     1. Render bridge skeleton with target word
 *     2. Present shuffled letter orbs
 *     3. Detect word completion → validate → trigger material transform
 *
 *   Epic 2 (character & world):
 *     4. SUCCESS — steel bridge → character walks across (Story 4)
 *     5. FAILURE — paper bridge collapses → character falls (Story 5)
 *     6. Level / world progression (Levels 1-5 across 5 worlds)
 *
 *   Epic 3 (assistance & retention):
 *     7. Lightbulb Hint — 💡 button → HintModal (Story 6)
 *     8. Star Progression — earn 1-3 ★ per level; stars unlock worlds (Story 7)
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import BridgeComponent, { BridgeComponentHandle } from './BridgeComponent';
import LetterOrb, { LetterOrbHandle, OrbDef } from './LetterOrb';
import CharacterComponent, { CharacterHandle } from './CharacterComponent';
import HintModal from './HintModal';
import StarDisplay, { TotalStarCounter, WorldStarProgress } from './StarDisplay';
import { getWordForLevel, getWorldForLevel, WORLDS, WorldTheme } from '../types/WorldSystem';
import {
    calcStars, recordLevelResult, loadStarState, saveStarState,
    starsToNextWorld, WORLD_STAR_THRESHOLDS,
    type LevelStarResult, type StarSystemState,
} from '../types/StarSystem';

// ──── Helpers ──────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildOrbs(word: string): OrbDef[] {
    return shuffle(
        word.split('').map((letter, i) => ({ id: `${letter}-${i}`, letter }))
    );
}

// ── Max single-session hints ───────────────────────────────────────────────
const MAX_HINTS = 3;

// ──── Types ────────────────────────────────────────────────────────────────

type GamePhase =
    | 'playing'          // player is spelling
    | 'transforming'     // bridge material animation
    | 'walking'          // character walks across (success)
    | 'falling'          // character falls (failure)
    | 'success'          // success banner shown
    | 'failure'          // failure banner shown
    | 'level-up';        // brief world-transition screen

// ──── Component ────────────────────────────────────────────────────────────

const GameController: React.FC = () => {

    // ── Level / World state ────────────────────────────────────────────────
    const [levelIndex, setLevelIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [phase, setPhase] = useState<GamePhase>('playing');
    const [orbs, setOrbs] = useState<OrbDef[]>(() =>
        buildOrbs(getWordForLevel(0).word)
    );
    const [currentWorld, setCurrentWorld] = useState<WorldTheme>(WORLDS[0]);

    // ── Epic 3 State ──────────────────────────────────────────────────────
    const [hintOpen, setHintOpen] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);             // total session
    const [hintUsedThisLevel, setHintUsedThisLevel] = useState(false);
    const [retriedThisLevel, setRetriedThisLevel] = useState(false);
    const [starState, setStarState] = useState<StarSystemState>(() => loadStarState());
    const [lastStarResult, setLastStarResult] = useState<LevelStarResult | null>(null);

    const hintsLeft = MAX_HINTS - hintsUsed;

    const currentWordDef = getWordForLevel(levelIndex);
    const currentWorldIndex = Math.floor(levelIndex / 5) % WORLDS.length;

    // Stars needed to unlock the next world
    const starsForNext = starsToNextWorld(currentWorldIndex, starState.totalStars);

    // ── Refs ──────────────────────────────────────────────────────────────
    const bridgeRef = useRef<BridgeComponentHandle>(null);
    const orbRef = useRef<LetterOrbHandle>(null);
    const characterRef = useRef<CharacterHandle>(null);
    const bannerRef = useRef<HTMLDivElement>(null);
    const levelUpRef = useRef<HTMLDivElement>(null);
    const lockedRef = useRef(false);
    const sceneRef = useRef<HTMLDivElement>(null);
    const hintBtnRef = useRef<HTMLButtonElement>(null);

    // ── Apply world theme to DOM ──────────────────────────────────────────
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;
        WORLDS.forEach(w => scene.classList.remove(w.cssClass));
        scene.classList.add(currentWorld.cssClass);
        scene.style.setProperty('--world-accent', currentWorld.accentColor);
        scene.style.setProperty('--world-sky', currentWorld.skyGradient);
        scene.style.setProperty('--world-mist-color', currentWorld.mistColor);
    }, [currentWorld]);

    // ── Banner reset on phase change ──────────────────────────────────────
    useEffect(() => {
        if (phase === 'playing' && bannerRef.current) {
            gsap.set(bannerRef.current, { opacity: 0, scale: 0.85, pointerEvents: 'none' });
        }
    }, [phase]);

    // ── Hint button pulse when idle ───────────────────────────────────────
    useEffect(() => {
        if (phase !== 'playing' || hintsLeft <= 0) return;
        const btn = hintBtnRef.current;
        if (!btn) return;
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 6 });
        tl.fromTo(btn,
            { boxShadow: '0 0 0 0 rgba(255, 220, 60, 0)' },
            { boxShadow: '0 0 0 10px rgba(255, 220, 60, 0)', duration: 0.8, ease: 'power2.out' }
        );
        return () => { tl.kill(); };
    }, [phase, hintsLeft]);

    // ── Show banner helper ────────────────────────────────────────────────
    const showBanner = useCallback(() => {
        if (bannerRef.current) {
            gsap.to(bannerRef.current, {
                opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)',
            });
            gsap.set(bannerRef.current, { pointerEvents: 'auto' });
        }
    }, []);

    const hideBanner = useCallback((cb: () => void) => {
        if (bannerRef.current) {
            gsap.to(bannerRef.current, {
                opacity: 0, scale: 0.85, duration: 0.25, ease: 'power2.in',
                onComplete: cb,
            });
        } else {
            cb();
        }
    }, []);

    // ── Open hint ─────────────────────────────────────────────────────────
    const handleHint = useCallback(() => {
        if (hintsLeft <= 0 || phase !== 'playing') return;
        setHintOpen(true);
        setHintsUsed(n => n + 1);
        setHintUsedThisLevel(true);

        // Subtle hint-button shake as feedback
        if (hintBtnRef.current) {
            gsap.fromTo(hintBtnRef.current,
                { rotation: -8 },
                { rotation: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' }
            );
        }
    }, [hintsLeft, phase]);

    const handleHintClose = useCallback(() => {
        setHintOpen(false);
    }, []);

    // ── Word completion handler ──────────────────────────────────────────
    const handleComplete = useCallback(async (filledWord: string) => {
        if (lockedRef.current) return;
        lockedRef.current = true;

        const isCorrect = filledWord === currentWordDef.word;
        setPhase('transforming');

        if (isCorrect) {
            // 1. Transform bridge to steel
            await bridgeRef.current?.transformMaterial('steel');

            // 2. Walk character across (Story 4)
            setPhase('walking');
            await characterRef.current?.walkAcross();

            // 3. Calculate & record stars (Story 7)
            const earnedStars = calcStars(hintUsedThisLevel, retriedThisLevel);
            setStarState(prev => {
                const { nextState, result } = recordLevelResult(prev, levelIndex, earnedStars);
                saveStarState(nextState);
                setLastStarResult(result);
                return nextState;
            });

            // 4. Increment score + show banner
            setScore(s => s + 1);
            setPhase('success');
            showBanner();

        } else {
            // 1. Transform bridge to paper
            await bridgeRef.current?.transformMaterial('paper');

            // 2. Character falls with the bridge (Story 5)
            setPhase('falling');
            await characterRef.current?.fallOff();

            setPhase('failure');
            showBanner();
        }
    }, [currentWordDef.word, showBanner, hintUsedThisLevel, retriedThisLevel, levelIndex]);

    // ── Collapse end ───────────────────────────────────────────────────────
    const handleCollapseEnd = useCallback(() => { }, []);

    // ── Advance to next level ─────────────────────────────────────────────
    const handleNext = useCallback(() => {
        hideBanner(() => {
            const nextLevel = levelIndex + 1;
            const nextWorld = getWorldForLevel(nextLevel);
            const prevWorld = getWorldForLevel(levelIndex);

            setLevelIndex(nextLevel);
            setOrbs(buildOrbs(getWordForLevel(nextLevel).word));
            lockedRef.current = false;

            // Reset per-level Epic 3 tracking
            setHintUsedThisLevel(false);
            setRetriedThisLevel(false);
            setLastStarResult(null);

            // World changed? Show world-transition screen
            if (nextWorld.id !== prevWorld.id) {
                setCurrentWorld(nextWorld);
                setPhase('level-up');

                if (levelUpRef.current) {
                    gsap.fromTo(levelUpRef.current,
                        { opacity: 0, scale: 0.8 },
                        {
                            opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)',
                            onComplete: () => {
                                setTimeout(() => {
                                    gsap.to(levelUpRef.current, {
                                        opacity: 0, scale: 0.8, duration: 0.4, ease: 'power2.in',
                                        onComplete: () => {
                                            setPhase('playing');
                                            setTimeout(() => {
                                                characterRef.current?.reset();
                                                bridgeRef.current?.reset();
                                                orbRef.current?.reset();
                                            }, 80);
                                        },
                                    });
                                }, 2200);
                            },
                        }
                    );
                }
            } else {
                setPhase('playing');
                setTimeout(() => {
                    characterRef.current?.reset();
                    bridgeRef.current?.reset();
                    orbRef.current?.reset();
                }, 80);
            }
        });
    }, [levelIndex, hideBanner]);

    // ── Retry same word ───────────────────────────────────────────────────
    const handleRetry = useCallback(() => {
        hideBanner(() => {
            setOrbs(buildOrbs(currentWordDef.word));
            setPhase('playing');
            lockedRef.current = false;
            setRetriedThisLevel(true);   // mark as retried for star calc
            setTimeout(() => {
                characterRef.current?.reset();
                bridgeRef.current?.reset();
                orbRef.current?.reset();
            }, 80);
        });
    }, [currentWordDef.word, hideBanner]);

    // ── Level progress dots ──────────────────────────────────────────────
    const levelInWorld = levelIndex % 5;    // 0-4
    const totalLevels = 5;

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div
            ref={sceneRef}
            className={`game-scene ${currentWorld.cssClass}`}
            id="game-scene"
            style={{ '--world-sky': currentWorld.skyGradient } as React.CSSProperties}
        >
            {/* ── Environment Layers ── */}
            <div className="env-stars" aria-hidden="true" />
            <div className="env-moon" aria-hidden="true" />
            <div className="env-forest-bg" aria-hidden="true">
                <WorldSVG world={currentWorld} />
            </div>
            <div className="env-mist" aria-hidden="true" />

            {/* ── HUD ── */}
            <header className="hud" role="banner">
                <div className="hud__left">
                    <h1 className="hud__title">Word-Bridge Builder</h1>
                    <span className="hud__world-name">
                        {currentWorld.emoji} {currentWorld.name}
                    </span>
                </div>

                {/* Level progress dots */}
                <div className="hud__levels" aria-label={`Level ${levelInWorld + 1} of ${totalLevels}`}>
                    {Array.from({ length: totalLevels }).map((_, i) => (
                        <span
                            key={i}
                            className={`hud__level-dot ${i < levelInWorld
                                ? 'hud__level-dot--done'
                                : i === levelInWorld
                                    ? 'hud__level-dot--active'
                                    : 'hud__level-dot--pending'
                                }`}
                            aria-hidden="true"
                        />
                    ))}
                </div>

                <div className="hud__right">
                    <div className="hud__right-row">
                        <span className="hud__word-label">{currentWordDef.hint}</span>
                        {/* ── Story 6: Lightbulb Hint Button ── */}
                        <button
                            ref={hintBtnRef}
                            id="hint-btn"
                            className={`hint-btn ${hintsLeft <= 0 ? 'hint-btn--depleted' : ''} ${phase !== 'playing' ? 'hint-btn--disabled' : ''}`}
                            onClick={handleHint}
                            disabled={hintsLeft <= 0 || phase !== 'playing'}
                            aria-label={`Lightbulb hint (${hintsLeft} remaining)`}
                            title={hintsLeft > 0 ? `Use a hint (${hintsLeft} left)` : 'No hints remaining'}
                        >
                            💡
                            {hintsLeft > 0 && (
                                <span className="hint-btn__badge">{hintsLeft}</span>
                            )}
                        </button>
                    </div>
                    {/* ── Story 7: Star counter ── */}
                    <TotalStarCounter totalStars={starState.totalStars} />
                    <span className="hud__score" aria-label={`Score: ${score}`}>✦ {score}</span>
                </div>
            </header>

            {/* ── Story 7: World progress bar (shown below HUD when progress < 100%) ── */}
            {starsForNext !== null && phase === 'playing' && (
                <WorldStarProgress
                    earned={starState.totalStars - (WORLD_STAR_THRESHOLDS[currentWorldIndex] ?? 0)}
                    required={
                        (WORLD_STAR_THRESHOLDS[currentWorldIndex + 1] ?? 0) -
                        (WORLD_STAR_THRESHOLDS[currentWorldIndex] ?? 0)
                    }
                    accentColor={currentWorld.accentColor}
                />
            )}

            {/* ── Character Stage ── */}
            <div className="character-stage" id="character-stage">
                <CharacterComponent
                    ref={characterRef}
                    onCrossed={() => { /* handled via await */ }}
                    onFallen={() => { /* handled via await */ }}
                />
            </div>

            {/* ── Bridge ── */}
            <main role="main">
                <BridgeComponent
                    ref={bridgeRef}
                    targetWord={currentWordDef.word}
                    hintLabel={currentWordDef.hint}
                    onComplete={handleComplete}
                    onCollapseEnd={handleCollapseEnd}
                />
            </main>

            {/* ── Letter Orbs ── */}
            <LetterOrb
                ref={orbRef}
                orbs={orbs}
                bridgeRef={bridgeRef}
                locked={phase !== 'playing'}
            />

            {/* ── Success / Failure Banner (Stories 4, 5, 7) ── */}
            <div
                ref={bannerRef}
                id="result-banner"
                className={`result-banner ${phase === 'success' || phase === 'walking'
                    ? 'result-banner--success'
                    : 'result-banner--failure'
                    }`}
                role="dialog"
                aria-modal="true"
                aria-label={
                    phase === 'success'
                        ? 'Bridge crossed successfully!'
                        : 'The bridge collapsed!'
                }
                style={{ opacity: 0, transform: 'translate(-50%, -50%) scale(0.85)', pointerEvents: 'none' }}
            >
                {(phase === 'success') && (
                    <>
                        <div className="result-banner__fx">🌟</div>
                        <p className="result-banner__title">Bridge Crossed!</p>
                        <p className="result-banner__word">
                            {currentWordDef.word} — Solid Steel
                        </p>
                        {/* ── Story 7: Star display ── */}
                        {lastStarResult && (
                            <StarDisplay stars={lastStarResult.stars} animate />
                        )}
                        {lastStarResult?.isNewBest && lastStarResult.stars === 3 && (
                            <p className="result-banner__star-hint">Perfect! ★★★</p>
                        )}
                        {lastStarResult?.isNewBest && lastStarResult.stars < 3 && (
                            <p className="result-banner__star-hint">New best! Try without hints next time.</p>
                        )}
                        <p className="result-banner__flavour">
                            Your character safely crossed. Excellent spelling!
                        </p>
                        <button
                            id="btn-next-word"
                            className="result-banner__btn result-banner__btn--success"
                            onClick={handleNext}
                            autoFocus
                        >
                            {getWorldForLevel(levelIndex + 1).id !== currentWorld.id
                                ? `Enter ${getWorldForLevel(levelIndex + 1).emoji} Next World →`
                                : 'Next Word →'}
                        </button>
                    </>
                )}
                {(phase === 'failure') && (
                    <>
                        <div className="result-banner__fx">💀</div>
                        <p className="result-banner__title">Bridge Collapsed!</p>
                        <p className="result-banner__word">
                            Crinkled Paper — Try Again
                        </p>
                        <p className="result-banner__flavour">
                            The bridge couldn't hold. Spell it correctly to cross!
                        </p>
                        {/* Hint nudge if they haven't used it yet */}
                        {!hintUsedThisLevel && hintsLeft > 0 && (
                            <p className="result-banner__hint-nudge">
                                💡 Tap the lightbulb for a clue!
                            </p>
                        )}
                        <button
                            id="btn-retry"
                            className="result-banner__btn result-banner__btn--failure"
                            onClick={handleRetry}
                            autoFocus
                        >
                            Retry ↺
                        </button>
                    </>
                )}
            </div>

            {/* ── Level-Up / World Transition Panel ── */}
            <div
                ref={levelUpRef}
                id="level-up-panel"
                className="level-up-panel"
                aria-live="polite"
                style={{ opacity: 0, pointerEvents: 'none' }}
            >
                <div className="level-up-panel__emoji">{currentWorld.emoji}</div>
                <p className="level-up-panel__title">New World Unlocked!</p>
                <p className="level-up-panel__name">{currentWorld.name}</p>
                <p className="level-up-panel__sub">
                    5 new words await your bridge-building skills…
                </p>
                <div className="level-up-panel__stars">
                    <span>★</span><span>★</span><span>★</span>
                </div>
            </div>

            {/* ── Story 6: Hint Modal ── */}
            {hintOpen && (
                <HintModal
                    word={currentWordDef.word}
                    hint={currentWordDef.hint}
                    onClose={handleHintClose}
                    hintsLeft={hintsLeft}
                />
            )}
        </div>
    );
};

// ──── World SVG Trees (adapts per world) ──────────────────────────────────

const WorldSVG: React.FC<{ world: WorldTheme }> = ({ world }) => {
    const w = world.cssClass;
    if (w === 'world--forest') {
        return (
            <svg aria-hidden="true" viewBox="0 0 800 300" preserveAspectRatio="none"
                style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', opacity: 0.85 }}>
                <polygon points="0,300 60,80 120,300" fill="#061208" />
                <polygon points="20,300 90,40 160,300" fill="#07150a" />
                <polygon points="60,300 130,100 200,300" fill="#061208" />
                <polygon points="100,300 160,120 220,300" fill="#07150a" />
                <polygon points="580,300 640,120 700,300" fill="#07150a" />
                <polygon points="620,300 690,100 760,300" fill="#061208" />
                <polygon points="660,300 730,40 800,300" fill="#07150a" />
                <polygon points="720,300 790,80 850,300" fill="#061208" />
            </svg>
        );
    }
    if (w === 'world--mountain') {
        return (
            <svg aria-hidden="true" viewBox="0 0 800 300" preserveAspectRatio="none"
                style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', opacity: 0.85 }}>
                <polygon points="0,300 100,60 200,300" fill="#0a1530" />
                <polygon points="80,300 200,20 320,300" fill="#0d1e40" />
                <polygon points="200,300 310,80 420,300" fill="#0a1530" />
                <polygon points="380,300 490,40 600,300" fill="#0d1e40" />
                <polygon points="560,300 670,70 780,300" fill="#0a1530" />
                <polygon points="100,60 130,100 70,100" fill="rgba(200,220,255,0.7)" />
                <polygon points="200,20 240,70 160,70" fill="rgba(200,220,255,0.8)" />
                <polygon points="490,40 525,80 455,80" fill="rgba(200,220,255,0.7)" />
                <polygon points="670,70 700,105 640,105" fill="rgba(200,220,255,0.6)" />
            </svg>
        );
    }
    if (w === 'world--cave') {
        return (
            <svg aria-hidden="true" viewBox="0 0 800 300" preserveAspectRatio="none"
                style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', opacity: 0.85 }}>
                <polygon points="50,0 80,120 110,0" fill="#1a0830" />
                <polygon points="150,0 180,90 210,0" fill="#1a0530" />
                <polygon points="300,0 340,140 380,0" fill="#1a0830" />
                <polygon points="500,0 530,100 560,0" fill="#1a0530" />
                <polygon points="650,0 680,110 710,0" fill="#1a0830" />
                <circle cx="80" cy="118" r="5" fill="#b060ff" opacity="0.7" />
                <circle cx="340" cy="138" r="6" fill="#9040e0" opacity="0.6" />
                <circle cx="530" cy="98" r="4" fill="#c080ff" opacity="0.8" />
            </svg>
        );
    }
    if (w === 'world--reef') {
        return (
            <svg aria-hidden="true" viewBox="0 0 800 300" preserveAspectRatio="none"
                style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', opacity: 0.85 }}>
                <ellipse cx="80" cy="260" rx="30" ry="80" fill="#007060" opacity="0.8" />
                <ellipse cx="160" cy="275" rx="20" ry="60" fill="#00a090" opacity="0.7" />
                <ellipse cx="600" cy="265" rx="28" ry="75" fill="#007060" opacity="0.8" />
                <ellipse cx="680" cy="278" rx="22" ry="55" fill="#00a090" opacity="0.7" />
                <ellipse cx="740" cy="270" rx="18" ry="65" fill="#005048" opacity="0.8" />
                <path d="M350 300 Q340 240 360 200 Q370 160 350 130" stroke="#00c0a0" strokeWidth="6" fill="none" opacity="0.5" />
                <path d="M420 300 Q430 250 410 210 Q400 170 420 140" stroke="#00a080" strokeWidth="5" fill="none" opacity="0.4" />
                <circle cx="200" cy="150" r="8" fill="none" stroke="rgba(100,220,200,0.4)" strokeWidth="2" />
                <circle cx="500" cy="100" r="6" fill="none" stroke="rgba(100,220,200,0.3)" strokeWidth="1.5" />
                <circle cx="650" cy="180" r="5" fill="none" stroke="rgba(100,220,200,0.3)" strokeWidth="1.5" />
            </svg>
        );
    }
    // world--sky
    return (
        <svg aria-hidden="true" viewBox="0 0 800 300" preserveAspectRatio="none"
            style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', opacity: 0.85 }}>
            <ellipse cx="100" cy="200" rx="90" ry="30" fill="#2a1050" opacity="0.8" />
            <ellipse cx="100" cy="190" rx="70" ry="25" fill="#3a1870" opacity="0.7" />
            <ellipse cx="650" cy="220" rx="100" ry="32" fill="#2a1050" opacity="0.8" />
            <ellipse cx="650" cy="208" rx="80" ry="26" fill="#3a1870" opacity="0.7" />
            <ellipse cx="380" cy="260" rx="120" ry="28" fill="#200840" opacity="0.9" />
            <circle cx="200" cy="50" r="2" fill="#f6ad55" opacity="0.9" />
            <circle cx="400" cy="30" r="3" fill="#fde68a" opacity="0.8" />
            <circle cx="600" cy="60" r="2" fill="#f6ad55" opacity="0.7" />
            <circle cx="700" cy="20" r="2.5" fill="#fde68a" opacity="0.9" />
            <circle cx="50" cy="80" r="1.5" fill="#f6ad55" opacity="0.6" />
        </svg>
    );
};

export default GameController;
