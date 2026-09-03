import React, { useState } from 'react';
import {
  ArrowLeft, Clock, MapPin, Phone, Plus, Minus, Check,
  ShoppingCart, CheckCircle, ShieldCheck, ChevronRight, Trash2, MessageSquare,
} from 'lucide-react';
import { Store, Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { onImageError, resolveMediaUrl, mediaSrc } from '../../utils/media';
import { RatingStars } from './RatingStars';
import { CatalogReviewPanel } from './CatalogReviewPanel';

interface StoreDetailViewProps {
  store: Store;
  products: Product[];
  onBack: () => void;
  onOpenCart: () => void;
  onOpenChat: () => void;
  autoAddedProduct?: Product | null;
}

export const StoreDetailView: React.FC<StoreDetailViewProps> = ({
  store,
  products,
  onBack,
  onOpenCart,
  onOpenChat,
  autoAddedProduct,
}) => {
  const {
    cart, addToCart, updateCartQuantity, cartTotal, cartDeliveryFee,
    clearCart, orders, currentUser, setActiveTrackingOrder,
  } = useApp();

  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(
    autoAddedProduct ? autoAddedProduct.id : null,
  );
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);

  const sameStoreId = (a: string, b: string) =>
    a === b || a.replace(/^store-/, '') === b.replace(/^store-/, '');

  const storeProducts = products.filter(
    p => sameStoreId(p.storeId, store.id) || p.storeName.toLowerCase() === store.name.toLowerCase(),
  );

  const fallbackImage = resolveMediaUrl(storeProducts.find(p => p.image)?.image || '');
  const coverSrc = mediaSrc(store.coverImage || store.logo || fallbackImage);
  const logoSrc = mediaSrc(store.logo || store.coverImage || fallbackImage);

  const cartItemsFromStore = cart.filter(
    item => item.product.storeId === store.id || item.product.storeName.toLowerCase() === store.name.toLowerCase(),
  );
  const totalStoreItemsCount = cartItemsFromStore.reduce((sum, item) => sum + item.quantity, 0);

  const handleAdd = (product: Product) => {
    addToCart(product, 1);
    setRecentlyAddedId(product.id);
    setTimeout(() => setRecentlyAddedId(null), 2000);
  };

  const getCartQuantityForProduct = (productId: string) =>
    cart.find(item => item.product.id === productId)?.quantity ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-28 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#fffdf8] border border-[#e6dac8] text-slate-800 font-bold text-xs hover:border-[#ff8a1f]/50 transition group"
        >
          <ArrowLeft className="w-4 h-4 text-[#ff8a1f] group-hover:-translate-x-0.5 transition-transform" />
          Retour au marché
        </button>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
          {store.category}
        </span>
      </div>

      {autoAddedProduct && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle className="w-6 h-6 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Ajouté au panier</p>
              <h4 className="text-sm font-black truncate">
                {autoAddedProduct.name} · {autoAddedProduct.price.toLocaleString()} FCFA
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCart}
            className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-black text-xs shrink-0"
          >
            Voir le panier ({totalStoreItemsCount})
          </button>
        </div>
      )}

      <div className="bg-[#fffdf8] rounded-2xl border border-[#e6dac8] overflow-hidden">
        <div className={`h-44 sm:h-56 relative ${
          !store.coverImage || store.coverImage === store.logo ? 'bg-[#fff7ed]' : 'bg-[#0c1a2e]'
        }`}>
          <img
            src={coverSrc}
            alt={store.name}
            onError={onImageError}
            className={!store.coverImage || store.coverImage === store.logo
              ? 'w-full h-full object-contain p-6'
              : 'w-full h-full object-cover opacity-90'}
          />
          <div className={`absolute inset-0 ${
            !store.coverImage || store.coverImage === store.logo
              ? 'bg-gradient-to-t from-[#fffdf8] via-transparent to-transparent'
              : 'bg-gradient-to-t from-[#0c1a2e]/90 via-[#0c1a2e]/20 to-transparent'
          }`} />
          {(store.reviewCount ?? 0) > 0 ? (
            <span className="absolute top-3 right-3 bg-white/95 px-2.5 py-1 rounded-lg">
              <RatingStars
                rating={store.ratingAverage ?? 0}
                showValue
                reviewCount={store.reviewCount}
              />
            </span>
          ) : (
            <span className="absolute top-3 right-3 bg-white/95 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-500">
              Pas encore noté
            </span>
          )}
          <span className="absolute top-3 left-3 bg-[#0c1a2e]/80 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#ff8a1f]" />
            {store.deliveryTime}
          </span>
        </div>

        <div className="px-4 sm:px-6 pb-5 -mt-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3">
              <img
                src={logoSrc}
                alt={store.name}
                onError={onImageError}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain bg-white p-1 border-4 border-[#fffdf8] shadow-lg shrink-0"
              />
              <div className="pb-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{store.name}</h1>
                  {store.isCertified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" /> Certifié
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#ff8a1f]" />
                  {store.address}{store.city ? `, ${store.city}` : ''}
                </p>
                {store.phone && (
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {store.phone}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const related = orders.find(o =>
                  (o.storeId === store.id || o.storeId.replace(/^store-/, '') === store.id.replace(/^store-/, ''))
                  && o.clientId === currentUser?.id
                  && !['cancelled'].includes(o.status),
                );
                if (related) setActiveTrackingOrder(related);
                onOpenChat();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white font-bold text-xs transition shrink-0"
            >
              Discuter
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Livraison', value: 'Dès 450 F' },
              { label: 'Délai', value: store.deliveryTime },
              { label: 'Paiement', value: 'Espèces' },
              { label: 'Catalogue', value: `${storeProducts.length} art.` },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-[#f4f0e8] border border-[#e6dac8] px-3 py-2.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{item.label}</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CatalogReviewPanel
        targetType="store"
        targetId={store.id}
        targetName={store.name}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Catalogue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ajoutez vos articles au panier</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-[#ff8a1f]/10 text-[#e86f00] text-xs font-bold">
            {storeProducts.length}
          </span>
        </div>

        {storeProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e6dac8] bg-[#faf6ef] p-10 text-center text-sm text-slate-500">
            Aucun produit listé pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {storeProducts.map(product => {
              const qtyInCart = getCartQuantityForProduct(product.id);
              const isJustAdded = recentlyAddedId === product.id;
              const showProductReviews = reviewProductId === product.id;

              return (
                <div key={product.id} className="space-y-2">
                  <div
                    className={`bg-[#fffdf8] rounded-2xl border overflow-hidden flex flex-col transition ${
                      qtyInCart > 0
                        ? 'border-[#ff8a1f] ring-2 ring-[#ff8a1f]/15'
                        : 'border-[#e6dac8] hover:border-[#ff8a1f]/40'
                    }`}
                  >
                    <div className="h-40 relative bg-slate-100">
                      <img
                        src={mediaSrc(product.image)}
                        alt={product.name}
                        onError={onImageError}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {qtyInCart > 0 && (
                        <span className="absolute top-2.5 right-2.5 bg-[#ff8a1f] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Check className="w-3 h-3" /> {qtyInCart}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-black text-slate-900 leading-snug">{product.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 flex-1">{product.description}</p>

                      {(product.reviewCount ?? 0) > 0 && (
                        <RatingStars
                          rating={product.ratingAverage ?? 0}
                          size="sm"
                          showValue
                          reviewCount={product.reviewCount}
                          className="mt-2"
                        />
                      )}

                      <button
                        type="button"
                        onClick={() => setReviewProductId(showProductReviews ? null : product.id)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#ff8a1f] hover:underline self-start"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {showProductReviews ? 'Masquer les avis' : 'Voir les avis'}
                      </button>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#efe6d8]">
                        <div>
                          <span className="text-base font-black text-[#ff8a1f] block">
                            {product.price.toLocaleString()} F
                          </span>
                          {product.unit && (
                            <span className="text-[10px] text-slate-400">par {product.unit}</span>
                          )}
                        </div>

                        {qtyInCart > 0 ? (
                          <div className="flex items-center gap-1.5 bg-[#f4f0e8] p-1 rounded-xl border border-[#e6dac8]">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(product.id, qtyInCart - 1)}
                              className="w-8 h-8 rounded-lg bg-white text-slate-800 flex items-center justify-center hover:bg-slate-100"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-black text-xs text-slate-900 w-5 text-center">{qtyInCart}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(product.id, qtyInCart + 1)}
                              className="w-8 h-8 rounded-lg bg-[#ff8a1f] text-white flex items-center justify-center hover:bg-[#e86f00]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAdd(product)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                              isJustAdded
                                ? 'bg-emerald-500 text-white'
                                : 'bg-[#0c1a2e] hover:bg-[#132d4d] text-white'
                            }`}
                          >
                            {isJustAdded ? (
                              <><Check className="w-3.5 h-3.5" /> Ajouté</>
                            ) : (
                              <><Plus className="w-3.5 h-3.5" /> Ajouter</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {showProductReviews && (
                    <CatalogReviewPanel
                      targetType="product"
                      targetId={product.id}
                      targetName={product.name}
                      compact
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c1a2e]/97 backdrop-blur-md border-t border-slate-800 text-white p-3 sm:p-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-11 h-11 rounded-xl bg-[#ff8a1f] flex items-center justify-center relative shrink-0">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-[#ff8a1f] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Total · +{cartDeliveryFee.toLocaleString()} F livraison
                </p>
                <p className="text-lg font-black">
                  {(cartTotal + cartDeliveryFee).toLocaleString()} FCFA
                </p>
              </div>
              <button
                type="button"
                onClick={clearCart}
                className="sm:hidden ml-auto px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={clearCart}
                className="hidden sm:flex px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 text-xs font-bold items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Annuler
              </button>
              <button
                type="button"
                onClick={onOpenCart}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white font-black text-xs flex items-center justify-center gap-2"
              >
                Finaliser <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
