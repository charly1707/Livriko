import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock, MapPin, ArrowRight,
  Store as StoreIcon, Truck, ChevronRight, ShieldCheck,
  Utensils, ShoppingBag, ShoppingCart, Sparkles, Cpu, LayoutGrid,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, Store, CategoryType } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { StoreDetailView } from './StoreDetailView';
import { ServiceExpressView } from './ServiceExpressView';
import { onImageError, resolveMediaUrl, mediaSrc } from '../../utils/media';
import { RatingStars } from './RatingStars';

const SERVICE_CATEGORIES = new Set<CategoryType>(['autres', 'services']);

type CategoryFilter = 'all' | CategoryType | 'mode-beaute';

const CATEGORY_TILES: {
  id: CategoryFilter;
  label: string;
  sub: string;
  icon: React.ElementType;
  idle: string;
}[] = [
  { id: 'all', label: 'Tout', sub: 'Le marché', icon: LayoutGrid, idle: 'bg-zinc-100 text-zinc-700' },
  { id: 'restaurants', label: 'Manger', sub: 'Restaurants', icon: Utensils, idle: 'bg-amber-50 text-amber-700' },
  { id: 'boutiques', label: 'Shopping', sub: 'Boutiques', icon: ShoppingBag, idle: 'bg-sky-50 text-sky-700' },
  { id: 'supermarches', label: 'Courses', sub: 'Marchés', icon: ShoppingCart, idle: 'bg-violet-50 text-violet-700' },
  { id: 'mode-beaute', label: 'Style', sub: 'Mode', icon: Sparkles, idle: 'bg-rose-50 text-rose-700' },
  { id: 'electronique', label: 'Tech', sub: 'Électro', icon: Cpu, idle: 'bg-cyan-50 text-cyan-700' },
];

const matchesCategoryFilter = (category: CategoryType, filter: CategoryFilter) => {
  if (filter === 'all') return true;
  if (filter === 'mode-beaute') return category === 'mode' || category === 'beaute';
  return category === filter;
};

