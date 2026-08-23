import { Store, Product, Order, User, CategoryType } from '../types';

export const CATEGORIES: { id: CategoryType; label: string; icon: string; color: string; description: string }[] = [
  { id: 'restaurants', label: 'Restaurants', icon: 'Utensils', color: 'bg-orange-500', description: 'Plats & cuisine locale' },
  { id: 'boutiques', label: 'Boutiques', icon: 'ShoppingBag', color: 'bg-blue-600', description: 'Mode, accessoires & achats' },
  { id: 'supermarches', label: 'Supermarchés', icon: 'ShoppingCart', color: 'bg-indigo-600', description: 'Épicerie & produits du quotidien' },
  { id: 'autres', label: 'Services Express', icon: 'Grid', color: 'bg-slate-700', description: 'Colis, courses & services rapides' },
  { id: 'mode', label: 'Mode / Vêtements', icon: 'ShoppingBag', color: 'bg-pink-600', description: 'Vêtements, chaussures & style' },
  { id: 'electronique', label: 'Électronique', icon: 'Grid', color: 'bg-cyan-600', description: 'Téléphones & équipements' },
  { id: 'beaute', label: 'Beauté', icon: 'Sparkles', color: 'bg-violet-600', description: 'Soins, beauté & bien-être' },
  { id: 'services', label: 'Autres services', icon: 'Grid', color: 'bg-slate-600', description: 'Services locaux à la demande' },
];

export const MOCK_USERS: User[] = [];
export const MOCK_STORES: Store[] = [];
export const MOCK_PRODUCTS: Product[] = [];
export const INITIAL_ORDERS: Order[] = [];

