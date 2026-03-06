/**
 * BridgeComponent.tsx
 * Story 1 — Bridge Skeleton (Visual Trigger)
 * Story 3 — Material Transformation (Feedback Loop)
 *
 * Displays a stylized 2D bridge with letter slots.
 * Looks "fragile" as skeleton (shaking planks, dim amber glow, crack overlays).
 * Transforms to STEEL on correct word, PAPER on incorrect word via GSAP.
 */

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { gsap } from 'gsap';

// ──── Types ────────────────────────────────────────────────────────────────

export type BridgeMaterial = 'skeleton' | 'steel' | 'paper';

export interface BridgeSlot {
    index: number;
    expectedLetter: string;
    filledLetter: string | null;
}

export interface BridgeComponentHandle {
    /**
     * Called by LetterOrb when a letter snaps into a slot.
     * Returns true if all slots are now filled.
     */
    fillSlot: (slotIndex: number, letter: string) => boolean;

    /**
     * Trigger material transformation using GSAP.
     */
    transformMaterial: (material: 'steel' | 'paper') => Promise<void>;

    /**
     * Reset the bridge back to skeleton state.
     */
    reset: () => void;

    /** Read-only: current slots state */
    getSlots: () => BridgeSlot[];
}

interface BridgeComponentProps {
    /** The target word (e.g. "BRIDGE") */
    targetWord: string;
    /** Called when all slots are filled */
    onComplete: (filledWord: string) => void;
    /** Called after collapse animation ends */
    onCollapseEnd?: () => void;
    /** An optional image/hint label shown above the bridge */
    hintLabel?: string;
}

// ──── Component ────────────────────────────────────────────────────────────