export const ClientView: React.FC<{ onOpenCart: () => void; onOpenChat: () => void }> = ({ onOpenCart, onOpenChat }) => {
  const {
    stores,
    products,
    activeCategory,
    setActiveCategory,
    searchQuery,
    orders,
    setActiveTrackingOrder,
    currentUser,
  } = useApp();

  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [autoAddedProduct, setAutoAddedProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    const resetBrowse = () => setCategoryFilter('all');
    window.addEventListener('livriko:reset-browse', resetBrowse);
    return () => window.removeEventListener('livriko:reset-browse', resetBrowse);
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const productImageByStoreId = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      const image = resolveMediaUrl(product.image);
      if (!product.storeId || !image) continue;
      if (!map.has(product.storeId)) map.set(product.storeId, image);
      const bare = product.storeId.replace(/^store-/, '');
      if (!map.has(bare)) map.set(bare, image);
      if (!map.has(`store-${bare}`)) map.set(`store-${bare}`, image);
    }
    return map;
  }, [products]);

  const enrichStoreMedia = (store: Store): Store => {
    const fallback =
      productImageByStoreId.get(store.id)
      || productImageByStoreId.get(store.id.replace(/^store-/, ''))
      || productImageByStoreId.get(`store-${store.id.replace(/^store-/, '')}`)
      || '';
    const logo = resolveMediaUrl(store.logo) || fallback;
    const cover = resolveMediaUrl(store.coverImage) || logo || fallback;
    return { ...store, logo, coverImage: cover };
  };

  const storesFromProducts = useMemo(() => products.reduce<Store[]>((result, product) => {
    if (result.some(store => store.id === product.storeId)) return result;
    result.push(enrichStoreMedia({
      id: product.storeId,
      name: product.storeName || 'Boutique Livriko',
      category: product.category,
      ownerId: product.storeId.replace(/^store-/, ''),
      logo: product.image,
      coverImage: product.image,
      ratingAverage: 0,
      reviewCount: 0,
      deliveryTime: '30-45 min',
      address: 'Lokossa',
      city: 'Lokossa',
      phone: '',
      isOpen: true,
      isCertified: false,
    }));
    return result;
  }, []), [products, productImageByStoreId]);

  const allStores = useMemo(() => [
    ...stores.map(enrichStoreMedia),
    ...storesFromProducts.filter(productStore => !stores.some(store =>
      store.id === productStore.id
      || store.id.replace(/^store-/, '') === productStore.id.replace(/^store-/, ''),
    )),
  ], [stores, storesFromProducts]);

  const sameStoreId = (a: string, b: string) =>
    a === b || a.replace(/^store-/, '') === b.replace(/^store-/, '');

  const getStoreProducts = (store: Store) => products.filter(p =>
    sameStoreId(p.storeId, store.id) || p.storeName.toLowerCase() === store.name.toLowerCase(),
  );

  const boutiqueStores = allStores.filter(store => !SERVICE_CATEGORIES.has(store.category));

  const filterStores = (list: Store[]) => list.filter(store => {
    const storeProducts = getStoreProducts(store);
    const matchesCategory = categoryFilter === 'all'
      || matchesCategoryFilter(store.category, categoryFilter)
      || storeProducts.some(product => matchesCategoryFilter(product.category, categoryFilter));
    const matchesSearch = !normalizedSearch
      || store.name.toLowerCase().includes(normalizedSearch)
      || storeProducts.some(product =>
        product.name.toLowerCase().includes(normalizedSearch)
        || product.description.toLowerCase().includes(normalizedSearch),
      );
    return matchesCategory && matchesSearch;
  });

  const filteredBoutiques = filterStores(boutiqueStores);

  const activeOrder = orders.find(
    o => String(o.clientId) === String(currentUser?.id) && !['delivered', 'cancelled'].includes(o.status),
  );

  const openStore = (store: Store) => {
    setViewingStore(store);
    setAutoAddedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectCategoryTile = (id: CategoryFilter) => {
    setCategoryFilter(id);
  };

  if (viewingStore) {
    return (
      <div className="pb-16 overflow-x-hidden bg-[#f7f7f5] min-h-screen">
        <StoreDetailView
          store={viewingStore}
          products={products}
          onBack={() => { setViewingStore(null); setAutoAddedProduct(null); }}
          onOpenCart={onOpenCart}
          onOpenChat={onOpenChat}
          autoAddedProduct={autoAddedProduct}
        />
      </div>
    );
  }

  if (activeCategory === 'autres') {
    return <ServiceExpressView onBack={() => setActiveCategory('all')} />;
  }

  const firstName = (currentUser?.name || 'client').split(' ')[0];
  const activeTileLabel = CATEGORY_TILES.find(t => t.id === categoryFilter)?.sub || 'Tout';
  const featuredStore = filteredBoutiques.find(s => s.isCertified)
    || filteredBoutiques.find(s => s.isOpen)
    || filteredBoutiques[0];
  const otherStores = filteredBoutiques.filter(s => s.id !== featuredStore?.id);

  const renderStoreCard = (store: Store, featured = false) => {
    const storeProducts = getStoreProducts(store);
    const categoryLabel = CATEGORIES.find(c => c.id === store.category)?.label || 'Commerce';
    const bannerSrc = mediaSrc(store.coverImage || store.logo);
    const logoSrc = mediaSrc(store.logo || store.coverImage);
    const logoAsBanner = !store.coverImage || store.coverImage === store.logo;
    return (
      <article
        key={store.id}
        onClick={() => openStore(store)}
        className={`group bg-white overflow-hidden cursor-pointer shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_36px_rgba(15,23,42,0.1)] transition ${
          featured ? 'rounded-[28px]' : 'rounded-[24px]'
        }`}
      >
        <div className={`relative overflow-hidden ${featured ? 'h-56 sm:h-72' : 'h-40 sm:h-44'} ${
          logoAsBanner ? 'bg-[#fff7ed] flex items-center justify-center' : 'bg-zinc-100'
        }`}>
          <img
            src={bannerSrc}
            alt={store.name}
            onError={onImageError}
            className={logoAsBanner
              ? `max-h-[82%] max-w-[82%] object-contain ${featured ? 'p-4' : 'p-3'}`
              : 'w-full h-full object-cover group-hover:scale-[1.04] transition duration-500'}
            loading="lazy"
          />
          <div className={`absolute inset-0 ${logoAsBanner ? 'bg-gradient-to-t from-black/20 via-transparent to-transparent' : 'bg-gradient-to-t from-black/55 via-black/10 to-transparent'}`} />
          {featured && (
            <span className="absolute top-3 left-3 h-7 px-3 rounded-full bg-[#ff8a1f] text-white text-[11px] font-semibold flex items-center">
              En vedette
            </span>
          )}
          {store.isCertified && (
            <span className="absolute top-3 right-3 h-7 px-2.5 rounded-full bg-white text-emerald-600 text-[11px] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Certifié
            </span>
          )}
          <span className={`absolute bottom-3 left-3 h-6 px-2.5 rounded-full text-[11px] font-semibold ${
            store.isOpen ? 'bg-emerald-500 text-white' : 'bg-white/90 text-zinc-700'
          }`}>
            {store.isOpen ? 'Ouvert' : 'Fermé'}
          </span>
        </div>
        <div className={`flex items-center gap-3 ${featured ? 'p-4 sm:p-5' : 'p-3.5'}`}>
          <img
            src={logoSrc}
            alt=""
            onError={onImageError}
            className="w-12 h-12 rounded-2xl object-contain bg-white p-1 shrink-0 ring-2 ring-white shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold text-zinc-900 truncate ${featured ? 'text-lg' : 'text-[15px]'}`}>
              {store.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {store.address || store.city} · {categoryLabel}
            </p>
            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-zinc-500">
              {(store.reviewCount ?? 0) > 0 && (
                <RatingStars
                  rating={store.ratingAverage ?? 0}
                  size="sm"
                  showValue
                  reviewCount={store.reviewCount}
                />
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {store.deliveryTime}
              </span>
              <span>{storeProducts.length} art.</span>
            </div>
          </div>
          <span className="w-10 h-10 rounded-full bg-[#ff8a1f] text-white flex items-center justify-center shrink-0">
            <ChevronRight className="w-5 h-5" />
          </span>
        </div>
      </article>
    );
  };

  return (
    <div className="pb-10 overflow-x-hidden bg-[#f7f7f5] min-h-screen">
      {activeOrder && (
        <div className="sticky top-14 sm:top-16 z-40 bg-white/90 backdrop-blur border-b border-zinc-200">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-full bg-[#ff8a1f] text-white flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#ff8a1f]">
                  En cours · {activeOrder.code}
                </p>
                <p className="text-sm font-semibold text-zinc-900 truncate">{activeOrder.storeName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { setActiveTrackingOrder(activeOrder); onOpenChat(); }}
                className="h-9 px-4 rounded-full border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition"
              >
                Discuter
              </button>
              <button
                type="button"
                onClick={() => setActiveTrackingOrder(activeOrder)}
                className="h-9 px-4 rounded-full bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-xs font-semibold flex items-center gap-1 transition"
              >
                Suivre <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-5 pt-6 space-y-6">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Marché · Lokossa
          </p>
          <h1 className="mt-1 text-[1.75rem] sm:text-[2rem] font-semibold tracking-tight text-zinc-900">
            {currentUser ? `Salut ${firstName}, voici les boutiques` : 'Les boutiques à Lokossa'}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {filteredBoutiques.length} boutique{filteredBoutiques.length > 1 ? 's' : ''}
            {categoryFilter !== 'all' && ` · ${activeTileLabel}`}
            {normalizedSearch && ` · « ${searchQuery} »`}
          </p>
        </header>

        <nav aria-label="Catégories" className="flex justify-between gap-2 overflow-x-auto pb-1">
          {CATEGORY_TILES.map(tile => {
            const Icon = tile.icon;
            const active = categoryFilter === tile.id;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => selectCategoryTile(tile.id)}
                className="flex flex-col items-center gap-2 min-w-[64px] shrink-0"
              >
                <span
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                    active
                      ? 'bg-[#ff8a1f] text-white shadow-md shadow-orange-200'
                      : `${tile.idle} hover:scale-105`
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </span>
                <span className={`text-[11px] font-semibold ${active ? 'text-zinc-900' : 'text-zinc-500'}`}>
                  {tile.label}
                </span>
              </button>
            );
          })}
        </nav>

        <section id="results-section" className="space-y-4">
          {filteredBoutiques.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-14">
              <div className="w-16 h-16 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mb-4">
                <StoreIcon className="w-7 h-7" />
              </div>
              <p className="text-base font-semibold text-zinc-900">Aucune boutique ici</p>
              <p className="text-sm text-zinc-500 mt-1 max-w-xs">
                {categoryFilter === 'all'
                  ? 'Les boutiques apparaîtront ici dès qu’elles seront en ligne.'
                  : 'Rien dans cette catégorie pour le moment.'}
              </p>
              {categoryFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className="mt-5 h-11 px-6 rounded-full bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-sm font-semibold shadow-sm shadow-orange-200 transition"
                >
                  Voir toutes les boutiques
                </button>
              )}
            </div>
          ) : (
            <>
              {featuredStore && renderStoreCard(featuredStore, true)}
              {otherStores.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {otherStores.map(store => renderStoreCard(store))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};
