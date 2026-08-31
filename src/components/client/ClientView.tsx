import React, { useState, useMemo } from 'react';
import {
  Star, Clock, MapPin, Search, Plus, ArrowRight,
  Store as StoreIcon, Truck, Package, ChevronRight, ShieldCheck, Wrench,
  Utensils, ShoppingBag, ShoppingCart, Sparkles, Grid3X3,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, Store, CategoryType } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { StoreDetailView } from './StoreDetailView';
import { ServiceExpressView } from './ServiceExpressView';
import { onImageError, resolveMediaUrl, mediaSrc } from '../../utils/media';

const SERVICE_CATEGORIES = new Set<CategoryType>(['autres', 'services']);

const PAGE = 'bg-[#f4f0e8]';
const CARD = 'bg-[#fffdf8] border border-[#e6dac8]';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  restaurants: Utensils,
  boutiques: ShoppingBag,
  supermarches: ShoppingCart,
  autres: Package,
  mode: ShoppingBag,
  electronique: Grid3X3,
  beaute: Sparkles,
  services: Wrench,
};

export const ClientView: React.FC<{ onOpenCart: () => void; onOpenChat: () => void }> = ({ onOpenCart, onOpenChat }) => {
  const {
    stores,
    products,
    activeCategory,
    setActiveCategory,
    searchQuery,
    addToCart,
    orders,
    setActiveTrackingOrder,
    currentUser,
  } = useApp();

  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [autoAddedProduct, setAutoAddedProduct] = useState<Product | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

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
      rating: 5,
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
  const serviceStores = allStores.filter(store => SERVICE_CATEGORIES.has(store.category));

  const filterStores = (list: Store[]) => list.filter(store => {
    const storeProducts = getStoreProducts(store);
    const matchesCategory = activeCategory === 'all'
      || store.category === activeCategory
      || storeProducts.some(product => product.category === activeCategory);
    const matchesSearch = !normalizedSearch
      || store.name.toLowerCase().includes(normalizedSearch)
      || storeProducts.some(product =>
        product.name.toLowerCase().includes(normalizedSearch)
        || product.description.toLowerCase().includes(normalizedSearch),
      );
    return matchesCategory && matchesSearch;
  });

  const filteredBoutiques = filterStores(boutiqueStores);
  const filteredServiceStores = filterStores(serviceStores);

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = !normalizedSearch
      || product.name.toLowerCase().includes(normalizedSearch)
      || product.description.toLowerCase().includes(normalizedSearch)
      || product.storeName.toLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  }).filter(p => !SERVICE_CATEGORIES.has(p.category));

  const activeOrder = orders.find(
    o => String(o.clientId) === String(currentUser?.id) && !['delivered', 'cancelled'].includes(o.status),
  );

  const openStore = (store: Store) => {
    setViewingStore(store);
    setAutoAddedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product);
    setAddedItemIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedItemIds(prev => ({ ...prev, [product.id]: false })), 1500);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (viewingStore) {
    return (
      <div className={`pb-16 overflow-x-hidden ${PAGE} min-h-screen`}>
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

  return (
    <div className={`pb-8 overflow-x-hidden ${PAGE} min-h-screen`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">

        {/* Welcome + order */}
        <header className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff8a1f]">
                Marché · Lokossa
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {currentUser ? `Bonjour, ${firstName}` : 'Explorer Livriko'}
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                Boutiques, restaurants et services express — livraison locale.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#e6dac8]">
                <StoreIcon className="w-3.5 h-3.5 text-[#ff8a1f]" />
                {filteredBoutiques.length} commerces
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#e6dac8]">
                <Package className="w-3.5 h-3.5 text-[#ff8a1f]" />
                {filteredProducts.length} articles
              </span>
            </div>
          </div>

          {activeOrder && (
            <div
              className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white"
              style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #1a3d66 100%)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#ff8a1f] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#ffb86a]">
                    Commande en cours · {activeOrder.code}
                  </p>
                  <p className="text-sm font-semibold truncate mt-0.5">{activeOrder.storeName}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setActiveTrackingOrder(activeOrder); onOpenChat(); }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition"
                >
                  Discuter
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTrackingOrder(activeOrder)}
                  className="px-4 py-2 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-sm font-bold flex items-center gap-1 transition"
                >
                  Suivre <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Categories */}
        <section>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="text-base font-black text-slate-900">Catégories</h2>
            {activeCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="text-xs font-bold text-[#ff8a1f] hover:underline"
              >
                Tout afficher
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition border ${
                activeCategory === 'all'
                  ? 'bg-[#0c1a2e] text-white border-[#0c1a2e]'
                  : 'bg-white text-slate-600 border-[#e6dac8] hover:border-[#ff8a1f]/50'
              }`}
            >
              Tout
            </button>
            {CATEGORIES.map(cat => {
              const Icon = CATEGORY_ICONS[cat.id] || Package;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (cat.id === 'autres') {
                      setActiveCategory('autres');
                    } else {
                      setActiveCategory(cat.id);
                      scrollToSection('boutiques-section');
                    }
                  }}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border ${
                    active
                      ? 'bg-[#ff8a1f] text-white border-[#ff8a1f]'
                      : 'bg-white text-slate-600 border-[#e6dac8] hover:border-[#ff8a1f]/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Boutiques */}
        <section id="boutiques-section" className="scroll-mt-28">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Boutiques & commerces</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {filteredBoutiques.length} disponible(s)
                {normalizedSearch && (
                  <span className="inline-flex items-center gap-1 ml-2 text-[#ff8a1f]">
                    <Search className="w-3.5 h-3.5" /> « {searchQuery} »
                  </span>
                )}
              </p>
            </div>
          </div>

          {filteredBoutiques.length === 0 ? (
            <div className={`rounded-2xl border border-dashed border-[#e6dac8] bg-[#faf6ef] p-12 text-center`}>
              <StoreIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">Aucune boutique trouvée</p>
              <p className="text-xs text-slate-400 mt-1">Essayez une autre catégorie ou recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredBoutiques.map(store => {
                const storeProducts = getStoreProducts(store);
                const categoryLabel = CATEGORIES.find(c => c.id === store.category)?.label || 'Commerce';
                return (
                  <article
                    key={store.id}
                    onClick={() => openStore(store)}
                    className={`${CARD} rounded-2xl overflow-hidden hover:shadow-md hover:border-[#ff8a1f]/40 transition cursor-pointer group`}
                  >
                    <div className="relative h-36 bg-slate-200">
                      <img
                        src={mediaSrc(store.coverImage || store.logo)}
                        alt={store.name}
                        onError={onImageError}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <span className="absolute top-2.5 right-2.5 bg-white/95 px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {store.rating.toFixed(1)}
                      </span>
                      {store.isCertified && (
                        <span className="absolute top-2.5 left-2.5 bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Certifié
                        </span>
                      )}
                      <span className={`absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        store.isOpen ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}>
                        {store.isOpen ? 'Ouvert' : 'Fermé'}
                      </span>
                    </div>
                    <div className="p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={mediaSrc(store.logo || store.coverImage)}
                          alt=""
                          onError={onImageError}
                          className="w-9 h-9 rounded-lg object-cover border border-[#e6dac8] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-[#ff8a1f] transition">
                            {store.name}
                          </h3>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" /> {store.address || store.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-[#ff8a1f]/10 text-[#e86f00] font-bold">
                          {categoryLabel}
                        </span>
                        <span className="text-slate-400">{storeProducts.length} art.</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#efe6d8] text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#ff8a1f]" /> {store.deliveryTime}
                        </span>
                        <span className="text-[#ff8a1f] font-bold flex items-center gap-0.5">
                          Voir <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Services */}
        <section id="services-section" className="scroll-mt-28">
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900">Services</h2>
            <p className="text-sm text-slate-500 mt-0.5">Express, courses et missions locales</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {[
              {
                title: 'Services Express',
                desc: 'Colis, documents, courses',
                icon: Package,
                action: () => setActiveCategory('autres'),
                dark: true,
              },
              {
                title: 'Prestataires',
                desc: `${serviceStores.length} disponible(s)`,
                icon: Wrench,
                action: () => scrollToSection('services-list'),
                dark: false,
              },
              {
                title: 'Livraison rapide',
                desc: 'Dès 300 FCFA · tarif au km',
                icon: Truck,
                action: () => setActiveCategory('autres'),
                dark: false,
              },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.action}
                  className={`text-left rounded-2xl p-4 transition border group ${
                    item.dark
                      ? 'bg-[#0c1a2e] border-[#0c1a2e] text-white hover:bg-[#132d4d]'
                      : `${CARD} hover:shadow-md hover:border-[#ff8a1f]/40`
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${
                    item.dark ? 'bg-[#ff8a1f]/20 text-[#ffb86a]' : 'bg-[#ff8a1f]/10 text-[#ff8a1f]'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className={`text-sm font-black ${item.dark ? 'text-white' : 'text-slate-900'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-xs mt-1 ${item.dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.desc}
                  </p>
                  <span className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${
                    item.dark ? 'text-[#ffb86a]' : 'text-[#ff8a1f]'
                  }`}>
                    Continuer <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </span>
                </button>
              );
            })}
          </div>

          {filteredServiceStores.length > 0 && (
            <div id="services-list" className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 scroll-mt-28">
              {filteredServiceStores.map(store => {
                const storeProducts = getStoreProducts(store);
                return (
                  <article
                    key={store.id}
                    onClick={() => openStore(store)}
                    className={`${CARD} rounded-2xl p-4 flex items-center gap-3 hover:shadow-md hover:border-[#ff8a1f]/40 transition cursor-pointer group`}
                  >
                    <img
                      src={mediaSrc(store.logo || store.coverImage)}
                      alt=""
                      onError={onImageError}
                      className="w-14 h-14 rounded-xl object-cover border border-[#e6dac8] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-[#ff8a1f] transition">
                        {store.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{store.address || store.city}</p>
                      <p className="text-[11px] text-[#ff8a1f] font-bold mt-1">
                        {storeProducts.length} offre(s) · {store.deliveryTime}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#ff8a1f] shrink-0" />
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Articles */}
        {filteredProducts.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-black text-slate-900">Articles populaires</h2>
              <p className="text-sm text-slate-500 mt-0.5">Ajoutez directement au panier</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map(product => {
                const isAdded = addedItemIds[product.id];
                const store = allStores.find(s => sameStoreId(s.id, product.storeId));
                return (
                  <article
                    key={product.id}
                    onClick={() => { if (store) openStore(store); }}
                    className={`${CARD} rounded-2xl overflow-hidden hover:shadow-md hover:border-[#ff8a1f]/40 transition cursor-pointer group`}
                  >
                    <div className="aspect-[4/3] relative bg-slate-100">
                      <img
                        src={mediaSrc(product.image)}
                        alt={product.name}
                        onError={onImageError}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                      />
                      <span className="absolute top-2 left-2 max-w-[85%] truncate bg-[#0c1a2e]/85 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {product.storeName}
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-[#ff8a1f] transition">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 hidden sm:block">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-[#efe6d8] gap-2">
                        <span className="text-sm font-black text-[#ff8a1f] truncate">
                          {product.price.toLocaleString()} F
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(e, product)}
                          className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                            isAdded
                              ? 'bg-emerald-500 text-white'
                              : 'bg-[#0c1a2e] hover:bg-[#132d4d] text-white'
                          }`}
                        >
                          {isAdded ? 'OK' : <><Plus className="w-3.5 h-3.5" /></>}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