const BridgeComponent = forwardRef<BridgeComponentHandle, BridgeComponentProps>(
    ({ targetWord, onComplete, onCollapseEnd, hintLabel }, ref) => {

        // Normalise word to uppercase letters only
        const word = targetWord.toUpperCase().replace(/[^A-Z]/g, '');

        // ── State (kept in refs for perf; DOM is directly mutated by GSAP) ──
        const slotsRef = useRef<BridgeSlot[]>(
            word.split('').map((letter, i) => ({
                index: i,
                expectedLetter: letter,
                filledLetter: null,
            }))
        );
        const materialRef = useRef<BridgeMaterial>('skeleton');
        const bridgeElRef = useRef<HTMLDivElement>(null);
        const slotEls = useRef<(HTMLDivElement | null)[]>([]);
        const isAnimatingRef = useRef(false);

        // ── Expose imperative handle ──────────────────────────────────────────
        useImperativeHandle(ref, () => ({

            fillSlot(slotIndex: number, letter: string): boolean {
                if (isAnimatingRef.current) return false;
                if (slotIndex < 0 || slotIndex >= slotsRef.current.length) return false;
                if (slotsRef.current[slotIndex].filledLetter !== null) return false;

                // Update data
                slotsRef.current[slotIndex].filledLetter = letter;

                // Update DOM
                const el = slotEls.current[slotIndex];
                if (el) {
                    el.classList.remove('bridge__slot--empty');
                    el.classList.add('bridge__slot--filled');

                    // Update letter display
                    const letterEl = el.querySelector('.bridge__slot-letter') as HTMLSpanElement;
                    if (letterEl) letterEl.textContent = letter;

                    // Snap particle flash
                    const particle = document.createElement('div');
                    particle.className = 'snap-particle';
                    el.appendChild(particle);
                    setTimeout(() => particle.remove(), 420);

                    // GSAP micro-bounce
                    gsap.fromTo(el,
                        { scale: 1.3, y: -8 },
                        { scale: 1, y: 0, duration: 0.45, ease: 'elastic.out(1.2, 0.5)' }
                    );
                }

                // Check if all slots filled
                const allFilled = slotsRef.current.every(s => s.filledLetter !== null);
                if (allFilled) {
                    const filled = slotsRef.current.map(s => s.filledLetter!).join('');
                    onComplete(filled);
                }
                return allFilled;
            },

            async transformMaterial(material: 'steel' | 'paper'): Promise<void> {
                if (isAnimatingRef.current) return;
                isAnimatingRef.current = true;

                const bridge = bridgeElRef.current;
                if (!bridge) { isAnimatingRef.current = false; return; }

                const tl = gsap.timeline({
                    onComplete: () => { isAnimatingRef.current = false; }
                });

                if (material === 'steel') {
                    // ── Steel Transformation ──────────────────────────────────────
                    // 1. Flash of white light
                    tl.to(bridge, {
                        filter: 'brightness(2.5) saturate(0)',
                        duration: 0.18,
                        ease: 'power2.in',
                    });
                    // 2. Apply class mid-flash
                    tl.call(() => {
                        bridge.classList.remove('bridge--paper');
                        bridge.classList.add('bridge--steel');
                        materialRef.current = 'steel';
                    });
                    // 3. Settle into steel with metallic shimmer
                    tl.to(bridge, {
                        filter: 'brightness(1.1) saturate(1.4)',
                        duration: 0.5,
                        ease: 'power2.out',
                    });
                    // 4. Slot stagger entrance
                    tl.fromTo(
                        slotEls.current.filter(Boolean),
                        { scaleY: 0.6, opacity: 0.5 },
                        { scaleY: 1, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.7)' },
                        '<0.05'
                    );
                    // 5. Final glow pulse
                    tl.fromTo(bridge,
                        { filter: 'brightness(1.1) saturate(1.4) drop-shadow(0 0 0px #63b3ed)' },
                        { filter: 'brightness(1) saturate(1) drop-shadow(0 0 20px #63b3ed)', duration: 0.6, ease: 'sine.inOut' }
                    );
                    tl.to(bridge, {
                        filter: 'brightness(1) saturate(1) drop-shadow(0 0 6px #63b3ed)',
                        duration: 0.8,
                        ease: 'sine.inOut',
                    });

                } else {
                    // ── Paper Transformation ──────────────────────────────────────
                    // 1. Crinkle effect: rapid scale jitter
                    tl.to(bridge, {
                        filter: 'brightness(1.5) sepia(0.8)',
                        duration: 0.15,
                        ease: 'power1.in',
                    });
                    tl.call(() => {
                        bridge.classList.remove('bridge--steel');
                        bridge.classList.add('bridge--paper');
                        materialRef.current = 'paper';
                    });
                    tl.to(bridge, {
                        filter: 'brightness(0.9) sepia(0.6)',
                        duration: 0.3,
                        ease: 'power2.out',
                    });

                    // 2. Shake — the bridge is WEAK
                    bridge.classList.add('bridge--shake');
                    tl.call(() => {
                        setTimeout(() => bridge.classList.remove('bridge--shake'), 500);
                    }, [], '+=0.15');

                    // 3. Slots droop/wilt with stagger
                    tl.to(
                        slotEls.current.filter(Boolean),
                        {
                            rotation: (i) => (i % 2 === 0 ? -3 : 3),
                            y: (i) => i * 1.5,
                            duration: 0.5,
                            stagger: 0.05,
                            ease: 'power2.in'
                        },
                        '+=0.1'
                    );

                    // 4. Collapse: bridge drops away
                    tl.to(bridge, {
                        y: 80,
                        rotation: gsap.utils.random(-6, 6),
                        opacity: 0,
                        duration: 0.8,
                        ease: 'power3.in',
                        delay: 0.3,
                    });

                    // 5. Notify parent & reset
                    tl.call(() => {
                        onCollapseEnd?.();
                    });
                }

                await tl.then();
            },

            reset() {
                // Reset slots data
                slotsRef.current = word.split('').map((letter, i) => ({
                    index: i,
                    expectedLetter: letter,
                    filledLetter: null,
                }));
                materialRef.current = 'skeleton';

                const bridge = bridgeElRef.current;
                if (bridge) {
                    // Kill all GSAP animations on bridge
                    gsap.killTweensOf(bridge);
                    gsap.killTweensOf(slotEls.current.filter(Boolean));

                    // Reset visual state
                    gsap.set(bridge, { clearProps: 'all' });
                    bridge.classList.remove('bridge--steel', 'bridge--paper',
                        'bridge--shake', 'bridge--collapsing');

                    // Reset slots
                    slotEls.current.forEach((el, i) => {
                        if (!el) return;
                        gsap.set(el, { clearProps: 'all' });
                        el.classList.remove('bridge__slot--filled');
                        el.classList.add('bridge__slot--empty');
                        const letterEl = el.querySelector('.bridge__slot-letter') as HTMLSpanElement;
                        if (letterEl) letterEl.textContent = '_';
                    });
                    isAnimatingRef.current = false;
                }
            },

            getSlots() {
                return [...slotsRef.current];
            },
        }));

        // ── Entrance animation on mount ───────────────────────────────────────
        useEffect(() => {
            const bridge = bridgeElRef.current;
            if (!bridge) return;

            gsap.fromTo(bridge,
                { y: -40, opacity: 0, scale: 0.92 },
                { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.5)', delay: 0.2 }
            );

            // Stagger slot entrance
            gsap.fromTo(
                slotEls.current.filter(Boolean),
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out', delay: 0.4 }
            );
        }, []);

        // ── Render ────────────────────────────────────────────────────────────
        return (
            <div className="bridge-wrapper" role="region" aria-label={`Build the bridge by spelling: ${hintLabel || targetWord}`}>
                {/* Word hint above bridge */}
                {hintLabel && (
                    <p className="bridge-image-word" aria-label={`Target word: ${hintLabel}`}>
                        {hintLabel}
                    </p>
                )}

                {/* Bridge structure */}
                <div
                    ref={bridgeElRef}
                    className="bridge"
                    id="bridge-main"
                    aria-label="Bridge structure"
                    role="img"
                >
                    {/* Top rope rail */}
                    <div className="bridge__rope bridge__rope--top" />

                    {/* Letter Slots Row */}
                    <div className="bridge__planks" role="list" aria-label="Letter slots">
                        {word.split('').map((letter, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <div className="bridge__separator" aria-hidden="true" />}
                                <div
                                    ref={el => { slotEls.current[i] = el; }}
                                    id={`bridge-slot-${i}`}
                                    className="bridge__slot bridge__slot--empty"
                                    data-slot-index={i}
                                    data-expected={letter}
                                    role="listitem"
                                    aria-label={`Slot ${i + 1}: empty`}
                                    tabIndex={-1}
                                >
                                    <span className="bridge__slot-letter" aria-hidden="true">_</span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Bottom rope rail */}
                    <div className="bridge__rope bridge__rope--bottom" />
                </div>
            </div>
        );
    }
);

BridgeComponent.displayName = 'BridgeComponent';
export default BridgeComponent;
