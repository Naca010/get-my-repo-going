// @ts-nocheck
import { useEffect, useRef, useState, type CSSProperties } from "react";
import carImg from "@/assets/securego-car.png";

interface RaceLoaderProps {
  color: string;
  finished?: boolean;
  bankLogoUrl?: string;
  /** Sekunden bis die Ziellinie erscheint (Default: 60) */
  finishAfterMs?: number;
  onComplete?: () => void;
}

type Speed = 0 | 1 | 2 | 3;

/**
 * Dezente Renn-Animation mit Upgrade-Stufen:
 *  - Stufe 1: rote Warnleuchte beginnt zu blinken
 *  - Stufe 2: größere Räder
 *  - Stufe 3: Flügel + Heck-Flammen → Auto fliegt am Ende durch die Ziellinie
 */
export default function RaceLoader({
  color,
  finished = false,
  finishAfterMs = 75000,
  onComplete,
}: RaceLoaderProps) {
  const [phase, setPhase] = useState<"cruise" | "finishing" | "done">("cruise");
  const [speed, setSpeed] = useState<Speed>(0);
  const [confetti, setConfetti] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<{ id: number; kind: "bolt" | "coin" | "star"; collected: boolean }[]>([]);
  const startedAt = useRef<number>(Date.now());
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    startedAt.current = Date.now();
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Festes Skript: 2 Items, 2 Upgrades, dann Finish
  // Item-Bewegung dauert ~3.6s — Item wird so gespawnt, dass es ~bei der Zielzeit das Auto erreicht
  const ITEM_TRAVEL_MS = 3600;
  useEffect(() => {
    if (phase !== "cruise") return;

    const spawn = (id: number, kind: "bolt" | "coin" | "star") => {
      setItems((prev) => [...prev, { id, kind, collected: false }]);
    };
    const collect = (id: number) => {
      setItems((prev) => prev.filter((p) => p.id !== id));
      setSpeed((s) => (Math.min(3, (s as number) + 1) as Speed));
    };

    // Upgrade 1 (Blinklicht) bei 30s, Upgrade 2 (Jet) bei 60s
    const t1Spawn = setTimeout(() => spawn(1, "bolt"), 30000 - ITEM_TRAVEL_MS);
    const t1Hit = setTimeout(() => collect(1), 30000);
    const t2Spawn = setTimeout(() => spawn(2, "star"), 60000 - ITEM_TRAVEL_MS);
    const t2Hit = setTimeout(() => collect(2), 60000);

    return () => {
      clearTimeout(t1Spawn);
      clearTimeout(t1Hit);
      clearTimeout(t2Spawn);
      clearTimeout(t2Hit);
    };
  }, [phase]);

  // Finish auslösen
  useEffect(() => {
    if (finished) {
      setSpeed(3);
      setPhase("finishing");
      return;
    }
    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, finishAfterMs - elapsed);
    const t = setTimeout(() => {
      setSpeed(3);
      setPhase("finishing");
    }, remaining);
    return () => clearTimeout(t);
  }, [finished, finishAfterMs]);

  useEffect(() => {
    if (phase !== "finishing") return;
    const t1 = setTimeout(() => setConfetti(true), 1400);
    const t2 = setTimeout(() => setPhase("done"), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    onCompleteRef.current?.();
  }, [phase]);

  const cruiseDur = [50, 38, 26, 16][speed];
  const roadDur = [1.4, 1.0, 0.6, 0.45][speed];
  const wheelDur = [1.6, 1.1, 0.6, 0.4][speed];
  const bushDur = [11, 8, 5, 4][speed];
  const hasWings = false;
  const bigWheels = false;
  const hasLight = speed >= 1;
  const hasJet = speed >= 2;

  return (
    <div
      className="w-full max-w-sm mx-auto select-none transition-opacity duration-700"
      style={{ opacity: mounted ? 1 : 0 }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes race-enter {
          0%   { left: -160px; }
          100% { left: -20px; }
        }
        @keyframes race-cruise {
          0%   { left: -20px; }
          100% { left: calc(100% - 90px); }
        }
        @keyframes race-fly {
          0%   { transform: translateX(var(--fly-start, 60%)) translateY(0) rotate(0deg); }
          25%  { transform: translateX(calc(var(--fly-start, 60%) + 40px)) translateY(-14px) rotate(-6deg); }
          50%  { transform: translateX(calc(var(--fly-start, 60%) + 90px)) translateY(-26px) rotate(-8deg); }
          75%  { transform: translateX(calc(var(--fly-start, 60%) + 150px)) translateY(-16px) rotate(-4deg); }
          100% { transform: translateX(calc(var(--fly-start, 60%) + 220px)) translateY(0) rotate(0deg); }
        }
        @keyframes race-wing-flap {
          0%, 100% { transform: rotate(-14deg) scaleY(1); }
          50%      { transform: rotate(-26deg) scaleY(0.92); }
        }
        @keyframes race-wing-flap-r {
          0%, 100% { transform: rotate(14deg) scaleY(1); }
          50%      { transform: rotate(26deg) scaleY(0.92); }
        }
        @keyframes race-wing-flap-fly {
          0%, 100% { transform: rotate(-22deg) scaleY(1.05) translateY(0); }
          50%      { transform: rotate(-52deg) scaleY(0.78) translateY(-2px); }
        }
        @keyframes race-wing-flap-fly-r {
          0%, 100% { transform: rotate(22deg) scaleY(1.05) translateY(0); }
          50%      { transform: rotate(52deg) scaleY(0.78) translateY(-2px); }
        }
        @keyframes race-sprint {
          0%   { transform: translateX(60%); }
          100% { transform: translateX(calc(100% + 70px)); }
        }
        @keyframes race-road {
          0% { background-position: 0 0; }
          100% { background-position: -30px 0; }
        }
        @keyframes race-bush {
          0% { transform: translateX(0); }
          100% { transform: translateX(-180px); }
        }
        @keyframes race-wheel {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes race-finish-rise {
          0%   { transform: translateY(100%); opacity: 0; }
          60%  { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes race-finish-exit {
          0%   { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(-180px, 0); opacity: 0; }
        }
        @keyframes race-confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translateY(70px) rotate(360deg); opacity: 0; }
        }
        @keyframes race-item-move {
          0%   { transform: translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateX(-380px); opacity: 1; }
        }
        @keyframes race-item-pop {
          0%   { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2) translateY(-10px); opacity: 0; }
        }
        @keyframes race-light-blink {
          0%, 49%   { opacity: 1; box-shadow: 0 0 6px 2px rgba(239,68,68,0.9); }
          50%, 100% { opacity: 0.25; box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes race-flame {
          0%, 100% { transform: scaleX(1); opacity: 0.9; }
          50%      { transform: scaleX(1.4); opacity: 1; }
        }

        .race-scene {
          position: relative;
          height: 80px;
          width: 100%;
          overflow: hidden;
        }
        .race-bushes {
          position: absolute;
          left: 0; right: 0;
          bottom: 14px;
          height: 14px;
          display: flex;
          gap: 28px;
          width: 200%;
          opacity: 0.5;
        }
        .race-bush {
          width: 22px; height: 12px;
          background: radial-gradient(ellipse at 50% 100%, #94a3b8 0 60%, transparent 61%);
          flex-shrink: 0;
        }
        .race-bush.tall { height: 14px; width: 28px; }

        .race-road {
          position: absolute;
          left: 0; right: 0;
          bottom: 8px;
          height: 2px;
          background-image: repeating-linear-gradient(
            to right,
            hsl(var(--muted-foreground) / 0.55) 0 10px,
            transparent 10px 22px
          );
          background-size: 30px 2px;
        }

        .race-finish-wrap {
          position: absolute;
          right: 8%;
          bottom: 10px;
          width: 18px;
          height: 56px;
          overflow: hidden;
          pointer-events: none;
        }
        .race-finish {
          position: absolute;
          inset: 0;
          transform: translateY(100%);
          opacity: 0;
        }
        .race-scene.finishing .race-finish {
          animation: race-finish-rise 0.6s cubic-bezier(.2,.8,.2,1) forwards;
        }
        .race-scene.done .race-finish-wrap {
          animation: race-finish-exit 1s ease-in forwards;
          animation-delay: 0.1s;
        }
        .race-finish::before {
          content: "";
          position: absolute;
          left: 8px; top: 0; bottom: 0;
          width: 1.5px;
          background: hsl(var(--foreground) / 0.7);
        }
        .race-finish::after {
          content: "";
          position: absolute;
          left: 0; top: 0;
          width: 18px; height: 14px;
          background-image: repeating-conic-gradient(#000 0% 25%, #fff 0% 50%);
          background-size: 5px 5px;
          border-radius: 1px;
        }

        .race-items {
          position: absolute;
          left: 0; right: 0;
          bottom: 24px;
          height: 16px;
          pointer-events: none;
        }
        .race-item {
          position: absolute;
          width: 14px; height: 14px;
          left: 100%;
          top: 0;
          animation: race-item-move 3.6s linear forwards;
          font-size: 13px;
          line-height: 1;
          display: flex; align-items: center; justify-content: center;
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.25));
        }
        .race-item.collected { animation: race-item-pop 0.18s ease-out forwards; }

        .race-car-wrap {
          position: absolute;
          bottom: 6px;
          left: -20px;
          width: 70px;
          height: 32px;
          will-change: left, transform;
        }
        .race-scene.finishing .race-car-wrap {
          left: calc(100% - 160px);
          animation: race-fly 2s cubic-bezier(.25,.46,.45,.94) forwards !important;
        }
        .race-car { position: absolute; inset: 0; }
        .race-car-img {
          position: absolute;
          left: 0; bottom: 0;
          width: 100%;
          height: auto;
          object-fit: contain;
          pointer-events: none;
          filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25));
        }

        .race-body {
          position: absolute;
          left: 4px; right: 4px;
          bottom: 6px;
          height: 11px;
          background: var(--car-color);
          border-radius: 3px 8px 3px 3px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.25);
        }
        .race-spoiler {
          position: absolute;
          left: 2px; bottom: 14px;
          width: 9px; height: 5px;
          background: var(--car-color);
          border-radius: 1px;
          filter: brightness(0.8);
        }
        .race-nose {
          position: absolute;
          right: 0; bottom: 6px;
          width: 11px; height: 5px;
          background: var(--car-color);
          filter: brightness(0.85);
          clip-path: polygon(0 0, 100% 60%, 100% 100%, 0 100%);
        }
        .race-cockpit {
          position: absolute;
          left: 24px; bottom: 15px;
          width: 24px; height: 8px;
          background: linear-gradient(180deg, #1f2937 0%, #475569 100%);
          border-radius: 6px 8px 0 0;
          clip-path: polygon(8% 100%, 0 100%, 18% 0, 82% 0, 100% 100%, 100% 100%);
        }
        .race-decal {
          position: absolute;
          left: 16px; bottom: 8px;
          padding: 1px 3px;
          font-size: 5.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
          color: var(--car-color);
          background: #fff;
          border-radius: 2px;
          line-height: 1;
          font-family: ui-sans-serif, system-ui, sans-serif;
          text-transform: uppercase;
        }
        .race-number {
          position: absolute;
          right: 16px; bottom: 7px;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #fff;
          color: var(--car-color);
          font-size: 6px;
          font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          line-height: 1;
        }
        .race-light {
          position: absolute;
          top: 8px;
          left: 38%;
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #ef4444;
          animation: race-light-blink 0.5s steps(2, end) infinite;
          z-index: 5;
        }
        .race-wheel {
          position: absolute;
          bottom: 0;
          width: 11px; height: 11px;
          border-radius: 50%;
          background: #111827;
          border: 1.5px solid #374151;
          transition: width 0.3s, height 0.3s, bottom 0.3s;
        }
        .race-wheel.big { width: 15px; height: 15px; bottom: -2px; border-width: 2px; }
        .race-wheel::after {
          content: "";
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: #6b7280;
        }
        .race-wheel.front { right: 4px; }
        .race-wheel.back  { left: 4px; }

        .race-wing {
          position: absolute;
          opacity: 0;
          transition: opacity 0.4s;
          pointer-events: none;
          width: 26px; height: 22px;
          background:
            radial-gradient(circle at 85% 50%, #ffffff 0 4px, transparent 5px),
            radial-gradient(circle at 70% 35%, #ffffff 0 5px, transparent 6px),
            radial-gradient(circle at 55% 55%, #ffffff 0 6px, transparent 7px),
            radial-gradient(circle at 38% 45%, #ffffff 0 7px, transparent 8px),
            radial-gradient(circle at 20% 55%, #ffffff 0 8px, transparent 9px);
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.45)) drop-shadow(0 0 1px rgba(0,0,0,0.3));
          z-index: 4;
        }
        .race-car-wrap.has-wings .race-wing { opacity: 1; }
        .race-wing.left {
          left: 2px; bottom: 12px;
          transform-origin: 100% 50%;
          transform: rotate(-18deg);
          animation: race-wing-flap 0.9s ease-in-out infinite;
        }
        .race-wing.right {
          right: 2px; bottom: 12px;
          transform-origin: 0% 50%;
          transform: rotate(18deg) scaleX(-1);
          animation: race-wing-flap-r 0.9s ease-in-out infinite;
        }
        .race-scene.finishing .race-car-wrap.has-wings .race-wing.left {
          animation: race-wing-flap-fly 0.18s ease-in-out infinite;
        }
        .race-scene.finishing .race-car-wrap.has-wings .race-wing.right {
          animation: race-wing-flap-fly-r 0.18s ease-in-out infinite;
        }
        .race-flame {
          position: absolute;
          left: -6px; bottom: 8px;
          width: 10px; height: 6px;
          background: linear-gradient(90deg, transparent, #facc15 30%, #f97316 60%, #ef4444);
          border-radius: 50% 0 0 50%;
          opacity: 0;
          transform-origin: right center;
        }
        .race-car-wrap.has-wings .race-flame,
        .race-car-wrap.jet .race-flame {
          opacity: 1;
          animation: race-flame 0.18s ease-in-out infinite;
        }
        .race-car-wrap.jet .race-flame {
          left: -10px;
          width: 16px;
          height: 7px;
        }
        .race-car-wrap.jet-2 .race-flame {
          left: -14px;
          width: 22px;
          height: 8px;
        }
        .race-car-wrap.jet-3 .race-flame {
          left: -18px;
          width: 28px;
          height: 9px;
        }

        .race-confetti { position: absolute; inset: 0; pointer-events: none; }
        .race-confetti span {
          position: absolute;
          top: 6px;
          width: 5px; height: 7px;
          opacity: 0;
          animation: race-confetti-fall 1.2s ease-out forwards;
        }
      `}</style>

      <div ref={sceneRef} className={`race-scene ${phase === "finishing" ? "finishing" : ""} ${phase === "done" ? "finishing done" : ""}`}>
        <div className="race-bushes" style={{ animation: `race-bush ${bushDur}s linear infinite` }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className={`race-bush ${i % 3 === 0 ? "tall" : ""}`} />
          ))}
        </div>

        <div className="race-road" style={{ animation: `race-road ${roadDur}s linear infinite` }} />

        <div className="race-items">
          {items.map((it) => (
            <div key={it.id} data-id={it.id} className={`race-item ${it.collected ? "collected" : ""}`}>
              {it.kind === "bolt" ? "⚡" : it.kind === "coin" ? "🪙" : "⭐"}
            </div>
          ))}
        </div>

        <div className="race-finish-wrap">
          <div className="race-finish" />
        </div>

        <div
          className={`race-car-wrap ${hasWings ? "has-wings" : ""} ${hasJet ? "jet jet-3" : ""}`}
          style={{
            "--car-color": color,
            animation: `race-enter 2.5s cubic-bezier(.25,.46,.45,.94) both, race-cruise ${cruiseDur}s linear 2.5s infinite alternate`,
          } as CSSProperties & { "--car-color": string }}
        >
          <div className="race-car">
            <div className="race-flame" />
            <img src={carImg} alt="" className="race-car-img" draggable={false} />
            {hasLight && <div className="race-light" />}
          </div>
        </div>

        {confetti && (
          <div className="race-confetti">
            {Array.from({ length: 14 }).map((_, i) => {
              const left = 60 + Math.random() * 35;
              const delay = Math.random() * 0.3;
              const colors = [color, "#facc15", "#f97316", "#22c55e", "#3b82f6"];
              const bg = colors[i % colors.length];
              return (
                <span
                  key={i}
                  style={{
                    left: `${left}%`,
                    background: bg,
                    animationDelay: `${delay}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
