import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { MessageCircle } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ClientView } from './components/client/ClientView';
import { VendeurView } from './components/vendeur/VendeurView';
import { LivreurView } from './components/livreur/LivreurView';
import { AdminView } from './components/admin/AdminView';
import { PageScooterLoader } from './components/PageScooterLoader';
import { AuthModal } from './components/AuthModal';
import WelcomePage from './components/WelcomePage';
import { readPersistedSession, readPersistedUserSnapshot } from './utils/authFallback';

const CartDrawer = lazy(() => import('./components/client/CartDrawer').then(module => ({ default: module.CartDrawer })));
const OrderTrackingModal = lazy(() => import('./components/client/OrderTrackingModal').then(module => ({ default: module.OrderTrackingModal })));
const NotificationModal = lazy(() => import('./components/NotificationModal').then(module => ({ default: module.NotificationModal })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(module => ({ default: module.UserProfileModal })));
const ChatWidget = lazy(() => import('./components/ChatWidget').then(module => ({ default: module.ChatWidget })));
const ReviewModal = lazy(() => import('./components/client/ReviewModal').then(module => ({ default: module.default })));

function GlobalAuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    authModalRole,
    closeAuthModal,
  } = useApp();

  return (
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      initialMode={authModalMode}
      initialRole={authModalRole}
    />
  );
}

