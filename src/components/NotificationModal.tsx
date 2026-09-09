import React from 'react';
import { X, Bell, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';

function rolesMatch(target: UserRole, active: UserRole) {
  if (target === active) return true;
  // vendeur / restaurant partagent les notifs boutique
  if ((target === 'vendeur' || target === 'restaurant') && (active === 'vendeur' || active === 'restaurant')) {
    return true;
  }
  return false;
}

export const NotificationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, activeRole, setActiveTrackingOrder, orders } = useApp();

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => rolesMatch(n.targetRole, activeRole));

  return (
    <div className="fixed inset-0 z-1100 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              type="button"
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Retour"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Retour</span>
            </button>
            <div className="flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold">Notifications</h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 italic">Aucune notification pour le moment.</p>
          ) : (
            filteredNotifs.map(n => (
              <div 
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.orderId) {
                    const order = orders.find(o => o.id === n.orderId);
                    if (order) {
                      setActiveTrackingOrder(order);
                      onClose();
                    }
                  }
                }}
                className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition space-y-1 ${
                  n.read ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-blue-50/70 border-blue-200 text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 min-w-0">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                    <span className="truncate">{n.title}</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">{n.message}</p>
                {n.orderId && (
                  <span className="text-[10px] font-bold text-blue-600 underline block pt-0.5">
                    Voir la commande →
                  </span>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
