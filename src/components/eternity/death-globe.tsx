"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import {
  DEATH_CENTERS,
  type DeathCenter,
  nextPingDelayMs,
  pickWeighted,
} from "./map-constants";
import { WorldMap } from "./world-map";

const PING_LIFE_MS = 2500;
const MAX_MARKER_SIZE = 0.09;

interface Ping {
  location: [number, number]; // [lat, lng] — cobe order
  bornAt: number;
}

/** Ring-like pulse: quick swell, slow fade — mirrors the 2D map's pulse-ring. */
function pingSize(ageMs: number): number {
  if (ageMs >= PING_LIFE_MS) return 0;
  const swell = Math.min(ageMs / 250, 1);
  const fade = 1 - Math.max(0, ageMs - 250) / (PING_LIFE_MS - 250);
  return MAX_MARKER_SIZE * swell * fade;
}

// Reduced motion (which Android also reports under battery saver / "remove
// animations") disables auto-rotation — so instead of freezing wherever it
// loaded, the globe parks facing the densest population hemisphere: the near
// hemisphere at ~32°E holds 68 of the 81 centres and 87.7% of the world's
// dying by weight, so the death pings still land where the reader can see them.
const STATIC_VIEW_LNG = 32;
// cobe's longitude→phi mapping, from its "rotate to location" example.
const STATIC_PHI = Math.PI - ((STATIC_VIEW_LNG * Math.PI) / 180 - Math.PI / 2);

/** Inverse of the phi mapping above: which longitude is currently facing us. */
function phiToCenterLng(phi: number): number {
  return ((1.5 * Math.PI - phi) * 180) / Math.PI;
}

/**
 * How far off the sphere's edge a marker has to be before it is worth pinging.
 * Below this it is technically front-facing but foreshortened into the limb,
 * where a ping renders as a smear rather than a dot.
 */
const MIN_DEPTH = 0.25;

