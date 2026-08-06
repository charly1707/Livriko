import React, { useState } from 'react';
import { 
  Phone, Mail, Globe, MapPin, ShieldCheck, Clock, Truck, 
  Utensils, Pill, ShoppingCart, Store as StoreIcon, Package, Send, 
  CheckCircle, MessageCircle, Heart, ArrowUp, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryType } from '../types';
import livrikoLogo from '../assets/images/livriko_logo_1785408725718.jpg';

export const Footer: React.FC = () => {
  const { setActiveCategory, setIsAuthModalOpen } = useApp();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleServiceClick = (category: CategoryType) => {
    setActiveCategory(category);
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;
    setIsSubscribed(true);
    setTimeout(() => {
      setIsSubscribed(false);
      setEmailOrPhone('');
    }, 4000);
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 pt-14 pb-10 mt-12 relative w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Compact & Humanized Newsletter / Local Deals Bar */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 mb-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center md:text-left">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 hidden sm:flex">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center justify-center md:justify-start gap-2">
                  <span>Bons plans & promos à proximité</span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-semibold">Lokossa</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recevez nos meilleures offres gourmandes et infos utiles directement sur WhatsApp ou email à Lokossa.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="w-full md:w-auto shrink-0">
              {isSubscribed ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Merci ! Vous êtes bien inscrit.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-700">
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="WhatsApp ou email..."
                    className="w-full md:w-56 px-3 py-1.5 bg-transparent text-white placeholder:text-slate-500 text-xs focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition cursor-pointer shrink-0 shadow-xs"
                  >
                    M'inscrire
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Main Footer Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          
          {/* Brand Column */}
          <div id="footer-about" className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={livrikoLogo} 
                alt="Livriko Logo" 
                className="w-11 h-11 object-contain rounded-xl bg-white p-1 shadow-xs border border-slate-700"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-xl font-black text-white tracking-tight">Livriko</span>
                <span className="text-[10px] text-orange-400 font-bold block uppercase tracking-wider">Services & Livraison à Lokossa</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Votre plateforme locale de commande et livraison. Nous connectons les habitants de Lokossa avec leurs commerces de proximité.
            </p>

            {/* Direct WhatsApp Assistance */}
            <a 
              href="https://wa.me/2290196730353?text=Bonjour%20Livriko,%20j'ai%20une%20question"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Service Client WhatsApp</span>
            </a>
          </div>

          {/* Services & Rayons */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-orange-500 pl-3">
              Nos Services
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button 
                  onClick={() => handleServiceClick('restaurants')} 
                  className="hover:text-orange-400 transition flex items-center gap-2.5 w-full text-left cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-orange-400 transition">
                    <Utensils className="w-3.5 h-3.5" />
                  </div>
                  <span>Livraison Repas & Restaurants</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceClick('pharmacies')} 
                  className="hover:text-orange-400 transition flex items-center gap-2.5 w-full text-left cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-orange-400 transition">
                    <Pill className="w-3.5 h-3.5" />
                  </div>
                  <span>Pharmacies de Garde</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceClick('supermarches')} 
                  className="hover:text-orange-400 transition flex items-center gap-2.5 w-full text-left cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-orange-400 transition">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <span>Supermarchés & Épicerie</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceClick('boutiques')} 
                  className="hover:text-orange-400 transition flex items-center gap-2.5 w-full text-left cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-orange-400 transition">
                    <StoreIcon className="w-3.5 h-3.5" />
                  </div>
                  <span>Boutiques & High-Tech</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceClick('autres')} 
                  className="hover:text-orange-400 transition flex items-center gap-2.5 w-full text-left cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-orange-400 transition">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <span>Express Colis & Coursier</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Acteurs & Espaces */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-orange-500 pl-3">
              Rejoindre Livriko
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li>
                <button 
                  onClick={() => setIsAuthModalOpen(true)} 
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition w-full text-left cursor-pointer group flex items-center gap-3"
                >
                  <Truck className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-white text-xs">Devenir Livreur</span>
                    <span className="text-[10px] text-slate-400 block">Effectuez des courses et augmentez vos revenus.</span>
                  </div>
                </button>
              </li>

              <li>
                <button 
                  onClick={() => setIsAuthModalOpen(true)} 
                  className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition w-full text-left cursor-pointer group flex items-center gap-3"
                >
                  <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-white text-xs">Espace Vendeur</span>
                    <span className="text-[10px] text-slate-400 block">Inscrivez votre restaurant ou magasin.</span>
                  </div>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Infos */}
          <div id="footer-contact" className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-orange-500 pl-3">
              Contact & Support
            </h4>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3 text-xs">
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <a href="tel:+2290196730353" className="hover:text-orange-400 transition font-medium">+229 01 96 73 03 53</a>
              </div>

              <div className="flex items-center gap-3 text-slate-300 pt-2 border-t border-slate-700/60">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href="mailto:digizen14@gmail.com" className="hover:text-orange-400 transition font-medium truncate">digizen14@gmail.com</a>
              </div>

              <div className="flex items-center gap-3 text-slate-300 pt-2 border-t border-slate-700/60">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">Lokossa, Bénin</span>
              </div>

              <div className="flex items-center gap-3 text-slate-300 pt-2 border-t border-slate-700/60">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">Livraisons 7j/7 (07h - 23h)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Payment Methods and Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-[11px] font-medium text-slate-500 mr-2">Paiement à la livraison ou par Mobile Money :</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold text-[11px]">
              MTN MoMo
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold text-[11px]">
              Moov Money
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold text-[11px]">
              Espèces (Cash)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="text-orange-400 hover:text-orange-300 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>Remonter en haut</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-slate-800/60 text-center text-slate-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Livriko Bénin. Tous droits réservés.</p>
          <p className="flex items-center justify-center gap-1 text-slate-400">
            Fait avec <Heart className="w-3 h-3 text-orange-500 fill-orange-500 inline" /> pour le Bénin
          </p>
        </div>

      </div>
    </footer>
  );
};
