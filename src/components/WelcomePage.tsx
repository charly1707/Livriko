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
  Package,
  ArrowRight,
  CheckCircle2,
  Store,
} from 'lucide-react';
import { UserRole } from '../types';
import livrikoLogo from '../assets/images/livriko_logo_1785408725718.jpg';
import heroImage from '../assets/images/livriko_rider_branded_hero_1785411575207.png';
import hostessImage from '../assets/images/cliente.png';

type AuthMode = 'register' | 'login';

type WelcomePageProps = {
  onSeen?: () => void;
  onOpenAuth?: (mode: AuthMode, role?: UserRole) => void;
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

const WelcomePage: React.FC<WelcomePageProps> = ({ onSeen, onOpenAuth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

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

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f4f8fc] text-slate-900">
      {/* Header */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
          overMobileHero && !mobileMenuOpen
            ? 'border-b border-transparent bg-transparent'
            : scrolled || mobileMenuOpen
              ? 'border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md'
              : 'border-b border-transparent bg-white/90 backdrop-blur-sm'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-[96rem] items-center gap-3 px-4 sm:h-16 sm:px-8 lg:h-[4.75rem] lg:px-12 xl:px-16">
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
              className={`h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10 ${
                overMobileHero && !mobileMenuOpen ? 'ring-2 ring-white/70' : ''
              }`}
            />
            <span
              className={`truncate text-base font-black tracking-tight sm:text-lg ${
                overMobileHero && !mobileMenuOpen
                  ? 'text-white drop-shadow'
                  : 'text-[#0b2a4a]'
              }`}
            >
              Livr
              <span className={overMobileHero && !mobileMenuOpen ? 'text-[#ffb45c]' : 'text-[#ff8a1f]'}>
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
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-[#0b2a4a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30"
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
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30"
            >
              Devenir livreur
            </button>
            <button
              type="button"
              onClick={() => openAuth('login')}
              className="inline-flex items-center gap-2 rounded-full bg-[#0b2a4a] px-4 py-2.5 text-sm font-bold text-white transition duration-200 hover:bg-[#123a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/40 focus-visible:ring-offset-2"
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
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
            className="border-t border-slate-100 bg-white lg:hidden"
          >
            <nav className="flex flex-col px-4 py-3" aria-label="Navigation mobile">
              {NAV_LINKS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="border-b border-slate-100 py-3.5 text-left text-[15px] font-semibold text-[#0b2a4a] last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30"
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="grid gap-2 border-t border-slate-100 px-4 py-4">
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
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
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
            src={hostessImage}
            alt="Hôtesse Livriko accueillante avec une livraison"
            className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
            loading="eager"
            decoding="async"
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
                  src={hostessImage}
                  alt="Hôtesse Livriko"
                  className="h-28 w-28 object-cover object-[center_18%]"
                />
              </div>
              <div className="relative z-[1] -ml-4 overflow-hidden rounded-full border-[3px] border-white shadow-xl">
                <img
                  src={heroImage}
                  alt="Livreur Livriko"
                  className="h-20 w-20 object-cover object-[center_10%]"
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

        {/* —— Desktop : hero plein écran, image en arrière-plan —— */}
        <div className="relative hidden min-h-[100svh] w-full lg:block">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
            loading="eager"
            decoding="async"
            aria-hidden
          />
          {/* Dégradé localisé derrière le bloc texte uniquement */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-[48%] max-w-2xl"
            style={{
              background:
                'linear-gradient(90deg, rgba(244,248,252,0.78) 0%, rgba(244,248,252,0.35) 70%, transparent 100%)',
            }}
            aria-hidden
          />

          <div className="relative z-[2] mx-auto flex min-h-[100svh] max-w-[96rem] flex-col px-12 pb-14 pt-[7.5rem] xl:px-16 xl:pb-16">
            {/* Bloc texte : colonne gauche, aérée */}
            <div className="flex flex-1 flex-col justify-center">
              <div className="max-w-[34rem] text-left xl:max-w-[38rem]">
                <p className="inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-[0.16em] text-[#1d4ed8]">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Plateforme 100% sécurisée
                </p>

                <h1 className="mt-5 font-black tracking-[-0.045em] text-[#0b2a4a]">
                  <span className="block text-[2.75rem] leading-[1.05] xl:text-[3.25rem]">
                    Bienvenue sur
                  </span>
                  <span className="mt-1 block text-[4.5rem] leading-[0.92] xl:text-[5.5rem] 2xl:text-[6rem]">
                    <span className="text-[#0b2a4a]">Livr</span>
                    <span className="text-[#ff8a1f]">iko</span>
                  </span>
                </h1>

                <p className="mt-6 max-w-[28rem] text-[1.125rem] leading-[1.55] text-slate-700 xl:text-[1.2rem]">
                  Votre plateforme de livraison simple, rapide et proche de vous.
                </p>

                <div className="mt-8 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openAuth('register')}
                    className="inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-2xl bg-[#0b2a4a] px-7 text-sm font-black uppercase tracking-wide text-white shadow-md shadow-blue-950/20 transition duration-200 hover:bg-[#123a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/40 focus-visible:ring-offset-2 active:scale-[0.99]"
                  >
                    <UserRound className="h-5 w-5" aria-hidden />
                    S&apos;inscrire
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className="inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-2xl border-2 border-[#0b2a4a] bg-white px-7 text-sm font-black uppercase tracking-wide text-[#0b2a4a] shadow-sm transition duration-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30 focus-visible:ring-offset-2 active:scale-[0.99]"
                  >
                    <LockKeyhole className="h-5 w-5" aria-hidden />
                    Se connecter
                  </button>
                </div>
              </div>
            </div>

            {/* Avantages : bandeau bas, hors du flux du titre */}
            <div className="mt-auto flex max-w-3xl items-stretch gap-0 divide-x divide-slate-200/80 rounded-2xl border border-white/80 bg-white/90 shadow-sm">
              {FEATURES.map(({ icon: Icon, title, description, iconClass }) => (
                <div key={title} className="flex flex-1 items-center gap-3 px-5 py-4">
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0b2a4a]">{title}</p>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Badge statut — coin photo */}
            <div className="absolute right-12 top-32 xl:right-16 xl:top-36">
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white px-3.5 py-3 shadow-lg">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-[#1d4ed8]">
                  <Package className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Statut</p>
                  <p className="text-sm font-bold text-[#0b2a4a]">Livraison en cours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu sous le hero mobile (+ trust desktop) */}
        <div
          id="accueil-contenu"
          className="relative scroll-mt-20 bg-[#f4f8fc] lg:bg-transparent"
        >
          <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden>
            <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-blue-200/25 blur-3xl" />
            <div className="absolute right-0 top-20 h-48 w-48 rounded-full bg-orange-100/35 blur-3xl" />
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

            <ul className="mt-7 divide-y divide-slate-200/90 border-y border-slate-200/90">
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
            <div className="flex w-full flex-col items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-full sm:px-8 lg:px-10 lg:py-6">
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
      <section id="a-propos" className="scroll-mt-24 border-t border-slate-200/70 bg-white py-11 sm:py-16 lg:py-20">
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
          <ul className="mt-8 divide-y divide-slate-100 lg:hidden">
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
              <div key={title} className="flex flex-col rounded-3xl border border-slate-200 bg-[#f8fbff] p-5">
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
      <section id="comment-ca-marche" className="scroll-mt-24 bg-[#f4f8fc] py-11 sm:py-16 lg:py-20">
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
                    <span className="mt-2 w-px flex-1 bg-slate-300" aria-hidden />
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
              <li key={item.step} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="text-xs font-black text-[#ff8a1f]">{item.step}</span>
                <h3 className="mt-2 text-lg font-bold text-[#0b2a4a]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Advantages */}
      <section id="nos-avantages" className="scroll-mt-24 border-t border-slate-200/70 bg-white py-11 sm:py-16 lg:py-20">
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
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#f8fbff] px-4 py-3.5"
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

      <footer className="border-t border-slate-200 bg-white py-6 sm:py-8">
        <div className="mx-auto flex max-w-[96rem] flex-col items-start gap-2 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center gap-2">
            <img src={livrikoLogo} alt="" className="h-7 w-7 rounded-full object-cover" />
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
