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

const CartDrawer = lazy(() => import('./components/client/CartDrawer').then(module => ({ default: module.CartDrawer })));
const OrderTrackingModal = lazy(() => import('./components/client/OrderTrackingModal').then(module => ({ default: module.OrderTrackingModal })));
const NotificationModal = lazy(() => import('./components/NotificationModal').then(module => ({ default: module.NotificationModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(module => ({ default: module.AuthModal })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(module => ({ default: module.UserProfileModal })));
const ChatWidget = lazy(() => import('./components/ChatWidget').then(module => ({ default: module.ChatWidget })));
import WelcomePage from './components/WelcomePage';
import { readPersistedSession } from './utils/authFallback';
const ReviewModal = lazy(() => import('./components/client/ReviewModal').then(module => ({ default: module.default })));

function MainAppContent() {
  const { 
    activeRole, 
    activeTrackingOrder, 
    setActiveTrackingOrder, 
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    reviewModalOrderId,
    setReviewModalOrderId,
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
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('login');

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
    if (status === 'rider_assigned' && orderId && chatAutoOpenedRef.current !== orderId) {
      chatAutoOpenedRef.current = orderId;
      setIsChatOpen(true);
    }
    if (status === 'delivered' && isChatOpen) {
      setIsChatOpen(false);
    }
  }, [activeTrackingOrder?.status, activeTrackingOrder?.id, isChatOpen]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 selection:bg-blue-600 selection:text-white">
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
        onTriggerScooterLoader={() => {
          setShowScooterLoader(true);
        }}
      />

      {/* Primary Role Views */}
      <main className="flex-1 w-full pt-20 sm:pt-24">
        {activeRole === 'client' && <ClientView onOpenCart={() => setIsCartOpen(true)} onOpenChat={() => setIsChatOpen(true)} />}
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          {activeRole === 'vendeur' && <VendeurView />}
          {activeRole === 'livreur' && <LivreurView />}
          {activeRole === 'admin' && currentUser?.role === 'admin' && <AdminView />}
          {activeRole === 'admin' && currentUser?.role !== 'admin' && (
            <div className="p-6 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm text-slate-700 text-sm font-bold">
              Accès réservé au Super Administrateur. Veuillez vous connecter avec un compte admin valide.
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <Suspense fallback={null}>
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </Suspense>

      {activeTrackingOrder && (
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

      {activeTrackingOrder && ['rider_assigned', 'picked_up', 'delivering'].includes(activeTrackingOrder.status) && !isChatOpen && (
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
      <AppRoot />
    </AppProvider>
  );
}

function AppRoot() {
  const { authReady, isLoggedIn, currentUserId, currentUser } = useApp();
  const [welcomeAuthMode, setWelcomeAuthMode] = React.useState<'register' | 'login'>('login');
  const [welcomeAuthOpen, setWelcomeAuthOpen] = React.useState(false);

  const hasValidSession = isLoggedIn || Boolean(currentUserId) || Boolean(currentUser);
  const hasPersistedSession = readPersistedSession().isLoggedIn;

  if (!authReady) {
    if (hasPersistedSession) {
      return <MainAppContent />;
    }

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Chargement de votre session...</p>
        </div>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <>
        <WelcomePage
          onSeen={() => {
            // keep the welcome flow as the required entry point for unauthenticated visitors.
          }}
          onOpenAuth={(mode) => {
            setWelcomeAuthMode(mode);
            setWelcomeAuthOpen(true);
          }}
        />
        <AuthModal
          isOpen={welcomeAuthOpen}
          onClose={() => setWelcomeAuthOpen(false)}
          initialMode={welcomeAuthMode}
        />
      </>
    );
  }

  return <MainAppContent />;
}
