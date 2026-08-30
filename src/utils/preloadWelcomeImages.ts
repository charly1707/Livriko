import mobileHero from '../assets/images/welcome-mobile-hero.webp';
import carouselMoto from '../assets/images/welcome-carousel-moto.webp';
import carouselHandoff from '../assets/images/welcome-carousel-handoff.webp';

/** URLs critiques de la page d'accueil — préchargées dès le démarrage de l'app */
export const WELCOME_CRITICAL_IMAGES = [
  mobileHero,
  carouselMoto,
  carouselHandoff,
] as const;

const preloaded = new Set<string>();

export function preloadWelcomeImages(priority: 'high' | 'low' = 'high') {
  WELCOME_CRITICAL_IMAGES.forEach((src) => {
    if (preloaded.has(src)) return;
    preloaded.add(src);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    if (priority === 'high' && 'fetchPriority' in link) {
      (link as HTMLLinkElement & { fetchPriority?: string }).fetchPriority = 'high';
    }
    document.head.appendChild(link);

    const img = new Image();
    if ('fetchPriority' in img) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority;
    }
    img.decoding = 'async';
    img.src = src;
  });
}
