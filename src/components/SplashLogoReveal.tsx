import { useEffect, useState } from "react";
import vrLogo from "@/assets/vr-logo.png";

interface Props {
  logoSrc?: string;
  alt: string;
  className?: string;
}

/**
 * Splash-Reveal: Logo skaliert & blendet weich ein, danach folgt ein
 * dezenter Glanz-Sweep von links nach rechts.
 */
const SplashLogoReveal = ({ logoSrc, alt, className = "h-20 sm:h-24" }: Props) => {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const src = logoSrc || vrLogo;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className={`relative ${className}`} aria-label={alt}>
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "scale(1)" : "scale(0.85)",
          transition:
            "opacity 500ms ease-out, transform 700ms cubic-bezier(0.22, 1.2, 0.36, 1)",
        }}

      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain"
          draggable={false}
        />
        {/* Glanz-Sweep */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
            transform: phase >= 2 ? "translateX(120%)" : "translateX(-120%)",
            transition: "transform 900ms cubic-bezier(0.4, 0, 0.2, 1)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
};

export default SplashLogoReveal;
