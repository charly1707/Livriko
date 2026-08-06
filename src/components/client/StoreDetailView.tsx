import React, { useState } from 'react';
import { 
  ArrowLeft, Star, Clock, MapPin, Phone, ShoppingBag, Plus, Minus, Check, ShoppingCart, 
  CreditCard, Smartphone, CheckCircle, ShieldCheck, ChevronRight, Utensils, Trash2, X
} from 'lucide-react';
import { Store, Product, CartItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface StoreDetailViewProps {
  store: Store;
  products: Product[];
  onBack: () => void;
  onOpenCart: () => void;
  autoAddedProduct?: Product | null;
}

export const StoreDetailView: React.FC<StoreDetailViewProps> = ({
  store,
  products,
  onBack,
  onOpenCart,
  autoAddedProduct
}) => {
  const { cart, addToCart, updateCartQuantity, cartTotal, cartDeliveryFee, clearCart } = useApp();

  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(
    autoAddedProduct ? autoAddedProduct.id : null
  );

  // Products belonging to this store
  const storeProducts = products.filter(
    p => p.storeId === store.id || p.storeName.toLowerCase() === store.name.toLowerCase()
  );

  // Filter items in cart that belong to this store or overall
  const cartItemsFromStore = cart.filter(
    item => item.product.storeId === store.id || item.product.storeName.toLowerCase() === store.name.toLowerCase()
  );

  const totalStoreItemsCount = cartItemsFromStore.reduce((sum, item) => sum + item.quantity, 0);

  const handleAdd = (product: Product) => {
    addToCart(product, 1);
    setRecentlyAddedId(product.id);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 2000);
  };

  const getCartQuantityForProduct = (productId: string) => {
    const found = cart.find(item => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Header: Bouton de retour au marché */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-50 hover:border-slate-300 shadow-xs transition cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-orange-500 group-hover:-translate-x-1 transition-transform" />
          <span>← Retour au Marché (Tous les Commerces)</span>
        </button>

        <span className="text-xs font-bold text-slate-500 hidden sm:inline">
          Espace Entreprise • {store.category.toUpperCase()}
        </span>
      </div>

      {/* Auto-added Notification Banner */}
      {autoAddedProduct && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg border border-emerald-400 flex flex-wrap items-center justify-between gap-3 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Repas Sélectionné & Ajouté au Panier</p>
              <h4 className="text-sm font-black text-white">{autoAddedProduct.name} ({autoAddedProduct.price.toLocaleString()} FCFA)</h4>
              <p className="text-[11px] text-emerald-100">
                Vous êtes dans l'espace <strong>{store.name}</strong>. Parcourez la carte ci-dessous pour ajouter d'autres plats !
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCart}
            className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-black text-xs shadow-md hover:bg-emerald-50 transition cursor-pointer shrink-0"
          >
            Voir le panier ({totalStoreItemsCount}) →
          </button>
        </div>
      )}

      {/* Store Banner & Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover Photo */}
        <div className="h-48 sm:h-64 relative bg-slate-900">
          <img 
            src={store.coverImage} 
            alt={store.name} 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
          
          <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-slate-900 flex items-center gap-1.5 shadow-md">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{store.rating} / 5.0</span>
          </span>

          <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>Livraison en {store.deliveryTime}</span>
          </span>
        </div>

        {/* Store Header Details */}
        <div className="p-6 relative -mt-12 sm:-mt-16 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-100 bg-white">
          <div className="flex items-end gap-4">
            <img 
              src={store.logo} 
              alt={store.name} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-xl bg-white shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{store.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase border border-emerald-200">
                  Partenaire Vérifié
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-orange-500" /> {store.address}, {store.city}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> WhatsApp Direct: {store.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a 
              href={`https://wa.me/${store.phone.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(store.name)},%20je%20souhaite%20commander`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              💬 Contacter sur WhatsApp
            </a>
          </div>
        </div>

        {/* Store Quick Features */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 text-center text-xs bg-slate-50/50">
          <div className="p-3">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Frais de livraison</span>
            <span className="font-bold text-slate-900">Dès 450 FCFA</span>
          </div>
          <div className="p-3">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Temps Moyen</span>
            <span className="font-bold text-slate-900">{store.deliveryTime}</span>
          </div>
          <div className="p-3">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Paiement Accepté</span>
            <span className="font-bold text-slate-900">MoMo (MTN/Moov) & Cash</span>
          </div>
          <div className="p-3">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Menu / Catalogue</span>
            <span className="font-bold text-orange-600">{storeProducts.length} article(s)</span>
          </div>
        </div>
      </div>

      {/* Menu & Products List for this Store */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-500" />
              <span>Menu & Plats disponibles chez {store.name}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Cliquez sur un plat pour l'ajouter directement à votre panier.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
            {storeProducts.length} plat(s)
          </span>
        </div>

        {storeProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <p className="text-sm font-bold">Aucun produit listé pour cette entreprise actuellement.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {storeProducts.map(product => {
              const qtyInCart = getCartQuantityForProduct(product.id);
              const isJustAdded = recentlyAddedId === product.id;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-3xl border transition-all overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
                    qtyInCart > 0 ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Image */}
                    <div className="h-44 relative bg-slate-100 overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {qtyInCart > 0 && (
                        <span className="absolute top-3 right-3 bg-orange-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{qtyInCart} dans le panier</span>
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2">
                      <h3 className="text-base font-black text-slate-900 leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Pricing and Direct Add to Cart Action */}
                  <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                    <div>
                      <span className="text-lg font-black text-orange-600 block">
                        {product.price.toLocaleString()} FCFA
                      </span>
                      {product.unit && (
                        <span className="text-[11px] text-slate-400 block font-normal">
                          par {product.unit}
                        </span>
                      )}
                    </div>

                    {qtyInCart > 0 ? (
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button
                          onClick={() => updateCartQuantity(product.id, qtyInCart - 1)}
                          className="w-8 h-8 rounded-xl bg-white text-slate-800 font-black flex items-center justify-center hover:bg-slate-200 transition cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-black text-xs text-slate-900 px-2">{qtyInCart}</span>
                        <button
                          onClick={() => updateCartQuantity(product.id, qtyInCart + 1)}
                          className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black flex items-center justify-center hover:bg-orange-600 transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAdd(product)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Ajouté !</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Ajouter au panier</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Return Actions */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50 shadow-xs transition cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-orange-500 group-hover:-translate-x-1 transition-transform" />
            <span>← Retour au Marché (Tous les Commerces)</span>
          </button>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            <span>↑ Remonter en haut de {store.name}</span>
          </button>
        </div>
      </div>

      {/* Floating Bottom Cart Summary & Payment Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white p-3.5 sm:p-4 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            
            {/* Left Info: Cart Total & Items */}
            <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shrink-0 relative shadow-lg">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 text-[10px] sm:text-[11px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-orange-500">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Votre Commande</span>
                  <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    + {cartDeliveryFee.toLocaleString()} FCFA livraison
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-black text-white">
                  {(cartTotal + cartDeliveryFee).toLocaleString()} FCFA
                </div>
              </div>

              {/* Mobile Clear Button */}
              <button
                type="button"
                onClick={clearCart}
                className="md:hidden px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1 cursor-pointer shrink-0"
                title="Annuler et vider le panier"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Annuler</span>
              </button>
            </div>

            {/* Middle: Accepted Payment Badges with Real Payment Logos */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 bg-slate-800/80 px-3 py-2 rounded-2xl border border-slate-700">
              <span className="col-span-2 text-slate-400 font-bold text-[10px]">Paiement :</span>
              {[
                {
                  name: 'MTN MoMo',
                  logo: '/mtn-momo.svg',
                  accent: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
                },
                {
                  name: 'Moov Money',
                  logo: '/moov-money.svg',
                  accent: 'bg-blue-500/10 border-blue-500/20 text-blue-200',
                },
                {
                  name: 'Celtis Cash',
                  logo: '/celtis-cash.svg',
                  accent: 'bg-purple-500/10 border-purple-500/20 text-purple-200',
                },
                {
                  name: 'Espèces',
                  logo: '/cash.svg',
                  accent: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200',
                },
              ].map((method) => (
                <div
                  key={method.name}
                  className={`flex items-center gap-2 rounded-2xl border px-2.5 py-1 ${method.accent} border-opacity-80 min-w-0`}
                >
                  <div className="w-5 h-5 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <img src={method.logo} alt={method.name} className="max-h-4 max-w-4 object-contain" />
                  </div>
                  <span className="font-semibold uppercase tracking-[0.08em] leading-tight">{method.name}</span>
                </div>
              ))}
            </div>

            {/* Right Action: Cancel Button & Checkout */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={clearCart}
                className="hidden md:flex px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700 font-bold text-xs transition items-center gap-1.5 cursor-pointer shrink-0"
                title="Annuler la commande et vider les articles"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Annuler</span>
              </button>

              <button
                onClick={onOpenCart}
                className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Finaliser la commande (MoMo / Celtis / Cash)</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
