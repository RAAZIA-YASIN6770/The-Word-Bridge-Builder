/**
 * CharacterComponent.tsx
 * Epic 2 — Story 4 (Successful Crossing) & Story 5 (Bridge Collapse)
 *
 * Renders an animated SVG character that:
 *   - Idles on the left side of the bridge gap
 *   - Walks across the steel bridge on success (Story 4)
 *   - Falls with the collapsing paper bridge on failure (Story 5)
 */

import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { gsap } from 'gsap';

// ──── Handle ────────────────────────────────────────────────────────────────

export interface CharacterHandle {
    /** Walk right across the bridge → reach the other side */
    walkAcross: () => Promise<void>;
    /** Fall downward (bridge collapse) then show game-over */
    fallOff: () => Promise<void>;
    /** Reset to idle starting position */
    reset: () => void;
}

interface CharacterProps {
    /** Called when the character finishes crossing (after walk animation) */
    onCrossed?: () => void;
    /** Called when the character finishes falling (after fall animation) */
    onFallen?: () => void;
}

// ──── Component ─────────────────────────────────────────────────────────────

const CharacterComponent = forwardRef<CharacterHandle, CharacterProps>(
    ({ onCrossed, onFallen }, ref) => {

        const wrapperRef = useRef<HTMLDivElement>(null);
        const bodyRef = useRef<SVGGElement>(null);
        const leftLegRef = useRef<SVGLineElement>(null);
        const rightLegRef = useRef<SVGLineElement>(null);
        const leftArmRef = useRef<SVGLineElement>(null);
        const rightArmRef = useRef<SVGLineElement>(null);
        const capeRef = useRef<SVGPathElement>(null);
        const eyeRef = useRef<SVGCircleElement>(null);

        // Walk animation timeline ref — so we can kill it on reset
        const walkTlRef = useRef<GSAPTimeline | null>(null);

        // ── Walk Across ───────────────────────────────────────────────────────
        const walkAcross = useCallback((): Promise<void> => {
            return new Promise(resolve => {
                const wrapper = wrapperRef.current;
                if (!wrapper) { resolve(); return; }

                // Kill any previous animation
                walkTlRef.current?.kill();

                const tl = gsap.timeline({
                    onComplete: () => {
                        onCrossed?.();
                        resolve();
                    },
                });
                walkTlRef.current = tl;

                // 1. Excitement jump before walking
                tl.to(wrapper, {
                    y: -16,
                    duration: 0.18,
                    ease: 'power2.out',
                });
                tl.to(wrapper, {
                    y: 0,
                    duration: 0.22,
                    ease: 'bounce.out',
                });

                // 2. Walk across bridge (translate right)
                tl.to(wrapper, {
                    x: '+=380',
                    duration: 1.6,
                    ease: 'none',
                }, '+=0.1');

                // 3. Leg swing loop - synchronized with walk
                tl.to(leftLegRef.current, {
                    rotation: 25,
                    transformOrigin: '50% 0%',
                    duration: 0.22,
                    repeat: 7,
                    yoyo: true,
                    ease: 'sine.inOut',
                }, '<');

                tl.to(rightLegRef.current, {
                    rotation: -25,
                    transformOrigin: '50% 0%',
                    duration: 0.22,
                    repeat: 7,
                    yoyo: true,
                    ease: 'sine.inOut',
                }, '<');

                // Arm swing (opposite to legs)
                tl.to(leftArmRef.current, {
                    rotation: -20,
                    transformOrigin: '50% 0%',
                    duration: 0.22,
                    repeat: 7,
                    yoyo: true,
                    ease: 'sine.inOut',
                }, '<');

                tl.to(rightArmRef.current, {
                    rotation: 20,
                    transformOrigin: '50% 0%',
                    duration: 0.22,
                    repeat: 7,
                    yoyo: true,
                    ease: 'sine.inOut',
                }, '<');

                // Cape flutter during walk
                tl.to(capeRef.current, {
                    scaleX: 1.15,
                    scaleY: 0.9,
                    transformOrigin: '100% 0%',
                    duration: 0.3,
                    repeat: 5,
                    yoyo: true,
                    ease: 'sine.inOut',
                }, '<');

                // 4. Celebration bounce on arrival
                tl.to(wrapper, {
                    y: -20,
                    duration: 0.2,
                    ease: 'power2.out',
                }, '+=0.05');
                tl.to(wrapper, {
                    y: 0,
                    duration: 0.3,
                    ease: 'bounce.out',
                });

                // Star sparkle on character
                tl.call(() => spawnStars(wrapper), [], '-=0.1');
            });
        }, [onCrossed]);

        // ── Fall Off ──────────────────────────────────────────────────────────
        const fallOff = useCallback((): Promise<void> => {
            return new Promise(resolve => {
                const wrapper = wrapperRef.current;
                if (!wrapper) { resolve(); return; }

                walkTlRef.current?.kill();

                const tl = gsap.timeline({
                    onComplete: () => {
                        onFallen?.();
                        resolve();
                    },
                });
                walkTlRef.current = tl;

                // 1. Short stumble attempt on bridge
                tl.to(wrapper, {
                    x: '+=30',
                    duration: 0.3,
                    ease: 'power1.out',
                });

                // 2. Flail arms (panic)
                tl.to([leftArmRef.current, rightArmRef.current], {
                    rotation: 45,
                    transformOrigin: '50% 0%',
                    duration: 0.15,
                    repeat: 3,
                    yoyo: true,
                    ease: 'power1.inOut',
                }, '<');

                // 3. Tilt and fall
                tl.to(wrapper, {
                    rotation: 90,
                    y: 220,
                    x: '+=40',
                    opacity: 0,
                    duration: 0.9,
                    ease: 'power3.in',
                }, '+=0.1');
            });
        }, [onFallen]);

        // ── Reset ──────────────────────────────────────────────────────────────
        const reset = useCallback(() => {
            walkTlRef.current?.kill();
            const wrapper = wrapperRef.current;
            if (wrapper) {
                gsap.killTweensOf([wrapper, leftLegRef.current, rightLegRef.current,
                    leftArmRef.current, rightArmRef.current, capeRef.current]);
                gsap.set(wrapper, { clearProps: 'all' });
                gsap.set([leftLegRef.current, rightLegRef.current,
                leftArmRef.current, rightArmRef.current, capeRef.current],
                    { clearProps: 'all' });
            }
        }, []);

        useImperativeHandle(ref, () => ({ walkAcross, fallOff, reset }));

        // ── Render ─────────────────────────────────────────────────────────────
        return (
            <div
                ref={wrapperRef}
                className="character-wrapper"
                id="character-wrapper"
                aria-hidden="true"
            >
                <svg
                    className="character-svg"
                    viewBox="0 0 40 72"
                    width="40"
                    height="72"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <g ref={bodyRef} className="character-body">
                        {/* Cape */}
                        <path
                            ref={capeRef}
                            d="M18 20 Q8 35 12 52 Q16 58 20 55 L20 20 Z"
                            fill="#7c3aed"
                            opacity="0.85"
                            className="char-cape"
                        />

                        {/* Torso */}
                        <rect x="13" y="20" width="14" height="20" rx="3"
                            fill="#1e40af" stroke="#3b82f6" strokeWidth="1" />

                        {/* Belt */}
                        <rect x="13" y="34" width="14" height="3" rx="1"
                            fill="#d97706" />

                        {/* Head */}
                        <circle cx="20" cy="13" r="9"
                            fill="#fde68a" stroke="#d97706" strokeWidth="1.2" />

                        {/* Eye */}
                        <circle ref={eyeRef} cx="23" cy="12" r="2.5" fill="#1e3a8a" />
                        <circle cx="23.8" cy="11.2" r="0.8" fill="white" />

                        {/* Eyebrow */}
                        <path d="M20 9.5 Q23 8 26 9.5" stroke="#92400e" strokeWidth="1.2"
                            fill="none" strokeLinecap="round" />

                        {/* Smile */}
                        <path d="M17.5 16 Q20 18.5 22.5 16" stroke="#92400e" strokeWidth="1.2"
                            fill="none" strokeLinecap="round" />

                        {/* Hair */}
                        <path d="M11 11 Q14 4 20 3 Q26 4 29 11 Q26 7 20 7 Q14 7 11 11Z"
                            fill="#92400e" />

                        {/* Left Arm */}
                        <line ref={leftArmRef}
                            x1="13" y1="23" x2="6" y2="33"
                            stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />

                        {/* Right Arm */}
                        <line ref={rightArmRef}
                            x1="27" y1="23" x2="34" y2="33"
                            stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />

                        {/* Left Leg */}
                        <line ref={leftLegRef}
                            x1="16" y1="40" x2="13" y2="58"
                            stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
                        {/* Left Boot */}
                        <ellipse cx="12" cy="59" rx="5" ry="3" fill="#78350f" />

                        {/* Right Leg */}
                        <line ref={rightLegRef}
                            x1="24" y1="40" x2="27" y2="58"
                            stroke="#1e40af" strokeWidth="4" strokeLinecap="round" />
                        {/* Right Boot */}
                        <ellipse cx="28" cy="59" rx="5" ry="3" fill="#78350f" />
                    </g>
                </svg>
            </div>
        );
    }
);

// ── Utility: spawn celebratory stars ──────────────────────────────────────────

function spawnStars(container: HTMLElement) {
    const colors = ['#fde68a', '#6ee7b7', '#93c5fd', '#f9a8d4', '#c4b5fd'];
    for (let i = 0; i < 8; i++) {
        const star = document.createElement('div');
        star.className = 'char-star';
        star.textContent = ['✦', '★', '✸', '✺', '❋'][Math.floor(Math.random() * 5)];
        star.style.color = colors[Math.floor(Math.random() * colors.length)];
        const angle = (i / 8) * 360 + Math.random() * 20;
        const dist = 30 + Math.random() * 30;
        container.appendChild(star);

        gsap.fromTo(star,
            { x: 0, y: 0, scale: 0, opacity: 1 },
            {
                x: Math.cos(angle * Math.PI / 180) * dist,
                y: Math.sin(angle * Math.PI / 180) * dist - 20,
                scale: 1 + Math.random(),
                opacity: 0,
                duration: 0.7 + Math.random() * 0.4,
                ease: 'power2.out',
                onComplete: () => star.remove(),
            }
        );
    }
}

CharacterComponent.displayName = 'CharacterComponent';
export default CharacterComponent;
