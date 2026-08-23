import React, { useEffect, useState } from 'react';
import livrikoLogo from '../assets/images/livriko_logo_1785408725718.jpg';

interface PageScooterLoaderProps {
  onComplete?: () => void;
  duration?: number;
}

export const PageScooterLoader: React.FC<PageScooterLoaderProps> = ({ 
  onComplete,
  duration = 2400 
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 400);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  // Dynamic status messages as the scooter drives
  const getStatusText = () => {
    if (progress < 25) return "Samuel, votre livreur Livriko, enfile son casque...";
    if (progress < 60) return "Moto TVS démarrée, prise en charge de votre commande...";
    if (progress < 85) return "Traversée rapide des quartiers de Lokossa...";
    return "Livraison imminente à votre porte !";
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white transition-opacity duration-500 p-6 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top Bar Header */}
      <div className="w-full flex justify-between items-center max-w-lg pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">Ville de Lokossa</span>
        </div>
        <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/30">
          Tarif fixe dès 450 FCFA
        </span>
      </div>

      {/* Main Center Content */}
      <div className="w-full max-w-lg flex flex-col items-center text-center space-y-6 my-auto">
        {/* Official Livriko Brand Crest */}
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500 to-orange-500 opacity-40 blur-lg animate-pulse" />
            <img 
              src={livrikoLogo} 
              alt="Logo Officiel Livriko" 
              className="relative w-28 h-28 object-contain drop-shadow-2xl rounded-2xl bg-white p-1"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mt-3">
            Livri<span className="text-orange-400">ko</span>
          </h1>
          <p className="text-xs font-medium text-slate-300 mt-1">
            "Vos achats en ligne, notre mission !"
          </p>
        </div>

        {/* Realistic Driving Rider Animation Track */}
        <div className="w-full space-y-4 py-2">
          
          <div className="relative w-full h-36 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex items-center">
            
            {/* Speed backdrop lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
            
            {/* Lokossa City Skyline Silhouette backdrop */}
            <div className="absolute bottom-6 left-0 right-0 h-10 opacity-20 pointer-events-none flex items-end justify-around">
              <div className="w-8 h-8 bg-slate-700 rounded-t" />
              <div className="w-12 h-10 bg-slate-600 rounded-t" />
              <div className="w-6 h-6 bg-slate-700 rounded-t" />
              <div className="w-14 h-12 bg-slate-600 rounded-t" />
              <div className="w-10 h-8 bg-slate-700 rounded-t" />
            </div>

            {/* Road Surface & Moving Dashed Highway Lines */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-900 border-t-2 border-slate-700 flex items-center overflow-hidden">
              <div className="w-full h-0.5 border-t-2 border-dashed border-yellow-400/80 opacity-90" />
            </div>

            {/* HORIZONTALLY DRIVING RIDER ON SCOOTER ("Bonhomme qui roule") */}
            <div 
              className="absolute bottom-2 transition-all ease-linear duration-75 flex items-end gap-1"
              style={{ left: `calc(${progress}% - 85px)` }}
            >
              {/* Speed Wind & Exhaust Lines trailing behind rider */}
              <div className="flex flex-col gap-1 items-end pr-1 opacity-80 pb-3">
                <span className="w-6 h-1 bg-orange-500 rounded-full animate-pulse" />
                <span className="w-4 h-0.5 bg-blue-400 rounded-full" />
                <span className="w-8 h-1 bg-amber-400/60 rounded-full" />
              </div>

              {/* Scooter & Character Container */}
              <div className="relative flex items-end">
                
                {/* Driver Photo Avatar Badge floating above helmet */}
                <div className="absolute -top-10 left-4 z-20 flex items-center gap-1.5 bg-white text-slate-900 px-2 py-0.5 rounded-full shadow-lg border border-orange-400 text-[10px] font-extrabold whitespace-nowrap animate-bounce">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] text-white">S</span>
                  <span>Samuel • En route</span>
                </div>

                {/* Highly Detailed Animated Vector Rider + Scooter SVG */}
                <svg className="w-24 h-24 drop-shadow-2xl overflow-visible" viewBox="0 0 120 100" fill="none">
                  {/* Headlight Beam Effect */}
                  <path d="M92 65 L120 50 L120 75 Z" fill="url(#headlightGrad)" opacity="0.4" />
                  
                  <defs>
                    <linearGradient id="headlightGrad" x1="92" y1="65" x2="120" y2="65" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#fef08a" stopOpacity="0.8" />
                      <stop offset="1" stopColor="#fef08a" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Rear Delivery Box (Bright Blue with Livriko white L) */}
                  <rect x="8" y="32" width="28" height="28" rx="4" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <rect x="11" y="35" width="22" height="22" rx="2" fill="#1d4ed8" />
                  <path d="M22 41 L17 52 L26 52" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Scooter Rear Rack */}
                  <rect x="30" y="52" width="12" height="4" fill="#475569" />

                  {/* Scooter Body Frame (White & Orange TVS) */}
                  <path d="M35 60 C35 50 45 42 60 48 L75 48 C85 48 90 55 92 65 L35 65 Z" fill="#f97316" />
                  <path d="M42 62 L88 62 L84 54 L48 54 Z" fill="#ffffff" />
                  <path d="M78 40 L88 64" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

                  {/* Front Handlebar & Mirror */}
                  <circle cx="76" cy="38" r="2.5" fill="#e2e8f0" />
                  <path d="M76 38 L72 34" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Headlight bulb */}
                  <circle cx="92" cy="62" r="3.5" fill="#fef08a" />

                  {/* RIDER CHARACTER ("BONHOMME") */}
                  {/* Legs / Pants */}
                  <path d="M44 48 L54 62 L66 62" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Shoe */}
                  <ellipse cx="68" cy="63" rx="4" ry="2.5" fill="#0f172a" />

                  {/* Torso / Blue Polo Jacket */}
                  <path d="M38 46 Q46 34 54 36 L68 44" stroke="#2563eb" strokeWidth="11" strokeLinecap="round" />
                  
                  {/* Arms / Sleeves holding Handlebars */}
                  <path d="M50 38 L68 42 L76 38" stroke="#1d4ed8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Glove / Hand */}
                  <circle cx="76" cy="38" r="2" fill="#334155" />

                  {/* Rider Head & Blue Livriko Helmet */}
                  <circle cx="50" cy="24" r="9" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  {/* Visor / Face profile */}
                  <path d="M52 22 Q58 24 54 28" fill="#38bdf8" opacity="0.9" />
                  <path d="M44 26 C44 26 48 30 52 29" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

                  {/* ROTATING WHEELS */}
                  {/* Rear Wheel */}
                  <g className="animate-[spin_0.4s_linear_infinite]" style={{ transformOrigin: '28px 72px' }}>
                    <circle cx="28" cy="72" r="11" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                    <circle cx="28" cy="72" r="5" fill="#94a3b8" />
                    <line x1="28" y1="61" x2="28" y2="83" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="17" y1="72" x2="39" y2="72" stroke="#cbd5e1" strokeWidth="1.5" />
                  </g>

                  {/* Front Wheel */}
                  <g className="animate-[spin_0.4s_linear_infinite]" style={{ transformOrigin: '88px 72px' }}>
                    <circle cx="88" cy="72" r="11" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                    <circle cx="88" cy="72" r="5" fill="#94a3b8" />
                    <line x1="88" y1="61" x2="88" y2="83" stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1="77" y1="72" x2="99" y2="72" stroke="#cbd5e1" strokeWidth="1.5" />
                  </g>
                </svg>

              </div>

            </div>

          </div>

          {/* Progress Toast & Percentage */}
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium px-2">
            <span className="text-orange-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {getStatusText()}
            </span>
            <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {progress}%
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div 
              className="bg-gradient-to-r from-blue-500 via-orange-500 to-amber-400 h-full rounded-full transition-all ease-out duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Human Guarantee Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 text-xs text-slate-300 border border-slate-700">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>Nous venons, nous prenons, nous livrons !</span>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-[11px] text-slate-400 flex items-center gap-2">
        <span>Rapidité</span> • <span>Sécurité</span> • <span>Confiance</span> • <span>Proximité</span>
      </div>
    </div>
  );
};

