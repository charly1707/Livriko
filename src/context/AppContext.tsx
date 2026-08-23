import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { 
  User, UserRole, Store, Product, Order, CartItem, NotificationItem, 
  CategoryType, OrderStatus 
} from '../types';
import { normalizeUserRole } from '../utils/authFallback';
import { uploadImageFile, uploadProductImageFile } from '../utils/imageUpload';
import { buildDeliveryQuoteFromCoordinates, calculateDeliveryFee, calculateRoadDistanceKm, calculateHaversineDistance, isValidCoordinates } from '../utils/deliveryCalculator';

interface AppContextType {
  isLoggedIn: boolean;
  currentUserId: string | null;
  activeRole: UserRole;
  setActiveRole: (role: UserRole, force?: boolean) => void;
  currentUser: User | null;
  allUsers: User[];
  loginUser: (email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logoutUser: () => void;
  registerUser: (userData: {
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
  }) => Promise<User>;
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  approveLivreur: (userId: string) => void;
  rejectLivreur: (userId: string, reason?: string) => void;
  toggleStoreCertification: (storeId: string) => void;
  updateStore: (updatedStore: Store) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  reviewModalOrderId: string | null;
  setReviewModalOrderId: (id: string | null) => void;

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
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartDeliveryFee: number;
  
  // Order Lifecycle
  placeOrder: (details: {
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
    deliveryQuote?: {
      distanceKm: number;
      deliveryFee: number;
      driverEarnings: number;
      platformFee: number;
    };
  }) => Promise<Order>;
  requestRiderForOrder: (orderId: string) => void;
  acceptDeliveryOrder: (orderId: string, customRider?: User) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, finalDistanceKm?: number, reason?: string) => void;

  // Product Management (Vendeur)
  addProduct: (newProd: ProductPayload) => Promise<void>;
  updateProduct: (prod: ProductUpdatePayload) => Promise<void>;
  deleteProduct: (id: string) => void;

  // Delete user account (admin or self)
  deleteUser: (userId: string) => void;

  // Notification
  addNotification: (title: string, message: string, targetRole: UserRole, orderId?: string) => void;
  markNotificationRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type ProductPayload = Omit<Product, 'id' | 'image'> & { image?: string | File };
type ProductUpdatePayload = Omit<Product, 'image'> & { image?: string | File };

const isProductionRuntime = Boolean(import.meta.env.PROD);
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const getDefaultApiBase = () => {
  if (typeof window === 'undefined') return '';
  return (window.location.origin || '').replace(/\/$/, '');
};
const buildApiUrl = (path: string) => `${API_BASE || getDefaultApiBase()}${path}`;

const uploadProductImage = async (file: File): Promise<string> => uploadProductImageFile(file);

const getApiErrorMessage = (error: any): string => {
  const status = error?.response?.status;
  const backendMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message;

  if (!error?.response || error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'Le serveur Livriko est momentanément indisponible. Veuillez réessayer plus tard.';
  }

  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return backendMessage || 'Informations incorrectes. Vérifiez vos données et réessayez.';
  }

  if (status === 500) {
    return 'Une erreur interne est survenue. Veuillez réessayer plus tard.';
  }

  return backendMessage || 'Une erreur est survenue. Veuillez réessayer.';
};

