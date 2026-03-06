/**
 * LetterOrb.tsx
 * Story 2 — Letter Interaction (The Physics Flick)
 *
 * Renders a tray of draggable / flickable letter orbs.
 * Uses Matter.js for physics simulation:
 *   - Drag: pointer down → update body position each frame
 *   - Flick: capture velocity on pointer-up → apply to physics body
 *   - Snap: each tick checks if a body is within snap-radius of a bridge slot center
 *
 * The physics canvas is hidden; DOM orb elements mirror body positions.
 * When a body enters a slot's snap zone, it snaps (removes from physics),
 * and calls bridgeRef.fillSlot().
 */

import React, {
    useEffect,
    useRef,
    useCallback,
    forwardRef,
    useImperativeHandle,
} from 'react';
import Matter from 'matter-js';
import { gsap } from 'gsap';
import { BridgeComponentHandle } from './BridgeComponent';

// ──── Types ────────────────────────────────────────────────────────────────

export interface OrbDef {
    id: string;
    letter: string;
}

interface OrbState {
    def: OrbDef;
    body: Matter.Body;
    el: HTMLDivElement | null;
    used: boolean;
    /** velocity sampled two frames before pointer-up for flick */
    velHistory: { x: number; y: number }[];
}

interface SlotTarget {
    index: number;
    /** absolute page coordinates of slot centre */
    cx: number;
    cy: number;
    /** slot element for getBoundingClientRect re-measurement */
    el: HTMLElement;
    filled: boolean;
}

export interface LetterOrbHandle {
    /** Reset all orbs back to tray (skeleton restart) */
    reset: () => void;
}

interface LetterOrbProps {
    orbs: OrbDef[];
    bridgeRef: React.RefObject<BridgeComponentHandle | null>;
    /** Called when a letter snaps into a slot */
    onSnap?: (orbId: string, slotIndex: number) => void;
    /** Whether interaction is locked (e.g. during result animation) */
    locked?: boolean;
}

// ──── Constants ────────────────────────────────────────────────────────────

const SNAP_RADIUS = 54;   // px — distance for auto-snap
const ORB_RADIUS = 29;   // px — physics body radius
const GRAVITY_Y = 0.8;
const FLICK_SCALE = 0.018; // scales pixel-velocity to Matter units
const VEL_HISTORY_LEN = 4;

// ──── Helpers ──────────────────────────────────────────────────────────────

