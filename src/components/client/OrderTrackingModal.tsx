import React, { useEffect, useState } from 'react';
import { 
  X, Truck, MapPin, CheckCircle2, Phone, Clock, Store, User, AlertCircle, ArrowRight, ArrowLeft, Trash2 
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';

export const OrderTrackingModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const { updateOrderStatus } = useApp();
  const [riderProgress, setRiderProgress] = useState(65); // percentage along route

  const displayDistanceKm = order.distanceKm ?? 2;
  const displayDeliveryFee = order.finalDeliveryFee ?? order.estimatedDeliveryFee ?? order.deliveryFee;

  const steps: { status: OrderStatus; label: string; desc: string }[] = [
    { status: 'pending', label: 'Commande envoyée', desc: 'Reçue par le commerçant' },
    { status: 'confirmed', label: 'En préparation', desc: 'Le vendeur prépare vos articles' },
    { status: 'rider_requested', label: 'Livreur sollicité', desc: 'Recherche d\'un livreur à proximité' },
    { status: 'rider_assigned', label: 'Livreur assigné', desc: 'Se déplace vers la boutique' },
    { status: 'picked_up', label: 'Colis récupéré', desc: 'En route vers votre adresse' },
    { status: 'delivering', label: 'En cours de livraison', desc: 'Le livreur approche de votre position' },
    { status: 'delivered', label: 'Commande livrée', desc: 'Livraison effectuée avec succès' },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status);


  return (
    <div className="fixed inset-0 z-1100 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 my-auto">
        
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-5 sm:p-6 relative">
          <div className="flex items-center justify-between gap-2 mb-2">
            <button
              onClick={onClose}
              type="button"
              className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-orange-300" />
              <span>Retour</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-100 font-semibold text-[10px] tracking-wide">
              Suivi de Livraison en temps réel
            </span>
            <span className="text-xs text-blue-200">{order.createdAt}</span>
          </div>

          <h2 className="text-2xl font-black">{order.code}</h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Boutique : <strong>{order.storeName}</strong>
          </p>
        </div>

        {/* Live Map Simulation Stage */}
        <div className="relative bg-slate-100 h-48 border-b border-slate-200 overflow-hidden flex items-center justify-center">
          
          {/* Decorative Map Grid & Roads */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] bg-size-[16px_16px]" />
          <svg className="absolute inset-0 w-full h-full stroke-blue-300 stroke-3 fill-none" opacity="0.4">
            <path d="M 40 120 Q 150 40 300 120 T 600 80" />
            <path d="M 80 180 L 250 30 L 500 160" stroke="#f97316" strokeDasharray="4 4" />
          </svg>

          {/* Store Pin */}
          <div className="absolute left-[15%] top-[40%] text-center transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-orange-500 flex items-center justify-center shadow-md">
              <Store className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold bg-white/90 px-1.5 py-0.5 rounded shadow-xs mt-1 inline-block text-slate-800">
              {order.storeName}
            </span>
          </div>

          {/* Client Pin */}
          <div className="absolute right-[15%] top-[55%] text-center transform translate-x-1/2 -translate-y-1/2">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center shadow-md">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold bg-white/90 px-1.5 py-0.5 rounded shadow-xs mt-1 inline-block text-slate-800 truncate max-w-30">
              {order.clientAddress}
            </span>
          </div>

          {/* Rider Moving Icon */}
          {order.riderName && (
            <div 
              className="absolute top-[45%] text-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
              style={{ left: `${order.status === 'delivered' ? 85 : order.status === 'delivering' ? 60 : 35}%` }}
            >
              <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-emerald-900 text-emerald-100 px-2 py-0.5 rounded-full shadow-xs mt-1 inline-block">
                {order.riderName} (Moto)
              </span>
            </div>
          )}

          {/* ETA Floating Card */}
          <div className="absolute bottom-3 left-4 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 backdrop-blur-xs">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>Temps estimé : <strong>~{order.estimatedMinutes || 15} minutes</strong></span>
          </div>
        </div>

        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">🚚 Livraison</p>
              <h3 className="text-base font-black text-slate-900 mt-1">
                {order.riderName ? '🚴 Votre livreur est en route' : '📍 Distance estimée et tarif calculés automatiquement'}
              </h3>
            </div>
            <span className="rounded-full bg-orange-100 text-orange-700 px-2.5 py-1 text-[10px] font-bold">{displayDistanceKm.toFixed(1)} km</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-white p-2.5">
              <p className="text-[10px] font-bold uppercase text-slate-500">📍 Distance estimée</p>
              <p className="mt-1 text-sm font-black text-slate-900">{displayDistanceKm.toFixed(1)} km</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-2.5">
              <p className="text-[10px] font-bold uppercase text-slate-500">💰 Frais de livraison</p>
              <p className="mt-1 text-sm font-black text-orange-600">{displayDeliveryFee.toLocaleString()} FCFA</p>
            </div>
          </div>
        </div>

        {/* Rider Info Strip if assigned */}
        {order.riderName ? (
          <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={order.riderPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                alt={order.riderName}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
              />
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Votre livreur Livriko</p>
                <h4 className="text-sm font-bold text-slate-900">{order.riderName}</h4>
                <p className="text-xs text-slate-600">Transport en moto • {order.riderPhone}</p>
              </div>
            </div>

            <a
              href={`tel:${order.riderPhone}`}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Phone className="w-3.5 h-3.5" />
              Appeler
            </a>
          </div>
        ) : (
          <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Un livreur à proximité va être automatiquement affecté par la plateforme Livriko.</span>
            </div>
          </div>
        )}

        {/* Step Progress Timeline */}
        <div className="p-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Étapes de la livraison</h4>
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const isDone = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.status} className="flex items-start gap-3 relative">
                  {idx !== steps.length - 1 && (
                    <div 
                      className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${
                        idx < currentStepIndex ? 'bg-blue-600' : 'bg-slate-200'
                      }`} 
                    />
                  )}
                  
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold z-10 ${
                      isDone 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div className="pt-0.5">
                    <p className={`text-xs font-bold ${isCurrent ? 'text-blue-600' : isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label} {isCurrent && <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full ml-2">En cours</span>}
                    </p>
                    <p className="text-[11px] text-slate-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary & Breakdown */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Sous-total articles :</span>
              <span className="font-semibold text-slate-800">{order.subtotal.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1">
                Frais de livraison ({displayDistanceKm.toFixed(1)} km) :
              </span>
              <span className="font-semibold text-orange-600">{displayDeliveryFee.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-bold text-slate-900 text-sm">
              <span>Total à payer à la livraison :</span>
              <span className="text-orange-600">{order.totalAmount.toLocaleString()} FCFA</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
              {['pending', 'confirmed', 'rider_requested'].includes(order.status) ? (
                <button
                  onClick={() => {
                    if (window.confirm('Voulez-vous vraiment annuler cette commande ?')) {
                      updateOrderStatus(order.id, 'cancelled', undefined, 'Annulée par le client');
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 border border-rose-200 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Annuler la commande</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 italic">Commande en cours de livraison</span>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
