import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Truck, User, Bell, LogOut, ArrowLeft, MessageCircle,
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
  isUserProfileOpen?: boolean;
}> = ({
  onOpenCart,
  onOpenNotifications,
  onOpenChat,
  onOpenUserProfile,
  onOpenAuth,
  onTriggerScooterLoader,
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
    orders,
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectCategory = (id: CategoryType | 'all') => {
    setActiveCategory(id);
    if (id !== 'autres') {
      document.getElementById('boutiques-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isClient = activeRole === 'client';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-1000 w-full bg-[#0c1a2e] text-white transition-shadow duration-300 ${
        isScrolled ? 'shadow-lg border-b border-slate-800' : 'border-b border-slate-800/60'
      }`}
    >
      {/* Single main bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center gap-2 sm:gap-4">

        {/* Brand */}
        <button
          type="button"
          onClick={goHome}
          className="flex items-center gap-2 shrink-0 cursor-pointer group"
          title="Accueil Livriko"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm group-hover:scale-105 transition">
            <img src={livrikoLogo} alt="Livriko" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div className="hidden xs:block sm:block text-left leading-tight">
            <span className="text-base sm:text-lg font-black tracking-tight">
              Livr<span className="text-[#ff8a1f]">iko</span>
            </span>
            <span className="hidden lg:block text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Lokossa
            </span>
          </div>
        </button>

        {/* Desktop category nav — client only */}
        {isClient && (
          <nav className="hidden md:flex flex-1 items-center justify-center gap-1 min-w-0">
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

        {!isClient && <div className="flex-1" />}

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto md:ml-0">
          {!isClient && (
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
                title={currentUserLabel}
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
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/10 transition"
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-xs font-bold transition"
              >
                S&apos;inscrire
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile category strip — client only */}
      {isClient && (
        <div className="md:hidden border-t border-slate-800/80 bg-[#0a1526] px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {menuNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeCategory === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectCategory(item.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition ${
                  active
                    ? 'bg-[#ff8a1f] text-white'
                    : 'bg-white/5 text-slate-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
          <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[10px] text-slate-500 px-1">
            <Truck className="w-3 h-3 text-[#ff8a1f]" />
            dès 300 F
          </span>
        </div>
      )}
    </header>
  );
};
