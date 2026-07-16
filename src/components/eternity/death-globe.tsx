"use client";

import { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { POPULATION_CENTERS } from "./map-constants";
import { WorldMap } from "./world-map";

// 1.8 deaths/sec — same cadence as the flat map's pulses.
const PING_INTERVAL_MS = 556;
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

/**
 * The homepage deaths visual as a 3D globe: slowly rotating, drag/touch to
 * spin, one red ping per ~556ms at a random population center. Falls back to
 * the flat WorldMap when WebGL is unavailable.
 */
export function DeathGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let phi = 0.3;
    let width = 0;
    let pings: Ping[] = [];
    let globe: ReturnType<typeof createGlobe> | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
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

    const addPing = () => {
      if (!visible || document.hidden) return;
      const center = POPULATION_CENTERS[Math.floor(Math.random() * POPULATION_CENTERS.length)];
      pings.push({
        // POPULATION_CENTERS is [lng, lat]; cobe wants [lat, lng]. Jitter like the 2D map.
        location: [center[1] + (Math.random() - 0.5) * 2, center[0] + (Math.random() - 0.5) * 2],
        bornAt: performance.now(),
      });
    };

    // cobe v2 runs its own render loop; we push phi + marker state each frame.
    const frame = () => {
      if (!globe) return;
      const now = performance.now();
      pings = pings.filter((p) => now - p.bornAt < PING_LIFE_MS);
      if (!reducedMotion && pointerStart === null) phi += 0.0035;
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
          theta: 0.18,
          dark: 1,
          diffuse: 1.2,
          mapSamples: 16000,
          mapBrightness: 1.8,
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
        pingTimer = setInterval(addPing, PING_INTERVAL_MS);
        addPing();
        rafId = requestAnimationFrame(frame);
      } catch {
        setWebglFailed(true);
      }
    };

    const stop = () => {
      cancelAnimationFrame(rafId);
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = null;
      globe?.destroy();
      globe = null;
      pings = [];
    };

    // Only run the WebGL loop while the globe is actually on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { rootMargin: "100px" },
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
      io.disconnect();
      stop();
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointercancel", endPointer);
    };
  }, []);

  if (webglFailed) {
    return <WorldMap />;
  }

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-[380px] sm:max-w-[440px]"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        // touch-action pan-y: horizontal drags spin the globe, vertical still scrolls.
        style={{
          width: "100%",
          aspectRatio: "1",
          cursor: "grab",
          touchAction: "pan-y",
          opacity: 0,
          transition: "opacity 1s ease",
        }}
      />
    </div>
  );
}
