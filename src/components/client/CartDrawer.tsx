import React, { useState, useEffect } from 'react';
import { 
  X, ShoppingBag, Trash2, Plus, Minus, MapPin, Phone, User, ArrowRight, Compass, ArrowLeft,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { LatLngExpression, icon } from 'leaflet';
import { useApp } from '../../context/AppContext';
import { calculateDeliveryFee, calculateRoadDistanceKm, isValidCoordinates } from '../../utils/deliveryCalculator';

const clientMarkerIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const storeMarkerIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const LocationMarker: React.FC<{ clientCoords: { lat: number; lng: number }; onLocationSelect: (coords: { lat: number; lng: number }) => void }> = ({ clientCoords, onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return (
    <Marker
      position={[clientCoords.lat, clientCoords.lng] as LatLngExpression}
      icon={clientMarkerIcon}
    >
      <Popup>Votre position de livraison</Popup>
    </Marker>
  );
};

const MapAutoFit: React.FC<{ bounds: LatLngExpression[] }> = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (!bounds || bounds.length === 0) return;
    const validBounds = bounds.filter(Boolean) as LatLngExpression[];
    if (validBounds.length === 0) return;
    map.fitBounds(validBounds as any, {
      padding: [24, 24],
      maxZoom: 15,
    });
  }, [map, bounds]);

  return null;
};

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
  const [mapZoom, setMapZoom] = useState(14);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLngExpression[]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
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
      setGeoError('La géolocalisation n’est pas supportée par ce navigateur. Saisissez votre adresse et placez le pin manuellement sur la carte.');
      return;
    }
    setIsGeolocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setClientCoords(coords);
        setMapZoom(15);
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
          setGeoError('Autorisation GPS refusée. Activez la localisation ou placez le pin manuellement sur la carte.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Délai GPS dépassé. Réessayez ou placez le pin manuellement.');
        } else {
          setGeoError('Position indisponible. Saisissez votre adresse et ajustez le pin sur la carte.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const storeId = cart[0]?.product.storeId;
  const store = stores.find(s => s.id === storeId);
  const storeName = store?.name ?? cart[0]?.product.storeName ?? 'Boutique Livriko';
  const storeLat = store?.lat ?? 6.3833;
  const storeLng = store?.lng ?? 1.7167;
  const distanceKm = calculateRoadDistanceKm(storeLat, storeLng, clientCoords?.lat, clientCoords?.lng);
  const deliveryInfo = distanceKm === null ? null : calculateDeliveryFee(distanceKm);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartDeliveryFee = deliveryInfo?.deliveryFee ?? 0;
  const cartTotal = cartSubtotal + cartDeliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!currentUser) {
      openAuthModal('login');
      setSubmissionError('Connectez-vous ou inscrivez-vous pour finaliser votre commande. Votre panier sera conservé.');
      return;
    }

    if (!canComputeDelivery) {
      setSubmissionError('Le calcul GPS de la livraison est impossible avec la position actuelle. Réessayez ou géolocalisez-vous à nouveau.');
      return;
    }

    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      if (!clientCoords) {
        throw new Error('Votre position GPS est nécessaire pour calculer la distance.');
      }
      const quote = calculateDeliveryFee(resolvedDistanceKm);
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

  const canSubmitOrder = Boolean(name.trim() && phone.trim() && address.trim());

  const storeCoords: LatLngExpression | null = typeof storeLat === 'number' && typeof storeLng === 'number' && isValidCoordinates(storeLat, storeLng) ? [storeLat, storeLng] : null;
  const clientPosition: LatLngExpression | null = clientCoords && isValidCoordinates(clientCoords.lat, clientCoords.lng) ? [clientCoords.lat, clientCoords.lng] : null;
  const routePositions: LatLngExpression[] = storeCoords && clientPosition ? [storeCoords, clientPosition] : [];
  const resolvedDistanceKm = routeDistanceKm ?? distanceKm;
  const canComputeDelivery = resolvedDistanceKm !== null && resolvedDistanceKm > 0 && Boolean(storeCoords && clientPosition);

  useEffect(() => {
    if (!isOpen) return;

    if (!isValidCoordinates(storeLat, storeLng) || !clientCoords || !isValidCoordinates(clientCoords.lat, clientCoords.lng)) {
      setRouteCoordinates(routePositions);
      return;
    }

    const controller = new AbortController();
    const routeUrl = `/backend/index.php/api/maps/route?fromLat=${storeLat}&fromLng=${storeLng}&toLat=${clientCoords.lat}&toLng=${clientCoords.lng}`;

    setRouteLoading(true);
    setRouteError(null);

    fetch(routeUrl, { signal: controller.signal, credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`OSRM non disponible (${response.status})`);
        }
        return response.json();
      })
      .then((body) => {
        const data = body.route ?? body;
        if (body.success === false) {
          throw new Error(body.message || 'Service GPS non configuré');
        }
        const route = data.routes?.[0];
        if (!route) {
          throw new Error('Aucun itinéraire trouvé');
        }
        const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as LatLngExpression);

        setRouteCoordinates(coordinates);
        setRouteDistanceKm(Math.max(0.1, Math.round((route.distance / 1000) * 10) / 10));
        setRouteDurationMin(Math.max(1, Math.round(route.duration / 60)));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setRouteCoordinates(routePositions);
        setRouteDistanceKm(distanceKm);
        setRouteDurationMin(null);
        setRouteError(error instanceof Error ? error.message : 'Impossible de charger l’itinéraire');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRouteLoading(false);
        }
      });

    return () => controller.abort();
  }, [isOpen, storeLat, storeLng, clientCoords?.lat, clientCoords?.lng, distanceKm]);

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

              {/* GPS / map */}
              <div className="pt-3 border-t border-[#e6dac8] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ff8a1f]" />
                    Trajet Lokossa
                  </h4>
                  <span className="text-[11px] font-bold text-[#e86f00] bg-[#ff8a1f]/10 px-2 py-0.5 rounded-md border border-[#ff8a1f]/25">
                    {deliveryInfo ? `${deliveryInfo.deliveryFee.toLocaleString()} F · ${distanceKm} km` : 'GPS requis'}
                  </span>
                </div>

                <div className="p-3 bg-[#fffdf8] rounded-xl border border-[#e6dac8] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Boutique → Vous</p>
                      <p className="text-[11px] text-slate-500">Cliquez la carte pour placer le pin</p>
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

                  <div className="h-44 rounded-xl overflow-hidden border border-[#e6dac8] relative">
                    <div className="absolute left-3 top-3 z-20 rounded-xl bg-[#0c1a2e]/95 text-white text-[11px] p-2.5 shadow-lg w-[calc(100%-1.5rem)] max-w-[220px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">Itinéraire</span>
                        <span className="text-[#ffb86a]">{routeLoading ? '...' : routeDistanceKm ? `${routeDistanceKm.toFixed(1)} km` : distanceKm !== null ? `${distanceKm.toFixed(1)} km` : '—'}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-300">
                        {routeDurationMin ? `~${routeDurationMin} min` : routeError || 'Trajet GPS'}
                      </p>
                    </div>

                    {storeCoords && clientPosition ? <MapContainer
                      center={clientPosition}
                      zoom={mapZoom}
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                      whenReady={() => setIsMapReady(true)}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker
                        clientCoords={clientCoords!}
                        onLocationSelect={(coords) => setClientCoords(coords)}
                      />
                      <Marker position={storeCoords} icon={storeMarkerIcon}>
                        <Popup>{storeName}</Popup>
                      </Marker>
                      <MapAutoFit bounds={routeCoordinates.length > 0 ? routeCoordinates : routePositions} />
                      <Polyline
                        positions={routeCoordinates.length > 0 ? routeCoordinates : routePositions}
                        pathOptions={{ color: 'rgba(251,146,60,0.95)', weight: 5, opacity: 0.95, dashArray: routeCoordinates.length > 0 ? undefined : '10,6' }}
                      />
                    </MapContainer> : (
                      <div className="h-full flex items-center justify-center bg-slate-100 px-6 text-center text-xs font-semibold text-slate-600">
                        Votre position GPS et la position de la boutique sont nécessaires pour afficher l’itinéraire.
                      </div>
                    )}
                  </div>

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
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Tarifs Lokossa</p>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    {[
                      ['<1 km', '300'],
                      ['1–2 km', '500'],
                      ['2–3 km', '675'],
                      ['3–5 km', '1 125'],
                      ['5–8 km', '1 600'],
                      ['8–12 km', '2 100'],
                    ].map(([label, price]) => (
                      <div key={label} className="p-1.5 bg-[#fffdf8] rounded-lg border border-[#e6dac8] text-center">
                        <span className="text-slate-500 block">{label}</span>
                        <strong className="text-slate-800">{price} F</strong>
                      </div>
                    ))}
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
