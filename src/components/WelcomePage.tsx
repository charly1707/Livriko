import React from 'react';
import { LockKeyhole, UserRound } from 'lucide-react';
import livrikoLogo from '../assets/images/livriko_logo_1785408725718.jpg';
import backgroundImage from '../assets/images/livriko_rider_hero_bg_1785410590188.jpg';

const WelcomePage: React.FC<{ onSeen?: () => void; onOpenAuth?: (mode: 'register' | 'login') => void }> = ({ onSeen, onOpenAuth }) => {
  const handleRegister = () => {
    try { localStorage.setItem('livriko_seen_welcome', 'true'); } catch {}
    onSeen && onSeen();
    onOpenAuth ? onOpenAuth('register') : (window.location.href = '/register');
  };

  const handleLogin = () => {
    try { localStorage.setItem('livriko_seen_welcome', 'true'); } catch {}
    onSeen && onSeen();
    onOpenAuth ? onOpenAuth('login') : (window.location.href = '/login');
  };

  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#021b2d] text-white">
      <section className="relative h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-[#041a2a]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#071827]/20 via-[#071827]/25 to-[#021b2d]/85" />

        <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-4xl text-center">
            <div className="mb-5 flex items-center justify-center">
              <img
                src={livrikoLogo}
                alt="Logo Livriko"
                className="h-16 w-16 rounded-full object-cover shadow-[0_0_25px_rgba(255,255,255,0.18)] sm:h-20 sm:w-20"
              />
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Bienvenue sur
            </h1>

            <div className="mt-2 text-5xl font-black tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-[7rem]">
              <span className="text-white">Livr</span>
              <span className="text-[#ff8a1f]">iko</span>
            </div>

            <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/95 sm:text-lg md:text-2xl">
              Votre plateforme de livraison simple, rapide et proche de vous.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={handleRegister}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#24d878] bg-[#1ecb75] px-5 text-base font-black text-white shadow-[0_0_30px_rgba(30,203,117,0.35)] transition hover:scale-[1.01] hover:bg-[#27d880] focus:outline-none focus:ring-4 focus:ring-emerald-300/40 sm:w-[220px] sm:text-lg"
              >
                <UserRound className="h-5 w-5" />
                <span>S'INSCRIRE</span>
              </button>

              <button
                type="button"
                onClick={handleLogin}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#24d878] bg-[#0b2538]/45 px-5 text-base font-black text-white backdrop-blur-sm transition hover:scale-[1.01] hover:bg-[#0b2538]/60 focus:outline-none focus:ring-4 focus:ring-emerald-300/30 sm:w-[220px] sm:text-lg"
              >
                <LockKeyhole className="h-5 w-5" />
                <span>SE CONNECTER</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;
