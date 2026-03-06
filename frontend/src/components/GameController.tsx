/**
 * GameController.tsx
 * Orchestrates the full Epic 1 game loop:
 *   1. Render bridge skeleton with target word
 *   2. Present shuffled letter orbs
 *   3. Detect word completion → validate → trigger material transform
 *   4. Show result banner → allow retry
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import BridgeComponent, { BridgeComponentHandle } from './BridgeComponent';
import LetterOrb, { LetterOrbHandle, OrbDef } from './LetterOrb';

// ──── Word Bank ────────────────────────────────────────────────────────────

const WORD_BANK: { word: string; hint: string }[] = [
    { word: 'BRIDGE', hint: '🌉 Build a bridge' },
    { word: 'RIVER', hint: '🌊 Flowing water' },
    { word: 'STONE', hint: '🪨 Hard rock' },
    { word: 'PLANT', hint: '🌿 Green growth' },
    { word: 'CLOUD', hint: '☁️ Sky float' },
    { word: 'FROST', hint: '❄️ Cold morning' },
    { word: 'LIGHT', hint: '💡 Bright idea' },
];

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

type GamePhase = 'playing' | 'success' | 'failure';

// ──── Component ────────────────────────────────────────────────────────────

const GameController: React.FC = () => {
    const [wordIndex, setWordIndex] = useState(0);
    const [phase, setPhase] = useState<GamePhase>('playing');
    const [score, setScore] = useState(0);
    const [orbs, setOrbs] = useState<OrbDef[]>(() =>
        buildOrbs(WORD_BANK[0].word)
    );

    const bridgeRef = useRef<BridgeComponentHandle>(null);
    const orbRef = useRef<LetterOrbHandle>(null);
    const bannerRef = useRef<HTMLDivElement>(null);
    const lockedRef = useRef(false);

    const current = WORD_BANK[wordIndex];

    // ── Handle word completion ──────────────────────────────────────────────
    const handleComplete = useCallback(async (filledWord: string) => {
        if (lockedRef.current) return;
        lockedRef.current = true;

        const isCorrect = filledWord === current.word;

        if (isCorrect) {
            setScore(s => s + 1);
            await bridgeRef.current?.transformMaterial('steel');
            setPhase('success');
        } else {
            await bridgeRef.current?.transformMaterial('paper');
            setPhase('failure');
        }

        // Animate in result banner
        if (bannerRef.current) {
            gsap.to(bannerRef.current, {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                ease: 'back.out(1.6)',
            });
        }
    }, [current.word]);

    // ── Handle collapse end (bridge off-screen) ─────────────────────────────
    const handleCollapseEnd = useCallback(() => {
        // Banner is already showing at this point — nothing extra needed
    }, []);

    // ── Next word / retry ───────────────────────────────────────────────────
    const handleNext = useCallback(() => {
        if (bannerRef.current) {
            gsap.to(bannerRef.current, {
                opacity: 0,
                scale: 0.85,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => {
                    // Pick next word (or loop)
                    const nextIdx = (wordIndex + 1) % WORD_BANK.length;
                    setWordIndex(nextIdx);
                    setOrbs(buildOrbs(WORD_BANK[nextIdx].word));
                    setPhase('playing');
                    lockedRef.current = false;

                    // Reset bridge + orbs after state settles
                    setTimeout(() => {
                        bridgeRef.current?.reset();
                        orbRef.current?.reset();
                    }, 80);
                },
            });
        }
    }, [wordIndex]);

    const handleRetry = useCallback(() => {
        if (bannerRef.current) {
            gsap.to(bannerRef.current, {
                opacity: 0,
                scale: 0.85,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => {
                    setOrbs(buildOrbs(current.word));
                    setPhase('playing');
                    lockedRef.current = false;
                    setTimeout(() => {
                        bridgeRef.current?.reset();
                        orbRef.current?.reset();
                    }, 80);
                },
            });
        }
    }, [current.word]);

    // ── Reset banner when phase returns to playing ──────────────────────────
    useEffect(() => {
        if (phase === 'playing' && bannerRef.current) {
            gsap.set(bannerRef.current, { opacity: 0, scale: 0.85 });
        }
    }, [phase]);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="game-scene" id="game-scene">
            {/* Environment layers */}
            <div className="env-stars" aria-hidden="true" />
            <div className="env-moon" aria-hidden="true" />
            <div className="env-forest-bg" aria-hidden="true">
                {/* SVG tree silhouettes */}
                <svg
                    aria-hidden="true"
                    viewBox="0 0 800 300"
                    preserveAspectRatio="none"
                    style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%', opacity: 0.85 }}
                >
                    {/* Left trees */}
                    <polygon points="0,300 60,80  120,300" fill="#061208" />
                    <polygon points="20,300 90,40  160,300" fill="#07150a" />
                    <polygon points="60,300 130,100 200,300" fill="#061208" />
                    <polygon points="100,300 160,120 220,300" fill="#07150a" />
                    {/* Right trees */}
                    <polygon points="580,300 640,120 700,300" fill="#07150a" />
                    <polygon points="620,300 690,100 760,300" fill="#061208" />
                    <polygon points="660,300 730,40  800,300" fill="#07150a" />
                    <polygon points="720,300 790,80  850,300" fill="#061208" />
                </svg>
            </div>
            <div className="env-mist" aria-hidden="true" />

            {/* HUD */}
            <header className="hud" role="banner">
                <h1 className="hud__title">Word-Bridge Builder</h1>
                <span className="hud__word-label">{current.hint}</span>
                <span className="hud__score" aria-label={`Score: ${score}`}>✦ {score}</span>
            </header>

            {/* Bridge */}
            <main role="main">
                <BridgeComponent
                    ref={bridgeRef}
                    targetWord={current.word}
                    hintLabel={current.hint}
                    onComplete={handleComplete}
                    onCollapseEnd={handleCollapseEnd}
                />
            </main>

            {/* Letter Orbs */}
            <LetterOrb
                ref={orbRef}
                orbs={orbs}
                bridgeRef={bridgeRef}
                locked={phase !== 'playing'}
            />

            {/* Result Banner */}
            <div
                ref={bannerRef}
                id="result-banner"
                className={`result-banner ${phase === 'success' ? 'result-banner--success' : 'result-banner--failure'
                    }`}
                role="dialog"
                aria-modal="true"
                aria-label={phase === 'success' ? 'You crossed successfully!' : 'The bridge collapsed!'}
                style={{ opacity: 0, transform: 'translate(-50%, -50%) scale(0.85)' }}
            >
                {phase === 'success' && (
                    <>
                        <p className="result-banner__title">⚔️ Bridge Built!</p>
                        <p className="result-banner__word">{current.word} — Solid Steel</p>
                        <button
                            id="btn-next-word"
                            className="result-banner__btn"
                            onClick={handleNext}
                            autoFocus
                        >
                            Next Word →
                        </button>
                    </>
                )}
                {phase === 'failure' && (
                    <>
                        <p className="result-banner__title">💀 Bridge Collapsed!</p>
                        <p className="result-banner__word">Crinkled Paper — Try Again</p>
                        <button
                            id="btn-retry"
                            className="result-banner__btn"
                            onClick={handleRetry}
                            autoFocus
                        >
                            Retry ↺
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default GameController;