function MainAppContent() {
  const { 
    activeRole, 
    activeTrackingOrder, 
    setActiveTrackingOrder, 
    currentUser,
    reviewModalOrderId,
    setReviewModalOrderId,
    openAuthModal,
  } = useApp();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatAutoOpenedRef = useRef<string | null>(null);
  const [showScooterLoader, setShowScooterLoader] = useState(() => {
    try {
      return !sessionStorage.getItem('livriko_loader_shown');
    } catch {
      return false;
    }
  });

  // User Profile Modal state
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [userProfileTab, setUserProfileTab] = useState<'profil' | 'commandes' | 'adresses' | 'parametres'>('profil');

  // Trigger brief loader when switching roles to make app feel dynamic
  useEffect(() => {
    const timer = setTimeout(() => {
      // smooth view mount
    }, 100);
    return () => clearTimeout(timer);
  }, [activeRole]);

  useEffect(() => {
    const status = activeTrackingOrder?.status;
    const orderId = activeTrackingOrder?.id;
    if (
      orderId
      && status
      && ['pending', 'confirmed', 'rider_requested', 'rider_assigned', 'picked_up', 'delivering'].includes(status)
      && chatAutoOpenedRef.current !== orderId
    ) {
      chatAutoOpenedRef.current = orderId;
      setIsChatOpen(true);
    }
    if (status === 'delivered' && isChatOpen) {
      setIsChatOpen(false);
    }
  }, [activeTrackingOrder?.status, activeTrackingOrder?.id, isChatOpen]);

  const isAdminDashboard = activeRole === 'admin' && currentUser?.role === 'admin';
  const isMerchantDashboard = (activeRole === 'vendeur' || activeRole === 'restaurant')
    && (currentUser?.role === 'vendeur' || currentUser?.role === 'restaurant');
  const isFullScreenDashboard = isAdminDashboard || isMerchantDashboard;
  const isClientSpace = activeRole === 'client';

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white ${isFullScreenDashboard ? 'lg:h-screen lg:max-h-screen lg:overflow-hidden' : ''}`}>
      {/* Scooter Page Loading Animation */}
      {showScooterLoader && (
        <PageScooterLoader 
          onComplete={() => {
            try {
              sessionStorage.setItem('livriko_loader_shown', '1');
            } catch {
              // ignore storage errors
            }
            setShowScooterLoader(false);
          }}
          duration={2000}
        />
      )}

      {/* Header — masqué en espace admin / boutique (navigation via sidebar) */}
      {!isFullScreenDashboard && (
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
            openAuthModal(mode);
          }}
          onTriggerScooterLoader={() => {
            setShowScooterLoader(true);
          }}
        />
      )}

      {/* Primary Role Views */}
      <main className={`flex-1 w-full ${
        isFullScreenDashboard
          ? 'lg:h-screen lg:max-h-screen lg:overflow-hidden'
          : isClientSpace
            ? 'pt-[5.75rem] md:pt-16'
            : 'pt-14 sm:pt-16'
      }`}>
        {activeRole === 'client' && <ClientView onOpenCart={() => setIsCartOpen(true)} onOpenChat={() => setIsChatOpen(true)} />}

        {isAdminDashboard && (
          <AdminView
            onOpenUserProfile={(tab = 'profil') => {
              setUserProfileTab(tab);
              setIsUserProfileOpen(true);
            }}
          />
        )}

        {isMerchantDashboard && <VendeurView onOpenChat={() => setIsChatOpen(true)} />}

        <div className={`w-full px-3 sm:px-6 py-4 sm:py-6 ${isFullScreenDashboard ? 'hidden' : 'max-w-7xl mx-auto'}`}>
          {activeRole === 'livreur' && <LivreurView onOpenChat={() => setIsChatOpen(true)} />}
          {activeRole === 'admin' && currentUser?.role !== 'admin' && (
            <div className="p-6 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm text-slate-700 text-sm font-bold">
              Accès réservé au Super Administrateur. Veuillez vous connecter avec un compte admin valide.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {!isFullScreenDashboard && <Footer />}

      {/* Global Modals & Drawers */}
      <Suspense fallback={null}>
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </Suspense>

      {activeTrackingOrder && activeRole === 'client' && (
        <Suspense fallback={null}>
          <OrderTrackingModal 
            order={activeTrackingOrder} 
            onClose={() => setActiveTrackingOrder(null)} 
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      </Suspense>

      <Suspense fallback={null}>
        <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </Suspense>

      {activeTrackingOrder && ['pending', 'confirmed', 'rider_requested', 'rider_assigned', 'picked_up', 'delivering'].includes(activeTrackingOrder.status) && !isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-1150 flex items-center gap-2 rounded-full bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-orange-500/30 hover:bg-orange-600 transition"
          title={`Ouvrir la conversation pour ${activeTrackingOrder.storeName}`}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-orange-500">
            <MessageCircle className="w-5 h-5" />
          </span>
          {`Discussion ${activeTrackingOrder.storeName}`}
        </button>
      )}

      <Suspense fallback={null}>
        <UserProfileModal
          isOpen={isUserProfileOpen}
          onClose={() => setIsUserProfileOpen(false)}
          initialTab={userProfileTab}
        />
      </Suspense>

      {reviewModalOrderId && (
        <Suspense fallback={null}>
          <ReviewModal orderId={reviewModalOrderId} isOpen={true} onClose={() => setReviewModalOrderId(null)} />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppWithAuthModal />
    </AppProvider>
  );
}

function AppWithAuthModal() {
  return (
    <>
      <AppRoot />
      <GlobalAuthModal />
    </>
  );
}

function AppRoot() {
  const { authReady, isLoggedIn, currentUserId, currentUser, storesReady, openAuthModal } = useApp();
  const [guestBrowse, setGuestBrowse] = useState(false);

  const hasValidSession = isLoggedIn || Boolean(currentUserId) || Boolean(currentUser);
  const persisted = readPersistedSession();
  const snapshot = readPersistedUserSnapshot();
  const hasPersistedSession = persisted.isLoggedIn;
  const merchantRole = currentUser?.role || snapshot?.role;
  const isMerchantRole = merchantRole === 'vendeur' || merchantRole === 'restaurant';

  // Never paint the merchant dashboard until auth is ready; for merchants also wait for store lookup
  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  if (hasValidSession && isMerchantRole && !storesReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Vérification de votre boutique...</p>
        </div>
      </div>
    );
  }

  if (!hasValidSession && !guestBrowse) {
    return (
      <WelcomePage
        onSeen={() => {
          // keep the welcome flow as the landing for unauthenticated visitors.
        }}
        onBrowseMarket={() => setGuestBrowse(true)}
        onOpenAuth={(mode, role) => {
          openAuthModal(mode, role === 'livreur' || role === 'vendeur' ? role : 'client');
        }}
      />
    );
  }

  return <MainAppContent />;
}
