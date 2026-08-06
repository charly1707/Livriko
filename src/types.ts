export type UserRole = 'client' | 'vendeur' | 'livreur' | 'admin';

export type CategoryType = 'restaurants' | 'boutiques' | 'pharmacies' | 'supermarches' | 'autres';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  storeId?: string; // If vendeur
  vehicle?: string; // If livreur
  location?: { lat: number; lng: number; address: string };
  city?: string;
  // Livreur Security Onboarding
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  cipPhoto?: string; // Photo carte CIP / NPI / CNIB
  vehiclePhoto?: string; // Photo de la moto / immatriculation
  selfiePhoto?: string; // Photo du livreur
  verificationSubmittedAt?: string;
  rejectionReason?: string;
  walletBalance?: number; // Solde portefeuille virtuel en FCFA
  isCertified?: boolean;
}

export interface Store {
  id: string;
  name: string;
  category: CategoryType;
  ownerId: string;
  logo: string;
  coverImage: string;
  rating: number;
  deliveryTime: string;
  address: string;
  city: string;
  phone: string;
  momoPhone?: string; // Numéro Mobile Money MoMo/Moov/Celtis de la boutique
  lat?: number;
  lng?: number;
  isOpen: boolean;
  isCertified?: boolean; // Certified by Admin
  description?: string;
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  description: string;
  price: number; // In FCFA
  category: CategoryType;
  image: string;
  inStock: boolean;
  unit?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 
  | 'pending'           // Client placed order, waiting for store acceptance
  | 'confirmed'         // Store accepted, preparing
  | 'rider_requested'   // Store requested a delivery rider
  | 'rider_assigned'    // Rider accepted delivery
  | 'picked_up'         // Rider picked up items from store
  | 'delivering'        // Rider on the way to client
  | 'delivered'         // Order delivered successfully
  | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  code: string; // e.g. #LVK-8921
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  clientLat?: number;
  clientLng?: number;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeLat?: number;
  storeLng?: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  distanceKm?: number;
  driverEarnings?: number;
  platformFee?: number;
  storeCommissionFee?: number; // 5% of subtotal (LIVRIKO commission)
  storeNetEarnings?: number;   // 95% of subtotal (Vendeur payout)
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'cash' | 'momo_mtn' | 'momo_moov' | 'orange_money' | 'celtis_cash';
  storePaymentMode?: 'online' | 'delivery';
  paymentSource?: 'wallet' | 'direct_momo' | 'cash';
  momoTransactionRef?: string;
  paymentReceiptPhoto?: string;
  paymentStatus: 'pending' | 'paid';
  deliveryFeePaymentStatus?: 'pending' | 'paid';
  createdAt: string;
  startedAt?: string;       // Timestamp when trip started ("Démarrer la course")
  finalDistanceKm?: number; // Distance mesurée au compteur à la fin de la course
  deliveredAt?: string;     // Timestamp when trip ended ("Terminer la livraison")
  durationMinutes?: number; // Duration of delivery in minutes
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderPhoto?: string;
  riderVehicle?: string;
  currentRiderLat?: number; // Live GPS latitude of rider during trip
  currentRiderLng?: number; // Live GPS longitude of rider during trip
  cancellationReason?: string;
  notes?: string;
  estimatedMinutes?: number;
}

export type ChatChannel = 'client-vendeur' | 'vendeur-livreur' | 'livreur-client' | 'assistant';

export interface ChatMessage {
  id: string;
  orderId?: string;
  channel: ChatChannel;
  senderRole: UserRole | 'bot';
  senderId?: string;
  text: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRole: UserRole;
  orderId?: string;
}