const mapApiOrder = (order: any): Order => ({
  id: String(order.id || (order.databaseId ? `ord-${order.databaseId}` : '')),
  databaseId: String(order.databaseId || String(order.id || '').replace(/^ord-/, '') || '') || undefined,
  code: order.code || '#LVK',
  clientId: String(order.clientId || ''),
  clientName: order.clientName || 'Client',
  clientPhone: order.clientPhone || '',
  clientAddress: order.clientAddress || '',
  clientLat: order.clientLat ?? undefined,
  clientLng: order.clientLng ?? undefined,
  storeId: String(order.storeId || ''),
  storeName: order.storeName || 'Boutique',
  storeAddress: order.storeAddress || '',
  storeLat: order.storeLat ?? undefined,
  storeLng: order.storeLng ?? undefined,
  items: Array.isArray(order.items) ? order.items : [],
  subtotal: Number(order.subtotal) || 0,
  deliveryFee: Number(order.deliveryFee) || 0,
  totalAmount: Number(order.totalAmount) || 0,
  status: order.status || 'pending',
  paymentMethod: order.paymentMethod || 'cash',
  paymentStatus: order.paymentStatus || 'pending',
  createdAt: order.createdAt || '',
  riderId: order.riderId || undefined,
  deliveryStatus: order.deliveryStatus,
  distanceKm: order.distanceKm ?? undefined,
  notes: order.notes || undefined,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return false;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return null;
  });

  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('livriko_active_role') : null;
    return stored && ['client', 'restaurant', 'vendeur', 'livreur', 'admin'].includes(stored) ? (stored as UserRole) : 'client';
  });
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [reviewModalOrderId, setReviewModalOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUserId && !isLoggedIn) {
      setIsLoggedIn(true);
    }
  }, [currentUserId, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('livriko_active_role', activeRole);
  }, [activeRole]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const meUrl = buildApiUrl('/backend/index.php/api/auth/me');
        const res = await axios.get(meUrl, { withCredentials: true });
        if (res.data?.user) {
          const user = res.data.user;
          const userId = String(user.id);
          setAllUsers(prev => {
            const existing = prev.find(u => u.id === userId);
            if (existing) {
              return prev.map(u => u.id === userId ? { ...existing, ...user, id: userId } : u);
            }
            return [{
              id: userId,
              name: user.prenom || user.nom_utilisateur || user.email,
              email: user.email,
              phone: user.telephone || '',
              role: user.role || 'client',
              avatar: user.avatar || undefined,
            }, ...prev];
          });
          setCurrentUserId(userId);
          setIsLoggedIn(true);
          setActiveRoleState(normalizeUserRole(user.role));
        } else {
          setCurrentUserId(null);
          setIsLoggedIn(false);
        }
      } catch {
        setCurrentUserId(null);
        setIsLoggedIn(false);
      }

      try {
        const productsUrl = buildApiUrl('/backend/index.php/api/products');
        const res = await axios.get(productsUrl, { withCredentials: true });
        if (res.data?.products) {
          const mappedProducts: Product[] = res.data.products.map((p: any) => ({
            id: String(p.id),
            storeId: String(p.store_id || p.restaurant_id),
            storeName: p.store_name || p.nom || 'Boutique',
            name: p.nom,
            description: p.description || '',
            price: Number(p.prix) || 0,
            category: (p.category as CategoryType) || 'restaurants',
            image: p.image || '',
            inStock: Boolean(p.en_stock),
            unit: p.unit || 'portion',
          }));
          setProducts(mappedProducts);
        }
      } catch {
        setProducts([]);
      }

      try {
        const restaurantsUrl = buildApiUrl('/backend/index.php/api/restaurants');
        const res = await axios.get(restaurantsUrl, { withCredentials: true });
        const mappedStores: Store[] = (res.data?.restaurants || []).map((restaurant: any) => ({
          id: `store-${restaurant.id}`,
          name: restaurant.name,
          category: 'restaurants',
          ownerId: String(restaurant.ownerId),
          logo: restaurant.logo || '',
          coverImage: restaurant.logo || '',
          rating: 0,
          deliveryTime: '',
          address: restaurant.address,
          city: restaurant.city,
          phone: restaurant.phone,
          momoPhone: restaurant.momoPhone || undefined,
          lat: restaurant.lat ?? undefined,
          lng: restaurant.lng ?? undefined,
          isOpen: Boolean(restaurant.isOpen),
          isCertified: Boolean(restaurant.isCertified),
          description: restaurant.description || '',
        }));
        setStores(mappedStores);
      } catch {
        setStores([]);
      }

      try {
        const ordersUrl = buildApiUrl('/backend/index.php/api/orders');
        const res = await axios.get(ordersUrl, { withCredentials: true });
        if (Array.isArray(res.data?.orders)) {
          setOrders(res.data.orders.map(mapApiOrder));
        }
      } catch {
        setOrders([]);
      }
    };
    bootstrap();
  }, []);

  const currentUser = React.useMemo(() => {
    if (!isLoggedIn) return null;
    if (currentUserId) {
      const found = allUsers.find(u => u.id === currentUserId);
      return found ?? null;
    }
    return null;
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

  const loginUser = async (emailOrUsername: string, password?: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    if (!emailOrUsername || !emailOrUsername.trim()) {
      return { success: false, error: "Veuillez renseigner votre adresse e-mail ou votre nom d'utilisateur." };
    }
    if (!password || !password.trim()) {
      return { success: false, error: "Veuillez renseigner votre mot de passe." };
    }

    const payload = new URLSearchParams();
    payload.append('identifiant', emailOrUsername.trim());
    payload.append('mot_de_passe', password.trim());

    try {
      const loginUrl = buildApiUrl('/backend/index.php/api/auth/login');
      const res = await axios.post(loginUrl, payload, { withCredentials: true });
      if (res.data?.success && res.data.user) {
        const userData: User = {
          id: String(res.data.user.id),
          name: res.data.user.prenom || res.data.user.nom_utilisateur || res.data.user.email,
          email: res.data.user.email,
          phone: res.data.user.telephone || '',
          role: normalizeUserRole(res.data.user.role),
          avatar: res.data.user.avatar || undefined,
        };
        setAllUsers(prev => {
          const existing = prev.find(u => u.id === userData.id);
          if (existing) {
            return prev.map(u => u.id === userData.id ? { ...existing, ...userData } : u);
          }
          return [userData, ...prev];
        });
        setCurrentUserId(userData.id);
        setIsLoggedIn(true);
        setActiveRoleState(userData.role);
        addNotification('Connexion réussie', `Bienvenue dans votre espace ${userData.role.toUpperCase()} !`, userData.role);
        return { success: true, user: userData };
      }

      const apiMessage = res.data?.message || res.data?.error || 'Échec de la connexion.';
      return { success: false, error: apiMessage };
    } catch (error: any) {
      return { success: false, error: getApiErrorMessage(error) };
    }
  };

  const logoutUser = async () => {
    try {
      const logoutUrl = buildApiUrl('/backend/index.php/api/auth/logout');
      await axios.post(logoutUrl, new URLSearchParams(), { withCredentials: true });
    } catch {
      // ignore backend logout failure
    }

    setIsLoggedIn(false);
    setCurrentUserId(null);
    setActiveRoleState('client');
    setIsAuthModalOpen(false);

    try {
      localStorage.removeItem('livriko_is_logged_in');
      localStorage.removeItem('livriko_current_user_id');
      localStorage.removeItem('livriko_seen_welcome');
      sessionStorage.removeItem('livriko_session');
    } catch {}

    try {
      document.cookie = 'PHPSESSID=; Max-Age=0; path=/; SameSite=Lax';
      document.cookie = 'PHPSESSID=; Max-Age=0; path=/backend; SameSite=Lax';
    } catch {}

    addNotification('Déconnexion réussie', 'Vous êtes maintenant en mode visiteur non connecté.', 'client');

    try {
      window.location.replace('/');
    } catch {}
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

  const registerUser = async (userData: {
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
  }): Promise<User> => {
    const normalizedPassword = userData.password || '123456';
    const payload = new URLSearchParams();
    payload.append('prenom', userData.name);
    payload.append('nom', userData.name);
    payload.append('nom_utilisateur', userData.email.split('@')[0]);
    payload.append('email', userData.email);
    payload.append('telephone', userData.phone);
    payload.append('mot_de_passe', normalizedPassword);
    payload.append('role', userData.role);
    if (userData.avatar) payload.append('avatar', userData.avatar);
    if (userData.selfiePhoto) payload.append('selfie_photo', userData.selfiePhoto);
    if (userData.cipPhoto) payload.append('cip_photo', userData.cipPhoto);
    if (userData.vehiclePhoto) payload.append('vehicle_photo', userData.vehiclePhoto);
    if (userData.role === 'restaurant' || userData.role === 'vendeur') {
      payload.append('restaurant_name', userData.storeName || `Boutique de ${userData.name}`);
      payload.append('adresse', userData.storeAddress || 'Centre-ville, Lokossa');
      payload.append('ville', userData.city || 'Lokossa');
      if (userData.avatar) payload.append('logo', userData.avatar);
    }

    try {
      const registerUrl = buildApiUrl('/backend/index.php/api/auth/register');
      const res = await axios.post(registerUrl, payload, { withCredentials: true });
      if (res.data?.success && res.data.user) {
        const userDataFromApi: User = {
          id: String(res.data.user.id),
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          avatar: res.data.user.avatar || userData.avatar,
          vehicle: userData.vehicle,
          city: userData.city,
          storeId: ['restaurant', 'vendeur'].includes(userData.role) ? `store-${res.data.user.id}` : undefined,
          verificationStatus: userData.verificationStatus,
          selfiePhoto: userData.selfiePhoto,
          cipPhoto: userData.cipPhoto,
          vehiclePhoto: userData.vehiclePhoto,
          verificationSubmittedAt: userData.verificationSubmittedAt,
          isCertified: userData.role !== 'livreur',
          password: normalizedPassword,
        };

        setAllUsers(prev => [userDataFromApi, ...prev.filter(user => user.id !== userDataFromApi.id)]);
        setCurrentUserId(userDataFromApi.id);
        setIsLoggedIn(true);
        setActiveRoleState(userDataFromApi.role);

        addNotification(
          'Compte créé avec succès !',
          `Espace ${userDataFromApi.role.toUpperCase()} activé pour ${userDataFromApi.name}.`,
          userDataFromApi.role
        );

        if (userData.role === 'livreur') {
          addNotification(
            'Nouveau dossier livreur à vérifier !',
            `Le livreur ${userDataFromApi.name} a soumis ses pièces (CIP, Moto, Selfie) pour validation sous 12h.`,
            'admin'
          );
        }

        return userDataFromApi;
      }

      const apiMessage = res.data?.message || res.data?.error || 'Échec de l’inscription côté serveur.';
      throw new Error(apiMessage);
    } catch (error: any) {
      throw new Error(getApiErrorMessage(error));
    }
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


  // Cart logic
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const firstProduct = prev[0]?.product;
      const sameStore = !firstProduct
        || firstProduct.storeId === product.storeId
        || firstProduct.storeName.toLowerCase() === product.storeName.toLowerCase();

      if (!sameStore) {
        addNotification(
          'Panier limité à une boutique',
          `Retirez les articles de ${firstProduct.storeName} avant d’ajouter un produit de ${product.storeName}.`,
          'client'
        );
        return prev;
      }

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
    const quote = buildDeliveryQuoteFromCoordinates(store?.lat, store?.lng, currentUser?.location?.lat, currentUser?.location?.lng);
    return quote?.deliveryFee ?? 0;
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

  // Place Order (Client)
  const placeOrder = async (details: {
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
    deliveryQuote?: {
      distanceKm: number;
      deliveryFee: number;
      driverEarnings: number;
      platformFee: number;
    };
  }): Promise<Order> => {
    if (cart.length === 0) {
      throw new Error('Votre panier est vide. Ajoutez au moins un produit pour finaliser la commande.');
    }

    const storeId = cart[0]?.product.storeId ?? 'unknown-store';
    const storeName = cart[0]?.product.storeName ?? 'Boutique';
    const store = stores.find(s => s.id === storeId);

    const storeLat = store?.lat;
    const storeLng = store?.lng;
    const clientLat = details.clientLat ?? currentUser?.location?.lat;
    const clientLng = details.clientLng ?? currentUser?.location?.lng;
    if (!isValidCoordinates(storeLat, storeLng) || !isValidCoordinates(clientLat, clientLng)) {
      throw new Error('La position réelle de la boutique et du client est nécessaire pour calculer la distance.');
    }

    const calculatedQuote = buildDeliveryQuoteFromCoordinates(storeLat, storeLng, clientLat, clientLng);
    if (!calculatedQuote) {
      throw new Error('Service GPS indisponible : impossible de calculer la distance réelle.');
    }
    const resolvedQuote = details.deliveryQuote && Number.isFinite(details.deliveryQuote.distanceKm) && details.deliveryQuote.distanceKm > 0
      ? {
          distanceKm: details.deliveryQuote.distanceKm,
          deliveryFee: details.deliveryQuote.deliveryFee,
          driverEarnings: details.deliveryQuote.driverEarnings,
          platformFee: details.deliveryQuote.platformFee,
          ratePerKm: Math.round((details.deliveryQuote.deliveryFee / details.deliveryQuote.distanceKm) * 10) / 10,
          tierLabel: 'Distance verrouillée par le système GPS',
        }
      : calculatedQuote;

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
      deliveryFee: resolvedQuote.deliveryFee,
      estimatedDeliveryFee: resolvedQuote.deliveryFee,
      finalDeliveryFee: undefined,
      distanceKm: resolvedQuote.distanceKm,
      driverEarnings: resolvedQuote.driverEarnings,
      platformFee: resolvedQuote.platformFee,
      storeCommissionFee,
      storeNetEarnings,
      totalAmount: cartSubtotal + resolvedQuote.deliveryFee,
      status: 'pending',
      paymentMethod: details.paymentMethod,
      storePaymentMode: details.storePaymentMode ?? (details.paymentMethod === 'cash' ? 'delivery' : 'online'),
      paymentStatus: 'pending',
      deliveryFeePaymentStatus: 'pending',
      momoTransactionRef: details.momoTransactionRef,
      paymentReceiptPhoto: details.paymentReceiptPhoto,
      createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      notes: details.notes,
      estimatedMinutes: Math.round(10 + resolvedQuote.distanceKm * 4),
    };

    const payload = new URLSearchParams();
    payload.append('items', JSON.stringify(items));
    payload.append('clientAddress', details.clientAddress);
    payload.append('deliveryFee', String(resolvedQuote.deliveryFee));
    payload.append('distanceKm', String(resolvedQuote.distanceKm));
    payload.append('paymentMethod', details.paymentMethod);
    payload.append('paymentStatus', newOrder.paymentStatus);

    try {
      const response = await axios.post(buildApiUrl('/backend/index.php/api/orders'), payload, { withCredentials: true });
      const persistedOrder = response.data?.order ? mapApiOrder(response.data.order) : newOrder;

      if (newOrder.storePaymentMode === 'online' && details.paymentMethod !== 'cash') {
        if (!persistedOrder.databaseId) {
          throw new Error('La commande a été créée sans identifiant serveur exploitable pour le paiement.');
        }

        await axios.post(buildApiUrl('/backend/index.php/api/payments/transactions'), new URLSearchParams({
          orderId: String(persistedOrder.databaseId),
          phone: details.clientPhone || '',
          provider: details.paymentMethod === 'momo_mtn' ? 'mtn_momo' : details.paymentMethod,
          idempotencyKey: `order-${persistedOrder.databaseId}-${details.paymentMethod}`,
        }), { withCredentials: true });
      }

      setOrders(prev => [persistedOrder, ...prev.filter(order => order.id !== persistedOrder.id)]);
      setActiveTrackingOrder(persistedOrder);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
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

    return newOrder;
  };

  // Request Rider (Vendeur)
  const requestRiderForOrder = (orderId: string) => {
    void axios.post(buildApiUrl('/backend/index.php/api/orders/status'), new URLSearchParams([
      ['orderId', String(orderId).replace(/^ord-/, '')],
      ['status', 'rider_requested'],
    ]), { withCredentials: true }).catch(error => console.error('Order rider request failed', error));

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

    const storeLat = order.storeLat;
    const storeLng = order.storeLng;
    if (!isValidCoordinates(storeLat, storeLng)) {
      addNotification('Localisation indisponible', 'La position réelle de la boutique est nécessaire pour rechercher un livreur.', 'vendeur', orderId);
      return;
    }

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
      const riderLat = rider.location?.lat;
      const riderLng = rider.location?.lng;
      if (!isValidCoordinates(riderLat, riderLng)) return null;
      return calculateHaversineDistance(storeLat, storeLng, riderLat, riderLng);
    };

    const nearestRider = eligibleRiders.reduce((closest, rider) => {
      const distance = getRiderDistance(rider);
      if (distance === null) return closest;
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

    void axios.post(buildApiUrl('/backend/index.php/api/orders/status'), new URLSearchParams([
      ['orderId', String(orderId).replace(/^ord-/, '')],
      ['status', 'rider_assigned'],
    ]), { withCredentials: true }).catch(error => console.error('Order rider assignment failed', error));

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
          currentRiderLat: activeRider.location?.lat,
          currentRiderLng: activeRider.location?.lng,
          estimatedMinutes: o.distanceKm ? Math.round(8 + o.distanceKm * 3) : undefined,
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

    if (status !== 'pending') {
      void axios.post(buildApiUrl('/backend/index.php/api/orders/status'), new URLSearchParams([
        ['orderId', String(orderId).replace(/^ord-/, '')],
        ['status', status],
      ]), { withCredentials: true }).catch(error => console.error('Order status update failed', error));
    }

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
          updated.durationMinutes = updated.startedAt && updated.distanceKm ? Math.max(5, Math.round(12 + updated.distanceKm * 2)) : undefined;
          if (finalDistanceKm !== undefined && finalDistanceKm > 0) {
            updated.finalDistanceKm = finalDistanceKm;
          }
        }

        if (finalDistanceKm !== undefined && finalDistanceKm > 0) {
          const feeInfo = calculateDeliveryFee(finalDistanceKm);
          updated.distanceKm = feeInfo.distanceKm;
          updated.finalDeliveryFee = feeInfo.deliveryFee;
          updated.driverEarnings = feeInfo.driverEarnings;
          updated.platformFee = feeInfo.platformFee;
          updated.totalAmount = o.subtotal + feeInfo.deliveryFee;
        }
        return updated;
      }
      return o;
    }));

    // If order delivered, and current user is the client of that order, prompt for review
    if (status === 'delivered') {
      const deliveredOrder = orders.find(o => o.id === orderId);
      if (deliveredOrder && currentUser && String(deliveredOrder.clientId) === String(currentUser.id)) {
        try {
          setReviewModalOrderId(orderId);
        } catch {}
      }
    }

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
        ...(status === 'delivered' ? { deliveredAt: nowTimeString } : {})
      } : null);
    }
  };

  // Product management for Vendeur
  const addProduct = async (newProd: ProductPayload) => {
    try {
      let imageValue = typeof newProd.image === 'string' ? newProd.image : '';
      if (newProd.image instanceof File) {
        imageValue = await uploadProductImage(newProd.image);
      }

      const payload = new URLSearchParams();
      payload.append('nom', newProd.name);
      payload.append('description', newProd.description || '');
      payload.append('prix', String(newProd.price));
      payload.append('image', imageValue || '');
      payload.append('category', newProd.category || 'restaurants');
      payload.append('en_stock', String(Boolean(newProd.inStock)));

      const res = await axios.post(buildApiUrl('/backend/index.php/api/products'), payload, { withCredentials: true });
      if (res.data?.success && res.data.product) {
        const savedProduct: Product = {
          id: String(res.data.product.id),
          storeId: String(res.data.product.store_id || newProd.storeId),
          storeName: res.data.product.store_name || newProd.storeName,
          name: res.data.product.nom || newProd.name,
          description: res.data.product.description || newProd.description,
          price: Number(res.data.product.prix || newProd.price),
          category: (res.data.product.category as CategoryType) || newProd.category,
          image: res.data.product.image || imageValue || newProd.image || '',
          inStock: Boolean(res.data.product.en_stock ?? newProd.inStock),
          unit: newProd.unit || 'portion',
        };
        setProducts(prev => [savedProduct, ...prev.filter(item => item.id !== savedProduct.id)]);
        return;
      }

      throw new Error(res.data?.message || 'Impossible d’ajouter le produit.');
    } catch (error: any) {
      console.error('addProduct failed', error);
      throw new Error(getApiErrorMessage(error));
    }
  };

  const updateProduct = async (updated: ProductUpdatePayload) => {
    try {
      let imageValue = typeof updated.image === 'string' ? updated.image : '';
      if (updated.image instanceof File) {
        imageValue = await uploadProductImage(updated.image);
      }

      const payload = new URLSearchParams();
      payload.append('id', String(updated.id));
      payload.append('nom', updated.name);
      payload.append('description', updated.description || '');
      payload.append('prix', String(updated.price));
      payload.append('image', imageValue);
      payload.append('category', updated.category || 'restaurants');
      payload.append('en_stock', String(Boolean(updated.inStock)));

      const res = await axios.post(buildApiUrl('/backend/index.php/api/products/update'), payload, { withCredentials: true });
      if (res.data?.success) {
        const savedProduct: Product = {
          ...updated,
          image: typeof res.data.product?.image === 'string' ? res.data.product.image : imageValue,
        };
        setProducts(prev => prev.map(p => p.id === updated.id ? savedProduct : p));
        return;
      }

      throw new Error(res.data?.message || 'Impossible de modifier le produit.');
    } catch (error: any) {
      console.error('updateProduct failed', error);
      throw new Error(getApiErrorMessage(error));
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const payload = new URLSearchParams();
      payload.append('id', String(id));
      await axios.post(buildApiUrl('/backend/index.php/api/products/delete'), payload, { withCredentials: true });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error: any) {
      console.error('deleteProduct failed', error);
      throw new Error(getApiErrorMessage(error));
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        currentUserId,
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
        reviewModalOrderId,
        setReviewModalOrderId,
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
