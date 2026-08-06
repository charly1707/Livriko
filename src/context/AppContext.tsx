import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  User, UserRole, Store, Product, Order, CartItem, NotificationItem, 
  CategoryType, OrderStatus, ChatMessage, ChatChannel 
} from '../types';
import { MOCK_USERS, MOCK_STORES, MOCK_PRODUCTS, INITIAL_ORDERS } from '../data/mockData';
import { calculateDeliveryFee, calculateRoadDistanceKm, calculateHaversineDistance } from '../utils/deliveryCalculator';

interface AppContextType {
  isLoggedIn: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole, force?: boolean) => void;
  currentUser: User | null;
  allUsers: User[];
  loginUser: (email: string, password?: string) => { success: boolean; error?: string; user?: User };
  logoutUser: () => void;
  registerUser: (userData: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    avatar?: string;
    vehicle?: string;
    city?: string;
    storeName?: string;
    storeCategory?: CategoryType;
    storeAddress?: string;
    selfiePhoto?: string;
    cipPhoto?: string;
    vehiclePhoto?: string;
    verificationStatus?: 'pending' | 'approved' | 'rejected';
    verificationSubmittedAt?: string;
  }) => User;
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  approveLivreur: (userId: string) => void;
  rejectLivreur: (userId: string, reason?: string) => void;
  toggleStoreCertification: (storeId: string) => void;
  updateStore: (updatedStore: Store) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  stores: Store[];
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  notifications: NotificationItem[];
  activeCategory: CategoryType | 'all';
  setActiveCategory: (cat: CategoryType | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTrackingOrder: Order | null;
  setActiveTrackingOrder: (order: Order | null) => void;
  chatMessages: ChatMessage[];
  sendChatMessage: (params: {
    orderId?: string;
    channel: ChatChannel;
    senderRole: UserRole | 'bot';
    senderId?: string;
    text: string;
  }) => Promise<void>;
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartDeliveryFee: number;
  
  const sendChatMessage = async (params: {
  placeOrder: (details: {
    paymentMethod: 'cash' | 'momo_mtn' | 'momo_moov' | 'orange_money' | 'celtis_cash';
    storePaymentMode?: 'online' | 'delivery';
    clientName: string;
    clientPhone: string;
  }) => {
    notes?: string;
    clientLat?: number;
    clientLng?: number;
    momoTransactionRef?: string;
    paymentReceiptPhoto?: string;
  }) => Order;
  requestRiderForOrder: (orderId: string) => void;
  acceptDeliveryOrder: (orderId: string, customRider?: User) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, finalDistanceKm?: number, reason?: string) => void;

  // Product Management (Vendeur)
  addProduct: (newProd: Omit<Product, 'id'>) => void;
    // send message to backend AI chatbot and append reply (fallbacks to local generator)
    if (params.senderRole !== 'bot') {
      const generateBotReply = (channel: ChatChannel, senderRole: UserRole | 'bot', text: string) => {
        const normalize = (s: string) => s
          .normalize('NFD')
          .replace(/[\u0000-\u036f]/g, '')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        const lower = normalize(text);
        const contains = (words: string[]) => words.some(w => lower.includes(w));

        if (channel === 'assistant') {
          if (contains(['commande', 'order'])) return 'Je peux vous aider à suivre une commande, vérifier votre panier ou expliquer les étapes de livraison.';
          if (contains(['livreur', 'course', 'distance', 'livraison'])) return 'Le livreur est affecté une fois que le restaurant a confirmé la commande. La distance finale est validée au compteur.';
          if (contains(['momo', 'paiement', 'recu', 'reçu', 'payer', 'carte'])) return 'Vous pouvez payer avec MoMo, Moov, Celtis Cash ou en espèces. Attachez le reçu si nécessaire.';
          if (contains(['restaurant', 'vendeur', 'boutique'])) return 'Le restaurant confirme d’abord la commande, puis demande un livreur après préparation.';
          return 'Je suis le robot assistant Livriko. Posez-moi une question sur votre commande, la livraison, ou le fonctionnement du site.';
        }

        if (channel === 'client-vendeur') {
          if (senderRole === 'client') {
            if (contains(['heure', 'temps', 'delai'])) return 'Le restaurant prépare votre commande et vous confirme dès que c’est prêt.';
            return 'Merci pour la précision, nous préparons votre commande et vous contactons si nécessaire.';
          }
          if (senderRole === 'vendeur') {
            if (contains(['retard', 'delay'])) return 'La préparation prend un peu plus de temps, je vous informe dès que c’est prêt.';
            return 'Commande bien reçue, je confirme la préparation dès que possible.';
          }
        }

        if (channel === 'vendeur-livreur') {
          if (senderRole === 'vendeur') {
            if (contains(['presque', 'bientot', 'bientôt'])) return 'Je serai sur place dans quelques minutes pour récupérer le colis.';
            return 'Je prends la demande de livraison et je vous confirme l’arrivée au restaurant.';
          }
          if (senderRole === 'livreur') {
            if (contains(['retard', 'traffic', 'trafic'])) return 'Je suis en route, je prévois un léger retard à cause du trafic.';
            return 'Je prends en charge la commande, j’arrive au restaurant dans quelques minutes.';
          }
        }

        if (channel === 'livreur-client') {
          if (senderRole === 'client') {
            if (contains(['attendez', 'ou', 'ouù', 'ou?'])) return 'Je suis à proximité, j’arrive à votre adresse bientôt.';
            return 'Merci, je vous préviens dès que je suis devant la porte.';
          }
          if (senderRole === 'livreur') {
            if (contains(['arrive', 'arrivé', 'devant'])) return 'Je suis arrivé devant votre adresse, descendez s’il vous plaît.';
            return 'Je suis en route avec votre commande, je vous préviens à l’arrivée.';
          }
        }

        return 'Message reçu. Nous revenons vers vous très vite.';
      };

      // build a small history (including the new message)
      const history = [...chatMessages, newChat].slice(-12).map(m => ({ senderRole: m.senderRole, text: m.text, channel: m.channel }));

      try {
        const res = await fetch('/backend/chatbot.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: params.channel, senderRole: params.senderRole, text: params.text, history }),
        });
        if (res.ok) {
          const data = await res.json();
          const replyText = data && data.reply ? data.reply : generateBotReply(params.channel, params.senderRole, params.text);
          setChatMessages(prev => [
            ...prev,
            {
              id: 'chat-bot-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
              orderId: params.orderId,
              channel: params.channel,
              senderRole: 'bot',
              text: replyText,
              timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          throw new Error('chatbot backend error');
        }
      } catch (e) {
        const replyText = generateBotReply(params.channel, params.senderRole, params.text);
        setChatMessages(prev => [
          ...prev,
          {
            id: 'chat-bot-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            orderId: params.orderId,
            channel: params.channel,
            senderRole: 'bot',
            text: replyText,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }
    if (!isLoggedIn) return null;
    if (currentUserId) {
      const found = allUsers.find(u => u.id === currentUserId);
      if (found) return found;
    }
    return allUsers.length > 0 ? allUsers[0] : null;
  }, [isLoggedIn, currentUserId, allUsers]);

  const setActiveRole = (role: UserRole, force = false) => {
    if (role !== 'client' && !isLoggedIn && !force) {
      setIsAuthModalOpen(true);
      return;
    }

    if (isLoggedIn && currentUser && role !== 'client' && role !== currentUser.role && !force) {
      setIsAuthModalOpen(true);
      return;
    }

    if (role === 'admin' && (!currentUser || currentUser.role !== 'admin') && !force) {
      setIsAuthModalOpen(true);
      return;
    }

    setActiveRoleState(role);
  };

  const loginUser = (emailOrUsername: string, password?: string): { success: boolean; error?: string; user?: User } => {
    if (!emailOrUsername || !emailOrUsername.trim()) {
      return { success: false, error: "Veuillez renseigner votre adresse e-mail ou votre nom d'utilisateur." };
    }
    if (!password || !password.trim()) {
      return { success: false, error: "Veuillez renseigner votre mot de passe." };
    }

    const cleanInput = emailOrUsername.trim().toLowerCase();
    const cleanPassword = password.trim();
    
    const found = allUsers.find(
      u => u.email.toLowerCase() === cleanInput || u.name.toLowerCase() === cleanInput
    );

    if (!found) {
      return { success: false, error: "Aucun compte trouvé pour cet e-mail ou identifiant. Veuillez vous inscrire." };
    }

    if (!found.password || found.password !== cleanPassword) {
      return { success: false, error: "Adresse e-mail/identifiant ou mot de passe incorrect." };
    }

    if (found.verificationStatus === 'rejected') {
      return { success: false, error: "Ce compte a été temporairement suspendu. Veuillez contacter l'administration." };
    }

    setCurrentUserId(found.id);
    setIsLoggedIn(true);
    setActiveRoleState(found.role);
    addNotification(
      'Connexion réussie',
      `Bienvenue dans votre espace ${found.role.toUpperCase()} (${found.name}) !`,
      found.role
    );
    return { success: true, user: found };
  };

  const logoutUser = () => {
    setIsLoggedIn(false);
    setCurrentUserId(null);
    setActiveRoleState('client');
    addNotification(
      'Déconnexion réussie',
      'Vous êtes maintenant en mode visiteur non connecté.',
      'client'
    );
  };

  const deleteUser = (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    // remove stores owned by this user
    setStores(prev => prev.filter(s => s.ownerId !== userId));
    // If the deleted user is the current user, log them out
    if (currentUserId === userId) {
      setIsLoggedIn(false);
      setCurrentUserId(null);
      setActiveRoleState('client');
      addNotification('Compte supprimé', 'Votre compte a été supprimé avec succès.', 'client');
    } else {
      addNotification('Compte supprimé', `Un compte utilisateur (${userId}) a été supprimé par l'administration.`, 'admin');
    }
  };

  const registerUser = (userData: {
    name: string;
    email: string;
    password?: string;
    phone: string;
    role: UserRole;
    avatar?: string;
    vehicle?: string;
    city?: string;
    storeName?: string;
    storeCategory?: CategoryType;
    storeAddress?: string;
    selfiePhoto?: string;
    cipPhoto?: string;
    vehiclePhoto?: string;
    verificationStatus?: 'pending' | 'approved' | 'rejected';
    verificationSubmittedAt?: string;
  }): User => {
    const newUserId = 'u-' + userData.role + '-' + Date.now();
    let newStoreId: string | undefined = undefined;

    if (userData.role === 'vendeur') {
      newStoreId = 'st-' + Date.now();
      const newStore: Store = {
        id: newStoreId,
        name: userData.storeName || `Boutique de ${userData.name}`,
        category: userData.storeCategory || 'restaurants',
        ownerId: newUserId,
        logo: userData.avatar || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=150&q=80',
        coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
        deliveryTime: '20-35 min',
        address: userData.storeAddress || 'Centre-ville, Lokossa',
        city: userData.city || 'Lokossa',
        phone: userData.phone,
        isOpen: true,
        isCertified: false,
      };
      setStores(prev => [newStore, ...prev]);
    }

    const newUser: User = {
      id: newUserId,
      name: userData.name,
      email: userData.email,
      password: userData.password || '123456',
      phone: userData.phone,
      role: userData.role,
      avatar: userData.avatar || userData.selfiePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      vehicle: userData.vehicle,
      city: userData.city || 'Lokossa',
      storeId: newStoreId,
      verificationStatus: userData.role === 'livreur' ? (userData.verificationStatus || 'pending') : 'approved',
      selfiePhoto: userData.selfiePhoto,
      cipPhoto: userData.cipPhoto,
      vehiclePhoto: userData.vehiclePhoto,
      verificationSubmittedAt: userData.verificationSubmittedAt || 'A l\'instant',
      isCertified: userData.role !== 'livreur',
    };

    setAllUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newUser.id);
    setIsLoggedIn(true);
    setActiveRoleState(newUser.role);

    addNotification(
      'Compte créé avec succès !',
      `Espace ${newUser.role.toUpperCase()} activé pour ${newUser.name}.`,
      newUser.role
    );

    if (userData.role === 'livreur') {
      addNotification(
        'Nouveau dossier livreur à vérifier !',
        `Le livreur ${newUser.name} a soumis ses pièces (CIP, Moto, Selfie) pour validation sous 12h.`,
        'admin'
      );
    }

    return newUser;
  };

  const updateUserProfile = (userId: string, updates: Partial<User>) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  const approveLivreur = (userId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, verificationStatus: 'approved', isCertified: true };
      }
      return u;
    }));
    addNotification(
      'Dossier Livreur Approuvé ! 🎉',
      'Votre compte livreur a été certifié par l\'administrateur Livriko. Vous pouvez maintenant accepter des courses.',
      'livreur'
    );
  };

  const rejectLivreur = (userId: string, reason?: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, verificationStatus: 'rejected', rejectionReason: reason || 'Pièces non conformes' };
      }
      return u;
    }));
  };

  const toggleStoreCertification = (storeId: string) => {
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, isCertified: !s.isCertified } : s));
  };

  const updateStore = (updatedStore: Store) => {
    setStores(prev => prev.map(s => s.id === updatedStore.id ? updatedStore : s));
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'Bienvenue sur Livriko !',
      message: 'Livraison rapide de tous vos produits à partir de 450 FCFA.',
      timestamp: 'A l\'instant',
      read: false,
      targetRole: 'client',
    },
    {
      id: 'n-2',
      title: 'Nouvelle commande reçue',
      message: 'Commande #LVK-7843 enregistrée pour Chez Maman Africa.',
      timestamp: 'Il y a 6 min',
      read: false,
      targetRole: 'vendeur',
      orderId: 'ord-102',
    },
    {
      id: 'n-3',
      title: 'Livraison en cours',
      message: 'Commande #LVK-7842 est en route vers le client.',
      timestamp: 'Il y a 10 min',
      read: false,
      targetRole: 'livreur',
      orderId: 'ord-101',
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'chat-1',
      channel: 'assistant',
      senderRole: 'bot',
      text: "Bonjour ! Je suis le robot assistant Livriko. Posez-moi une question sur les commandes, la livraison ou l'utilisation du site.",
      timestamp: 'À l\'instant',
    },
  ]);

  // Cart logic
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const cartDeliveryFee = React.useMemo(() => {
    if (cart.length === 0) return 0;
    const storeId = cart[0]?.product.storeId;
    const store = stores.find(s => s.id === storeId);
    const storeLat = store?.lat ?? currentUser?.location?.lat ?? 6.6432;
    const storeLng = store?.lng ?? currentUser?.location?.lng ?? 1.7145;
    const clientLat = currentUser?.location?.lat ?? 6.6432;
    const clientLng = currentUser?.location?.lng ?? 1.7145;
    const distanceKm = calculateRoadDistanceKm(storeLat, storeLng, clientLat, clientLng);
    return calculateDeliveryFee(distanceKm).deliveryFee;
  }, [cart, stores, currentUser?.location]);

  const cartTotal = cartSubtotal + cartDeliveryFee;

  // Add Notification
  const addNotification = (title: string, message: string, targetRole: UserRole, orderId?: string) => {
    const newNotif: NotificationItem = {
      id: 'n-' + Date.now(),
      title,
      message,
      timestamp: 'A l\'instant',
      read: false,
      targetRole,
      orderId,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const sendChatMessage = (params: {
    orderId?: string;
    channel: ChatChannel;
    senderRole: UserRole | 'bot';
    senderId?: string;
    text: string;
  }) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const newChat: ChatMessage = {
      id: 'chat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      orderId: params.orderId,
      channel: params.channel,
      senderRole: params.senderRole,
      senderId: params.senderId,
      text: params.text,
      timestamp,
    };

    setChatMessages(prev => [...prev, newChat]);

    // generate a contextual bot reply and enqueue it (only reply to human messages)
    if (params.senderRole !== 'bot') {
      const generateBotReply = (channel: ChatChannel, senderRole: UserRole | 'bot', text: string) => {
        const normalize = (s: string) => s
          .normalize('NFD')
          .replace(/[ -\u036f]/g, '')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        const lower = normalize(text);
        const contains = (words: string[]) => words.some(w => lower.includes(w));

        if (channel === 'assistant') {
          if (contains(['commande', 'order'])) return 'Je peux vous aider à suivre une commande, vérifier votre panier ou expliquer les étapes de livraison.';
          if (contains(['livreur', 'course', 'distance', 'livraison'])) return 'Le livreur est affecté une fois que le restaurant a confirmé la commande. La distance finale est validée au compteur.';
          if (contains(['momo', 'paiement', 'recu', 'reçu', 'payer', 'carte'])) return 'Vous pouvez payer avec MoMo, Moov, Celtis Cash ou en espèces. Attachez le reçu si nécessaire.';
          if (contains(['restaurant', 'vendeur', 'boutique'])) return 'Le restaurant confirme d’abord la commande, puis demande un livreur après préparation.';
          return 'Je suis le robot assistant Livriko. Posez-moi une question sur votre commande, la livraison, ou le fonctionnement du site.';
        }

        if (channel === 'client-vendeur') {
          if (senderRole === 'client') {
            if (contains(['heure', 'temps', 'delai'])) return 'Le restaurant prépare votre commande et vous confirme dès que c’est prêt.';
            return 'Merci pour la précision, nous préparons votre commande et vous contactons si nécessaire.';
          }
          if (senderRole === 'vendeur') {
            if (contains(['retard', 'delay'])) return 'La préparation prend un peu plus de temps, je vous informe dès que c’est prêt.';
            return 'Commande bien reçue, je confirme la préparation dès que possible.';
          }
        }

        if (channel === 'vendeur-livreur') {
          if (senderRole === 'vendeur') {
            if (contains(['presque', 'bientot', 'bientôt'])) return 'Je serai sur place dans quelques minutes pour récupérer le colis.';
            return 'Je prends la demande de livraison et je vous confirme l’arrivée au restaurant.';
          }
          if (senderRole === 'livreur') {
            if (contains(['retard', 'traffic', 'trafic'])) return 'Je suis en route, je prévois un léger retard à cause du trafic.';
            return 'Je prends en charge la commande, j’arrive au restaurant dans quelques minutes.';
          }
        }

        if (channel === 'livreur-client') {
          if (senderRole === 'client') {
            if (contains(['attendez', 'ou', 'ouù', 'ou?'])) return 'Je suis à proximité, j’arrive à votre adresse bientôt.';
            return 'Merci, je vous préviens dès que je suis devant la porte.';
          }
          if (senderRole === 'livreur') {
            if (contains(['arrive', 'arrivé', 'devant'])) return 'Je suis arrivé devant votre adresse, descendez s’il vous plaît.';
            return 'Je suis en route avec votre commande, je vous préviens à l’arrivée.';
          }
        }

        return 'Message reçu. Nous revenons vers vous très vite.';
      };

      const replyText = generateBotReply(params.channel, params.senderRole, params.text);
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            id: 'chat-bot-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
            orderId: params.orderId,
            channel: params.channel,
            senderRole: 'bot',
            text: replyText,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 800);
    }
  };

  // Place Order (Client)
  const placeOrder = (details: {
    paymentMethod: 'cash' | 'momo_mtn' | 'momo_moov' | 'orange_money' | 'celtis_cash';
    storePaymentMode?: 'online' | 'delivery';
    clientName: string;
    clientPhone: string;
    clientAddress: string;
    notes?: string;
    clientLat?: number;
    clientLng?: number;
    momoTransactionRef?: string;
    paymentReceiptPhoto?: string;
  }): Order => {
    const storeId = cart[0]?.product.storeId ?? 'unknown-store';
    const storeName = cart[0]?.product.storeName ?? 'Boutique';
    const store = stores.find(s => s.id === storeId);

    const storeLat = store?.lat ?? currentUser?.location?.lat ?? 6.6432;
    const storeLng = store?.lng ?? currentUser?.location?.lng ?? 1.7145;
    const clientLat = details.clientLat ?? currentUser?.location?.lat ?? 6.6432;
    const clientLng = details.clientLng ?? currentUser?.location?.lng ?? 1.7145;

    const calculatedDistanceKm = calculateRoadDistanceKm(storeLat, storeLng, clientLat, clientLng);
    const feeInfo = calculateDeliveryFee(calculatedDistanceKm);

    const items = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      unitPrice: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    const orderCode = `#LVK-${Math.floor(1000 + Math.random() * 9000)}`;

    const storeCommissionFee = Math.round(cartSubtotal * 0.05);
    const storeNetEarnings = cartSubtotal - storeCommissionFee;

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      code: orderCode,
      clientId: currentUser?.id || 'guest-' + Date.now(),
      clientName: details.clientName || currentUser?.name || 'Client Visiteur',
      clientPhone: details.clientPhone || currentUser?.phone || '+229 90 00 00 00',
      clientAddress: details.clientAddress,
      clientLat,
      clientLng,
      storeId,
      storeName,
      storeAddress: store?.address || 'Centre-ville, Lokossa',
      storeLat,
      storeLng,
      items,
      subtotal: cartSubtotal,
      deliveryFee: feeInfo.deliveryFee,
      distanceKm: feeInfo.distanceKm,
      driverEarnings: feeInfo.driverEarnings,
      platformFee: feeInfo.platformFee,
      storeCommissionFee,
      storeNetEarnings,
      totalAmount: cartSubtotal + feeInfo.deliveryFee,
      status: 'pending',
      paymentMethod: details.paymentMethod,
      storePaymentMode: details.storePaymentMode ?? (details.paymentMethod === 'cash' ? 'delivery' : 'online'),
      paymentStatus: (details.storePaymentMode ?? (details.paymentMethod === 'cash' ? 'delivery' : 'online')) === 'online' ? 'paid' : 'pending',
      deliveryFeePaymentStatus: 'pending',
      momoTransactionRef: details.momoTransactionRef,
      paymentReceiptPhoto: details.paymentReceiptPhoto,
      createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      notes: details.notes,
      estimatedMinutes: Math.round(10 + calculatedDistanceKm * 4),
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    addNotification(
      'Nouvelle commande reçue !',
      `Commande ${orderCode} de ${newOrder.clientName} (${newOrder.totalAmount.toLocaleString()} FCFA) reçue. Validez-la et demandez un livreur dès que la préparation est terminée.`,
      'vendeur',
      newOrder.id
    );

    setActiveTrackingOrder(newOrder);
    return newOrder;
  };

  // Request Rider (Vendeur)
  const requestRiderForOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'rider_requested' };
      }
      return o;
    }));

    addNotification(
      'Livraison demandée par le restaurant',
      `Le restaurant a terminé la préparation de la commande ${orderId} et recherche maintenant le livreur le plus proche.`,
      'livreur',
      orderId
    );

    addNotification(
      'Recherche de livreur en cours',
      `Votre commande ${orderId} est prête. Nous recherchons un livreur à proximité pour la livraison.`,
      'client',
      orderId
    );
  };

  // Accept Delivery Order (Livreur)
  const acceptDeliveryOrder = (orderId: string, customRider?: User) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== 'rider_requested') return;

    const storeLat = order.storeLat ?? currentUser?.location?.lat ?? 6.6432;
    const storeLng = order.storeLng ?? currentUser?.location?.lng ?? 1.7145;

    const eligibleRiders = allUsers.filter(u => u.role === 'livreur' && u.verificationStatus === 'approved');
    if (eligibleRiders.length === 0) {
      addNotification(
        'Aucun livreur disponible',
        'Aucun livreur certifié n’est disponible pour prendre cette course.',
        'vendeur',
        orderId
      );
      return;
    }

    const getRiderDistance = (rider: User) => {
      const riderLat = rider.location?.lat ?? storeLat;
      const riderLng = rider.location?.lng ?? storeLng;
      return calculateHaversineDistance(storeLat, storeLng, riderLat, riderLng);
    };

    const nearestRider = eligibleRiders.reduce((closest, rider) => {
      const distance = getRiderDistance(rider);
      if (!closest || distance < closest.distance) {
        return { rider, distance };
      }
      return closest;
    }, null as { rider: User; distance: number } | null)?.rider;

    if (!nearestRider) return;

    const activeRider = customRider || currentUser || nearestRider;
    if (!customRider && currentUser && currentUser.role === 'livreur' && currentUser.id !== nearestRider.id) {
      addNotification(
        'Course non attribuée',
        `Cette course est réservée au livreur le plus proche (${nearestRider.name}).`,
        'livreur',
        orderId
      );
      return;
    }

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        if (o.status === 'rider_assigned' || o.status === 'delivering' || o.status === 'delivered') return o;
        return {
          ...o,
          status: 'rider_assigned',
          riderId: activeRider?.id,
          riderName: activeRider?.name,
          riderPhone: activeRider?.phone,
          riderPhoto: activeRider?.avatar,
          riderVehicle: activeRider?.vehicle || 'Moto TVS HLX 125',
          currentRiderLat: o.storeLat || 6.6385,
          currentRiderLng: o.storeLng || 1.7170,
          estimatedMinutes: Math.round(8 + (o.distanceKm || 2) * 3),
        };
      }
      return o;
    }));

    addNotification(
      'Livreur affecté à votre commande !',
      `${activeRider?.name || 'Un livreur'} a accepté la mission et se rend au restaurant.`,
      'client',
      orderId
    );

    addNotification(
      'Livreur confirmé',
      `Le livreur ${activeRider?.name || 'proche'} a accepté la commande ${orderId}.`,
      'vendeur',
      orderId
    );
  };

  // Update Order Status
  const updateOrderStatus = (orderId: string, status: OrderStatus, finalDistanceKm?: number, reason?: string) => {
    const nowTimeString = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updated: Order = { ...o, status };
        if (reason) {
          updated.cancellationReason = reason;
        }
            if (status === 'delivering' || status === 'picked_up') {
          if (!updated.startedAt) {
            updated.startedAt = nowTimeString;
          }
        }
        if (status === 'delivered') {
          if (!updated.deliveredAt) {
            updated.deliveredAt = nowTimeString;
          }
          updated.durationMinutes = updated.startedAt ? Math.max(5, Math.round(12 + (updated.distanceKm || 2.5) * 2)) : 15;
          updated.paymentStatus = 'paid';
          updated.deliveryFeePaymentStatus = 'paid';
          if (finalDistanceKm !== undefined && finalDistanceKm > 0) {
            updated.finalDistanceKm = finalDistanceKm;
          }
        }

        if (finalDistanceKm !== undefined && finalDistanceKm > 0) {
          const feeInfo = calculateDeliveryFee(finalDistanceKm);
          updated.distanceKm = feeInfo.distanceKm;
          updated.deliveryFee = feeInfo.deliveryFee;
          updated.driverEarnings = feeInfo.driverEarnings;
          updated.platformFee = feeInfo.platformFee;
          updated.totalAmount = o.subtotal + feeInfo.deliveryFee;
        }
        return updated;
      }
      return o;
    }));

    const statusLabels: Record<OrderStatus, string> = {
      pending: 'En attente de validation du restaurant',
      confirmed: 'Commande acceptée ! En cours de préparation',
      rider_requested: 'Boutique prête • Recherche de livreur',
      rider_assigned: 'Livreur assigné • En route vers la boutique',
      picked_up: 'Colis récupéré chez le vendeur',
      delivering: 'Course démarrée • Livreur en route vers vous !',
      delivered: 'Commande livrée avec succès ! 🎉',
      cancelled: reason ? `Commande refusée (${reason})` : 'Commande annulée',
    };

    addNotification(
      status === 'cancelled' ? 'Commande Refusée/Annulée' : 'Mise à jour de votre commande',
      `Statut : ${statusLabels[status]}`,
      'client',
      orderId
    );

    if (activeTrackingOrder && activeTrackingOrder.id === orderId) {
      setActiveTrackingOrder(prev => prev ? {
        ...prev,
        status,
        ...(reason ? { cancellationReason: reason } : {}),
        ...(status === 'delivering' && !prev.startedAt ? { startedAt: nowTimeString } : {}),
        ...(status === 'delivered' ? { deliveredAt: nowTimeString, paymentStatus: 'paid' } : {})
      } : null);
    }
  };

  // Product management for Vendeur
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const p: Product = {
      ...newProd,
      id: 'p-' + Date.now(),
    };
    setProducts(prev => [p, ...prev]);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        activeRole,
        setActiveRole,
        currentUser,
        allUsers,
        loginUser,
        logoutUser,
        registerUser,
        updateUserProfile,
        approveLivreur,
        rejectLivreur,
        toggleStoreCertification,
        updateStore,
        isAuthModalOpen,
        setIsAuthModalOpen,
        stores,
        products,
        orders,
        cart,
        notifications,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        activeTrackingOrder,
        setActiveTrackingOrder,
        chatMessages,
        sendChatMessage,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartDeliveryFee,
        placeOrder,
        requestRiderForOrder,
        acceptDeliveryOrder,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        deleteUser,
        addNotification,
        markNotificationRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
