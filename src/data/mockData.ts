import { Store, Product, Order, User, CategoryType } from '../types';

export const CATEGORIES: { id: CategoryType; label: string; icon: string; color: string; description: string }[] = [
  { id: 'restaurants', label: 'Restaurants', icon: 'Utensils', color: 'bg-orange-500', description: 'Plats cuisinés, grillades & spécialités béninoises' },
  { id: 'boutiques', label: 'Boutiques', icon: 'ShoppingBag', color: 'bg-blue-600', description: 'Accessoires, high-tech et mode' },
  { id: 'pharmacies', label: 'Pharmacies', icon: 'Cross', color: 'bg-emerald-600', description: 'Médicaments & soins de santé urgents' },
  { id: 'supermarches', label: 'Supermarchés', icon: 'ShoppingCart', color: 'bg-indigo-600', description: 'Épicerie, boissons, fruits & entretien' },
  { id: 'autres', label: 'Services Express', icon: 'Grid', color: 'bg-slate-700', description: 'Coursiers & livraison de colis' },
];

export const MOCK_USERS: User[] = [
  {
    id: 'u-client-1',
    name: 'Kofi Mensah',
    email: 'kofi.m@gmail.com',
    password: '123456',
    phone: '+229 97 12 34 56',
    role: 'client',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    walletBalance: 25000,
    location: { lat: 6.6382, lng: 1.7167, address: 'Quartier Agamé, Lokossa' },
  },
  {
    id: 'u-livreur-1',
    name: 'Samuel Bio',
    email: 'samuel.bio@livriko.com',
    password: '123456',
    phone: '+229 95 00 11 22',
    role: 'livreur',
    vehicle: 'Moto TVS HLX 125',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    verificationStatus: 'approved',
    location: { lat: 6.6391, lng: 1.7195, address: 'Quartier Agamé, Lokossa' },
  },
  {
    id: 'u-livreur-2',
    name: 'Aminata S. ',
    email: 'aminata.s@livriko.com',
    password: '123456',
    phone: '+229 90 55 66 77',
    role: 'livreur',
    vehicle: 'Moto Yamaha 125',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    verificationStatus: 'approved',
    location: { lat: 6.6435, lng: 1.7110, address: 'Zone 6, Lokossa' },
  },
  {
    id: 'u-livreur-3',
    name: 'Emile D.',
    email: 'emile.d@livriko.com',
    password: '123456',
    phone: '+229 96 77 88 99',
    role: 'livreur',
    vehicle: 'Moto Honda XR 150',
    avatar: 'https://images.unsplash.com/photo-1546456073-92b8f0a9a7e8?auto=format&fit=crop&w=200&q=80',
    verificationStatus: 'approved',
    location: { lat: 6.6357, lng: 1.7180, address: 'Route de Grand-Popo' },
  },
  {
    id: 'u-admin-1',
    name: 'Service Client Livriko',
    email: 'chart@gmail.com',
    password: '1978100',
    phone: '+229 01 96 73 03',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
  },
];

export const MOCK_STORES: Store[] = [];

export const MOCK_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = []; 

