/**
 * LetterOrb.tsx
 * Story 2 — Letter Interaction (The Physics Flick)
 *
 * Renders a tray of draggable / flickable letter orbs.
 * Drag: pointer-down → orb becomes position:fixed and follows cursor
 * Flick: on pointer-up, velocity is calculated → orb animates in that direction
 * Snap: if orb lands near a bridge slot, it snaps into place
 */

import React, {
    useEffect,
    useRef,
    useCallback,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react';
import { gsap } from 'gsap';
import { BridgeComponentHandle } from './BridgeComponent';

// ──── Types ────────────────────────────────────────────────────────────────

export interface OrbDef {
    id: string;
    letter: string;
}

interface SlotTarget {
    index: number;
    cx: number;
    cy: number;
    el: HTMLElement;
    filled: boolean;
}

export interface LetterOrbHandle {
    reset: () => void;
}

interface LetterOrbProps {
    orbs: OrbDef[];
    bridgeRef: React.RefObject<BridgeComponentHandle | null>;
    onSnap?: (orbId: string, slotIndex: number) => void;
    locked?: boolean;
}

// ──── Constants ────────────────────────────────────────────────────────────

const SNAP_RADIUS = 65;  // px — how close orb needs to be to auto-snap
const VEL_SAMPLES = 5;   // number of pointer-move samples for flick velocity

// ──── Helpers ──────────────────────────────────────────────────────────────

function getCenter(el: HTMLElement): { cx: number; cy: number } {
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

function findNearestSlot(px: number, py: number, slots: SlotTarget[]): SlotTarget | null {
    let best: SlotTarget | null = null;
    let bestDist = Infinity;
    for (const s of slots) {
        if (s.filled) continue;
        const dx = px - s.cx;
        const dy = py - s.cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < SNAP_RADIUS && d < bestDist) {
            bestDist = d;
            best = s;
        }
    }
    return best;
}

// ──── Component ────────────────────────────────────────────────────────────

const LetterOrb = forwardRef<LetterOrbHandle, LetterOrbProps>(
    ({ orbs, bridgeRef, onSnap, locked = false }, ref) => {

        const [usedOrbs, setUsedOrbs] = useState<Set<string>>(new Set());
        const slotTargets = useRef<SlotTarget[]>([]);
        const lockedRef = useRef(locked);
        const dragRef = useRef<{
            orbId: string;
            el: HTMLDivElement;
            startRect: DOMRect;
            // For flick velocity
            history: { x: number; y: number; t: number }[];
        } | null>(null);

        useEffect(() => { lockedRef.current = locked; }, [locked]);

        // ── Expose imperative handle ──
        useImperativeHandle(ref, () => ({
            reset() {
                setUsedOrbs(new Set());
                slotTargets.current.forEach(s => { s.filled = false; });
                // Re-measure slots after bridge resets
                setTimeout(measureSlots, 150);
            },
        }));

        // ── Measure bridge slot positions ──
        function measureSlots() {
            slotTargets.current = [];
            const slotEls = document.querySelectorAll<HTMLElement>('[id^="bridge-slot-"]');
            slotEls.forEach(el => {
                const idxStr = el.getAttribute('data-slot-index');
                if (idxStr === null) return;
                const { cx, cy } = getCenter(el);
                slotTargets.current.push({
                    index: parseInt(idxStr, 10),
                    cx, cy, el,
                    filled: false,
                });
            });
        }

        // Measure slots on mount and when orbs change
        useEffect(() => {
            const timer = setTimeout(measureSlots, 400);
            window.addEventListener('resize', measureSlots);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', measureSlots);
            };
        }, [orbs]);

        // ── SNAP into a bridge slot ──
        const snapOrbToSlot = useCallback((orbId: string, letter: string, el: HTMLDivElement, slot: SlotTarget) => {
            slot.filled = true;
            setUsedOrbs(prev => new Set(prev).add(orbId));

            // Animate orb flying to slot center then disappearing
            const { cx, cy } = getCenter(slot.el);
            gsap.to(el, {
                left: cx - 29,
                top: cy - 29,
                scale: 0.6,
                opacity: 0,
                duration: 0.3,
                ease: 'power3.in',
                onComplete: () => {
                    // Reset the orb element styles so it goes back to normal flow (hidden)
                    el.style.position = '';
                    el.style.left = '';
                    el.style.top = '';
                    el.style.zIndex = '';
                    gsap.set(el, { clearProps: 'all' });
                },
            });

            // Notify bridge component to fill the slot
            bridgeRef.current?.fillSlot(slot.index, letter);
            onSnap?.(orbId, slot.index);
        }, [bridgeRef, onSnap]);

        // ── Return orb to tray (no snap found) ──
        const returnToTray = useCallback((el: HTMLDivElement, startRect: DOMRect) => {
            gsap.to(el, {
                left: startRect.left,
                top: startRect.top,
                scale: 1,
                duration: 0.4,
                ease: 'elastic.out(1, 0.6)',
                onComplete: () => {
                    el.style.position = '';
                    el.style.left = '';
                    el.style.top = '';
                    el.style.zIndex = '';
                    gsap.set(el, { clearProps: 'all' });
                },
            });
        }, []);

        // ── Pointer handlers ──

        const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, def: OrbDef) => {
            if (lockedRef.current || usedOrbs.has(def.id)) return;

            const el = e.currentTarget;
            el.setPointerCapture(e.pointerId);

            // Save original position in the tray flow
            const startRect = el.getBoundingClientRect();

            // Pull the orb out of flex flow → position: fixed at current spot
            el.style.position = 'fixed';
            el.style.left = `${startRect.left}px`;
            el.style.top = `${startRect.top}px`;
            el.style.width = `${startRect.width}px`;
            el.style.height = `${startRect.height}px`;
            el.style.zIndex = '999';
            el.style.margin = '0';

            // Scale up for "picked up" feel
            gsap.to(el, { scale: 1.2, duration: 0.12, ease: 'power2.out' });

            dragRef.current = {
                orbId: def.id,
                el,
                startRect,
                history: [{ x: e.clientX, y: e.clientY, t: Date.now() }],
            };

            // Re-measure slots (they may have shifted)
            measureSlots();
        }, [usedOrbs]);

        const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
            const drag = dragRef.current;
            if (!drag) return;

            const el = drag.el;
            const elW = drag.startRect.width;
            const elH = drag.startRect.height;

            // Center orb on cursor
            el.style.left = `${e.clientX - elW / 2}px`;
            el.style.top = `${e.clientY - elH / 2}px`;

            // Record for velocity
            drag.history.push({ x: e.clientX, y: e.clientY, t: Date.now() });
            if (drag.history.length > VEL_SAMPLES) {
                drag.history.shift();
            }
        }, []);

        const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
            const drag = dragRef.current;
            if (!drag) return;
            dragRef.current = null;

            const el = drag.el;
            const elW = drag.startRect.width;
            const elH = drag.startRect.height;
            const orbCx = e.clientX;
            const orbCy = e.clientY;

            // Check for snap immediately at drop position
            const slot = findNearestSlot(orbCx, orbCy, slotTargets.current);
            if (slot) {
                const orbDef = orbs.find(o => o.id === drag.orbId);
                if (orbDef) {
                    snapOrbToSlot(drag.orbId, orbDef.letter, el, slot);
                    return;
                }
            }

            // Calculate flick velocity from pointer history
            const h = drag.history;
            if (h.length >= 2) {
                const first = h[0];
                const last = h[h.length - 1];
                const dt = Math.max(last.t - first.t, 1); // ms
                const vx = (last.x - first.x) / dt * 16; // px per frame (~16ms)
                const vy = (last.y - first.y) / dt * 16;
                const speed = Math.sqrt(vx * vx + vy * vy);

                if (speed > 3) {
                    // Flick! Animate orb in the flick direction, then check for snap
                    const flickDuration = Math.min(0.5, speed * 0.015);
                    const targetX = orbCx + vx * 15;
                    const targetY = orbCy + vy * 15;

                    gsap.to(el, {
                        left: targetX - elW / 2,
                        top: targetY - elH / 2,
                        duration: flickDuration,
                        ease: 'power2.out',
                        onComplete: () => {
                            // Check snap at landing position
                            const landRect = el.getBoundingClientRect();
                            const landCx = landRect.left + landRect.width / 2;
                            const landCy = landRect.top + landRect.height / 2;
                            const landSlot = findNearestSlot(landCx, landCy, slotTargets.current);

                            if (landSlot) {
                                const orbDef = orbs.find(o => o.id === drag.orbId);
                                if (orbDef) {
                                    snapOrbToSlot(drag.orbId, orbDef.letter, el, landSlot);
                                    return;
                                }
                            }
                            // No snap → return to tray
                            returnToTray(el, drag.startRect);
                        },
                    });
                    return;
                }
            }

            // No flick, no snap → return to tray
            gsap.to(el, { scale: 1, duration: 0.15, ease: 'power2.out' });
            returnToTray(el, drag.startRect);
        }, [orbs, snapOrbToSlot, returnToTray]);

        // ── Keyboard: press Enter/Space to auto-snap to next slot ──
        const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, def: OrbDef) => {
            if ((e.key === 'Enter' || e.key === ' ') && !lockedRef.current && !usedOrbs.has(def.id)) {
                e.preventDefault();
                const nextFree = slotTargets.current.find(s => !s.filled);
                const el = e.currentTarget;
                if (nextFree) {
                    // Quick animate to slot
                    const startRect = el.getBoundingClientRect();
                    el.style.position = 'fixed';
                    el.style.left = `${startRect.left}px`;
                    el.style.top = `${startRect.top}px`;
                    el.style.width = `${startRect.width}px`;
                    el.style.height = `${startRect.height}px`;
                    el.style.zIndex = '999';
                    el.style.margin = '0';
                    snapOrbToSlot(def.id, def.letter, el, nextFree);
                }
            }
        }, [usedOrbs, snapOrbToSlot]);

        // ── Render ──
        return (
            <div className="orbs-area" id="orbs-area">
                <div
                    className="orbs-tray"
                    id="orbs-tray"
                    role="group"
                    aria-label="Letter orbs — drag or flick into the bridge slots"
                >
                    {orbs.map(def => {
                        const isUsed = usedOrbs.has(def.id);
                        return (
                            <div
                                key={def.id}
                                id={`orb-${def.id}`}
                                className={`letter-orb${isUsed ? ' letter-orb--used' : ''}`}
                                role="button"
                                aria-label={`Letter ${def.letter}`}
                                tabIndex={isUsed ? -1 : 0}
                                onPointerDown={e => handlePointerDown(e, def)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onKeyDown={e => handleKeyDown(e, def)}
                                style={{ touchAction: 'none' }}
                            >
                                <span className="letter-orb__text" aria-hidden="true">{def.letter}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
);

LetterOrb.displayName = 'LetterOrb';
export default LetterOrb;
