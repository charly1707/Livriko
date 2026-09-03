import React, { useEffect, useState } from 'react';
import {
  LockKeyhole,
  UserRound,
  ShieldCheck,
  Zap,
  MapPin,
  Menu,
  X,
  Truck,
  Users,
  ArrowRight,
  CheckCircle2,
  Store,
  ChevronLeft,
  ChevronRight,
  Phone,
  CreditCard,
  Headphones,
} from 'lucide-react';
import { UserRole } from '../types';
import livrikoLogo from '../assets/images/livriko-logo-sm.webp';
import { WELCOME_CRITICAL_IMAGES } from '../utils/preloadWelcomeImages';

const [welcomeMobileHero, welcomeCarouselMoto, welcomeCarouselHandoff] = WELCOME_CRITICAL_IMAGES;

type AuthMode = 'register' | 'login';

type WelcomePageProps = {
  onSeen?: () => void;
  onOpenAuth?: (mode: AuthMode, role?: UserRole) => void;
  onBrowseMarket?: () => void;
};

const NAV_LINKS = [
  { id: 'a-propos', label: 'À propos' },
  { id: 'comment-ca-marche', label: 'Comment ça marche ?' },
  { id: 'nos-avantages', label: 'Nos avantages' },
  { id: 'aide', label: 'Aide' },
] as const;

const FEATURES = [
  {
    icon: Zap,
    title: 'Livraison rapide',
    description: 'En un temps record',
    iconClass: 'text-[#1d4ed8] bg-blue-50',
  },
  {
    icon: ShieldCheck,
    title: 'Paiement sécurisé',
    description: 'Transactions protégées',
    iconClass: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: MapPin,
    title: 'Suivi en temps réel',
    description: 'Suivez votre commande',
    iconClass: 'text-[#ff8a1f] bg-orange-50',
  },
] as const;

const DESKTOP_SLIDES = [
  {
    id: 'marketplace',
    title: 'Tout votre marché local,',
    titleHighlight: 'livré à votre porte !',
    description:
      'La plateforme tout-en-un de livraison à Lokossa : courses, repas et colis en toute sérénité.',
    bgImage: welcomeCarouselMoto,
  },
  {
    id: 'handoff',
    title: 'Livré avec soin,',
    titleHighlight: 'jusqu’à votre porte !',
    description:
      'Nos livreurs certifiés vous remettent vos commandes en main propre, rapidement et en toute confiance.',
    bgImage: welcomeCarouselHandoff,
  },
  {
    id: 'client',
    title: 'Commandez, détendez-vous,',
    titleHighlight: 'on s’occupe du reste !',
    description:
      'Repas, courses ou colis — recevez vos achats à domicile à Lokossa dès 450 FCFA.',
    bgImage: welcomeMobileHero,
  },
] as const;

const WHATSAPP_PHONE = '+229 01 96 73 03 53';
const WHATSAPP_HREF =
  'https://wa.me/2290196730353?text=Bonjour%20Livriko%20!%20Je%20souhaite%20passer%20une%20commande.';

/** Fond navbar page d'accueil après scroll — beige chaud (pas blanc) */
const NAV_SCROLL_BG = 'bg-[#faf6ef]/95';
const NAV_SCROLL_BORDER = 'border-b border-[#e6dac8]/80';
const NAV_SCROLL_HOVER = 'hover:bg-[#f0e6d8]';

/** Thème beige page d'accueil (sections après le hero) */
const PAGE_BG = 'bg-[#faf6ef]';
const PAGE_BG_ALT = 'bg-[#f5efe6]';
const CARD_BG = 'bg-[#fffdf8]';
const BORDER_BEIGE = 'border-[#e6dac8]';
const BORDER_BEIGE_SOFT = 'border-[#e6dac8]/70';
const DIVIDE_BEIGE = 'divide-y divide-[#e6dac8]/90';

