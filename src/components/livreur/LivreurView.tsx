import React, { useState } from 'react';
import { 
  Truck, Navigation, CheckCircle2, MapPin, Phone, Clock, DollarSign, Store, ShieldCheck, ArrowRight, Play, AlertCircle, Camera, FileText, Settings, X, Sparkles, ArrowLeft, Compass, Calculator, Receipt
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus, User } from '../../types';
import { calculateDeliveryFee, calculateHaversineDistance, formatFCFA, isValidCoordinates } from '../../utils/deliveryCalculator';
import { MediaPicker } from '../MediaPicker';
import { uploadImageFile } from '../../utils/imageUpload';

interface RiderAcceptButtonProps {
  order: Order;
  currentUser: User;
  getNearestRiderForOrder: (order: Order) => User | null;
  onAccept: () => void;
}

interface ServiceMission {
  id: string;
  type: string;
  description: string;
  fromAddress: string;
  toAddress: string;
  distanceKm: number;
  fee: number;
  status: string;
}

const RiderAcceptButton: React.FC<RiderAcceptButtonProps> = ({ order, currentUser, getNearestRiderForOrder, onAccept }) => {
  const nearestRider = getNearestRiderForOrder(order);
  const isNearest = nearestRider?.id === currentUser.id;
  const label = isNearest
    ? 'Accepter la course'
    : nearestRider
      ? `Course réservée à ${nearestRider.name}`
      : 'Aucun livreur proche';

  return (
    <button
      type="button"
      onClick={onAccept}
      disabled={!isNearest}
      className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 ${isNearest ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
    >
      <Play className={`w-4 h-4 ${isNearest ? 'fill-white' : ''}`} />
      {label}
    </button>
  );
};

export const LivreurView: React.FC<{ onOpenChat?: () => void }> = ({ onOpenChat }) => {
  const { 
    currentUser, 
    allUsers,
    setActiveRole,
    orders, 
    acceptDeliveryOrder, 
    updateOrderStatus,
    approveLivreur,
    updateUserProfile,
    setActiveTrackingOrder,
  } = useApp();

  const [isOnline, setIsOnline] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editSelfie, setEditSelfie] = useState(currentUser?.selfiePhoto || currentUser?.avatar || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editVehicle, setEditVehicle] = useState(currentUser?.vehicle || '');

  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'history'>('active');
  const [serviceMissions, setServiceMissions] = useState<ServiceMission[]>([]);

  const handleCompleteDelivery = (order: Order) => {
    const initialDistance = order.finalDistanceKm ?? order.distanceKm;
    if (!initialDistance || initialDistance <= 0) {
      window.alert('La distance réelle de la livraison est indisponible.');
      return;
    }
    const entered = window.prompt('Entrez la distance finale relevée au compteur (km)', String(initialDistance));
    const finalDistanceKm = entered ? parseFloat(entered.replace(',', '.')) : undefined;
    if (!finalDistanceKm || Number.isNaN(finalDistanceKm) || finalDistanceKm <= 0) {
      window.alert('Une distance réelle valide est nécessaire pour terminer la livraison.');
      return;
    }
    updateOrderStatus(order.id, 'delivered', finalDistanceKm);
  };

  // Orders available for rider acceptance (where store requested a rider)
  const availableOrders = orders.filter(o => o.status === 'rider_requested');

  const getNearestRiderForOrder = (order: Order): User | null => {
    const riders = allUsers.filter(u => u.role === 'livreur' && u.verificationStatus === 'approved');
    const storeLat = order.storeLat;
    const storeLng = order.storeLng;
    if (!isValidCoordinates(storeLat, storeLng)) return null;

    const nearest = riders.reduce((best, rider) => {
      const riderLat = rider.location?.lat;
      const riderLng = rider.location?.lng;
      if (!isValidCoordinates(riderLat, riderLng)) return best;
      const distance = calculateHaversineDistance(storeLat, storeLng, riderLat, riderLng);
      if (distance === null) return best;
      if (!best || distance < best.distance) {
        return { rider, distance };
      }
      return best;
    }, null as { rider: User; distance: number } | null);

    return nearest?.rider ?? null;
  };

  // Orders currently assigned to this rider
  const myActiveOrders = orders.filter(o => 
    o.riderId === currentUser?.id && o.status !== 'delivered' && o.status !== 'cancelled'
  );

  // Completed deliveries for stats (85% driver earnings)
  const completedOrders = orders.filter(o => o.riderId === currentUser?.id && o.status === 'delivered');
  // Track which orders have been reviewed (frontend quick check)
  const reviewedOrderIds = new Set<string>();
  const totalRiderEarnings = completedOrders.reduce((sum, o) => {
    return sum + (o.driverEarnings ?? Math.round(o.deliveryFee * 0.85));
  }, 0);

  const [ratingStats, setRatingStats] = React.useState<{ total: number; average: number; negative_count: number }>({ total: 0, average: 0, negative_count: 0 });

  React.useEffect(() => {
    if (!currentUser) return;
    fetch('/backend/index.php/api/reviews/driver?driver_id=' + currentUser.id, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.stats) {
          setRatingStats(data.stats);
        }
      }).catch(()=>{});
  }, [currentUser]);

  const loadServiceMissions = React.useCallback(() => {
    if (!currentUser) return;
    fetch('/backend/index.php/api/service-express', { credentials: 'include' })
      .then(response => response.json())
      .then(data => { if (data.success) setServiceMissions(data.missions || []); })
      .catch(() => undefined);
  }, [currentUser]);

  React.useEffect(() => { loadServiceMissions(); }, [loadServiceMissions]);

  const updateServiceMission = (missionId: string, status: string) => {
    fetch('/backend/index.php/api/service-express/status', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ missionId: String(missionId), status }),
    }).then(response => response.json()).then(data => {
      if (data.success) loadServiceMissions();
    }).catch(() => undefined);
  };

  const isPendingVerification = currentUser?.verificationStatus === 'pending';
  const isRejected = currentUser?.verificationStatus === 'rejected';
  const isIncomplete = currentUser?.verificationStatus === 'incomplete';
  const needsResubmission = isRejected || isIncomplete;

  const [resubmitSelfie, setResubmitSelfie] = useState(currentUser?.selfiePhoto || '');
  const [resubmitCip, setResubmitCip] = useState(currentUser?.cipPhoto || '');
  const [resubmitVehicle, setResubmitVehicle] = useState(currentUser?.vehiclePhoto || '');
  const [resubmitSelfieFile, setResubmitSelfieFile] = useState<File | null>(null);
  const [resubmitCipFile, setResubmitCipFile] = useState<File | null>(null);
  const [resubmitVehicleFile, setResubmitVehicleFile] = useState<File | null>(null);
  const [resubmitBusy, setResubmitBusy] = useState(false);
  const [resubmitMessage, setResubmitMessage] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      updateUserProfile(currentUser.id, {
        avatar: editSelfie,
        selfiePhoto: editSelfie,
        phone: editPhone,
        vehicle: editVehicle,
      });
    }
    setIsProfileModalOpen(false);
  };

  const handleResubmitDocuments = async () => {
    if (!currentUser) return;
    setResubmitBusy(true);
    setResubmitMessage(null);
    try {
      let selfieUrl = resubmitSelfie;
      let cipUrl = resubmitCip;
      let vehicleUrl = resubmitVehicle;
      if (resubmitSelfieFile) selfieUrl = await uploadImageFile(resubmitSelfieFile, 'livreurs');
      if (resubmitCipFile) cipUrl = await uploadImageFile(resubmitCipFile, 'livreurs');
      if (resubmitVehicleFile) vehicleUrl = await uploadImageFile(resubmitVehicleFile, 'livreurs');
      await updateUserProfile(currentUser.id, {
        selfiePhoto: selfieUrl,
        cipPhoto: cipUrl,
        vehiclePhoto: vehicleUrl,
        avatar: selfieUrl,
      });
      setResubmitMessage('Dossier renvoyé pour vérification. Statut : en attente de certification.');
    } catch (error: any) {
      setResubmitMessage(error?.message || 'Impossible d’envoyer le dossier.');
    } finally {
      setResubmitBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Back Button to Client Market */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <button
          onClick={() => setActiveRole('client')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>← Retour à l'Accueil (Marché Client)</span>
        </button>
        <span className="text-xs font-semibold text-slate-500">
          Espace Livreur • {currentUser?.name || 'Livreur'}
        </span>
      </div>

      {/* VERIFICATION PENDING WORKFLOW BANNER */}
      {isPendingVerification && currentUser && (
        <div className="bg-amber-50 rounded-3xl border-2 border-amber-300 p-6 sm:p-8 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono text-[10px] uppercase font-bold">
                  En attente de certification
                </span>
                <h2 className="text-xl font-black text-amber-950 mt-1">
                  Vérification de Sécurité & Conformité en Cours
                </h2>
                <p className="text-xs text-amber-800">
                  L&apos;administrateur vérifie vos pièces obligatoires (Selfie, CIP et Photo Moto) sous 12h maximum.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-white rounded-2xl border border-amber-200 flex items-center gap-3">
              {(currentUser.selfiePhoto || currentUser.avatar) ? (
                <img src={currentUser.selfiePhoto || currentUser.avatar} alt="Selfie" className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">1. Photo Livreur</span>
                <span className="text-xs font-bold text-slate-900 truncate block">{currentUser.name}</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-amber-200 flex items-center gap-3">
              {currentUser.cipPhoto ? (
                <img src={currentUser.cipPhoto} alt="Carte CIP" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-[10px] text-slate-400 font-bold">—</div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">2. Carte CIP / ID</span>
                <span className="text-xs font-bold text-slate-900 truncate block">Pièce d&apos;identité</span>
              </div>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-amber-200 flex items-center gap-3">
              {currentUser.vehiclePhoto ? (
                <img src={currentUser.vehiclePhoto} alt="Moto" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-[10px] text-slate-400 font-bold">—</div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">3. Moto & Plaque</span>
                <span className="text-xs font-bold text-slate-900 truncate block">{currentUser.vehicle || 'Moto'} {currentUser.vehiclePlate || ''}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {needsResubmission && currentUser && (
        <div className={`rounded-3xl border-2 p-6 sm:p-8 space-y-5 shadow-md ${isRejected ? 'bg-rose-50 border-rose-300' : 'bg-orange-50 border-orange-300'}`}>
          <div>
            <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold ${isRejected ? 'bg-rose-200 text-rose-900' : 'bg-orange-200 text-orange-900'}`}>
              {isRejected ? 'Certification refusée' : 'Informations incomplètes'}
            </span>
            <h2 className={`text-xl font-black mt-2 ${isRejected ? 'text-rose-950' : 'text-orange-950'}`}>
              Action requise de votre part
            </h2>
            <p className={`text-xs mt-1 ${isRejected ? 'text-rose-800' : 'text-orange-800'}`}>
              {currentUser.rejectionReason || 'Merci de compléter ou corriger vos documents pour reprendre la certification.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MediaPicker
              label="Selfie"
              value={resubmitSelfie}
              captureMode="user"
              compact
              onChange={(preview, file) => { setResubmitSelfie(preview); setResubmitSelfieFile(file); }}
              onClear={() => { setResubmitSelfie(''); setResubmitSelfieFile(null); }}
            />
            <MediaPicker
              label="CIP / Pièce ID"
              value={resubmitCip}
              captureMode="environment"
              allowDocuments
              onChange={(preview, file) => { setResubmitCip(preview); setResubmitCipFile(file); }}
              onClear={() => { setResubmitCip(''); setResubmitCipFile(null); }}
            />
            <MediaPicker
              label="Photo moto"
              value={resubmitVehicle}
              captureMode="environment"
              onChange={(preview, file) => { setResubmitVehicle(preview); setResubmitVehicleFile(file); }}
              onClear={() => { setResubmitVehicle(''); setResubmitVehicleFile(null); }}
            />
          </div>

          <button
            type="button"
            disabled={resubmitBusy}
            onClick={() => void handleResubmitDocuments()}
            className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold disabled:opacity-60"
          >
            {resubmitBusy ? 'Envoi…' : 'Renvoyer mon dossier pour certification'}
          </button>
          {resubmitMessage && <p className="text-xs font-semibold text-slate-700">{resubmitMessage}</p>}
        </div>
      )}
      
      {/* Rider Status & Profile Card */}
      <div className="bg-linear-to-r from-emerald-700 via-emerald-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
            alt={currentUser?.name || 'Livreur'}
            className="w-16 h-16 rounded-full object-cover border-4 border-white/20 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentUser?.verificationStatus === 'approved' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-amber-500/30 text-amber-200'}`}>
                {currentUser?.verificationStatus === 'approved' ? 'Livreur Certifié Livriko' : 'En Attente de Validation (12h max)'}
              </span>
              <span className="text-xs text-emerald-200">• {currentUser?.vehicle || 'Moto'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5 flex flex-wrap items-center gap-2 wrap-break-word">
              {currentUser?.name || 'Livreur Livriko'}
              {currentUser?.verificationStatus === 'approved' && (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
            </h1>
            <p className="text-xs text-emerald-100 font-mono">ID Livreur : #LVK-RIDER-{currentUser?.id ? currentUser.id.slice(-4) : '0000'}</p>
          </div>
        </div>

        {/* Online Toggle & Earnings & Profile button */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-200 block">Gains estimées</span>
            <span className="text-xl font-black text-white">{totalRiderEarnings.toLocaleString()} FCFA</span>
          </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Ma note</span>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xl font-black text-white">{ratingStats.average.toFixed(1)} / 5</span>
                <span className="text-sm text-slate-200">({ratingStats.total} avis)</span>
              </div>
            </div>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Modifier mes infos
          </button>

          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-4 py-3 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer ${
              isOnline
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-white animate-ping' : 'bg-slate-500'}`} />
            <span>{isOnline ? 'En service (Disponible)' : 'Hors service'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 rounded-2xl bg-slate-100 p-1.5 max-w-2xl">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Navigation className="w-4 h-4" />
          Missions En Cours ({myActiveOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'available' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4 text-orange-400" />
          Offres Disponibles ({availableOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'history' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          Historique 11 Champs ({completedOrders.length})
        </button>
      </div>

      {/* TAB 1: ACTIVE MISSIONS WITH TURN-BY-TURN GPS NAVIGATION */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {myActiveOrders.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 shadow-xs">
              <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-spin-slow" />
              <p className="text-xs font-bold text-slate-800">Aucune mission en cours actuellement</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Basculez sur l'onglet "Offres Disponibles" pour accepter une nouvelle livraison attribuée par les restaurants de Lokossa.
              </p>
            </div>
          ) : (
            myActiveOrders.map(order => {
              if (!order.distanceKm || order.distanceKm <= 0) return null;
              const feeInfo = calculateDeliveryFee(order.distanceKm);
              const totalToCollect = order.subtotal + feeInfo.deliveryFee;

              return (
                <div key={order.id} className="bg-white rounded-3xl border-2 border-emerald-500 p-6 shadow-xl space-y-6">
                  
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                          COURSE EN COURS ({order.code})
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          Paiement : {order.paymentMethod.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mt-1">
                        Gains Livreur (85%) : <span className="text-emerald-600">{(order.driverEarnings ?? feeInfo.driverEarnings).toLocaleString()} FCFA</span>
                      </h3>
                    </div>

                    <a
                      href={`tel:${order.clientPhone}`}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition"
                    >
                      <Phone className="w-4 h-4" />
                      Appeler le client ({order.clientName})
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTrackingOrder(order);
                        onOpenChat?.();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md flex items-center gap-2 transition"
                    >
                      Discuter
                    </button>
                  </div>

                  {/* Waypoints Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50/70 rounded-2xl border border-orange-200 space-y-2">
                      <div className="flex items-center justify-between text-orange-900 font-bold text-xs uppercase">
                        <span className="flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-orange-600" />
                          1. Point de Départ (Restaurant)
                        </span>
                        <span className="font-mono text-[10px] text-orange-700">GPS: {order.storeLat?.toFixed(4)}, {order.storeLng?.toFixed(4)}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{order.storeName}</h4>
                      <p className="text-xs text-slate-600">{order.storeAddress}</p>
                    </div>

                    <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between text-blue-900 font-bold text-xs uppercase">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          2. Destination (Client)
                        </span>
                        <span className="font-mono text-[10px] text-blue-700">GPS: {order.clientLat?.toFixed(4)}, {order.clientLng?.toFixed(4)}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{order.clientName}</h4>
                      <p className="text-xs text-slate-600">{order.clientAddress}</p>
                    </div>
                  </div>

                  {/* LIVE TURN-BY-TURN GPS MAP VISUALIZER */}
                  <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-4 shadow-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-emerald-400 animate-pulse" />
                        <div>
                          <h4 className="text-sm font-bold text-white">Guidage GPS Pas à Pas en Temps Réel</h4>
                          <p className="text-[10px] text-slate-400">Navigation automatique calculée via coordonnées GPS Haversine</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                        {order.distanceKm} km • {feeInfo.deliveryFee.toLocaleString()} FCFA
                      </span>
                    </div>

                    {/* Animated Route Graphic */}
                    <div className="relative h-28 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-hidden flex items-center justify-between">
                      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1.5 bg-slate-800 rounded-full">
                        <div className="h-full bg-linear-to-r from-orange-500 via-emerald-400 to-blue-500 rounded-full w-3/4 animate-pulse" />
                      </div>

                      {/* Store Icon Pin */}
                      <div className="relative z-10 bg-orange-600 text-white p-2 rounded-xl shadow-md text-center">
                        <Store className="w-4 h-4 mx-auto" />
                        <span className="text-[9px] font-bold block mt-0.5 truncate max-w-20">{order.storeName}</span>
                      </div>

                      {/* Rider Scooter Animated */}
                      <div className="relative z-10 bg-emerald-500 text-slate-950 p-2.5 rounded-full shadow-lg ring-4 ring-emerald-500/30 animate-bounce">
                        <Truck className="w-5 h-5" />
                      </div>

                      {/* Client Destination Pin */}
                      <div className="relative z-10 bg-blue-600 text-white p-2 rounded-xl shadow-md text-center">
                        <MapPin className="w-4 h-4 mx-auto" />
                        <span className="text-[9px] font-bold block mt-0.5 truncate max-w-20">{order.clientName}</span>
                      </div>
                    </div>

                    {/* Step Guidance Text */}
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-slate-200">
                          {order.status === 'rider_assigned' && "📍 En route vers le restaurant pour récupérer la commande"}
                          {order.status === 'picked_up' && "📦 Colis récupéré ! Prêt à démarrer le guidage GPS vers le client"}
                          {order.status === 'delivering' && `🛵 En cours d'acheminement vers ${order.clientAddress} (Arrivée estimée dans ~5 min)`}
                        </span>
                      </div>
                      <span className="text-emerald-400 font-mono text-[11px] font-bold">Barème : {feeInfo.ratePerKm} F/km</span>
                    </div>
                  </div>

                  {/* Actions Bar (No Manual Input Required) */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    <div className="text-xs text-slate-600">
                      <span>Total à percevoir du client : </span>
                      <strong className="text-base text-slate-900 font-black">{totalToCollect.toLocaleString()} FCFA</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === 'rider_assigned' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'picked_up')}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          ✔ Colis récupéré au restaurant
                        </button>
                      )}

                      {order.status === 'picked_up' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivering')}
                          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                        >
                          🚀 Démarrer le guidage GPS
                        </button>
                      )}

                      {order.status === 'delivering' && (
                        <button
                          onClick={() => handleCompleteDelivery(order)}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Terminer la livraison (Compteur final)
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: AVAILABLE OFFERS POOL */}
      {activeTab === 'available' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          {serviceMissions.length > 0 && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Missions Service Express</h2>
                  <p className="text-xs text-slate-500">Demandes de colis, documents et courses à effectuer.</p>
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{serviceMissions.length}</span>
              </div>
              <div className="grid gap-3">
                {serviceMissions.map(mission => (
                  <div key={mission.id} className="rounded-xl border border-orange-200 bg-white p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase text-orange-600">{mission.type} • Mission #{mission.id}</p>
                      <p className="mt-1 text-sm font-bold text-slate-900 wrap-break-word">{mission.description}</p>
                      <p className="mt-1 text-xs text-slate-500">{mission.fromAddress} → {mission.toAddress} • {mission.distanceKm} km</p>
                      <p className="mt-1 text-xs font-bold text-emerald-600">Gain estimé : {Math.round(mission.fee * 0.85).toLocaleString()} FCFA</p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {mission.status === 'searching' && <button onClick={() => { updateServiceMission(mission.id, 'assigned'); setActiveTab('active'); }} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white">Accepter la mission</button>}
                      {mission.status === 'assigned' && <button onClick={() => updateServiceMission(mission.id, 'to_pickup')} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">En route vers le départ</button>}
                      {mission.status === 'to_pickup' && <button onClick={() => updateServiceMission(mission.id, 'picked_up')} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Objet récupéré</button>}
                      {mission.status === 'picked_up' && <button onClick={() => updateServiceMission(mission.id, 'delivering')} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Démarrer la livraison</button>}
                      {mission.status === 'delivering' && <button onClick={() => updateServiceMission(mission.id, 'delivered')} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white">Livraison effectuée</button>}
                      {mission.status === 'delivered' && <button onClick={() => updateServiceMission(mission.id, 'completed')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">Terminer la mission</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Demandes de Livraison Disponibles</h2>
              <p className="text-xs text-slate-500 font-medium">Offres diffusées en temps réel par les restaurateurs à Lokossa</p>
            </div>

            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              {availableOrders.length} offre(s)
            </span>
          </div>

          {availableOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">Aucune nouvelle demande de livraison pour l'instant.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Dès qu'un vendeur valide une commande et demande un livreur, la course s'affichera ici.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map(order => {
                if (!order.distanceKm || order.distanceKm <= 0) return null;
                const estimatedDist = order.distanceKm;
                const feeInfo = calculateDeliveryFee(estimatedDist);
                return (
                  <div key={order.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-400 transition">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                          {order.code}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{order.storeName}</span>
                        <span className="text-xs text-slate-400">• {order.createdAt}</span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>📦 Total commande : <strong>{(order.subtotal + feeInfo.deliveryFee).toLocaleString()} FCFA</strong> ({order.items.length} article(s))</p>
                        <p>📍 Destination : <strong>{order.clientAddress}</strong></p>
                        <p className="text-[11px] text-orange-600 font-medium pt-0.5">
                          📏 Distance GPS : <strong>{estimatedDist} km</strong> (Frais livraison : {feeInfo.deliveryFee.toLocaleString()} F)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Votre gain (85%)</span>
                        <span className="text-lg font-black text-emerald-600">{feeInfo.driverEarnings.toLocaleString()} FCFA</span>
                        <span className="text-[9px] text-slate-400 block">Livriko 15%: {feeInfo.platformFee} F</span>
                      </div>

                      {currentUser?.role === 'livreur' ? (
                        <RiderAcceptButton
                          order={order}
                          currentUser={currentUser}
                          getNearestRiderForOrder={getNearestRiderForOrder}
                          onAccept={() => {
                            acceptDeliveryOrder(order.id);
                            setActiveTab('active');
                          }}
                        />
                      ) : (
                        <button
                          disabled
                          className="px-5 py-2.5 rounded-xl bg-slate-300 text-slate-500 text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-not-allowed"
                        >
                          <Play className="w-4 h-4" />
                          Accepter la course
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DETAILED 11-FIELD HISTORICAL RIDE RECEIPTS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Historique Détaillé des Courses (Fiche à 11 Champs)</h2>
              <p className="text-xs text-slate-500">Registre complet des livraisons effectuées avec horodatages et calculs kilométriques automatiques GPS.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              {completedOrders.length} course(s) livrée(s)
            </span>
          </div>

          {completedOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold">Aucune livraison enregistrée dans l'historique</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedOrders.map(order => {
                if (!order.distanceKm || order.distanceKm <= 0) return null;
                const feeInfo = calculateDeliveryFee(order.distanceKm);
                return (
                  <div key={order.id} className="p-5 bg-linear-to-br from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold">
                          {order.code}
                        </span>
                        <span className="text-xs font-bold text-slate-800">Course Effectuée par {order.riderName || currentUser?.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✔ LIVRÉE ET REGLEÉ
                      </span>
                    </div>

                    {/* 11 MANDATORY FIELDS GRID DISPLAY */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      
                      {/* Field 1: Restaurant */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">1. Restaurant (Nom & Adresse)</span>
                        <strong className="text-slate-900 block mt-0.5">{order.storeName}</strong>
                        <span className="text-[11px] text-slate-500">{order.storeAddress}</span>
                      </div>

                      {/* Field 2: Client */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">2. Client (Nom & Adresse)</span>
                        <strong className="text-slate-900 block mt-0.5">{order.clientName}</strong>
                        <span className="text-[11px] text-slate-500">{order.clientAddress}</span>
                      </div>

                      {/* Field 3: Livreur & Véhicule */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">3. Livreur & Véhicule</span>
                        <strong className="text-slate-900 block mt-0.5">{order.riderName || currentUser?.name}</strong>
                        <span className="text-[11px] text-slate-500">{order.riderVehicle || currentUser?.vehicle || 'Moto TVS 125'}</span>
                      </div>

                      {/* Field 4: Coordonnées GPS */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">4. GPS Départ / Arrivée</span>
                        <span className="text-[11px] text-slate-700 font-mono block">Start: {order.storeLat?.toFixed(4)}, {order.storeLng?.toFixed(4)}</span>
                        <span className="text-[11px] text-slate-700 font-mono block">End: {order.clientLat?.toFixed(4)}, {order.clientLng?.toFixed(4)}</span>
                      </div>

                      {/* Field 5: Distance Totale */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">5. Distance Parcourue</span>
                        <strong className="text-emerald-600 text-sm block mt-0.5">{order.distanceKm} km</strong>
                        <span className="text-[10px] text-slate-400">Calcul Haversine auto</span>
                      </div>

                      {/* Field 6: Tarif & Frais Livraison */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">6. Frais & Barème Aplicqué</span>
                        <strong className="text-slate-900 block mt-0.5">{order.deliveryFee.toLocaleString()} FCFA</strong>
                        <span className="text-[10px] text-orange-600 font-bold">Livreur (85%): {(order.driverEarnings ?? feeInfo.driverEarnings).toLocaleString()} F</span>
                      </div>

                      {/* Field 7: Montant Total Payé */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">7. Montant Total Encaisse</span>
                        <strong className="text-slate-900 text-sm block mt-0.5">{order.totalAmount.toLocaleString()} FCFA</strong>
                        <span className="text-[10px] text-slate-500 uppercase">{order.paymentMethod}</span>
                      </div>

                      {/* Field 8 & 9: Horodatages Début & Fin */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">8 & 9. Horodatage Course</span>
                        <span className="text-[11px] text-slate-700 block">Début: {order.startedAt || order.createdAt}</span>
                        <span className="text-[11px] text-slate-700 block">Fin: {order.deliveredAt || 'Horodaté'}</span>
                      </div>

                      {/* Field 10 & 11: Durée & Statut */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">10 & 11. Durée & Statut</span>
                        <strong className="text-blue-600 block mt-0.5">{order.durationMinutes || 12} minutes</strong>
                        <span className="text-[10px] font-bold text-emerald-600">Statut: Livrée (Terminée)</span>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rider Profile Settings Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-1100 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Modifier mon Profil Livreur
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Photo Selfie (URL)</label>
                <input
                  type="text"
                  required
                  value={editSelfie}
                  onChange={e => setEditSelfie(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Téléphone / WhatsApp</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Moto & Immatriculation</label>
                <input
                  type="text"
                  required
                  value={editVehicle}
                  onChange={e => setEditVehicle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
