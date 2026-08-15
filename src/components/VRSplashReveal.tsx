import { useEffect, useState } from "react";
import topAsset from "@/assets/vr-splash-top.png.asset.json";
import bottomAsset from "@/assets/vr-splash-bottom.png.asset.json";

interface Props {
  alt: string;
  className?: string;
}

/**
 * VR-Splash-Reveal: zeigt zuerst den oberen (blauen) Teil des Splash-Logos,
 * dann fällt der untere (orange) Teil dazu – ergibt das komplette VR-Splash-Logo.
 */
const VRSplashReveal = ({ alt, className = "w-40 sm:w-48 aspect-[4/5]" }: Props) => {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

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
      <div className="flex h-full w-full flex-col">
        <img
          src={topAsset.url}
          alt={alt}
          draggable={false}
          className="block h-auto w-full shrink-0"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateY(0)" : "translateY(-14px)",
            transition: "opacity 500ms ease-out, transform 700ms cubic-bezier(0.22, 1.2, 0.36, 1)",
          }}
        />
        <img
          src={bottomAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="block h-auto w-full shrink-0"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0)" : "translateY(14px)",
            transition:
              "opacity 550ms ease-out, transform 800ms cubic-bezier(0.22, 1.2, 0.36, 1)",
          }}
        />
      </div>
    </div>
  );
};

export default VRSplashReveal;