const WelcomePage: React.FC<WelcomePageProps> = ({ onSeen, onOpenAuth, onBrowseMarket }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [desktopSlide, setDesktopSlide] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    const onResize = () => setIsNarrow(window.matchMedia('(max-width: 1023px)').matches);
    onScroll();
    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  // Les images sont préchargées au démarrage via main.tsx (preloadWelcomeImages)
  // Défilement automatique (ne se met plus en pause au survol)
  useEffect(() => {
    if (isNarrow) return;
    const timer = window.setInterval(() => {
      setDesktopSlide((prev) => (prev + 1) % DESKTOP_SLIDES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isNarrow]);

  const markSeen = () => {
    try {
      localStorage.setItem('livriko_seen_welcome', 'true');
    } catch {
      // ignore
    }
    onSeen?.();
  };

  const openAuth = (mode: AuthMode, role?: UserRole) => {
    markSeen();
    setMobileMenuOpen(false);
    if (onOpenAuth) {
      onOpenAuth(mode, role);
      return;
    }
    window.location.href = mode === 'login' ? '/login' : '/register';
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const overMobileHero = isNarrow && !scrolled;
  const overDesktopHero = !isNarrow && !scrolled;
  const lightHeader = overMobileHero || overDesktopHero;
  const slide = DESKTOP_SLIDES[desktopSlide];

  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${PAGE_BG} text-slate-900`}>
      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
          lightHeader && !mobileMenuOpen
            ? 'border-b border-transparent bg-transparent'
            : scrolled || mobileMenuOpen
              ? `${NAV_SCROLL_BORDER} ${NAV_SCROLL_BG} shadow-sm backdrop-blur-md`
              : 'border-b border-transparent bg-[#faf6ef]/90 backdrop-blur-sm'
        }`}
      >
        {/* Bandeau utilitaire desktop — données déjà présentes dans le projet */}
        <div
          className={`hidden border-b lg:block ${
            lightHeader && !mobileMenuOpen
              ? 'border-white/10 bg-black/45 text-white'
              : 'border-slate-200 bg-[#0b2a4a] text-white'
          }`}
        >
          <div className="mx-auto flex max-w-[96rem] items-center justify-between gap-4 px-12 py-1.5 text-[12px] xl:px-16">
            <p className="inline-flex items-center gap-1.5 font-medium">
              <MapPin className="h-3.5 w-3.5 text-[#ff8a1f]" aria-hidden />
              Livraison express à Lokossa dès 450 FCFA
            </p>
            <p className="inline-flex items-center gap-1.5 font-medium">
              <Phone className="h-3.5 w-3.5 text-[#ff8a1f]" aria-hidden />
              Support client 7j/7 : {WHATSAPP_PHONE}
            </p>
          </div>
        </div>

        <div className="mx-auto flex h-14 max-w-[96rem] items-center gap-3 px-4 sm:h-16 sm:px-8 lg:h-[4.25rem] lg:px-12 xl:px-16">
          {/* Logo */}
          <a
            href="#accueil"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex min-w-0 shrink-0 items-center gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/40"
            aria-label="Livriko — retour en haut"
          >
            <img
              src={livrikoLogo}
              alt="Logo Livriko"
              className={`h-10 w-10 rounded-xl bg-white object-contain p-0.5 sm:h-11 sm:w-11 ${
                lightHeader && !mobileMenuOpen ? 'ring-2 ring-white/70' : 'ring-1 ring-black/5'
              }`}
            />
            <span
              className={`truncate text-base font-black tracking-tight sm:text-lg ${
                lightHeader && !mobileMenuOpen
                  ? 'text-white drop-shadow'
                  : 'text-[#0b2a4a]'
              }`}
            >
              Livr
              <span className={lightHeader && !mobileMenuOpen ? 'text-[#ffb45c]' : 'text-[#ff8a1f]'}>
                iko
              </span>
            </span>
          </a>

          {/* Desktop nav — centrée */}
          <nav
            className="mx-auto hidden items-center gap-0.5 lg:flex"
            aria-label="Navigation principale"
          >
            {NAV_LINKS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30 ${
                  lightHeader && !mobileMenuOpen
                    ? 'text-white/90 hover:bg-white/10 hover:text-white'
                    : `text-slate-500 ${NAV_SCROLL_HOVER} hover:text-[#0b2a4a]`
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={() => openAuth('register', 'livreur')}
              className={`rounded-full px-4 py-2.5 text-sm font-bold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30 ${
                lightHeader && !mobileMenuOpen
                  ? 'border border-white/40 bg-white/10 text-white hover:bg-white/20'
                  : 'border border-[#e6dac8] bg-[#fffdf8] text-slate-700 hover:border-[#d9cbb8] hover:bg-[#f5efe6]'
              }`}
            >
              Devenir livreur
            </button>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="inline-flex items-center gap-2 rounded-full bg-[#ff8a1f] px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:bg-[#ff9a3d] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden />
              Se connecter
            </button>
          </div>

          {/* Mobile actions : connexion compacte + menu */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            {!overMobileHero && (
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="inline-flex h-9 items-center rounded-full bg-[#0b2a4a] px-3.5 text-xs font-bold text-white transition hover:bg-[#123a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/40"
              >
                Connexion
              </button>
            )}
            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30 ${
                overMobileHero && !mobileMenuOpen
                  ? 'border border-white/45 bg-white/15 text-white backdrop-blur-sm'
                  : 'border border-[#e6dac8] bg-[#fffdf8] text-slate-700 hover:bg-[#f5efe6]'
              }`}
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="welcome-mobile-menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div
            id="welcome-mobile-menu"
            className="border-t border-[#e6dac8]/60 bg-[#faf6ef] lg:hidden"
          >
            <nav className="flex flex-col px-4 py-3" aria-label="Navigation mobile">
              {NAV_LINKS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className={`border-b border-[#e6dac8]/60 py-3.5 text-left text-[15px] font-semibold text-[#0b2a4a] last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30`}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className={`grid gap-2 border-t border-[#e6dac8]/60 px-4 py-4`}>
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#ff8a1f] px-4 text-sm font-black text-white transition hover:bg-[#ff9a3d]"
              >
                <UserRound className="h-4 w-4" aria-hidden />
                S&apos;inscrire
              </button>
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b2a4a] px-4 text-sm font-bold text-white transition hover:bg-[#123a63]"
              >
                <LockKeyhole className="h-4 w-4" aria-hidden />
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => openAuth('register', 'livreur')}
                className={`inline-flex h-11 items-center justify-center rounded-2xl border ${BORDER_BEIGE} ${CARD_BG} px-4 text-sm font-bold text-slate-700 transition hover:bg-[#f5efe6]`}
              >
                Devenir livreur
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="accueil" className="relative overflow-hidden">
        {/* MOBILE: image d’accueil + hôtesses accueillantes, puis boutons auth */}
        <div className="relative flex h-[100svh] w-full flex-col lg:hidden">
          {/* Fond : hôtesse accueillante Livriko */}
          <img
            src={welcomeMobileHero}
            alt="Hôtesse Livriko accueillante avec une livraison"
            className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/75"
            aria-hidden
          />

          {/* Zone visuelle hôtesses / accueil */}
          <div className="relative z-[2] flex flex-1 flex-col items-center justify-center px-5 pt-20 text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              Accueil Livriko
            </p>

            {/* Portraits accueil (hôtesse + livreur Livriko) */}
            <div className="mb-5 flex items-end justify-center">
              <div className="relative z-[2] overflow-hidden rounded-full border-[3px] border-white shadow-xl ring-2 ring-[#ff8a1f]/60">
                <img
                  src={welcomeMobileHero}
                  alt="Hôtesse Livriko"
                  className="h-28 w-28 object-cover object-[center_18%]"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
              <div className="relative z-[1] -ml-4 overflow-hidden rounded-full border-[3px] border-white shadow-xl">
                <img
                  src={welcomeCarouselMoto}
                  alt="Livreur Livriko"
                  className="h-20 w-20 object-cover object-[center_10%]"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>

            <div className="max-w-sm rounded-3xl border border-white/20 bg-white/12 px-5 py-4 text-white shadow-lg backdrop-blur-md">
              <p className="text-2xl font-black tracking-tight sm:text-3xl">
                Bienvenue chez{' '}
                <span className="whitespace-nowrap">
                  Livr<span className="text-[#ffb45c]">iko</span>
                </span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                Nos équipes vous accueillent avec le sourire — livraison simple, rapide et proche de vous.
              </p>
            </div>
          </div>

          {/* Boutons connexion / inscription sous l’accueil */}
          <div className="relative z-[2] w-full space-y-3 px-5 pb-8 pt-2">
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#ff8a1f] px-6 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-orange-950/20 transition duration-200 hover:bg-[#ff9a3d] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 active:scale-[0.99]"
            >
              <UserRound className="h-5 w-5" aria-hidden />
              S&apos;inscrire
            </button>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-white/80 bg-white/95 px-6 text-sm font-black uppercase tracking-wide text-[#0b2a4a] shadow-md transition duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.99]"
            >
              <LockKeyhole className="h-5 w-5" aria-hidden />
              Se connecter
            </button>
            {onBrowseMarket && (
              <button
                type="button"
                onClick={onBrowseMarket}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 text-sm font-bold text-white transition hover:bg-white/15"
              >
                Voir le catalogue
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection('accueil-contenu')}
              className="mx-auto flex items-center gap-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              aria-label="Faire défiler pour en savoir plus"
            >
              En savoir plus
              <ArrowRight className="h-3.5 w-3.5 rotate-90" aria-hidden />
            </button>
          </div>
        </div>

        {/* Décor desktop — retiré : image en arrière-plan à la place */}

        {/* —— Desktop : hero type marketplace (style maquette) —— */}
        <div className="relative hidden min-h-[100svh] w-full overflow-hidden bg-slate-950 lg:block">
          {DESKTOP_SLIDES.map((s, idx) => (
            <img
              key={s.id}
              src={s.bgImage}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
                idx === desktopSlide ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              loading="eager"
              decoding={idx === 0 ? 'sync' : 'async'}
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              aria-hidden={idx !== desktopSlide}
            />
          ))}

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0.2) 100%), linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 40%, rgba(0,0,0,0.55) 100%)',
            }}
            aria-hidden
          />

          <button
            type="button"
            onClick={() =>
              setDesktopSlide((prev) => (prev - 1 + DESKTOP_SLIDES.length) % DESKTOP_SLIDES.length)
            }
            className="absolute left-5 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white transition hover:bg-black/55 xl:left-8"
            aria-label="Slide précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setDesktopSlide((prev) => (prev + 1) % DESKTOP_SLIDES.length)}
            className="absolute right-5 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white transition hover:bg-black/55 xl:right-8"
            aria-label="Slide suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="relative z-[2] mx-auto flex min-h-[100svh] max-w-[96rem] flex-col justify-center px-12 pb-20 pt-36 xl:px-16">
            <div className="max-w-3xl text-left">
              <h1 className="text-[3.25rem] font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-lg xl:text-[4rem]">
                {slide.title}
                <br />
                <span className="text-[#ff8a1f]">{slide.titleHighlight}</span>
              </h1>

              <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-white/90 xl:text-lg">
                {slide.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => (onBrowseMarket ? onBrowseMarket() : openAuth('register'))}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#ff8a1f] px-7 text-sm font-bold text-white shadow-lg shadow-orange-950/25 transition hover:bg-[#ff9a3d] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:scale-[0.99]"
                >
                  Voir le catalogue
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/50 bg-transparent px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  Se connecter
                </button>
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/50 bg-transparent px-6 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  WhatsApp {WHATSAPP_PHONE}
                </a>
              </div>

              <div className="mt-12 grid max-w-3xl grid-cols-3 gap-8 border-t border-white/15 pt-7">
                <div className="flex items-center gap-3 text-white">
                  <Truck className="h-5 w-5 shrink-0 text-[#ff8a1f]" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">Livraison rapide</p>
                    <p className="text-xs font-light text-white/70">Partout à Lokossa</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <CreditCard className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">Paiement sécurisé</p>
                    <p className="text-xs font-light text-white/70">Espèces à la livraison</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Headphones className="h-5 w-5 shrink-0 text-sky-300" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">Support 7j/7</p>
                    <p className="text-xs font-light text-white/70">Service client</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
            {DESKTOP_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setDesktopSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === desktopSlide ? 'w-6 bg-[#ff8a1f]' : 'w-2 bg-white/55 hover:bg-white'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Contenu sous le hero mobile (+ trust desktop) */}
        <div
          id="accueil-contenu"
          className={`relative scroll-mt-20 ${PAGE_BG}`}
        >
          <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden>
            <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-[#f0e6d8]/40 blur-3xl" />
            <div className="absolute right-0 top-20 h-48 w-48 rounded-full bg-[#ffecd6]/50 blur-3xl" />
          </div>

          {/* —— Mobile : intro courte après le hero photo —— */}
          <div className="relative px-5 pb-10 pt-9 lg:hidden">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff8a1f]">
              La plateforme
            </p>
            <h2 className="mt-2 max-w-[18ch] text-[1.85rem] font-black leading-[1.12] tracking-tight text-[#0b2a4a]">
              Tout près de vous, livré simplement
            </h2>
            <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-slate-600">
              Commandez, vendez ou livrez depuis une seule application — claire, rapide et locale.
            </p>

            <ul className={`mt-7 ${DIVIDE_BEIGE} border-y ${BORDER_BEIGE_SOFT}`}>
              {FEATURES.map(({ icon: Icon, title, description, iconClass }) => (
                <li key={title} className="flex items-center gap-3.5 py-4">
                  <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-[#0b2a4a]">{title}</p>
                    <p className="text-sm text-slate-500">{description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-5 flex items-start gap-2.5 text-sm leading-snug text-slate-600">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#1d4ed8]" aria-hidden />
              Comptes et paiements protégés — la confiance de nos utilisateurs.
            </p>
          </div>

          {/* Trust desktop */}
          <div className="relative mx-auto hidden max-w-[96rem] px-5 sm:px-8 lg:mt-10 lg:block lg:px-12 lg:pb-16 xl:mt-12 xl:px-16 xl:pb-20">
            <div className={`flex w-full flex-col items-start gap-3 rounded-2xl border ${BORDER_BEIGE_SOFT} ${CARD_BG} px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:px-8 lg:px-10 lg:py-6`}>
              <div className="flex items-center gap-3 text-lg text-slate-600">
                <LockKeyhole className="h-6 w-6 shrink-0 text-[#1d4ed8]" aria-hidden />
                <span className="font-medium">
                  La confiance de nos utilisateurs et partenaires
                </span>
              </div>
              <div className="flex items-center gap-2 text-base font-semibold text-slate-500">
                <ShieldCheck className="h-6 w-6 text-emerald-600" aria-hidden />
                Paiements, comptes et livraisons protégés
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="a-propos" className={`scroll-mt-24 border-t ${BORDER_BEIGE_SOFT} ${PAGE_BG_ALT} py-11 sm:py-16 lg:py-20`}>
        <div className="mx-auto max-w-[96rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-4xl text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff8a1f] sm:text-sm sm:tracking-wider">
              À propos
            </p>
            <h2 className="mt-2 max-w-[16ch] text-[1.7rem] font-black leading-[1.15] tracking-tight text-[#0b2a4a] sm:max-w-none sm:text-4xl lg:text-5xl">
              Une livraison locale, pensée pour Lokossa
            </h2>
            <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-slate-600 sm:mt-5 sm:text-lg lg:text-xl">
              Clients, commerçants et livreurs sur une même app : commander, préparer, livrer et suivre — près de chez vous.
            </p>
          </div>

          {/* Mobile : liste simple */}
          <ul className={`mt-8 divide-y divide-[#e6dac8]/60 lg:hidden`}>
            {[
              { icon: Store, title: 'Commerçants', text: 'Publiez vos articles et gérez vos commandes.' },
              { icon: Truck, title: 'Livreurs', text: 'Courses sécurisées après certification.' },
              { icon: Users, title: 'Clients', text: 'Parcourez, payez et suivez jusqu’à la livraison.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5 py-4 first:pt-0 last:pb-0">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b2a4a] text-white">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-[15px] font-bold text-[#0b2a4a]">{title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop / tablet cards */}
          <div className="mt-10 hidden gap-4 sm:grid-cols-3 lg:grid">
            {[
              { icon: Store, title: 'Commerçants', text: 'Publiez vos articles et gérez vos commandes depuis votre espace boutique.' },
              { icon: Truck, title: 'Livreurs', text: 'Recevez des courses, livrez en sécurité après certification de votre dossier.' },
              { icon: Users, title: 'Clients', text: 'Parcourez le marché, payez et suivez votre commande jusqu’à la livraison.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className={`flex flex-col rounded-3xl border ${BORDER_BEIGE} ${CARD_BG} p-5`}>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0b2a4a] text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-[#0b2a4a]">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="comment-ca-marche" className={`scroll-mt-24 ${PAGE_BG} py-11 sm:py-16 lg:py-20`}>
        <div className="mx-auto max-w-[96rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-4xl text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1d4ed8] sm:text-sm sm:tracking-wider">
              Comment ça marche ?
            </p>
            <h2 className="mt-2 max-w-[14ch] text-[1.7rem] font-black leading-[1.15] tracking-tight text-[#0b2a4a] sm:max-w-none sm:text-4xl lg:text-5xl">
              Trois étapes pour démarrer
            </h2>
          </div>

          {/* Mobile timeline — texte libre, sans cartes */}
          <ol className="relative mt-8 lg:hidden">
            {[
              { step: '1', title: 'Créez votre compte', text: 'Client, commerçant ou livreur — selon votre besoin.' },
              { step: '2', title: 'Commandez ou livrez', text: 'Les boutiques préparent ; les livreurs certifiés livrent.' },
              { step: '3', title: 'Suivez en direct', text: 'Préparation, livreur assigné, en route, livré.' },
            ].map((item, index, arr) => (
              <li key={item.step} className="relative flex gap-4 pb-7 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0b2a4a] text-sm font-black text-white">
                    {item.step}
                  </span>
                  {index < arr.length - 1 && (
                    <span className="mt-2 w-px flex-1 bg-[#e6dac8]" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <h3 className="text-[15px] font-bold text-[#0b2a4a]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Desktop grid */}
          <ol className="mt-10 hidden gap-4 md:grid-cols-3 lg:grid">
            {[
              { step: '01', title: 'Créez votre compte', text: 'Inscrivez-vous en tant que client, commerçant ou livreur selon votre besoin.' },
              { step: '02', title: 'Commandez ou livrez', text: 'Les clients passent commande ; les boutiques préparent ; les livreurs certifiés livrent.' },
              { step: '03', title: 'Suivez en direct', text: 'Le statut de la commande se met à jour : préparation, livreur assigné, en route, livré.' },
            ].map((item) => (
              <li key={item.step} className={`rounded-3xl border ${BORDER_BEIGE} ${CARD_BG} p-6 shadow-sm`}>
                <span className="text-xs font-black text-[#ff8a1f]">{item.step}</span>
                <h3 className="mt-2 text-lg font-bold text-[#0b2a4a]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Advantages */}
      <section id="nos-avantages" className={`scroll-mt-24 border-t ${BORDER_BEIGE_SOFT} ${PAGE_BG_ALT} py-11 sm:py-16 lg:py-20`}>
        <div className="mx-auto max-w-[96rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-4xl text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600 sm:text-sm sm:tracking-wider">
              Nos avantages
            </p>
            <h2 className="mt-2 max-w-[14ch] text-[1.7rem] font-black leading-[1.15] tracking-tight text-[#0b2a4a] sm:max-w-none sm:text-4xl lg:text-5xl">
              Ce que Livriko vous apporte
            </h2>
          </div>

          {/* Mobile : checklist compacte */}
          <ul className="mt-7 space-y-3.5 lg:hidden">
            {[
              'Marketplace locale (restaurants, boutiques, services)',
              'Paiements cash, Mobile Money ou portefeuille',
              'Suivi de commande pour le client',
              'Espace commerçant catalogues & commandes',
              'Certification livreurs (selfie, CIP, moto)',
              'Chat lié aux commandes en cours',
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-600" aria-hidden />
                <span className="text-[15px] leading-snug text-slate-700">{text}</span>
              </li>
            ))}
          </ul>

          {/* Desktop grid */}
          <ul className="mt-10 hidden gap-3 sm:grid-cols-2 lg:grid">
            {[
              'Marketplace locale : restaurants, boutiques et services',
              'Paiements adaptés (cash, Mobile Money, portefeuille)',
              'Suivi de commande pour le client',
              'Espace commerçant pour catalogues et commandes',
              'Certification des livreurs (selfie, CIP, moto)',
              'Chat lié aux commandes en cours',
            ].map((text) => (
              <li
                key={text}
                className={`flex items-start gap-3 rounded-2xl border ${BORDER_BEIGE} ${CARD_BG} px-4 py-3.5`}
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                <span className="text-sm font-medium leading-snug text-slate-700">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Help / CTA */}
      <section id="aide" className="scroll-mt-24 bg-[#0b2a4a] py-11 sm:py-16 lg:py-20">
        <div className="mx-auto flex max-w-[96rem] flex-col gap-6 px-5 text-left sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-12 xl:px-16">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff8a1f] sm:text-sm sm:tracking-wider">
              Aide
            </p>
            <h2 className="mt-2 max-w-[12ch] text-[1.7rem] font-black leading-[1.15] tracking-tight text-white sm:max-w-none sm:text-4xl lg:text-5xl">
              Prêt à rejoindre Livriko ?
            </h2>
            <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-slate-300 sm:mt-4 sm:text-base lg:text-lg">
              Créez un compte pour commander, vendre ou livrer. Une fois connecté, le chat de commande est là pour vous aider.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2.5 lg:w-auto lg:min-w-[280px]">
            <button
              type="button"
              onClick={() => openAuth('register')}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff8a1f] px-6 text-sm font-black text-white transition duration-200 hover:bg-[#ff9a3d] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:h-14 lg:h-12"
            >
              Créer un compte
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 text-sm font-bold text-white transition duration-200 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:h-14 lg:h-12"
            >
              Se connecter
            </button>
          </div>
        </div>
      </section>

      <footer className={`border-t ${BORDER_BEIGE} ${PAGE_BG} py-6 sm:py-8`}>
        <div className="mx-auto flex max-w-[96rem] flex-col items-start gap-2 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center gap-2">
            <img src={livrikoLogo} alt="" className="h-9 w-9 rounded-xl bg-white object-contain p-0.5 ring-1 ring-black/5" />
            <span className="text-sm font-bold text-[#0b2a4a]">
              Livr<span className="text-[#ff8a1f]">iko</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            © {new Date().getFullYear()} Livriko — Livraison simple, rapide et proche de vous.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
