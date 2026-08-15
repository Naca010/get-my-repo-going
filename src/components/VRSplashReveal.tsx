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
const VRSplashReveal = ({ alt, className = "h-40 sm:h-48 w-40 sm:w-48" }: Props) => {
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
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Oberer (oranger) Teil – oben, unten bündig, damit die Farbtropfen in den blauen Teil laufen */}
        <img
          src={topAsset.url}
          alt={alt}
          draggable={false}
          className="w-full object-contain object-bottom"
          style={{
            height: "58%",
            marginBottom: "-22%",
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? "translateY(0) scale(1)" : "translateY(-14px) scale(0.92)",
            transition:
              "opacity 500ms ease-out, transform 700ms cubic-bezier(0.22, 1.2, 0.36, 1)",
            filter: "drop-shadow(0 6px 18px rgba(236,102,8,0.25))",
          }}
        />
        {/* Unterer (blauer) Teil – fällt danach dazu und greift in den oberen */}
        <img
          src={bottomAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="w-full object-contain object-top relative"
          style={{
            height: "58%",
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateY(0) scale(1)" : "translateY(14px) scale(0.92)",
            transition:
              "opacity 550ms ease-out, transform 800ms cubic-bezier(0.22, 1.2, 0.36, 1)",
            filter: "drop-shadow(0 8px 20px rgba(0,60,125,0.25))",
          }}
        />
      </div>
    </div>
  );
};

export default VRSplashReveal;
