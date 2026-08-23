import React, { useState } from 'react';
import { 
  ShoppingBag, Star, Clock, ShieldCheck, MapPin, Search, Plus, Check, ArrowRight, ArrowLeft, Utensils, Cross, ShoppingCart, Grid, Phone, Truck, Filter, Heart, Sparkles, ThumbsUp, UserCheck, Smile, Store as StoreIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, Store, CategoryType } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { HeroCarousel } from './HeroCarousel';
import { OrderTrackingModal } from './OrderTrackingModal';
import { StoreDetailView } from './StoreDetailView';
import { ServiceExpressView } from './ServiceExpressView';
import { onImageError, resolveMediaUrl, mediaSrc } from '../../utils/media';

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

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [autoAddedProduct, setAutoAddedProduct] = useState<Product | null>(null);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const productImageByStoreId = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      const image = resolveMediaUrl(product.image);
      if (!product.storeId || !image) continue;
      if (!map.has(product.storeId)) {
        map.set(product.storeId, image);
      }
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
    return {
      ...store,
      logo,
      coverImage: cover,
    };
  };

  // Keep the company-first flow usable while store records are loading from the API.
  const storesFromProducts = products.reduce<Store[]>((result, product) => {
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
  }, []);

  const allStores = [
    ...stores.map(enrichStoreMedia),
    ...storesFromProducts.filter(productStore => !stores.some(store =>
      store.id === productStore.id
      || store.id.replace(/^store-/, '') === productStore.id.replace(/^store-/, ''),
    )),
  ];
  const filteredStores = allStores.filter(store => {
    const storeProducts = products.filter(product =>
      product.storeId === store.id
      || product.storeId.replace(/^store-/, '') === store.id.replace(/^store-/, ''),
    );
    const matchesCategory = activeCategory === 'all' || store.category === activeCategory || storeProducts.some(product => product.category === activeCategory);
    const matchesSearch = !normalizedSearch || store.name.toLowerCase().includes(normalizedSearch) || storeProducts.some(product =>
      product.name.toLowerCase().includes(normalizedSearch) || product.description.toLowerCase().includes(normalizedSearch)
    );
    return matchesCategory && matchesSearch;
  });

  const matchingProducts = products.filter(product => normalizedSearch && (
    product.name.toLowerCase().includes(normalizedSearch)
    || product.description.toLowerCase().includes(normalizedSearch)
    || product.storeName.toLowerCase().includes(normalizedSearch)
  ));

  const filteredProducts: Product[] = [];

  const handleAddToCart = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    addToCart(p);
    setAddedItemIds(prev => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [p.id]: false }));
    }, 1500);
  };

  const handleSelectProductAndGoToStore = (product: Product) => {
    const foundStore = allStores.find(
      s => s.id === product.storeId
        || s.id.replace(/^store-/, '') === product.storeId.replace(/^store-/, '')
        || s.name.toLowerCase() === product.storeName.toLowerCase(),
    );

    const storeFromProduct: Store = foundStore || enrichStoreMedia({
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
    });

    setAutoAddedProduct(null);
    setViewingStore(storeFromProduct);
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find latest client order for floating live tracking bar
  const activeOrder = orders.find(
    (o) =>
      String(o.clientId) === String(currentUser?.id) &&
      !['delivered', 'cancelled'].includes(o.status),
  );

  if (activeCategory === 'autres') {
    return <ServiceExpressView onBack={() => setActiveCategory('all')} />;
  }

  // If currently viewing a dedicated store space
  if (viewingStore) {
    return (
      <div className="pb-16 overflow-x-hidden bg-slate-50 min-h-screen">
        <StoreDetailView
          store={viewingStore}
          products={products}
          onBack={() => {
            setViewingStore(null);
            setAutoAddedProduct(null);
          }}
          onOpenCart={onOpenCart}
          onOpenChat={onOpenChat}
          autoAddedProduct={autoAddedProduct}
        />
      </div>
    );
  }

  return (
    <div className="pb-16 overflow-x-hidden">
      
      {/* Fullscreen Full-Bleed Edge-to-Edge Hero Slider */}
      <HeroCarousel 
        onSelectCategory={setActiveCategory} 
        onSelectStore={(storeId) => {
          const found = allStores.find(s =>
            s.id === storeId
            || s.id.replace(/^store-/, '') === String(storeId).replace(/^store-/, ''),
          );
          if (found) {
            setViewingStore(found);
            setAutoAddedProduct(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* Main Page Content below Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 space-y-12">

        {/* Floating Active Order Tracker Bar */}
        {activeOrder && activeOrder.status !== 'delivered' && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">Commande en cours</span>
                  <span className="text-xs text-slate-400 font-mono">{activeOrder.code}</span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  <strong className="text-white">{activeOrder.storeName}</strong> — Livré à {activeOrder.clientAddress}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTrackingOrder(activeOrder)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition shrink-0"
            >
              <span>Suivre la livraison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      {/* Category Grid Cards */}
      <div id="categories-section" className="scroll-mt-28">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Catégories du Marché</h2>
            <p className="text-xs text-slate-500">{CATEGORIES.length} catégories disponibles</p>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
            <span>Retour en haut</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map(cat => {
            const isSelected = activeCategory === cat.id;
            const count = allStores.filter(store => store.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const el = document.getElementById('entreprises-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`p-4 rounded-2xl text-left border transition flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-500/20 shadow-md'
                    : 'border-slate-200/90 bg-white hover:border-orange-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs ${cat.color}`}>
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-orange-600 transition">
                    {count} articles
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900">{cat.label}</h3>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{cat.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Company Directory */}
      <div id="entreprises-section" className="scroll-mt-28">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {normalizedSearch ? `Entreprises et résultats pour « ${searchQuery} »` : 'Entreprises disponibles'}
            </h2>
            <p className="text-xs text-slate-500">Choisissez une entreprise pour consulter son catalogue complet</p>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
            <span>Retour en haut</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredStores.map(store => (
            <div 
              key={store.id} 
              onClick={() => {
                setViewingStore(store);
                setAutoAddedProduct(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="h-28 relative">
                <img
                  src={mediaSrc(store.coverImage || store.logo)}
                  alt={store.name}
                  onError={onImageError}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {store.rating}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <img
                    src={mediaSrc(store.logo || store.coverImage)}
                    alt={store.name}
                    onError={onImageError}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-slate-900 truncate group-hover:text-orange-500 transition">{store.name}</h3>
                    <p className="text-[10px] text-slate-500 truncate">{store.address}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                  <span className="text-orange-600 font-semibold">{CATEGORIES.find(category => category.id === store.category)?.label || 'Autres services'}</span>
                  <span>⭐ {store.rating.toFixed(1)} (avis)</span>
                  <span>{store.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}</span>
                </div>

                {normalizedSearch && matchingProducts.filter(product => product.storeId === store.id).length > 0 && (
                  <p className="text-[10px] text-slate-500 truncate">
                    Produit correspondant : {matchingProducts.filter(product => product.storeId === store.id).map(product => product.name).join(', ')}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-600">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {store.deliveryTime}</span>
                  <span className="text-orange-600 font-semibold flex items-center gap-1">Voir la boutique →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products are intentionally shown only inside StoreDetailView. */}
      {false && <>
      <div id="products-section" className="scroll-mt-28">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {activeCategory === 'all' ? 'Tous les produits disponibles' : `Produits - ${CATEGORIES.find(c => c.id === activeCategory)?.label}`}
            </h2>
            <p className="text-xs text-slate-500">
              {filteredProducts.length} produit(s) en stock avec livraison rapide • Cliquez sur un plat pour ouvrir la boutique
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeCategory !== 'all' && (
              <button
                onClick={() => setActiveCategory('all')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Tous les produits</span>
              </button>
            )}

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
              <span>Retour en haut</span>
            </button>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <p className="text-sm font-semibold">Aucun produit ne correspond à votre recherche.</p>
            <button
              onClick={() => { setActiveCategory('all'); }}
              className="mt-3 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold"
            >
              Réinitialiser le filtre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map(product => {
              const isAdded = addedItemIds[product.id];

              return (
                <div
                  key={product.id}
                  onClick={() => handleSelectProductAndGoToStore(product)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Product Image */}
                    <div className="h-44 relative bg-slate-100 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1">
                        <StoreIcon className="w-3 h-3 text-orange-400" />
                        {product.storeName}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-1.5">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Price & Add to Cart button */}
                  <div className="p-4 pt-0 flex items-center justify-between">
                    <div>
                      <span className="text-base font-black text-orange-600">
                        {product.price.toLocaleString()} FCFA
                      </span>
                      {product.unit && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          / {product.unit}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(e, product);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Commander</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      </>}

      {/* Product Quick View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 my-auto">
            <div className="h-48 sm:h-64 relative bg-slate-100">
              <img src={mediaSrc(selectedProduct.image)} alt={selectedProduct.name} onError={onImageError} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <span className="text-xs font-semibold text-orange-500 uppercase tracking-wider">
                  {selectedProduct.storeName}
                </span>
                <h3 className="text-xl font-black text-slate-900">{selectedProduct.name}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <div>
                  <span className="text-2xl font-black text-orange-600">
                    {selectedProduct.price.toLocaleString()} FCFA
                  </span>
                  <span className="text-xs text-slate-400 block font-medium">Frais de livraison dès 300 FCFA (Calcul au km)</span>
                </div>

                <button
                  onClick={() => handleSelectProductAndGoToStore(selectedProduct)}
                  className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Commander chez {selectedProduct.storeName}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close inner max-w-7xl container */}
      </div>

    </div>
  );
};
