import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ClientView } from './components/client/ClientView';
import { VendeurView } from './components/vendeur/VendeurView';
import { LivreurView } from './components/livreur/LivreurView';
import { AdminView } from './components/admin/AdminView';
import { CartDrawer } from './components/client/CartDrawer';
import { OrderTrackingModal } from './components/client/OrderTrackingModal';
import { NotificationModal } from './components/NotificationModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ChatWidget } from './components/ChatWidget';
import { PageScooterLoader } from './components/PageScooterLoader';

function MainAppContent() {
  const { 
    activeRole, 
    activeTrackingOrder, 
    setActiveTrackingOrder, 
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
  } = useApp();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showScooterLoader, setShowScooterLoader] = useState(true);

  // User Profile Modal state
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfileTab, setUserProfileTab] = useState<'profil' | 'commandes' | 'adresses' | 'parametres'>('profil');
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('login');

  // Trigger brief loader when switching roles to make app feel dynamic
  useEffect(() => {
    const timer = setTimeout(() => {
      // smooth view mount
    }, 100);
    return () => clearTimeout(timer);
  }, [activeRole]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Scooter Page Loading Animation */}
      {showScooterLoader && (
        <PageScooterLoader 
          onComplete={() => setShowScooterLoader(false)}
          duration={2000}
        />
      )}

      {/* Header */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenUserProfile={(tab = 'profil') => {
          setUserProfileTab(tab);
          setIsUserProfileOpen(true);
        }}
        isUserProfileOpen={isUserProfileOpen}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAuth={(mode = 'login') => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onTriggerScooterLoader={() => setShowScooterLoader(true)}
      />

      {/* Primary Role Views */}
      <main className="flex-1 w-full pt-20 sm:pt-24">
        {activeRole === 'client' && <ClientView onOpenCart={() => setIsCartOpen(true)} />}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          {activeRole === 'vendeur' && <VendeurView />}
          {activeRole === 'livreur' && <LivreurView />}
          {activeRole === 'admin' && currentUser?.role === 'admin' && <AdminView />}
          {activeRole === 'admin' && currentUser?.role !== 'admin' && (
            <div className="p-10 bg-white rounded-3xl border border-slate-200 shadow-sm text-slate-700 text-sm font-bold">
              Accès réservé au Super Administrateur. Veuillez vous connecter avec un compte admin valide.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {activeTrackingOrder && (
        <OrderTrackingModal 
          order={activeTrackingOrder} 
          onClose={() => setActiveTrackingOrder(null)} 
        />
      )}

      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />

      <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-[1150] flex items-center gap-2 rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-orange-500/30 hover:bg-orange-600 transition"
          title="Ouvrir le chat Livriko"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-orange-500">
            <Bot className="w-5 h-5" />
          </span>
          Chat assistant
        </button>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authModalMode}
      />

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        initialTab={userProfileTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
