import React, { useState, useEffect } from 'react';
import { 
  X, ShoppingBag, Trash2, Plus, Minus, MapPin, Phone, User, ArrowRight, Compass, ArrowLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { calculateDeliveryFee, calculateRoadDistanceKm, isValidCoordinates } from '../../utils/deliveryCalculator';

export const CartDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart,
    placeOrder, 
    currentUser,
    stores,
    updateUserProfile,
    openAuthModal,
  } = useApp();

  const [address, setAddress] = useState(currentUser?.location?.address || 'Quartier Agamé, Parcelle 14 - Lokossa');
  const [phone, setPhone] = useState(currentUser?.phone || '+229 97 12 34 56');
  const [name, setName] = useState(currentUser?.name || 'Client Livriko');
  const [notes, setNotes] = useState('');
  const [clientCoords, setClientCoords] = useState<{ lat: number; lng: number } | null>(
    currentUser?.location && isValidCoordinates(currentUser.location.lat, currentUser.location.lng)
      ? { lat: currentUser.location.lat, lng: currentUser.location.lng }
      : null
  );
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.location?.address) setAddress(currentUser.location.address);
      else if (currentUser.city) setAddress(`${currentUser.city}, Bénin`);
      if (isValidCoordinates(currentUser.location?.lat, currentUser.location?.lng)) {
        setClientCoords({ lat: currentUser.location.lat, lng: currentUser.location.lng });
      }
    }
  }, [isOpen, currentUser]);

  const [geoError, setGeoError] = useState<string | null>(null);

  const handleGetGPS = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('La géolocalisation n’est pas supportée par ce navigateur. Saisissez votre adresse de livraison.');
      return;
    }
    setIsGeolocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setClientCoords(coords);
        if (currentUser) {
          void updateUserProfile(currentUser.id, {
            location: {
              lat: coords.lat,
              lng: coords.lng,
              address,
            },
          });
        }
        setIsGeolocating(false);
      },
      (err) => {
        setIsGeolocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Autorisation GPS refusée. Activez la localisation ou saisissez votre adresse.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Délai GPS dépassé. Réessayez ou saisissez votre adresse.');
        } else {
          setGeoError('Position indisponible. Saisissez votre adresse de livraison.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const storeId = cart[0]?.product.storeId;
  const store = stores.find(s => s.id === storeId);
  const storeName = store?.name ?? cart[0]?.product.storeName ?? 'Boutique Livriko';
  const storeLat = store?.lat ?? 6.6387;
  const storeLng = store?.lng ?? 1.7167;
  const distanceKm = calculateRoadDistanceKm(storeLat, storeLng, clientCoords?.lat, clientCoords?.lng);
  const deliveryInfo = distanceKm === null ? null : calculateDeliveryFee(distanceKm);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartDeliveryFee = deliveryInfo?.deliveryFee ?? 0;
  const cartTotal = cartSubtotal + cartDeliveryFee;
  const canSubmitOrder = Boolean(name.trim() && phone.trim() && address.trim());
  const hasStoreCoords = isValidCoordinates(storeLat, storeLng);
  const hasClientCoords = Boolean(clientCoords && isValidCoordinates(clientCoords.lat, clientCoords.lng));
  const canComputeDelivery = distanceKm !== null && distanceKm > 0 && hasStoreCoords && hasClientCoords;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!currentUser) {
      openAuthModal('login');
      setSubmissionError('Connectez-vous ou inscrivez-vous pour finaliser votre commande. Votre panier sera conservé.');
      return;
    }

    if (!canComputeDelivery || distanceKm === null) {
      setSubmissionError('Le calcul GPS de la livraison est impossible avec la position actuelle. Réessayez ou géolocalisez-vous à nouveau.');
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      if (!clientCoords) {
        throw new Error('Votre position GPS est nécessaire pour calculer la distance.');
      }
      const quote = calculateDeliveryFee(distanceKm);
      await placeOrder({
        paymentMethod: 'cash',
        storePaymentMode: 'delivery',
        clientName: name,
        clientPhone: phone,
        clientAddress: address,
        notes,
        clientLat: clientCoords.lat,
        clientLng: clientCoords.lng,
        deliveryQuote: {
          distanceKm: quote.distanceKm,
          deliveryFee: quote.deliveryFee,
          driverEarnings: quote.driverEarnings,
          platformFee: quote.platformFee,
        },
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue lors de la validation de la commande.';
      setSubmissionError(message);
      console.error('Commande non validée :', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1100 bg-[#0c1a2e]/55 backdrop-blur-xs flex justify-end">
      <div className="bg-[#fffdf8] w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden border-l border-[#e6dac8]">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0c1a2e] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              type="button"
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Retour au marché"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#ffb86a]" />
              <span>Retour</span>
            </button>
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-[#ffb86a]" />
              <h2 className="text-sm font-bold truncate">Mon panier</h2>
              <span className="px-2 py-0.5 rounded-md bg-[#ff8a1f]/20 text-[#ffb86a] text-[10px] font-semibold">
                {cart.length}
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f4f0e8]">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#e6dac8] flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-base font-black text-slate-800">Panier vide</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Parcourez les boutiques pour ajouter des articles.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-5 py-2.5 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white font-bold text-xs transition"
            >
              Parcourir le marché
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#f4f0e8]">
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Articles</h4>
                {cart.map(item => (
                  <div key={item.product.id} className="p-2.5 bg-[#fffdf8] rounded-xl border border-[#e6dac8] flex items-center gap-2.5">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h5>
                      <p className="text-[10px] text-slate-500 truncate">{item.product.storeName}</p>
                      <p className="text-xs font-bold text-[#ff8a1f] mt-0.5">
                        {item.product.price.toLocaleString()} F
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1 bg-white border border-[#e6dac8] rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-[#f4f0e8] hover:bg-[#efe6d8] text-slate-700 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="text-xs font-bold text-slate-800 w-5 text-center">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-[#ff8a1f] text-white flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Delivery Details */}
              <div className="pt-3 border-t border-[#e6dac8] space-y-2.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Livraison</h4>

                <div className="space-y-2">
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Nom du destinataire"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#fffdf8] border border-[#e6dac8] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#ff8a1f]"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Téléphone (+229...)"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#fffdf8] border border-[#e6dac8] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#ff8a1f]"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Quartier, rue, repère"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#fffdf8] border border-[#e6dac8] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#ff8a1f]"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Instructions (portail, étage...)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-[#fffdf8] border border-[#e6dac8] rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#ff8a1f] resize-none"
                  />
                </div>
              </div>

              {/* Position GPS (sans carte) */}
              <div className="pt-3 border-t border-[#e6dac8] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ff8a1f]" />
                    Livraison Lokossa
                  </h4>
                  <span className="text-[11px] font-bold text-[#e86f00] bg-[#ff8a1f]/10 px-2 py-0.5 rounded-md border border-[#ff8a1f]/25">
                    {deliveryInfo ? `${deliveryInfo.deliveryFee.toLocaleString()} F (forfait)` : 'GPS requis'}
                  </span>
                </div>

                <div className="p-3 bg-[#fffdf8] rounded-xl border border-[#e6dac8] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Position de livraison</p>
                      <p className="text-[11px] text-slate-500">Utilisez le GPS ou l’adresse saisie ci-dessus</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGetGPS}
                      disabled={isGeolocating}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0c1a2e] text-[11px] font-bold text-white transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Compass className="w-3 h-3 text-[#ffb86a]" />
                      {isGeolocating ? '...' : 'GPS'}
                    </button>
                  </div>
                  {geoError && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">{geoError}</p>
                  )}
                  {submissionError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 text-[12px]">
                      <p className="font-semibold">Erreur de validation :</p>
                      <p>{submissionError}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="rounded-lg bg-[#f4f0e8] p-2 border border-[#e6dac8]">
                      <p className="font-bold text-slate-800">Boutique</p>
                      <p className="truncate">{storeName}</p>
                    </div>
                    <div className="rounded-lg bg-[#f4f0e8] p-2 border border-[#e6dac8]">
                      <p className="font-bold text-slate-800">GPS</p>
                      <p className="truncate">{clientCoords ? `${clientCoords.lat.toFixed(4)}, ${clientCoords.lng.toFixed(4)}` : 'Non défini'}</p>
                    </div>
                  </div>
                  {distanceKm != null && (
                    <p className="text-[11px] text-slate-500">Distance estimée : <strong className="text-slate-800">{distanceKm.toFixed(1)} km</strong></p>
                  )}
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Tarif livraison Lokossa</p>
                  <div className="rounded-xl border border-[#ff8a1f]/35 bg-[#ff8a1f]/10 px-3 py-2.5 text-center">
                    <p className="text-[11px] text-slate-600">Forfait unique (toutes distances)</p>
                    <strong className="text-base text-[#e86f00]">500 FCFA</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e6dac8]">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-black text-emerald-900">Paiement à la livraison</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Espèces au livreur · {(cartSubtotal + cartDeliveryFee).toLocaleString()} FCFA
                  </p>
                </div>
              </div>

              {!currentUser && (
                <div className="rounded-xl border border-[#ff8a1f]/40 bg-[#ff8a1f]/10 p-3 space-y-2">
                  <p className="text-xs font-black text-[#9a4d00]">Compte requis pour commander</p>
                  <p className="text-[11px] text-[#9a4d00]/90 leading-relaxed">
                    Parcourez et remplissez votre panier librement. Connectez-vous ou inscrivez-vous pour valider la livraison.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="flex-1 py-2 rounded-lg bg-[#0c1a2e] text-white text-[11px] font-bold"
                    >
                      Se connecter
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuthModal('register')}
                      className="flex-1 py-2 rounded-lg bg-[#ff8a1f] text-white text-[11px] font-bold"
                    >
                      S&apos;inscrire
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#fffdf8] border-t border-[#e6dac8] space-y-2.5">
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-semibold text-slate-900">{cartSubtotal.toLocaleString()} F</span>
                </div>
                <div className="flex justify-between items-center font-semibold text-slate-700">
                  <span>Livraison</span>
                  <span>{cartDeliveryFee.toLocaleString()} F</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-[#e6dac8]">
                  <span>Total</span>
                  <span className="text-[#ff8a1f]">{(cartSubtotal + cartDeliveryFee).toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    onClose();
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-rose-50 border border-[#e6dac8] hover:border-rose-300 text-slate-700 hover:text-rose-600 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Annuler</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || (Boolean(currentUser) && !canSubmitOrder)}
                  onClick={(e) => {
                    if (!currentUser) {
                      e.preventDefault();
                      openAuthModal('login');
                      setSubmissionError('Connectez-vous ou inscrivez-vous pour finaliser votre commande.');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white font-black text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Validation...</span>
                  ) : !currentUser ? (
                    <>
                      <span>Se connecter pour commander</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Confirmer</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
