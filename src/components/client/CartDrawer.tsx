import React, { useState, useEffect } from 'react';
import { 
  X, ShoppingBag, Trash2, Plus, Minus, CreditCard, ShieldCheck, MapPin, Phone, User, Check, ArrowRight, Info, Compass, ArrowLeft,
  Wallet, Smartphone, Copy, CheckCircle2, Send
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { LatLngExpression, icon } from 'leaflet';
import { useApp } from '../../context/AppContext';
import { calculateDeliveryFee, calculateRoadDistanceKm } from '../../utils/deliveryCalculator';

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
    setIsAuthModalOpen,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo_mtn' | 'momo_moov' | 'orange_money' | 'celtis_cash'>('momo_mtn');
  const [storePaymentMode, setStorePaymentMode] = useState<'online' | 'delivery'>('online');

  const paymentMethodOptions = [
    {
      id: 'momo_mtn',
      name: 'MTN MoMo',
      logoUrl: '/mtn-momo.svg',
      accent: 'bg-[#F7C600] text-slate-900 border-[#F7C600]',
    },
    {
      id: 'momo_moov',
      name: 'Moov Money',
      logoUrl: '/moov-money.svg',
      accent: 'bg-[#1E40AF] text-white border-[#1E40AF]',
    },
    {
      id: 'celtis_cash',
      name: 'Celtis Cash',
      logoUrl: '/celtis-cash.svg',
      accent: 'bg-[#7C3AED] text-white border-[#7C3AED]',
    },
    {
      id: 'cash',
      name: 'Espèces',
      logoUrl: '/cash.svg',
      accent: 'bg-[#10B981] text-white border-[#10B981]',
    },
  ] as const;
  const [paymentSource, setPaymentSource] = useState<'direct_momo' | 'wallet'>('direct_momo');
  const [momoTxRef, setMomoTxRef] = useState('');
  const [paymentReceiptPhoto, setPaymentReceiptPhoto] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);

  const [address, setAddress] = useState(currentUser?.location?.address || 'Quartier Agamé, Parcelle 14 - Lokossa');
  const [phone, setPhone] = useState(currentUser?.phone || '+229 97 12 34 56');
  const [name, setName] = useState(currentUser?.name || 'Client Livriko');
  const [notes, setNotes] = useState('');
  const [clientCoords, setClientCoords] = useState<{ lat: number; lng: number }>({
    lat: currentUser?.location?.lat || 6.6432,
    lng: currentUser?.location?.lng || 1.7145
  });
  const [mapZoom, setMapZoom] = useState(14);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLngExpression[]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const handleImageFileSelect = (file: File | null, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.location?.address) setAddress(currentUser.location.address);
      else if (currentUser.city) setAddress(`${currentUser.city}, Bénin`);
      if (currentUser.location?.lat && currentUser.location?.lng) {
        setClientCoords({ lat: currentUser.location.lat, lng: currentUser.location.lng });
      }
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (paymentMethod === 'cash') {
      setStorePaymentMode('delivery');
    }
  }, [paymentMethod]);

  const handleGetGPS = () => {
    if ('geolocation' in navigator) {
      setIsGeolocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setClientCoords(coords);
          setMapZoom(15);
          if (currentUser) {
            updateUserProfile(currentUser.id, {
              location: {
                lat: coords.lat,
                lng: coords.lng,
                address,
              },
            });
          }
          setIsGeolocating(false);
        },
        () => {
          setIsGeolocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  if (!isOpen) return null;

  const storeId = cart[0]?.product.storeId;
  const store = stores.find(s => s.id === storeId);
  const storeName = store?.name ?? cart[0]?.product.storeName ?? 'Boutique Livriko';
  const storeLat = store?.lat ?? currentUser?.location?.lat ?? 6.6432;
  const storeLng = store?.lng ?? currentUser?.location?.lng ?? 1.7145;
  const distanceKm = calculateRoadDistanceKm(storeLat, storeLng, clientCoords.lat, clientCoords.lng);
  const deliveryInfo = calculateDeliveryFee(distanceKm);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartDeliveryFee = deliveryInfo.deliveryFee;
  const cartTotal = cartSubtotal + cartDeliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    placeOrder({
      paymentMethod,
      storePaymentMode,
      clientName: name,
      clientPhone: phone,
      clientAddress: address,
      notes,
      clientLat: clientCoords.lat,
      clientLng: clientCoords.lng,
      momoTransactionRef: momoTxRef,
      paymentReceiptPhoto,
    });
    setIsSubmitting(false);
    onClose();
  };

  const needsReceiptProof = paymentMethod !== 'cash' && storePaymentMode === 'online';
  const canSubmitOrder = !needsReceiptProof || Boolean(paymentReceiptPhoto);

  const LocationMarker: React.FC = () => {
    useMapEvents({
      click(e) {
        setClientCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
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
      if (bounds.length === 0) return;
      map.fitBounds(bounds, {
        padding: [24, 24],
        maxZoom: 15,
      });
    }, [map, bounds]);

    return null;
  };

  const storeCoords: LatLngExpression = [storeLat, storeLng];
  const clientPosition: LatLngExpression = [clientCoords.lat, clientCoords.lng];
  const routePositions: LatLngExpression[] = [storeCoords, clientPosition];

  useEffect(() => {
    if (!storeLat || !storeLng || !clientCoords.lat || !clientCoords.lng) {
      setRouteCoordinates(routePositions);
      return;
    }

    const controller = new AbortController();
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${storeLng},${storeLat};${clientCoords.lng},${clientCoords.lat}?overview=full&geometries=geojson&annotations=distance,duration`;

    setRouteLoading(true);
    setRouteError(null);

    fetch(routeUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`OSRM non disponible (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
          throw new Error('Aucun itinéraire trouvé');
        }

        const route = data.routes[0];
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
  }, [storeLat, storeLng, clientCoords.lat, clientCoords.lng, distanceKm]);

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              type="button"
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Retour au marché"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
              <span>Retour</span>
            </button>
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-bold truncate">Mon Panier</h2>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-semibold">
                {cart.length}
              </span>
            </div>
          </div>

          <button 
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Votre panier est vide</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Découvrez nos restaurants, boutiques et pharmacies pour passer votre première commande avec livraison dès 450 FCFA.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
            >
              Parcourir le marché
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Articles commandés</h4>
                {cart.map(item => (
                  <div key={item.product.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h5>
                      <p className="text-[10px] text-slate-500 truncate">{item.product.storeName}</p>
                      <p className="text-xs font-bold text-blue-600 mt-0.5">
                        {item.product.price.toLocaleString()} FCFA
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="text-xs font-bold text-slate-800 w-5 text-center">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
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
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Adresse de Livraison</h4>

                <div className="space-y-2">
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Nom du destinataire"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Téléphone portable (+229...)"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Quartier, rue, repère (ex: Haie Vive)"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Instructions particulières (piment à part, sonner au portail...)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              {/* Humanized Delivery & Tariffs for Lokossa */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    Livraison à Lokossa
                  </h4>
                  <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                    {deliveryInfo.deliveryFee.toLocaleString()} FCFA ({distanceKm} km)
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Trajet Commerce ➔ Votre adresse</p>
                      <p className="text-[11px] text-slate-500">Calcul basé sur le trajet réel du livreur à Lokossa</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGetGPS}
                      disabled={isGeolocating}
                      className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-orange-300 text-[11px] font-bold text-slate-700 hover:text-orange-600 shadow-xs transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Compass className="w-3 h-3 text-orange-500" />
                      {isGeolocating ? 'Localisation...' : 'Ma position GPS'}
                    </button>
                  </div>

                  <div className="bg-white rounded-xl p-2.5 border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Distance estimée :</span>
                      <strong className="text-slate-900 font-bold">{distanceKm} km</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Tarif de la course :</span>
                      <span className="text-orange-600 font-bold text-[11px]">{deliveryInfo.tierLabel}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Position de livraison</p>
                        <p className="text-[11px] text-slate-500">Cliquez sur la carte pour modifier votre lieu de réception.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGetGPS}
                        disabled={isGeolocating}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-orange-300 text-[11px] font-bold text-slate-700 hover:text-orange-600 shadow-xs transition flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Compass className="w-3 h-3 text-orange-500" />
                        {isGeolocating ? 'Localisation...' : 'Ma position GPS'}
                      </button>
                    </div>

                    <div className="h-48 rounded-2xl overflow-hidden border border-slate-200 relative">
                      <div className="absolute left-4 top-4 z-20 rounded-3xl bg-slate-950/95 text-white text-[11px] p-3 shadow-2xl w-[calc(100%-2rem)] max-w-[min(240px,100%)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold">Itinéraire</span>
                          <span className="text-slate-300">{routeLoading ? 'Chargement...' : routeDistanceKm ? `${routeDistanceKm.toFixed(1)} km` : `${distanceKm.toFixed(1)} km`}</span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-slate-300 text-[10px]">Boutique → Livraison</p>
                          <p className="text-xs text-slate-100">
                            {routeDurationMin ? `Durée estimée ${routeDurationMin} min` : 'Durée estimée indisponible'}
                          </p>
                          <p className="text-[10px] text-orange-200">
                            {routeError ? `Mode secours : ${routeError}` : 'Trajet calculé via OSRM quand disponible.'}
                          </p>
                        </div>
                      </div>

                      <MapContainer
                        center={clientPosition}
                        zoom={mapZoom}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                        whenCreated={() => setIsMapReady(true)}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker />
                        <Marker position={storeCoords} icon={storeMarkerIcon}>
                          <Popup>{storeName}</Popup>
                        </Marker>
                        <MapAutoFit bounds={routeCoordinates.length > 0 ? routeCoordinates : routePositions} />
                        <Polyline
                          positions={routeCoordinates.length > 0 ? routeCoordinates : routePositions}
                          pathOptions={{ color: 'rgba(251,146,60,0.95)', weight: 5, opacity: 0.95, dashArray: routeCoordinates.length > 0 ? undefined : '10,6' }}
                        />
                      </MapContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div className="rounded-2xl bg-white p-2 border border-slate-200">
                        <p className="font-bold text-slate-800">Boutique</p>
                        <p>{storeName}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-2 border border-slate-200">
                        <p className="font-bold text-slate-800">Livraison</p>
                        <p>{clientCoords.lat.toFixed(5)}, {clientCoords.lng.toFixed(5)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Official Tariff Grid display */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Grille tarifaire officielle des livreurs à Lokossa :</p>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center">
                        <span className="text-slate-500 block">Moins de 1 km</span>
                        <strong className="text-slate-800">300 FCFA</strong>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center">
                        <span className="text-slate-500 block">1 à 2 km</span>
                        <strong className="text-slate-800">500 FCFA</strong>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center">
                        <span className="text-slate-500 block">2 à 3 km</span>
                        <strong className="text-slate-800">675 FCFA</strong>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center">
                        <span className="text-slate-500 block">3 à 5 km</span>
                        <strong className="text-slate-800">1 125 FCFA</strong>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center">
                        <span className="text-slate-500 block">5 à 8 km</span>
                        <strong className="text-slate-800">1 600 FCFA</strong>
                      </div>
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-center">
                        <span className="text-slate-500 block">8 à 12 km</span>
                        <strong className="text-slate-800">2 100 FCFA</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Choisissez votre moyen de paiement</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethodOptions.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                        paymentMethod === m.id
                          ? `${m.accent} ring-2 ring-orange-500 shadow-xs`
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-200">
                          <img src={m.logoUrl} alt={m.name} className="max-h-7 max-w-7 object-contain" />
                        </div>
                        <div className="flex flex-col text-left">
                          <span>{m.name}</span>
                          <span className="text-[9px] opacity-75 font-normal">Méthode de paiement</span>
                        </div>
                      </div>
                      {paymentMethod === m.id && <Check className="w-4 h-4 text-orange-600 shrink-0" />}
                    </button>
                  ))}
                </div>

                {/* Store payment mode */}
                {paymentMethod !== 'cash' && (
                  <div className="space-y-3 p-3 bg-slate-950 text-white rounded-3xl border border-slate-800">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold">Paiement boutique</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStorePaymentMode('online')}
                        className={`p-3 rounded-2xl border text-xs font-bold text-left transition ${
                          storePaymentMode === 'online' ? 'bg-orange-500 text-white border-orange-400' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        Avant livraison
                        <span className="block text-[10px] text-slate-300 mt-1">Paiement en ligne avec preuve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStorePaymentMode('delivery')}
                        className={`p-3 rounded-2xl border text-xs font-bold text-left transition ${
                          storePaymentMode === 'delivery' ? 'bg-orange-500 text-white border-orange-400' : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        À la livraison
                        <span className="block text-[10px] text-slate-300 mt-1">Paiement boutique au moment de la remise</span>
                      </button>
                    </div>
                    {storePaymentMode === 'online' && (
                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        Si vous payez la boutique avant la livraison, joignez une capture de reçu ou une preuve de transfert.
                      </p>
                    )}
                  </div>
                )}
                {!currentUser && (
                <div className="p-4 mb-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold">
                  <p>Vous devez être connecté pour finaliser votre paiement.</p>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="mt-3 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition"
                  >
                    Se connecter maintenant
                  </button>
                </div>
              )}
              {paymentMethod !== 'cash' && (
                  <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-800">
                      <span className="text-slate-300">Option de paiement Mobile Money</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold">
                        Sécurisé
                      </span>
                    </div>

                    {/* Radio Tabs */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentSource('direct_momo')}
                        className={`p-2 rounded-xl text-left border text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          paymentSource === 'direct_momo'
                            ? 'bg-orange-500 text-white border-orange-400 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5 shrink-0" />
                        <span>Transfert MoMo boutique</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentSource('wallet')}
                        className={`p-2 rounded-xl text-left border text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          paymentSource === 'wallet'
                            ? 'bg-orange-500 text-white border-orange-400 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5 shrink-0" />
                        <span>Portefeuille Livriko</span>
                      </button>
                    </div>

                    {/* Mode A: Wallet */}
                    {paymentSource === 'wallet' && (
                      <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Solde disponible :</span>
                          <span className="font-bold text-emerald-400">
                            {(currentUser?.walletBalance || 25000).toLocaleString()} FCFA
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          Le montant total ({(cartSubtotal + cartDeliveryFee).toLocaleString()} FCFA) sera débité directement de votre compte Livriko sans attente.
                        </p>
                      </div>
                    )}

                    {/* Mode B: Direct MoMo Transfer to Store Number */}
                    {paymentSource === 'direct_momo' && (
                      <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 space-y-2.5 text-xs">
                        <p className="text-[11px] text-slate-300">
                          Si vous préférez ne pas utiliser votre portefeuille, vous pouvez transférer le montant depuis votre téléphone vers le numéro MoMo du commerçant :
                        </p>

                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Numéro MoMo de la boutique ({storeName})</p>
                            <p className="text-sm font-black text-orange-400 tracking-wider">
                              {store?.momoPhone || store?.phone || 'N/A'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const p = store?.momoPhone || store?.phone || 'N/A';
                              if (p !== 'N/A') {
                                navigator.clipboard.writeText(p);
                                setCopiedPhone(true);
                                setTimeout(() => setCopiedPhone(false), 2000);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                          >
                            {copiedPhone ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Copié !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copier</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* USSD Helper */}
                        <div className="p-2 bg-slate-900 rounded-lg text-[10px] text-slate-400 space-y-1 border border-slate-800">
                          <p className="font-bold text-slate-300">Procédure sur votre téléphone :</p>
                          {paymentMethod === 'momo_mtn' && (
                            <p>1. Tapez <strong className="text-amber-400">*880#</strong> sur votre téléphone MTN.</p>
                          )}
                          {paymentMethod === 'momo_moov' && (
                            <p>1. Tapez <strong className="text-blue-400">*155#</strong> sur votre téléphone Moov.</p>
                          )}
                          {paymentMethod === 'celtis_cash' && (
                            <p>1. Tapez <strong className="text-purple-400">*890#</strong> ou l'app Celtis Cash sur votre téléphone.</p>
                          )}
                          <p>2. Choisissez Transfert d'argent ➔ Entrez le numéro ci-dessus et validez <strong>{(cartSubtotal + cartDeliveryFee).toLocaleString()} FCFA</strong>.</p>
                        </div>

                        {/* Transaction ID input */}
                        <div className="space-y-1 pt-1">
                          <label className="text-[10px] text-slate-300 font-bold block">
                            ID / Référence du transfert SMS (facultatif) :
                          </label>
                          <input
                            type="text"
                            placeholder="ex: TRX-984210 ou ID SMS MoMo"
                            value={momoTxRef}
                            onChange={e => setMomoTxRef(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                          />
                          <div className="mt-3">
                            <label className="text-[10px] text-slate-300 font-bold block mb-1">
                              Capture du dépôt / Reçu du transfert (facultatif) :
                            </label>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <label className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-slate-800 cursor-pointer">
                                Choisir une image
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={e => handleImageFileSelect(e.target.files?.[0] || null, setPaymentReceiptPhoto)}
                                  className="hidden"
                                />
                              </label>

                              {paymentReceiptPhoto ? (
                                <div className="w-full sm:w-auto flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 p-2">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-800">
                                    <img src={paymentReceiptPhoto} alt="Aperçu reçu" className="w-full h-full object-cover" />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPaymentReceiptPhoto('')}
                                    className="px-2 py-1 rounded-xl bg-rose-600 text-[10px] text-white font-bold hover:bg-rose-500 transition"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400">
                                  Sélectionnez une capture de dépôt pour faciliter le traitement de votre paiement.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Footer Summary & Place / Cancel Order */}
            <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Sous-total articles</span>
                  <span className="font-semibold text-slate-900">{cartSubtotal.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    Frais de livraison <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Lokossa</span>
                  </span>
                  <span>{cartDeliveryFee.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total à payer</span>
                  <span className="text-orange-600">{(cartSubtotal + cartDeliveryFee).toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Action buttons: Cancel & Confirm */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    onClose();
                  }}
                  className="px-4 py-3 rounded-2xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-600 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                  title="Annuler la commande et vider le panier"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Annuler</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !canSubmitOrder}
                  className="flex-1 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Validation en cours...</span>
                  ) : (
                    <>
                      <span>Confirmer la commande</span>
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
