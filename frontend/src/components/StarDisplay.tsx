/**
 * StarDisplay.tsx
 * Epic 3 — Story 7: Star Progression
 *
 * Shows the 3 star slots for a completed level in the result banner.
 * Stars animate in one by one using GSAP.
 *
 * Also exports:
 *   - TotalStarCounter — small HUD widget showing cumulative star count
 *   - WorldStarProgress — horizontal bar showing progress toward world unlock
 */

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// ── Level star display (banner) ───────────────────────────────────────────────

interface StarDisplayProps {
    /** Number of stars earned (0–3) */
    stars: number;
    /** Whether to run the entrance animation */
    animate?: boolean;
}

const StarDisplay: React.FC<StarDisplayProps> = ({ stars, animate = true }) => {
    const starRefs = useRef<(HTMLSpanElement | null)[]>([]);

    useEffect(() => {
        if (!animate) return;
        starRefs.current.forEach((el, i) => {
            if (!el) return;
            gsap.fromTo(el,
                { scale: 0, rotation: -30, opacity: 0 },
                {
                    scale: 1, rotation: 0, opacity: 1,
                    duration: 0.45,
                    delay: 0.1 + i * 0.18,
                    ease: 'back.out(2)',
                }
            );
        });
    }, [animate, stars]);

    return (
        <div className="star-display" role="img" aria-label={`${stars} out of 3 stars`}>
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    ref={el => { starRefs.current[i] = el; }}
                    className={`star-display__star ${i < stars ? 'star-display__star--earned' : 'star-display__star--empty'}`}
                    aria-hidden="true"
                >
                    {i < stars ? '★' : '☆'}
                </span>
            ))}
        </div>
    );
};

export default StarDisplay;

// ── Small HUD star counter ────────────────────────────────────────────────────

interface TotalStarCounterProps {
    totalStars: number;
}

export const TotalStarCounter: React.FC<TotalStarCounterProps> = ({ totalStars }) => (
    <div className="hud__stars" aria-label={`Total stars: ${totalStars}`}>
        <span className="hud__star-icon" aria-hidden="true">★</span>
        <span className="hud__star-count">{totalStars}</span>
    </div>
);

// ── World progress bar ────────────────────────────────────────────────────────

interface WorldStarProgressProps {
    /** Stars earned so far toward current threshold */
    earned: number;
    /** Total stars needed for next unlock */
    required: number;
    /** Accent colour for the fill bar */
    accentColor: string;
}

export const WorldStarProgress: React.FC<WorldStarProgressProps> = ({
    earned, required, accentColor,
}) => {
    const pct = Math.min(100, (earned / required) * 100);

    return (
        <div className="world-progress" aria-label={`${earned} of ${required} stars to unlock next world`}>
            <span className="world-progress__label">
                Next world in <strong>{Math.max(0, required - earned)}</strong> ★
            </span>
            <div className="world-progress__bar">
                <div
                    className="world-progress__fill"
                    style={{ width: `${pct}%`, background: accentColor }}
                />
            </div>
        </div>
    );
};
