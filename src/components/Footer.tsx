import React, { useState } from 'react';
import axios from 'axios';
import { Phone, MessageCircle, Heart, ArrowUp, Send, CheckCircle } from 'lucide-react';
import livrikoLogo from '../assets/images/livriko_logo_1785408725718.jpg';

export const Footer: React.FC = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [showSubscribe, setShowSubscribe] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;
    setSubscriptionError('');
    try {
      await axios.post('/backend/index.php/api/subscriptions', { contact: emailOrPhone.trim() }, { withCredentials: true });
      setIsSubscribed(true);
      setEmailOrPhone('');
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : null;
      setSubscriptionError(message || 'Inscription indisponible.');
    }
  };

  return (
    <footer className="bg-[#0c1a2e] text-slate-300 border-t border-slate-800/80 mt-4 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={livrikoLogo}
              alt="Livriko"
              className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-black text-white leading-none">
                Livr<span className="text-[#ff8a1f]">iko</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                © {new Date().getFullYear()} · Lokossa · Espèces à la livraison
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px]">
            <a
              href="tel:+2290196730353"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition"
            >
              <Phone className="w-3 h-3 text-[#ff8a1f]" />
              +229 01 96 73 03 53
            </a>
            <a
              href="https://wa.me/2290196730353?text=Bonjour%20Livriko"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition"
            >
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              WhatsApp
            </a>
            {!showSubscribe && !isSubscribed ? (
              <button
                type="button"
                onClick={() => setShowSubscribe(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#ff8a1f]/15 hover:bg-[#ff8a1f]/25 text-[#ffb86a] font-bold transition"
              >
                <Send className="w-3 h-3" />
                Promos
              </button>
            ) : isSubscribed ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle className="w-3 h-3" /> Inscrit
              </span>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center gap-1">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="WhatsApp / email"
                  className="w-36 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-[#ff8a1f]"
                  required
                />
                <button type="submit" className="px-2.5 py-1.5 rounded-lg bg-[#ff8a1f] text-white font-bold text-[11px]">
                  OK
                </button>
              </form>
            )}
            {subscriptionError && <span className="text-rose-400 text-[10px]">{subscriptionError}</span>}
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-500">
              <Heart className="w-2.5 h-2.5 text-[#ff8a1f] fill-[#ff8a1f]" /> Bénin
            </span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#ff8a1f] transition"
              aria-label="Remonter"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
