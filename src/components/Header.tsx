import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, User, Bell, LogOut, ArrowLeft, MessageCircle, Search, X,
  Utensils, ShoppingBag, Package, LayoutGrid,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryType } from '../types';
import livrikoLogo from '../assets/images/livriko_logo_1785408725718.jpg';

export const Header: React.FC<{
  onOpenCart: () => void;
  onOpenNotifications: () => void;
  onOpenChat: () => void;
  onOpenUserProfile: (tab?: 'profil' | 'commandes' | 'adresses' | 'parametres') => void;
  onOpenAuth: (mode?: 'register' | 'login') => void;
  onTriggerScooterLoader?: () => void;
  onExitToWelcome?: () => void;
  isUserProfileOpen?: boolean;
}> = ({
  onOpenCart,
  onOpenNotifications,
  onOpenChat,
  onOpenUserProfile,
  onOpenAuth,
  onTriggerScooterLoader,
  onExitToWelcome,
}) => {
  const {
    activeRole,
    setActiveRole,
    cart,
    activeCategory,
    setActiveCategory,
    currentUser,
    logoutUser,
    activeTrackingOrder,
    setActiveTrackingOrder,
    orders,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isUserConnected = Boolean(currentUser?.id);
  const currentUserLabel = currentUser?.name || currentUser?.email || 'Mon compte';
  const sameId = (a?: string | null, b?: string | null) =>
    String(a || '').replace(/^(usr-|ord-)/, '') === String(b || '').replace(/^(usr-|ord-)/, '');
  const myClientOrders = orders.filter((order) =>
    sameId(order.clientId, currentUser?.id) || (currentUser?.phone && order.clientPhone === currentUser.phone),
  );
  const activeClientOrders = myClientOrders.filter((order) =>
    !['delivered', 'cancelled'].includes(order.status),
  );
  const hasActiveChatOrder = Boolean(
    (activeTrackingOrder && ['pending', 'confirmed', 'rider_requested', 'rider_assigned', 'picked_up', 'delivering'].includes(activeTrackingOrder.status))
    || orders.some((order) => ['pending', 'confirmed', 'rider_requested', 'rider_assigned', 'picked_up', 'delivering'].includes(order.status)),
  );

  const menuNavItems: { id: CategoryType | 'all'; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'Tout', icon: LayoutGrid },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'boutiques', label: 'Boutiques', icon: ShoppingBag },
    { id: 'supermarches', label: 'Supermarchés', icon: ShoppingCart },
    { id: 'autres', label: 'Express', icon: Package },
  ];

  const goHome = () => {
    setActiveCategory('all');
    setSearchQuery('');
    window.dispatchEvent(new CustomEvent('livriko:reset-browse'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectCategory = (id: CategoryType | 'all') => {
    setActiveCategory(id);
    if (id !== 'autres') {
      document.getElementById('boutiques-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isClient = activeRole === 'client';
  const isLockedLivreur = currentUser?.role === 'livreur'
    && currentUser.verificationStatus !== 'approved'
    && !(Boolean(currentUser.isCertified)
      && currentUser.verificationStatus !== 'pending'
      && currentUser.verificationStatus !== 'rejected'
      && currentUser.verificationStatus !== 'incomplete');

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-1000 w-full bg-[#0c1a2e] text-white transition-shadow duration-300 select-none ${
        isScrolled ? 'shadow-lg border-b border-slate-800' : 'border-b border-slate-800/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center gap-2 sm:gap-4">

        <button
          type="button"
          onClick={onExitToWelcome || goHome}
          className="flex items-center gap-2 shrink-0 cursor-pointer group"
          title={onExitToWelcome ? 'Retour à l’accueil' : 'Accueil Livriko'}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
            <img src={livrikoLogo} alt="Livriko" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <span className="text-base sm:text-lg font-black tracking-tight">
              Livr<span className="text-[#ff8a1f]">iko</span>
            </span>
            <span className="hidden lg:block text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Lokossa
            </span>
          </div>
        </button>

        {isClient && (
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 min-w-0">
            {menuNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectCategory(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    active
                      ? 'bg-[#ff8a1f] text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {isClient && (
          <div className="flex-1 min-w-0 max-w-[9.5rem] sm:max-w-xs lg:max-w-[11rem] xl:max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full h-9 sm:h-10 pl-9 pr-9 rounded-full bg-white/10 border border-white/10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff8a1f]/60 focus:bg-white/15 transition select-text"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title="Effacer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {!isClient && <div className="flex-1" />}

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {onExitToWelcome && isClient && (
            <button
              type="button"
              onClick={onExitToWelcome}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
              title="Retour à l’accueil"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Accueil</span>
            </button>
          )}

          {!isClient && !isLockedLivreur && (
            <button
              type="button"
              onClick={() => {
                setActiveRole('client');
                if (onTriggerScooterLoader) onTriggerScooterLoader();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#ff8a1f] hover:bg-[#e86f00] text-white font-bold text-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Marché</span>
            </button>
          )}

          {isClient && isUserConnected && (activeClientOrders.length > 0 || myClientOrders.length > 0) && (
            <button
              type="button"
              onClick={() => {
                if (activeClientOrders.length > 0) {
                  setActiveTrackingOrder(activeClientOrders[0]);
                  return;
                }
                onOpenUserProfile('commandes');
              }}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#ff8a1f] hover:bg-[#e86f00] text-white font-bold text-[11px] sm:text-xs transition max-w-[9.5rem] sm:max-w-none"
              title={activeClientOrders.length > 0 ? 'Suivre ma commande' : 'Histor historique de commandes'}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {activeClientOrders.length > 0
                  ? (activeClientOrders.length === 1 ? 'Suivre ma commande' : 'Mes commandes en cours')
                  : 'Mes commandes'}
              </span>
              {activeClientOrders.length > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-white text-[#e86f00] font-black text-[10px] flex items-center justify-center">
                  {activeClientOrders.length}
                </span>
              )}
            </button>
          )}

          {isClient && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 rounded-lg text-slate-200 hover:bg-white/10 hover:text-white transition"
              title="Panier"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#ff8a1f] text-white font-black text-[10px] flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>
          )}

          {hasActiveChatOrder && activeTrackingOrder && (
            <button
              type="button"
              onClick={onOpenChat}
              className="relative p-2 rounded-lg text-slate-200 hover:bg-white/10 hover:text-white transition"
              title="Chat"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          )}

          {isUserConnected && currentUser ? (
            <>
              <button
                type="button"
                onClick={onOpenNotifications}
                className="p-2 rounded-lg text-slate-200 hover:bg-white/10 hover:text-white transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => onOpenUserProfile('profil')}
                className="flex items-center gap-2 pl-1 pr-2 sm:pr-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition max-w-[160px] sm:max-w-[200px]"
                title="Profil, localisation et mot de passe"
              >
                <div className="w-7 h-7 rounded-full bg-[#ff8a1f] text-white font-black text-xs flex items-center justify-center overflow-hidden shrink-0">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="hidden sm:block font-bold text-white text-xs truncate">
                  {(currentUser.name || 'Compte').split(' ')[0]}
                </span>
              </button>

              <button
                type="button"
                onClick={logoutUser}
                className="p-2 rounded-lg text-rose-300 hover:bg-rose-500/15 transition"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="h-9 px-3 sm:px-4 rounded-full text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="h-9 px-3 sm:px-4 rounded-full bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-xs font-semibold transition"
              >
                S&apos;inscrire
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
