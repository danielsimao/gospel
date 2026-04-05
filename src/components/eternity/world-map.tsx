"use client";

import { useEffect, useRef, memo, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { POPULATION_CENTERS } from "./map-constants";

const GEO_URL = "/data/world-110m.json";

/**
 * Natural Earth projection (simplified).
 * Matches ComposableMap config: scale=120, translate=[300,170].
 * Coefficients from Šavrič et al. (2011).
 */
const A0 = 0.8707, A1 = -0.131979, A2 = -0.013791, A3 = 0.003971, A4 = -0.001529;
const B0 = 1.007226, B1 = 0.015085, B2 = -0.044475, B3 = 0.028874, B4 = -0.005916;
const SCALE = 120;
const TX = 300, TY = 170;

function projectNaturalEarth(lng: number, lat: number): [number, number] {
  const lam = (lng * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const phi2 = phi * phi;
  const phi4 = phi2 * phi2;
  const x = lam * (A0 + phi2 * (A1 + phi2 * (A2 + phi4 * (A3 + phi2 * A4))));
  const y = phi * (B0 + phi2 * (B1 + phi2 * (B2 + phi4 * (B3 + phi2 * B4))));
  return [x * SCALE + TX, -y * SCALE + TY];
}

const StaticGeographies = memo(function StaticGeographies() {
  return (
    <Geographies geography={GEO_URL}>
      {({ geographies }) =>
        geographies
          .filter((geo) => geo.properties.name !== "Antarctica")
          .map((geo) => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              fill="rgba(255,255,255,0.12)"
              stroke="none"
              style={{
                default: { outline: "none" },
                hover: { outline: "none" },
                pressed: { outline: "none" },
              }}
              tabIndex={-1}
            />
          ))
      }
    </Geographies>
  );
});

export const WorldMap = memo(function WorldMap() {
  const pulseGroupRef = useRef<SVGGElement>(null);
  const nextId = useRef(0);

  const addPulse = useCallback(() => {
    const g = pulseGroupRef.current;
    if (!g) return;

    const center =
      POPULATION_CENTERS[Math.floor(Math.random() * POPULATION_CENTERS.length)];
    const lng = center[0] + (Math.random() - 0.5) * 2;
    const lat = center[1] + (Math.random() - 0.5) * 2;
    const [x, y] = projectNaturalEarth(lng, lat);

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.id = `pulse-${nextId.current++}`;

    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("cx", String(x));
    ring.setAttribute("cy", String(y));
    ring.setAttribute("r", "4");
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "#DC2626");
    ring.setAttribute("stroke-width", "1.2");
    ring.style.animation = "pulse-ring 2.5s ease-out forwards";

    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", String(x));
    dot.setAttribute("cy", String(y));
    dot.setAttribute("r", "3.5");
    dot.setAttribute("fill", "#DC2626");
    dot.style.animation = "pulse-dot-fade 2.5s ease-out forwards";

    group.appendChild(ring);
    group.appendChild(dot);
    g.appendChild(group);

    setTimeout(() => group.remove(), 2600);
  }, []);

  useEffect(() => {
    // 1.8 deaths/sec = 1 pulse every ~556ms
    addPulse();
    const interval = setInterval(addPulse, 556);
    return () => clearInterval(interval);
  }, [addPulse]);

  return (
    <div className="relative w-full max-w-3xl mx-auto" aria-hidden="true">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 120 }}
        width={600}
        height={340}
        style={{ width: "100%", height: "auto" }}
      >
        <StaticGeographies />
        <g ref={pulseGroupRef} />
      </ComposableMap>
    </div>
  );
});