/** Get absolute centre of a DOM element */
function getCenter(el: HTMLElement): { cx: number; cy: number } {
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

/** Find the nearest unfilled slot within snap radius */
function nearestSlot(
    px: number, py: number,
    slots: SlotTarget[]
): SlotTarget | null {
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

        const trayRef = useRef<HTMLDivElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const engineRef = useRef<Matter.Engine | null>(null);
        const runnerRef = useRef<Matter.Runner | null>(null);
        const orbsRef = useRef<OrbState[]>([]);
        const slotTargets = useRef<SlotTarget[]>([]);
        const dragState = useRef<{
            orbState: OrbState;
            startPx: number; startPy: number;
            lastPx: number; lastPy: number;
        } | null>(null);
        const tickRafRef = useRef<number>(0);
        const lockedRef = useRef(locked);

        useEffect(() => { lockedRef.current = locked; }, [locked]);

        // ── Expose imperative handle ──────────────────────────────────────────
        useImperativeHandle(ref, () => ({
            reset() {
                // Restore all orbs to tray positions, mark unused
                orbsRef.current.forEach(os => {
                    os.used = false;
                    os.velHistory = [];
                    if (os.el) {
                        os.el.classList.remove('letter-orb--used');
                        gsap.set(os.el, { clearProps: 'all', opacity: 1, scale: 1 });
                    }
                    // Reset body to tray position
                    const trayPos = getTrayPosition(os.def.id);
                    if (trayPos) {
                        Matter.Body.setPosition(os.body, trayPos);
                        Matter.Body.setVelocity(os.body, { x: 0, y: 0 });
                        Matter.Body.setStatic(os.body, true);
                    }
                });
                slotTargets.current.forEach(s => { s.filled = false; });
            },
        }));

        // ── Utility: figure out a body's tray resting position ──────────────
        function getTrayPosition(orbId: string): { x: number; y: number } | null {
            const tray = trayRef.current;
            if (!tray) return null;
            const trayR = tray.getBoundingClientRect();
            const idx = orbs.findIndex(o => o.id === orbId);
            if (idx < 0) return null;
            // Space orbs evenly within the tray
            const spacing = Math.min(80, (trayR.width - 32) / orbs.length);
            const startX = trayR.left + 24 + idx * spacing + spacing / 2;
            const centreY = trayR.top + trayR.height / 2;
            return { x: startX, y: centreY };
        }

        // ── Measure slot targets (bridge DOM slots) ───────────────────────────
        function measureSlots() {
            slotTargets.current = [];
            // Find all bridge slot elements
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

        // ── Build Matter.js world ─────────────────────────────────────────────
        useEffect(() => {
            const canvas = canvasRef.current;
            const tray = trayRef.current;
            if (!canvas || !tray) return;

            // Resize canvas to full viewport
            const W = window.innerWidth;
            const H = window.innerHeight;
            canvas.width = W;
            canvas.height = H;

            // Engine
            const engine = Matter.Engine.create({ gravity: { x: 0, y: GRAVITY_Y } });
            engineRef.current = engine;

            // Ground & walls (invisible)
            const ground = Matter.Bodies.rectangle(W / 2, H + 30, W * 2, 60, { isStatic: true, label: 'ground' });
            const wallL = Matter.Bodies.rectangle(-30, H / 2, 60, H * 2, { isStatic: true, label: 'wallL' });
            const wallR = Matter.Bodies.rectangle(W + 30, H / 2, 60, H * 2, { isStatic: true, label: 'wallR' });
            Matter.World.add(engine.world, [ground, wallL, wallR]);

            // Create a body per orb, placed statically in tray initially
            const trayR = tray.getBoundingClientRect();
            const spacing = Math.min(80, (trayR.width - 32) / orbs.length);
            const startX = trayR.left + 24;
            const centreY = trayR.top + trayR.height / 2;

            const states: OrbState[] = orbs.map((def, i) => {
                const x = startX + i * spacing + spacing / 2;
                const body = Matter.Bodies.circle(x, centreY, ORB_RADIUS, {
                    restitution: 0.55,
                    friction: 0.1,
                    frictionAir: 0.06,
                    isStatic: true,       // start static; released on drag
                    label: `orb-${def.id}`,
                });
                Matter.World.add(engine.world, body);
                return { def, body, el: null, used: false, velHistory: [] };
            });
            orbsRef.current = states;

            // Runner (stepped manually via RAF for control)
            const runner = Matter.Runner.create();
            runnerRef.current = runner;

            // Measure slots after a short delay (bridge renders first)
            setTimeout(measureSlots, 300);

            // ── Tick loop: sync DOM to physics bodies ──────────────────────────
            function tick() {
                Matter.Runner.tick(runner, engine, 1000 / 60);

                orbsRef.current.forEach(os => {
                    if (os.used || !os.el) return;
                    const { x, y } = os.body.position;
                    os.el.style.left = `${x - ORB_RADIUS}px`;
                    os.el.style.top = `${y - ORB_RADIUS}px`;

                    // Snap check (only for non-static, moving orbs)
                    if (!os.body.isStatic) {
                        const snap = nearestSlot(x, y, slotTargets.current);
                        if (snap) {
                            snapOrbToSlot(os, snap);
                        }
                    }
                });

                tickRafRef.current = requestAnimationFrame(tick);
            }
            tickRafRef.current = requestAnimationFrame(tick);

            // ── Resize handler ────────────────────────────────────────────────
            function handleResize() {
                const c = canvasRef.current;
                if (c) {
                    c.width = window.innerWidth;
                    c.height = window.innerHeight;
                }
                measureSlots();
            }
            window.addEventListener('resize', handleResize);

            return () => {
                cancelAnimationFrame(tickRafRef.current);
                Matter.Engine.clear(engine);
                Matter.World.clear(engine.world, false);
                window.removeEventListener('resize', handleResize);
            };
        }, [orbs]);

        // ── Snap orb into slot ───────────────────────────────────────────────
        const snapOrbToSlot = useCallback((os: OrbState, slot: SlotTarget) => {
            if (os.used || slot.filled) return;

            // Mark as used / slot filled
            os.used = true;
            slot.filled = true;

            // Make body static at slot position
            Matter.Body.setStatic(os.body, true);
            Matter.Body.setPosition(os.body, { x: slot.cx, y: slot.cy });
            Matter.Body.setVelocity(os.body, { x: 0, y: 0 });

            // Fly orb DOM element to slot centre with GSAP
            if (os.el) {
                // Re-measure slot (layout may have shifted)
                const { cx, cy } = getCenter(slot.el);
                const r = os.el.getBoundingClientRect();

                gsap.to(os.el, {
                    x: cx - (r.left + ORB_RADIUS),
                    y: cy - (r.top + ORB_RADIUS),
                    scale: 0.75,
                    opacity: 0,
                    duration: 0.35,
                    ease: 'power3.in',
                    onComplete: () => {
                        if (os.el) {
                            os.el.classList.add('letter-orb--used');
                            gsap.set(os.el, { clearProps: 'all' });
                        }
                    },
                });
            }

            // Notify bridge
            bridgeRef.current?.fillSlot(slot.index, os.def.letter);
            onSnap?.(os.def.id, slot.index);
        }, [bridgeRef, onSnap]);

        // ── Pointer Events (Drag + Flick) ────────────────────────────────────

        const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, os: OrbState) => {
            if (lockedRef.current || os.used) return;
            e.currentTarget.setPointerCapture(e.pointerId);

            // make body dynamic
            Matter.Body.setStatic(os.body, false);

            dragState.current = {
                orbState: os,
                startPx: e.clientX,
                startPy: e.clientY,
                lastPx: e.clientX,
                lastPy: e.clientY,
            };
            os.velHistory = [];

            // Bring orb to front visually
            if (os.el) {
                os.el.style.zIndex = '200';
                gsap.to(os.el, { scale: 1.15, duration: 0.12, ease: 'power2.out' });
            }
        }, []);

        const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
            const ds = dragState.current;
            if (!ds) return;

            const { orbState } = ds;
            const dx = e.clientX - ds.lastPx;
            const dy = e.clientY - ds.lastPy;

            // Record velocity history for flick
            orbState.velHistory.push({ x: dx, y: dy });
            if (orbState.velHistory.length > VEL_HISTORY_LEN) {
                orbState.velHistory.shift();
            }

            // Move physics body to cursor
            const { x, y } = orbState.body.position;
            Matter.Body.setPosition(orbState.body, { x: x + dx, y: y + dy });
            Matter.Body.setVelocity(orbState.body, { x: dx * 2, y: dy * 2 });

            ds.lastPx = e.clientX;
            ds.lastPy = e.clientY;
        }, []);

        const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
            const ds = dragState.current;
            if (!ds) return;

            const { orbState } = ds;
            orbState.velHistory;

            // Compute average flick velocity
            if (orbState.velHistory.length > 0) {
                const avg = orbState.velHistory.reduce(
                    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
                    { x: 0, y: 0 }
                );
                avg.x /= orbState.velHistory.length;
                avg.y /= orbState.velHistory.length;

                // Only apply flick if meaningful velocity
                const speed = Math.sqrt(avg.x ** 2 + avg.y ** 2);
                if (speed > 2) {
                    Matter.Body.setVelocity(orbState.body, {
                        x: avg.x * FLICK_SCALE * 60,
                        y: avg.y * FLICK_SCALE * 60,
                    });
                }
            }

            // Scale back orb
            if (orbState.el) {
                orbState.el.style.zIndex = '';
                gsap.to(orbState.el, { scale: 1, duration: 0.2, ease: 'power2.out' });
            }

            dragState.current = null;
        }, []);

        // ── Assign el refs dynamically ────────────────────────────────────────
        const setOrbEl = useCallback((el: HTMLDivElement | null, index: number) => {
            if (orbsRef.current[index]) {
                orbsRef.current[index].el = el;
            }
        }, []);

        // ── Render ────────────────────────────────────────────────────────────
        return (
            <div className="orbs-area" id="orbs-area">
                {/* Hidden physics canvas (matter-js renders to it but we keep it opacity:0) */}
                <canvas ref={canvasRef} className="physics-canvas" aria-hidden="true" />

                {/* Letter Orb Tray */}
                <div
                    ref={trayRef}
                    className="orbs-tray"
                    id="orbs-tray"
                    role="group"
                    aria-label="Letter orbs — drag or flick into the bridge slots"
                >
                    {orbs.map((def, i) => {
                        const os = orbsRef.current[i];
                        return (
                            <div
                                key={def.id}
                                id={`orb-${def.id}`}
                                ref={el => setOrbEl(el, i)}
                                className="letter-orb"
                                style={{ position: 'relative' }} // overridden by tick loop when dragging
                                role="button"
                                aria-label={`Letter ${def.letter}`}
                                tabIndex={0}
                                onPointerDown={e => os && onPointerDown(e, os)}
                                onPointerMove={e => dragState.current?.orbState === os ? onPointerMove(e) : undefined}
                                onPointerUp={e => dragState.current?.orbState === os ? onPointerUp(e) : undefined}
                                // Keyboard accessibility: tap Enter/Space to auto-snap to next free slot
                                onKeyDown={e => {
                                    if ((e.key === 'Enter' || e.key === ' ') && os && !os.used && !lockedRef.current) {
                                        e.preventDefault();
                                        const nextFree = slotTargets.current.find(s => !s.filled);
                                        if (nextFree) snapOrbToSlot(os, nextFree);
                                    }
                                }}
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
