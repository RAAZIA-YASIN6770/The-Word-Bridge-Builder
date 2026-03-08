/**
 * HintModal.tsx
 * Epic 3 — Story 6: Lightbulb Hint
 *
 * A modal overlay that reveals a visual "picture clue" for the current word.
 * The clue is built from the word's emoji hint + a descriptive illustration
 * rendered entirely in CSS/SVG (no external image fetch — works offline).
 *
 * Props:
 *   word        — the target word (e.g. "BRIDGE")
 *   hint        — the emoji + short text hint (e.g. "🌉 Build a bridge")
 *   onClose     — callback to close the modal
 *   hintsLeft   — how many hint uses remain
 */

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface HintModalProps {
    word: string;
    hint: string;
    onClose: () => void;
    hintsLeft: number;
}

// ── Word → descriptive sentence ──────────────────────────────────────────────
const WORD_DESCRIPTIONS: Record<string, string> = {
    BRIDGE: 'A sturdy structure spanning a gap or river, letting you cross safely.',
    RIVER: 'A long body of flowing water that winds through the land.',
    STONE: 'A hard, solid piece of rock found in nature.',
    PLANT: 'A living green organism that grows from soil toward sunlight.',
    CLOUD: 'A fluffy mass of condensed water vapour floating in the sky.',
    FROST: 'A thin layer of ice crystals covering surfaces on cold mornings.',
    SNOW: 'White flakes of frozen water that fall from winter clouds.',
    CLIMB: 'The act of moving upward — scaling a rock face or mountain.',
    WIND: 'Moving air that rustles leaves and fills sails with power.',
    CAVE: 'A hollow space inside a cliff or mountain, cool and dark.',
    LIGHT: 'Bright illumination — the opposite of darkness; it lets you see.',
    JEWEL: 'A precious gemstone cut and polished to catch the light.',
    DARK: 'The absence of light — found deep underground or at midnight.',
    ECHO: 'A sound that bounces off a surface and returns to your ears.',
    MAGIC: 'A mysterious force that makes impossible things happen.',
    CORAL: 'Colourful marine organisms forming reef structures underwater.',
    WHALE: 'The largest ocean mammal — a gentle giant of the deep.',
    PEARL: 'A lustrous gem formed inside an oyster over many years.',
    SWIM: 'Moving through water using your arms and legs in rhythm.',
    SHELL: 'A hard protective outer casing of a sea creature.',
    STORM: 'A powerful weather event with strong winds, rain and lightning.',
    WINGS: 'The paired appendages a bird or angel uses to soar through air.',
    STAR: 'A giant ball of burning gas, visible as a point of light at night.',
    CROWN: 'An ornate circlet worn atop the head — a symbol of royalty.',
    BRAVE: 'Having the courage to face danger or difficulty without fear.',
};

function getDescription(word: string): string {
    return WORD_DESCRIPTIONS[word.toUpperCase()] ?? `The word "${word}" — look closely at the hint above!`;
}

// ── Decorative SVG illustrations per word (simplified) ───────────────────────
const WordIllustration: React.FC<{ word: string; hint: string }> = ({ word, hint }) => {
    // Extract just the emoji(s) from the hint string
    const emoji = hint.split(' ')[0] ?? '💡';

    return (
        <div className="hint-illustration" aria-hidden="true">
            {/* Large centred emoji as the "picture" */}
            <div className="hint-illustration__emoji">{emoji}</div>

            {/* Word spelled out in large decorated letters */}
            <div className="hint-illustration__word">
                {word.toUpperCase().split('').map((ch, i) => (
                    <span key={i} className="hint-illustration__char" style={{ animationDelay: `${i * 0.07}s` }}>
                        {ch}
                    </span>
                ))}
            </div>

            {/* Decorative sparkles */}
            <div className="hint-sparkle hint-sparkle--1">✦</div>
            <div className="hint-sparkle hint-sparkle--2">✦</div>
            <div className="hint-sparkle hint-sparkle--3">✦</div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────

const HintModal: React.FC<HintModalProps> = ({ word, hint, onClose, hintsLeft }) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Entrance animation
    useEffect(() => {
        if (!overlayRef.current || !panelRef.current) return;

        gsap.fromTo(overlayRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
        gsap.fromTo(panelRef.current,
            { opacity: 0, scale: 0.8, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.6)' }
        );
    }, []);

    const handleClose = () => {
        if (!overlayRef.current || !panelRef.current) { onClose(); return; }

        gsap.to(panelRef.current, {
            opacity: 0, scale: 0.85, y: 20,
            duration: 0.25, ease: 'power2.in',
        });
        gsap.to(overlayRef.current, {
            opacity: 0, duration: 0.3, ease: 'power2.in',
            onComplete: onClose,
        });
    };

    // Close on overlay click (not panel)
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) handleClose();
    };

    return (
        <div
            ref={overlayRef}
            className="hint-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Hint for the word ${word}`}
            onClick={handleOverlayClick}
        >
            <div ref={panelRef} className="hint-panel">
                {/* Header */}
                <div className="hint-panel__header">
                    <span className="hint-panel__icon">💡</span>
                    <h2 className="hint-panel__title">Lightbulb Hint</h2>
                    <button
                        id="hint-close-btn"
                        className="hint-panel__close"
                        onClick={handleClose}
                        aria-label="Close hint"
                    >
                        ✕
                    </button>
                </div>

                {/* Illustration */}
                <WordIllustration word={word} hint={hint} />

                {/* Description */}
                <p className="hint-panel__description">
                    {getDescription(word)}
                </p>

                {/* Hints remaining */}
                <div className="hint-panel__footer">
                    <span className="hint-panel__uses-label">
                        {hintsLeft > 0
                            ? `${hintsLeft} hint${hintsLeft !== 1 ? 's' : ''} remaining`
                            : 'No hints remaining'}
                    </span>
                    <button
                        id="hint-got-it-btn"
                        className="hint-panel__btn"
                        onClick={handleClose}
                        autoFocus
                    >
                        Got it! ✓
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HintModal;
