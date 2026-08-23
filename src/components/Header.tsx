import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Icon } from '@iconify/react';
import { 
  ShoppingBag, ShoppingCart, Truck, ShieldCheck, User, Bell, Search, ChevronDown, CheckCircle2, Store as StoreIcon, LogOut, ArrowLeft, Menu, X, MapPin, Phone, MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, CategoryType } from '../types';
import { CATEGORIES } from '../data/mockData';
import livrikoLogo from '../assets/images/livriko_logo_1785408725718.jpg';

export const Header: React.FC<{ 
  onOpenCart: () => void; 
  onOpenNotifications: () => void;
  onOpenChat: () => void;
  onOpenUserProfile: (tab?: 'profil' | 'commandes' | 'adresses' | 'parametres') => void;
  onOpenAuth: (mode?: 'register' | 'login') => void;
  onTriggerScooterLoader?: () => void;
  isUserProfileOpen?: boolean;
}> = ({
  onOpenCart,
  onOpenNotifications,
  onOpenChat,
  onOpenUserProfile,
  onOpenAuth,
  onTriggerScooterLoader
  ,isUserProfileOpen
}) => {
  const { 
    activeRole, 
    setActiveRole, 
    cart, 
    notifications, 
    activeCategory, 
    setActiveCategory, 
    searchQuery, 
    setSearchQuery,
    currentUser,
    isLoggedIn,
    logoutUser,
    setIsAuthModalOpen,
    activeTrackingOrder,
  } = useApp();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileDropdownOpenUp, setIsProfileDropdownOpenUp] = useState(false);
  const profileWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown when the global profile modal opens
  React.useEffect(() => {
    if (isUserProfileOpen) setIsProfileDropdownOpen(false);
  }, [isUserProfileOpen]);

  // Compute whether to open dropdown upwards when there's not enough space below
  const computeDropdownDirection = () => {
    const el = profileWrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownMax = Math.max(200, window.innerHeight - 80);
    if (spaceBelow < Math.min(260, dropdownMax) && spaceAbove > spaceBelow) {
      setIsProfileDropdownOpenUp(true);
    } else {
      setIsProfileDropdownOpenUp(false);
    }
  };

  useLayoutEffect(() => {
    if (!isProfileDropdownOpen) return;
    computeDropdownDirection();
    const onResize = () => computeDropdownDirection();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [isProfileDropdownOpen]);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isUserConnected = Boolean(currentUser?.id);
  const currentUserLabel = currentUser?.name || currentUser?.email || 'Mon compte';
  const currentUserStatus = currentUser ? {
    client: 'Client',
    restaurant: 'Restaurant',
    vendeur: 'Restaurant',
    livreur: 'Livreur',
    admin: 'Administrateur',
  }[currentUser.role] : '';
  const hasActiveChatOrder = Boolean(activeTrackingOrder && ['rider_assigned', 'picked_up', 'delivering'].includes(activeTrackingOrder.status));

  const roleLabels: Record<UserRole, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
    client: { 
      label: 'Client (Acheteur)', 
      icon: <ShoppingCart className="w-4 h-4 text-blue-600" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      desc: 'Commander & Suivre la livraison'
    },
    restaurant: {
      label: 'Restaurant',
      icon: <StoreIcon className="w-4 h-4 text-orange-500" />,
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      desc: 'Gérer produits & Demander un livreur'
    },
    vendeur: { 
      label: 'Restaurant', 
      icon: <StoreIcon className="w-4 h-4 text-orange-500" />,
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      desc: 'Gérer produits & Demander un livreur'
    },
    livreur: { 
      label: 'Livreur', 
      icon: <Truck className="w-4 h-4 text-emerald-600" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: 'Accepter & Livrer les commandes'
    },
    admin: { 
      label: 'Administrateur', 
      icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'Superviser les ventes & commissions'
    },
  };

  const navMenuItems = [
    { 
      id: 'accueil', 
      label: 'Accueil', 
      action: () => {
        if (activeRole !== 'client') setActiveRole('client');
        setActiveCategory('all'); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
      } 
    },
    { 
      id: 'boutiques', 
      label: 'Boutiques', 
      action: () => {
        if (activeRole !== 'client') setActiveRole('client');
        setTimeout(() => {
          setActiveCategory('all'); 
          const el = document.getElementById('entreprises-section'); 
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } 
    },
    { 
      id: 'categories', 
      label: 'Catégories', 
      action: () => {
        if (activeRole !== 'client') setActiveRole('client');
        setTimeout(() => {
          setActiveCategory('all'); 
          const el = document.getElementById('categories-section'); 
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } 
    },
    { 
      id: 'apropos', 
      label: 'À propos', 
      action: () => { 
        const el = document.getElementById('footer-about'); 
        if (el) el.scrollIntoView({ behavior: 'smooth' }); 
      } 
    },
    { 
      id: 'contact', 
      label: 'Contact', 
      action: () => { 
        const el = document.getElementById('footer-contact'); 
        if (el) el.scrollIntoView({ behavior: 'smooth' }); 
      } 
    },
  ];

  const menuNavItems: { id: CategoryType | 'all'; label: string }[] = [
    { id: 'all', label: 'Tout le marché' },
    { id: 'restaurants', label: 'Restaurants' },
    { id: 'boutiques', label: 'Boutiques' },
    { id: 'supermarches', label: 'Supermarchés' },
    { id: 'autres', label: 'Services Express' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-1000 w-full bg-slate-950 text-white transition-all duration-300 ${
      isScrolled 
        ? 'border-b border-slate-800 shadow-2xl py-0' 
        : 'border-b border-slate-800/80'
    }`}>
      {/* Top Utility Strip (Matches screenshot top bar) */}
      <div className="bg-slate-900 text-slate-300 text-xs px-3 sm:px-8 py-1.5 sm:py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 font-medium truncate">
          <Icon icon="mdi:map-marker" aria-hidden="true" className="text-orange-400 shrink-0" width="16" height="16" />
          <span className="truncate text-[11px] sm:text-xs">Livraison express à Lokossa dès 300 FCFA (Tarif au km)</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-xs shrink-0">
          {onTriggerScooterLoader && (
            <button
              onClick={onTriggerScooterLoader}
              className="hover:text-amber-300 text-amber-400 font-semibold transition text-[10px] sm:text-[11px] flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-full border border-slate-700 cursor-pointer"
              title="Revoir l'animation Scooter"
            >
              <Truck className="w-3 h-3 text-orange-400 animate-pulse" />
              <span>Scooter</span>
            </button>
          )}

          <span className="text-[10px] sm:text-xs">Support 7j/7 : <strong className="text-white font-mono">+229 01 96 73 03 53</strong></span>
          
          {/* Social Icons */}
          <div className="hidden md:flex items-center gap-2.5 text-slate-400 pl-2 border-l border-slate-700">
            <a href="#" className="hover:text-white transition font-bold text-xs">f</a>
            <a href="#" className="hover:text-white transition text-xs">📷</a>
            <a href="https://wa.me/2290196730353" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition text-xs">💬</a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-8 py-2 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Brand Logo (Matching screenshot style) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div 
            className="relative flex items-center gap-1 sm:gap-2 cursor-pointer group" 
            onClick={() => {
              setActiveCategory('all');
              if (onTriggerScooterLoader) onTriggerScooterLoader();
            }}
            title="Retour à l'accueil Livriko"
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-md group-hover:scale-105 transition shrink-0">
              <img 
                src={livrikoLogo} 
                alt="Livriko Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-lg sm:text-2xl font-black tracking-tight text-white">Livri</span>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-orange-500">ko</span>
            </div>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-bold uppercase tracking-wider">
          {navMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.action();
                if (onTriggerScooterLoader) onTriggerScooterLoader();
              }}
              className="text-slate-300 hover:text-orange-400 transition-colors py-1 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Action Icons (Cart + Auth State) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Quick Return to Client Market button when in Vendeur/Livreur/Admin roles */}
          {activeRole !== 'client' && (
            <button
              onClick={() => {
                setActiveRole('client');
                if (onTriggerScooterLoader) onTriggerScooterLoader();
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition cursor-pointer shrink-0"
              title="Retourner à la page d'accueil (Espace Client)"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Marché</span>
              <span className="sm:hidden text-[10px]">Marché</span>
            </button>
          )}

          {isUserConnected && currentUser && (
            <div className="flex flex-col items-start gap-0.5 px-3 py-2 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-200">
              <span className="font-black text-white text-sm sm:text-base truncate max-w-35">
                {currentUserLabel}
              </span>
              <span className="uppercase text-[10px] sm:text-[11px] text-slate-400">
                Statut : {currentUserStatus}
              </span>
            </div>
          )}

          {/* Shopping Cart Trigger */}
          {activeRole === 'client' && (
            <button
              onClick={onOpenCart}
              className="relative p-1.5 sm:p-2 text-slate-200 hover:text-white transition cursor-pointer"
              title="Mon Panier"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-500 text-white font-black text-[10px] sm:text-[11px] flex items-center justify-center border-2 border-slate-950">
                {cartItemsCount}
              </span>
            </button>
          )}

          {hasActiveChatOrder && activeTrackingOrder && (
            <button
              onClick={onOpenChat}
              className="relative p-1.5 sm:p-2 text-slate-200 hover:text-white transition cursor-pointer"
              title={`Ouvrir la conversation de ${activeTrackingOrder.storeName}`}
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 sm:p-2 text-slate-200 hover:text-white transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Auth actions are only on the welcome page; header stays for connected users only */}
          {!isUserConnected ? (
            <div className="hidden" aria-hidden="true" />
          ) : (
            <div className="relative" ref={profileWrapperRef}>
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
                title={`Compte Utilisateur : ${currentUserLabel}`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center border-2 border-orange-400 overflow-hidden shrink-0">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUserLabel} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                {/* User First Name / Username */}
                <div className="text-left flex items-center gap-1">
                  <span className="text-slate-400 text-xs">👤</span>
                  <span className="font-black text-white text-xs sm:text-sm truncate max-w-30 sm:max-w-40">
                    {currentUserLabel}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180 text-orange-400' : ''}`} />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className={`${isProfileDropdownOpenUp ? 'absolute right-2 sm:right-0 bottom-full mb-2' : 'absolute right-2 sm:right-0 top-full mt-2'} w-[min(320px,90vw)] max-w-[320px] md:w-72 lg:w-80 max-h-[calc(100vh-80px)] overflow-y-auto bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl z-50 p-2.5 space-y-1 animate-in fade-in zoom-in-95 whitespace-normal`}>
                  {/* User Header Info */}
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="font-black text-xs text-white wrap-break-word">{currentUserLabel}</div>
                    <div className="text-[10px] text-slate-400 wrap-break-word">{currentUser.email}</div>
                  </div>

                  {/* Dropdown Items */}
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onOpenUserProfile('profil');
                    }}
                    className="w-full min-h-11 px-3 py-3 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-bold transition text-left flex items-center gap-2 cursor-pointer"
                  >
                    <span>👤</span>
                    <span>Mon profil</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setActiveRole(currentUser.role || 'client');
                      if (onTriggerScooterLoader) onTriggerScooterLoader();
                    }}
                    className="w-full min-h-11 px-3 py-3 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-bold transition text-left flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <span>📊</span>
                      <span>Tableau de bord ({currentUser.role.toUpperCase()})</span>
                    </div>
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">Accéder</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onOpenUserProfile('parametres');
                    }}
                    className="w-full min-h-11 px-3 py-3 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-bold transition text-left flex items-center gap-2 cursor-pointer"
                  >
                    <span>⚙️</span>
                    <span>Paramètres</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onOpenNotifications();
                    }}
                    className="w-full min-h-11 px-3 py-3 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-bold transition text-left flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <span>🔔</span>
                      <span>Notifications</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  </button>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        logoutUser();
                      }}
                      className="w-full min-h-11 px-3 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Menu principal"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900/98 border-t border-b border-slate-800 text-white p-4 space-y-4 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-orange-400 tracking-wider mb-2">Navigation Principale</p>
            {navMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.action();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 px-3.5 rounded-xl hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-between transition cursor-pointer"
              >
                <span>{item.label}</span>
                <span className="text-slate-500 text-[10px]">→</span>
              </button>
            ))}
          </div>

          {/* Categories Shortcut */}
          <div className="pt-3 border-t border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Catégories Rapides</p>
            <div className="grid grid-cols-2 gap-1.5">
              {menuNavItems.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setIsMobileMenuOpen(false);
                    const el = document.getElementById('entreprises-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-2 rounded-xl text-left text-xs font-bold transition cursor-pointer ${
                    activeCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Account buttons on Mobile only for connected users */}
          {!isUserConnected ? (
            <div className="hidden" aria-hidden="true" />
          ) : (
            <div className="pt-3 border-t border-slate-800 space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Mon Compte ({currentUserLabel})</p>
              <button
                onClick={() => {
                  onOpenUserProfile('profil');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-xl hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>👤 Mon Profil</span>
              </button>
              <button
                onClick={() => {
                  onOpenUserProfile('commandes');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-xl hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>🛍️ Mes Commandes</span>
              </button>
              <button
                onClick={() => {
                  onOpenUserProfile('adresses');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-xl hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>📍 Mes Adresses</span>
              </button>
              <button
                onClick={() => {
                  onOpenUserProfile('parametres');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-xl hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>⚙️ Paramètres</span>
              </button>
              <button
                onClick={() => {
                  logoutUser();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-xl hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-2 cursor-pointer mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Horizontal Scrollable Category Bar for Tablets and Mobile Phones */}
      {activeRole === 'client' && (
        <div className="lg:hidden w-full bg-slate-900/95 border-t border-slate-800/80 px-3 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
          {menuNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveCategory(item.id);
                if (onTriggerScooterLoader) onTriggerScooterLoader();
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                activeCategory === item.id 
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' 
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

