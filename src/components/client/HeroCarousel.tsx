import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ChevronLeft, ChevronRight, Phone, Truck, CreditCard, Headphones, Sparkles
} from 'lucide-react';
import { CategoryType } from '../../types';
import riderHeroBg from '../../assets/images/livriko_rider_branded_hero_1785411575207.png';
import carouselBanner from '../../assets/images/livriko_rider_hero_bg_1785410590188.jpg';
import clientPhoto from '../../assets/images/cliente.png';

interface HeroCarouselProps {
  onSelectCategory: (category: CategoryType | 'all') => void;
  onSelectStore?: (storeId: string) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onSelectCategory, onSelectStore }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      id: 'official-mission',
      tag: 'Exclusivité Lokossa & environs',
      title: 'Tout votre marché local,',
      titleHighlight: 'livré en un éclair à votre porte !',
      subtitle: 'La 1ère plateforme tout-en-un de livraison ultra-rapide à Lokossa.',
      description: 'Vos courses de supermarché, plats chauds du maquis et colis livrés en toute sérénité.',
      badgePrice: 'Dès 450 FCFA',
      ctaText: 'Commander maintenant',
      ctaCategory: 'all' as CategoryType,
      whatsappPhone: '+229 01 96 73 03 53',
      bgImage: riderHeroBg,
    },
    {
      id: 'restaurants',
      tag: 'Gastronomie & Maquis de Lokossa',
      title: 'Du Maquis chaud à votre Table,',
      titleHighlight: 'en 20 minutes chrono !',
      subtitle: 'Atassi complet, Igname pilée, Poisson grillé & Sauce Dja artisanale.',
      description: 'Commandez vos plats locaux préférés auprès des meilleurs restaurants et maquis de Lokossa.',
      badgePrice: 'Dès 450 FCFA',
      ctaText: 'Découvrir le Menu',
      ctaCategory: 'restaurants' as CategoryType,
      whatsappPhone: '+229 01 96 73 03 53',
      bgImage: carouselBanner,
    },
    {
      id: 'coursier',
      tag: 'Expédition & Coursier Express',
      title: 'Expédiez vos Plis & Colis,',
      titleHighlight: 'en toute confiance & sécurité.',
      subtitle: 'Ramassage immédiat et livraison traçable en direct à Lokossa.',
      description: 'Confiez vos paquets importants à nos coursiers professionnels avec confirmation instantanée par SMS.',
      badgePrice: 'Suivi GPS',
      ctaText: 'Envoyer un Colis',
      ctaCategory: 'autres' as CategoryType,
      whatsappPhone: '+229 01 96 73 03 53',
      bgImage: clientPhoto,
    },
  ];

  // Carousel autoplay timer (3 seconds)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <div 
      className="relative w-screen left-1/2 -translate-x-1/2 h-screen min-h-[640px] max-h-[920px] bg-slate-950 overflow-hidden flex flex-col justify-between select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image filling 100% width and height (cover, center, no-repeat) */}
      {slides.map((s, idx) => (
        <div 
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === currentSlide ? 'opacity-100 z-0 scale-100' : 'opacity-0 z-0 pointer-events-none scale-105'
          }`}
          style={{
            backgroundImage: `url('${s.bgImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      ))}

      {/* Dark Overlay Filter (linear-gradient rgba(0,0,0,0.65), rgba(0,0,0,0.45)) */}
      <div 
        className="absolute inset-0 z-1 pointer-events-none" 
        style={{
          background: 'linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.65) 50%, rgba(0, 0, 0, 0.45) 100%), linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 35%, rgba(0,0,0,0.85) 100%)'
        }}
      />

      {/* Refined Glassmorphism Previous Button */}
      <button
        onClick={handlePrev}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/50 hover:bg-slate-950/80 text-white flex items-center justify-center shadow-lg transition hover:scale-105 active:scale-95 group/btn border border-white/15 backdrop-blur-md cursor-pointer"
        aria-label="Slide précédent"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover/btn:-translate-x-0.5 transition stroke-[2]" />
      </button>

      {/* Refined Glassmorphism Next Button */}
      <button
        onClick={handleNext}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/50 hover:bg-slate-950/80 text-white flex items-center justify-center shadow-lg transition hover:scale-105 active:scale-95 group/btn border border-white/15 backdrop-blur-md cursor-pointer"
        aria-label="Slide suivant"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover/btn:translate-x-0.5 transition stroke-[2]" />
      </button>

      {/* Main Text & Action Buttons directly on top of the image - Expanded Spacing across entire width */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-8 sm:px-16 pt-28 sm:pt-36 pb-16 my-auto flex flex-col justify-center">
        
        <div className="max-w-4xl w-full space-y-6 animate-in fade-in slide-in-from-left duration-500">

          {/* Titre raffiné, accrocheur et professionnel */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-xl">
            {slide.title} <br />
            <span className="text-amber-400 font-extrabold">
              {slide.titleHighlight}
            </span>
          </h1>

          {/* Sous-titre élégant */}
          <div className="space-y-1.5 text-sm sm:text-base text-slate-200 font-normal leading-relaxed max-w-3xl drop-shadow-md">
            <p className="font-semibold text-slate-100 text-base sm:text-lg">{slide.subtitle}</p>
            <p className="text-slate-300 text-xs sm:text-sm whitespace-pre-line leading-relaxed">{slide.description}</p>
          </div>

          {/* Action Buttons avec icônes fines et épurées */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => {
                if (slide.id === 'restaurants') {
                  onSelectCategory('restaurants');
                } else {
                  onSelectCategory(slide.ctaCategory);
                }
                const el = document.getElementById('entreprises-section') || document.getElementById('categories-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-7 py-3.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2.5 shadow-lg shadow-orange-500/30 tracking-wide cursor-pointer"
            >
              <span>{slide.ctaText}</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </button>

            <a
              href={`https://wa.me/2290196730353?text=Bonjour%20Livriko%20!%20Je%20souhaite%20passer%20une%20commande.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition flex items-center gap-2.5 border border-white/15 backdrop-blur-md shadow-md"
            >
              <Phone className="w-4 h-4 text-emerald-300" />
              <span>WhatsApp: +229 01 96 73 03 53</span>
            </a>
          </div>

          {/* Feature Badges Row - Spanning full width across 3 columns with generous space */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 pt-6 border-t border-white/10 w-full max-w-4xl">
            <div className="flex items-center gap-3 text-white/90">
              <Truck className="w-5 h-5 text-amber-400 shrink-0 stroke-[1.75]" />
              <div className="text-left">
                <p className="text-xs sm:text-sm font-semibold leading-tight text-white">Livraison rapide</p>
                <p className="text-[11px] sm:text-xs text-slate-300 font-light">Partout à Lokossa</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white/90">
              <CreditCard className="w-5 h-5 text-emerald-400 shrink-0 stroke-[1.75]" />
              <div className="text-left">
                <p className="text-xs sm:text-sm font-semibold leading-tight text-white">Paiement 100% sécurisé</p>
                <p className="text-[11px] sm:text-xs text-slate-300 font-light">MoMo, Flooz & Espèces</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white/90">
              <Headphones className="w-5 h-5 text-sky-400 shrink-0 stroke-[1.75]" />
              <div className="text-left">
                <p className="text-xs sm:text-sm font-semibold leading-tight text-white">Support client 7j/7</p>
                <p className="text-[11px] sm:text-xs text-slate-300 font-light">Assistance téléphonique & WhatsApp</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Center Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-md">
            {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
              idx === currentSlide 
                ? 'w-5 bg-orange-500 shadow-sm shadow-orange-500/50' 
                : 'w-1.5 bg-white/50 hover:bg-white'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  );
};
