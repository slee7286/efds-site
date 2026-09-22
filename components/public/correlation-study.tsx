"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import { correlationContour, correlationPoints, plotX, plotY } from "@/lib/visuals/correlation";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const getReducedMotion = () => window.matchMedia(motionQuery).matches;

export function CorrelationStudy() {
  const id = useId();
  const reduced = useSyncExternalStore(subscribeMotion, getReducedMotion, () => true);
  const [playback, setPlayback] = useState<boolean | null>(null);
  const [rho, setRho] = useState(.65);
  const playing = playback ?? !reduced;
  const root = useRef<HTMLElement>(null);
  const dots = useRef<SVGGElement>(null);
  const phase = useRef(0);
  const initial = correlationPoints(rho);
  const sign = rho > 0 ? "+" : "";

  useEffect(() => {
    const circles = dots.current?.querySelectorAll("circle");
    if (!circles) return;
    let frame: number | null = null;
    let visible = false;
    let lastTime = 0;
    const draw = () => correlationPoints(rho, phase.current).forEach((point, i) => {
      circles[i].setAttribute("cx", plotX(point.x).toFixed(2));
      circles[i].setAttribute("cy", plotY(point.y).toFixed(2));
    });
    const animate = (time: number) => {
      if (time - lastTime >= 1000 / 30) {
        if (lastTime) phase.current += Math.min(time - lastTime, 100) * .00014;
        lastTime = time;
        draw();
      }
      frame = requestAnimationFrame(animate);
    };
    const sync = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = 0;
      if (playing && visible && !document.hidden) frame = requestAnimationFrame(animate);
    };
    draw();
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); if (frame !== null) cancelAnimationFrame(frame); };
  }, [rho, playing]);

  return <figure className="correlation-study" ref={root} data-playing={playing} aria-labelledby={`${id}-title`}>
    <div className="study-heading"><span id={`${id}-title`}>Fig. 01 — A study in correlation</span><button className="motion-toggle" type="button" aria-label={playing ? "Pause animation" : "Play animation"} onClick={() => setPlayback(!playing)}>{playing ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}<span>{playing ? "Pause" : "Play"}</span></button></div>
    <div className="study-plot">
      <svg viewBox="0 0 600 445" role="img" aria-label={`Scatter plot of synthetic observations with correlation ${rho.toFixed(2)}`}>
        <defs><clipPath id={`${id}-clip`}><rect x="40" y="25" width="520" height="370" /></clipPath></defs>
        <g className="study-grid" aria-hidden="true">{[-3,-2,-1,0,1,2,3].map(tick => <g key={tick}><line x1={plotX(tick)} y1="32" x2={plotX(tick)} y2="390" /><line x1="60" y1={plotY(tick)} x2="540" y2={plotY(tick)} /><text x={plotX(tick)} y="413" textAnchor="middle">{tick}</text></g>)}</g>
        <g clipPath={`url(#${id}-clip)`}>
          <g className="study-contours" aria-hidden="true">{[.7,1.4,2.1,2.8].map(radius => <path key={radius} d={correlationContour(rho, radius)} />)}</g>
          <line className="study-regression" x1={plotX(-3)} x2={plotX(3)} y1={plotY(-3 * rho)} y2={plotY(3 * rho)} />
          <g className="study-dots" ref={dots}>{initial.map((point, i) => <circle key={i} cx={plotX(point.x).toFixed(2)} cy={plotY(point.y).toFixed(2)} r={i % 11 === 0 ? 5 : 2.6} opacity={i % 11 === 0 ? 1 : .65} />)}</g>
        </g>
        <text className="study-axis" x="537" y="435" textAnchor="end">STANDARDISED X</text>
        <text className="study-axis" transform="translate(27 235) rotate(-90)" textAnchor="middle">STANDARDISED Y</text>
        <g className="study-cross" aria-hidden="true"><path d="M292 221h16M300 213v16" /></g>
      </svg>
      <div className="study-number" aria-hidden="true"><span>ρ</span> {sign}{rho.toFixed(2)}</div>
    </div>
    <figcaption>
      <div className="study-control"><label htmlFor={`${id}-rho`}>Change the relationship</label><output htmlFor={`${id}-rho`}>{rho < -.2 ? "Negative" : rho > .2 ? "Positive" : "Little linear correlation"}</output></div>
      <input id={`${id}-rho`} className="correlation-slider" type="range" min="-0.95" max="0.95" step="0.05" value={rho} aria-label="Correlation" aria-valuetext={`${sign}${rho.toFixed(2)} correlation`} onChange={event => setRho(Number(event.target.value))} />
      <div className="study-foot"><span>−0.95</span><span>Simulated observations · drag to explore</span><span>+0.95</span></div>
    </figcaption>
  </figure>;
}
