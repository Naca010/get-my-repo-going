import topAsset from "@/assets/vr-splash-top.png.asset.json";
import bottomAsset from "@/assets/vr-splash-bottom.png.asset.json";

interface Props {
  alt: string;
  className?: string;
}

const VRSplashReveal = ({ alt, className = "w-40 sm:w-48 aspect-[4/5]" }: Props) => {
  return (
    <div className={`vr-splash-impact relative ${className}`} aria-label={alt}>
      <div className="flex h-full w-full flex-col">
        <img
          src={topAsset.url}
          alt={alt}
          draggable={false}
          className="vr-splash-top block h-auto w-full shrink-0"
        />
        <img
          src={bottomAsset.url}
          alt=""
          aria-hidden
          draggable={false}
          className="vr-splash-bottom block h-auto w-full shrink-0"
        />
      </div>
      <style>{`
        @keyframes vr-splash-top-reveal {
          0% { clip-path: inset(100% 0 0 0); opacity: 0; transform: scale(0.9); }
          65% { clip-path: inset(0 0 0 0); opacity: 1; transform: scale(1.035); }
          100% { clip-path: inset(0 0 0 0); opacity: 1; transform: scale(1); }
        }
        @keyframes vr-splash-bottom-reveal {
          0% { clip-path: inset(0 0 100% 0); opacity: 0; transform: scale(0.9); }
          65% { clip-path: inset(0 0 0 0); opacity: 1; transform: scale(1.04); }
          100% { clip-path: inset(0 0 0 0); opacity: 1; transform: scale(1); }
        }
        @keyframes vr-splash-impact {
          0%, 62% { transform: scale(1); }
          76% { transform: scale(1.055); }
          100% { transform: scale(1); }
        }
        .vr-splash-impact {
          animation: vr-splash-impact 900ms cubic-bezier(.2,.85,.3,1) both;
        }
        .vr-splash-top {
          transform-origin: center bottom;
          animation: vr-splash-top-reveal 680ms cubic-bezier(.16,1,.3,1) 80ms both;
        }
        .vr-splash-bottom {
          transform-origin: center top;
          animation: vr-splash-bottom-reveal 720ms cubic-bezier(.16,1,.3,1) 170ms both;
        }
        @media (prefers-reduced-motion: reduce) {
          .vr-splash-impact, .vr-splash-top, .vr-splash-bottom { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default VRSplashReveal;