/** The part of the sphere currently inside the viewport, in radii from centre. */
interface Crop {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/**
 * Where a marker lands on screen, in radii from the sphere's centre.
 *
 * Orthographic, matching cobe: rotate into the current view by longitude, then
 * tilt about the horizontal axis by theta. Screen y runs downward, so the sign
 * of the tilted vertical is flipped.
 */
function project(lng: number, lat: number, centerLng: number, theta: number) {
  const dl = ((lng - centerLng) * Math.PI) / 180;
  const la = (lat * Math.PI) / 180;
  const x = Math.cos(la) * Math.sin(dl);
  const y = Math.sin(la);
  const z = Math.cos(la) * Math.cos(dl);
  return {
    x,
    y: -(y * Math.cos(theta) - z * Math.sin(theta)),
    depth: y * Math.sin(theta) + z * Math.cos(theta),
  };
}

/**
 * The centres a reader could actually see right now.
 *
 * The near hemisphere is not the same as the visible area. Where the sphere is
 * cropped by the viewport — the homepage bleeds it off a corner — half of that
 * hemisphere is off-canvas, and pings spawned there are deaths nobody is shown.
 * Recomputed per ping rather than fixed, so it stays correct while the globe
 * turns and at any viewport size.
 */
function centersInView(
  phi: number,
  theta: number,
  crop: Crop,
): readonly DeathCenter[] {
  const centerLng = phiToCenterLng(phi);
  return DEATH_CENTERS.filter(([lng, lat]) => {
    const p = project(lng, lat, centerLng, theta);
    return (
      p.depth > MIN_DEPTH &&
      p.x >= crop.xMin &&
      p.x <= crop.xMax &&
      p.y >= crop.yMin &&
      p.y <= crop.yMax
    );
  });
}

/** The handful of centres most squarely facing the viewer right now. */
function mostFaceOn(phi: number, theta: number): readonly DeathCenter[] {
  const centerLng = phiToCenterLng(phi);
  return [...DEATH_CENTERS]
    .sort(
      (a, b) =>
        project(b[0], b[1], centerLng, theta).depth -
        project(a[0], a[1], centerLng, theta).depth,
    )
    .slice(0, 6);
}

/**
 * The homepage deaths visual as a 3D globe: slowly rotating, drag/touch to
 * spin, red pings averaging 1.8/sec — placed in proportion to where people
 * actually die (see DEATH_CENTERS) and arriving in clumps and lulls rather than
 * on a beat (see nextPingDelayMs). Falls back to the flat WorldMap when WebGL
 * is unavailable.
 */
interface DeathGlobeProps {
  /**
   * Overrides the container's sizing classes. The default caps the sphere at
   * 380/440px, which is right for a globe centred in a column but not for the
   * homepage's cropped corner, where the container is deliberately wider than
   * the space it is allowed to occupy.
   *
   * Sizing only — cobe renders at twice the container width, so a large value
   * costs real GPU work.
   */
  className?: string;
  /**
   * Multiplies the auto-rotation speed. 1 is the default drift; 0 stops it.
   *
   * The cropped desktop globe runs slow rather than stopped. Full speed beside
   * a headline pulls the eye off the words next to it — peripheral motion is
   * the strongest attention capture there is — but stopping it altogether costs
   * the thing most of the reason it is on the page. Slow keeps it alive and
   * stops it competing.
   *
   * Reduced motion overrides this and parks regardless.
   */
  rotationScale?: number;
  /**
   * Vertical tilt, in cobe's units. Higher values tip the north pole toward the
   * viewer, which walks the northern population band down the sphere — the
   * difference between Europe sitting above the cropped edge and sitting inside
   * it.
   */
  theta?: number;
  /**
   * Landmass dot brightness.
   *
   * The lever for a globe sitting *behind* type rather than beside it. On a
   * phone the sphere is wider than the screen, so none of its silhouette is on
   * canvas and the dots are all there is to see — and the scrim that keeps the
   * counter legible is the same scrim that flattens them. Raising brightness
   * lifts the globe without lifting the ground under the text, which taking the
   * scrim off would.
   */
  mapBrightness?: number;
}

export function DeathGlobe({
  className = "relative mx-auto w-full max-w-[380px] sm:max-w-[440px]",
  rotationScale = 1,
  theta = 0.18,
  mapBrightness = 1.8,
}: DeathGlobeProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Reduced motion parks the globe outright. Everything else drifts, at
    // whatever fraction of the base speed the caller asked for.
    const perFrame = reducedMotion ? 0 : 0.0035 * rotationScale;

    let phi = reducedMotion ? STATIC_PHI : 0.3;
    let width = 0;
    let pings: Ping[] = [];
    let globe: ReturnType<typeof createGlobe> | null = null;
    let pingTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId = 0;
    let visible = true;

    // Drag-to-spin state (mouse + touch via pointer events)
    let pointerStart: number | null = null;
    let pointerDelta = 0;
    let releasedDelta = 0;

    const onResize = () => {
      width = container.offsetWidth;
    };
    onResize();
    window.addEventListener("resize", onResize);

    /*
     * How much of the sphere the viewport is actually showing, in radii from
     * its centre. Read from the live rect rather than hardcoded, so it is
     * correct at every breakpoint and survives the layout being retuned —
     * the homepage crops this globe off a corner on desktop and centres it
     * behind the counter below that.
     */
    const currentCrop = () => {
      const rect = canvas.getBoundingClientRect();
      const r = rect.width / 2;
      if (r === 0) return null;
      const cx = rect.left + r;
      const cy = rect.top + r;
      return {
        xMin: (0 - cx) / r,
        xMax: (window.innerWidth - cx) / r,
        yMin: (0 - cy) / r,
        yMax: (window.innerHeight - cy) / r,
      };
    };

    const addPing = () => {
      if (!visible || document.hidden) return;
      const crop = currentCrop();
      /*
       * Recomputed per ping against the live rotation, so a turning globe still
       * only pings where the reader is looking. Falls back to the whole set
       * rather than going silent if the crop leaves nothing — a globe that
       * stops pinging reads as broken, an occasional off-screen death does not.
       */
      const livePhi = phi + releasedDelta + pointerDelta;
      const inView = crop ? centersInView(livePhi, theta, crop) : [];
      /*
       * The fallback is the most face-on centres, not a random one. When the
       * drift brings an ocean round there may be nothing inside the crop, and
       * picking at random from all 44 would put the death on the far side of
       * the earth — invisible, which is worse than slightly off-centre. A globe
       * that stops pinging reads as broken, so it never simply skips.
       */
      const pool = inView.length > 0 ? inView : mostFaceOn(livePhi, theta);
      /*
       * Weighted within the pool, not uniform across it: the pool is already a
       * slice of the world (what is facing the reader), so the shares are
       * renormalised over just those places. Picking uniformly here would throw
       * away the weighting the moment the globe cropped anything.
       */
      const center = pickWeighted(pool);
      if (!center) return;
      pings.push({
        // POPULATION_CENTERS is [lng, lat]; cobe wants [lat, lng]. Jitter like the 2D map.
        location: [center[1] + (Math.random() - 0.5) * 2, center[0] + (Math.random() - 0.5) * 2],
        bornAt: performance.now(),
      });
    };

    /*
     * Self-rescheduling rather than setInterval, so each gap is drawn fresh from
     * the exponential distribution (see nextPingDelayMs). The reschedule sits
     * outside addPing deliberately: addPing returns early while the globe is
     * off-screen or the tab is hidden, and the chain has to keep its own time
     * through that — rescheduling inside would end the chain on the first
     * skipped ping and the globe would come back from a background tab dead.
     */
    const tick = () => {
      addPing();
      pingTimer = setTimeout(tick, nextPingDelayMs());
    };

    // cobe v2 runs its own render loop; we push phi + marker state each frame.
    const frame = () => {
      if (!globe) return;
      const now = performance.now();
      pings = pings.filter((p) => now - p.bornAt < PING_LIFE_MS);
      if (perFrame !== 0 && pointerStart === null) phi -= perFrame;
      globe.update({
        phi: phi + releasedDelta + pointerDelta,
        markers: pings.map((p) => ({
          location: p.location,
          size: pingSize(now - p.bornAt),
        })),
        width: width * 2,
        height: width * 2,
      });
      rafId = requestAnimationFrame(frame);
    };

    const start = () => {
      if (globe || width === 0) return;
      try {
        globe = createGlobe(canvas, {
          devicePixelRatio: Math.min(2, window.devicePixelRatio || 1),
          width: width * 2,
          height: width * 2,
          phi,
          theta,
          dark: 1,
          diffuse: 1.2,
          mapSamples: 16000,
          mapBrightness,
          baseColor: [1, 1, 1],
          markerColor: [220 / 255, 38 / 255, 38 / 255],
          glowColor: [0.12, 0.1, 0.06],
          // Fully opaque: a translucent sphere (the old opacity: 0.85) let
          // far-side pings bleed through the body of the earth. Opaque, cobe
          // occludes back-hemisphere markers correctly.
          // Slight elevation lifts pings crisply off the surface (cobe v2).
          markerElevation: 0.012,
          markers: [],
        });
        canvas.style.opacity = "1";
        addPing();
        pingTimer = setTimeout(tick, nextPingDelayMs());
        rafId = requestAnimationFrame(frame);
      } catch {
        setWebglFailed(true);
      }
    };

    const stop = () => {
      cancelAnimationFrame(rafId);
      if (pingTimer) clearTimeout(pingTimer);
      pingTimer = null;
      globe?.destroy();
      globe = null;
      pings = [];
    };

    // Defer the (main-thread-heavy) cobe init until the browser is idle, so it
    // yields to the hero's LCP paint instead of competing with it. On the home
    // page the globe is in the initial viewport, so a synchronous start() here
    // added ~cobe-init to TBT during load. requestIdleCallback (timeout-capped)
    // lets first paint win the thread; the globe fades in a beat later.
    let cancelled = false;
    const ric: (cb: IdleRequestCallback) => void =
      typeof window.requestIdleCallback === "function"
        ? (cb) => window.requestIdleCallback(cb, { timeout: 1500 })
        : (cb) => window.setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 200);
    const scheduleStart = () => {
      if (globe || cancelled) return;
      ric(() => {
        if (!cancelled && visible) start();
      });
    };

