import React from 'react';
import {
  X, Truck, MapPin, CheckCircle2, Phone, Clock, Store, AlertCircle, ArrowLeft, Trash2,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';

export const OrderTrackingModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
  const { updateOrderStatus } = useApp();

  const displayDistanceKm = order.distanceKm ?? 2;
  const displayDeliveryFee = order.finalDeliveryFee ?? order.estimatedDeliveryFee ?? order.deliveryFee;

  const steps: { status: OrderStatus; label: string; desc: string }[] = [
    { status: 'pending', label: 'Commande envoyée', desc: 'Reçue par le commerçant' },
    { status: 'confirmed', label: 'En préparation', desc: 'Le vendeur prépare vos articles' },
    { status: 'rider_requested', label: 'Livreur sollicité', desc: 'Recherche d\'un livreur à proximité' },
    { status: 'rider_assigned', label: 'Livreur assigné', desc: 'Se déplace vers la boutique' },
    { status: 'picked_up', label: 'Colis récupéré', desc: 'En route vers votre adresse' },
    { status: 'delivering', label: 'En cours de livraison', desc: 'Le livreur approche' },
    { status: 'delivered', label: 'Commande livrée', desc: 'Livraison effectuée' },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status);

  return (
    <div className="fixed inset-0 z-1100 bg-[#0c1a2e]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#fffdf8] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e6dac8] my-auto">

        <div className="bg-[#0c1a2e] text-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              onClick={onClose}
              type="button"
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#ffb86a]" />
              Retour
            </button>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-wider text-[#ffb86a]">
            Suivi · {order.createdAt}
          </p>
          <h2 className="text-xl font-black mt-1">{order.code}</h2>
          <p className="text-xs text-slate-300 mt-0.5">{order.storeName}</p>
        </div>

        {/* Map simulation */}
        <div className="relative bg-[#f4f0e8] h-40 border-b border-[#e6dac8] overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#ff8a1f_1px,transparent_1px)] bg-size-[14px_14px]" />

          <div className="absolute left-[15%] top-[40%] text-center -translate-x-1/2 -translate-y-1/2">
            <div className="w-9 h-9 rounded-full bg-white border-2 border-[#ff8a1f] flex items-center justify-center shadow-md mx-auto">
              <Store className="w-4 h-4 text-[#ff8a1f]" />
            </div>
            <span className="text-[9px] font-bold bg-white/95 px-1.5 py-0.5 rounded mt-1 inline-block text-slate-800 max-w-20 truncate">
              {order.storeName}
            </span>
          </div>

          <div className="absolute right-[15%] top-[55%] text-center translate-x-1/2 -translate-y-1/2">
            <div className="w-9 h-9 rounded-full bg-white border-2 border-[#0c1a2e] flex items-center justify-center shadow-md mx-auto">
              <MapPin className="w-4 h-4 text-[#0c1a2e]" />
            </div>
            <span className="text-[9px] font-bold bg-white/95 px-1.5 py-0.5 rounded mt-1 inline-block text-slate-800 max-w-20 truncate">
              Vous
            </span>
          </div>

          {order.riderName && (
            <div
              className="absolute top-[45%] text-center -translate-x-1/2 -translate-y-1/2 transition-all duration-700"
              style={{ left: `${order.status === 'delivered' ? 85 : order.status === 'delivering' ? 60 : 35}%` }}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-pulse mx-auto">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-bold bg-[#0c1a2e] text-[#ffb86a] px-2 py-0.5 rounded-full mt-1 inline-block">
                {order.riderName}
              </span>
            </div>
          )}

          <div className="absolute bottom-2.5 left-3 bg-[#0c1a2e]/90 text-white px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#ffb86a]" />
            ~{order.estimatedMinutes || 15} min
          </div>
        </div>

        <div className="bg-[#faf6ef] border-b border-[#e6dac8] p-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[#e6dac8] bg-[#fffdf8] p-2.5">
            <p className="text-[10px] font-bold uppercase text-slate-400">Distance</p>
            <p className="mt-0.5 text-sm font-black text-slate-900">{displayDistanceKm.toFixed(1)} km</p>
          </div>
          <div className="rounded-xl border border-[#e6dac8] bg-[#fffdf8] p-2.5">
            <p className="text-[10px] font-bold uppercase text-slate-400">Livraison</p>
            <p className="mt-0.5 text-sm font-black text-[#ff8a1f]">{displayDeliveryFee.toLocaleString()} F</p>
          </div>
        </div>

        {order.riderName ? (
          <div className="bg-emerald-50 p-3.5 border-b border-emerald-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {order.riderPhoto ? (
                <img
                  src={order.riderPhoto}
                  alt={order.riderName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                  {order.riderName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Livreur</p>
                <h4 className="text-sm font-bold text-slate-900 truncate">{order.riderName}</h4>
              </div>
            </div>
            {order.riderPhone && (
              <a
                href={`tel:${order.riderPhone}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Phone className="w-3.5 h-3.5" /> Appeler
              </a>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 p-3.5 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Un livreur sera bientôt affecté.</span>
          </div>
        )}

        <div className="p-4 sm:p-5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Étapes</h4>
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isDone = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.status} className="flex items-start gap-3 relative">
                  {idx !== steps.length - 1 && (
                    <div
                      className={`absolute left-3 top-7 bottom-0 w-0.5 ${
                        idx < currentStepIndex ? 'bg-[#ff8a1f]' : 'bg-[#e6dac8]'
                      }`}
                    />
                  )}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold z-10 ${
                      isDone
                        ? 'bg-[#ff8a1f] text-white'
                        : 'bg-[#f4f0e8] text-slate-400 border border-[#e6dac8]'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <div className="pt-0.5">
                    <p className={`text-xs font-bold ${isCurrent ? 'text-[#ff8a1f]' : isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                      {isCurrent && (
                        <span className="text-[9px] bg-[#ff8a1f]/15 text-[#e86f00] font-semibold px-1.5 py-0.5 rounded ml-1.5">
                          En cours
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-[#e6dac8] space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total</span>
              <span className="font-semibold text-slate-800">{order.subtotal.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Livraison ({displayDistanceKm.toFixed(1)} km)</span>
              <span className="font-semibold text-[#ff8a1f]">{displayDeliveryFee.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#e6dac8] font-black text-sm text-slate-900">
              <span>Total</span>
              <span className="text-[#ff8a1f]">{order.totalAmount.toLocaleString()} FCFA</span>
            </div>

            <div className="pt-3">
              {['pending', 'confirmed', 'rider_requested'].includes(order.status) ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Voulez-vous vraiment annuler cette commande ?')) {
                      updateOrderStatus(order.id, 'cancelled', undefined, 'Annulée par le client');
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Annuler
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">Commande en cours de livraison</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
