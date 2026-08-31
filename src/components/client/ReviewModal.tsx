import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const QUICK_REASONS = [
  'Livreur poli',
  'Livraison rapide',
  'Bon comportement',
  'Commande bien transportée',
  'Retard',
  'Mauvaise communication',
  'Comportement inapproprié',
];

export const ReviewModal: React.FC<{ orderId: string; isOpen: boolean; onClose: () => void }> = ({
  orderId, isOpen, onClose,
}) => {
  const { addNotification } = useApp();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleReason = (r: string) => {
    setSelectedReasons(prev => (prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]));
  };

  const submit = async () => {
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    const payload = new URLSearchParams();
    payload.append('order_id', orderId);
    payload.append('rating', String(rating));
    payload.append('comment', comment);
    payload.append('reasons', JSON.stringify(selectedReasons));

    try {
      const res = await fetch('/backend/index.php/api/reviews/create', {
        method: 'POST', body: payload, credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        addNotification('Merci pour votre avis !', 'Votre évaluation a été enregistrée.', 'client');
        onClose();
      } else {
        alert(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch {
      alert('Erreur réseau lors de l\'enregistrement');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-1150 bg-[#0c1a2e]/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#fffdf8] rounded-2xl shadow-2xl border border-[#e6dac8] p-5 w-[min(440px,96vw)] relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[#f4f0e8] border border-[#e6dac8] flex items-center justify-center text-slate-500 hover:text-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff8a1f]">Avis livraison</p>
        <h3 className="text-lg font-black text-slate-900 mt-1">Comment s’est passée la livraison ?</h3>
        <p className="text-xs text-slate-500 mt-1">Votre retour aide à améliorer Livriko.</p>

        <div className="flex items-center gap-1.5 mt-4">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="p-1.5 rounded-lg hover:bg-[#f4f0e8] transition"
              aria-label={`${n} étoiles`}
            >
              <Star
                className={`w-7 h-7 ${
                  n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Commentaire (facultatif)"
          className="w-full mt-4 p-3 rounded-xl border border-[#e6dac8] bg-white text-sm text-slate-800 focus:outline-none focus:border-[#ff8a1f] resize-none"
          rows={3}
        />

        <div className="mt-3">
          <p className="text-xs font-bold text-slate-700 mb-2">Raisons rapides</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => toggleReason(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  selectedReasons.includes(r)
                    ? 'bg-[#ff8a1f] text-white border-[#ff8a1f]'
                    : 'bg-[#f4f0e8] text-slate-600 border-[#e6dac8]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[#e6dac8]">
          <button
            type="button"
            onClick={async () => {
              const reason = window.prompt(
                'Catégorie (Retard, Comportement, Communication, Commande endommagée, Paiement, Autre)',
              );
              if (!reason) return;
              const description = window.prompt('Expliquez le problème (facultatif)') || '';
              try {
                const payload = new URLSearchParams();
                payload.append('order_id', orderId);
                payload.append('reason', reason);
                payload.append('description', description);
                const res = await fetch('/backend/index.php/api/reviews/report', {
                  method: 'POST', body: payload, credentials: 'include',
                });
                const data = await res.json();
                if (data.success) {
                  addNotification('Signalement envoyé', 'Nous avons bien reçu votre signalement.', 'client');
                } else {
                  alert(data.error || 'Erreur lors de l\'envoi');
                }
              } catch {
                alert('Erreur réseau');
              }
            }}
            className="text-xs font-bold text-rose-500 hover:underline"
          >
            Signaler
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#f4f0e8] border border-[#e6dac8] text-xs font-bold text-slate-700"
            >
              Plus tard
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-xs font-black disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