    // Only run the WebGL loop while the globe is actually on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) scheduleStart();
        else stop();
      },
      // Wide margin: WebGL init + texture sampling take a beat — starting
      // well before the globe enters view means it's already spinning when
      // the reader arrives, instead of visibly "filling in".
      { rootMargin: "400px" },
    );
    io.observe(container);

    const onPointerDown = (e: PointerEvent) => {
      pointerStart = e.clientX;
      canvas.style.cursor = "grabbing";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pointerStart === null) return;
      pointerDelta = (e.clientX - pointerStart) / 120;
    };
    const endPointer = () => {
      if (pointerStart === null) return;
      releasedDelta += pointerDelta;
      pointerDelta = 0;
      pointerStart = null;
      canvas.style.cursor = "grab";
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);

    return () => {
      cancelled = true;
      io.disconnect();
      stop();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointercancel", endPointer);
    };
    // Both are read when cobe is created, so a change has to rebuild it.
  }, [rotationScale, theta, mapBrightness]);

  if (webglFailed) {
    return <WorldMap />;
  }

  return (
    <div ref={containerRef} className={className} aria-hidden="true">
      <canvas
        ref={canvasRef}
        // touch-action pan-y: horizontal drags spin the globe, vertical still scrolls.
        style={{
          width: "100%",
          aspectRatio: "1",
          cursor: "grab",
          touchAction: "pan-y",
          opacity: 0,
          transition: "opacity 0.5s ease",
        }}
      />
    </div>
  );
}
