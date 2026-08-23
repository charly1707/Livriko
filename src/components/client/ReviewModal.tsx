import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const QUICK_REASONS = [
  'Livreur poli',
  'Livraison rapide',
  'Bon comportement',
  'Commande bien transportée',
  'Retard',
  'Mauvaise communication',
  'Comportement inapproprié'
];

export const ReviewModal: React.FC<{ orderId: string; isOpen: boolean; onClose: () => void }> = ({ orderId, isOpen, onClose }) => {
  const { addNotification } = useApp();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleReason = (r: string) => {
    setSelectedReasons(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
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
      const res = await fetch('/backend/index.php/api/reviews/create', { method: 'POST', body: payload, credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        addNotification('Merci pour votre avis !', 'Votre évaluation a été enregistrée.', 'client');
        onClose();
      } else {
        alert(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (e) {
      alert('Erreur réseau lors de l\'enregistrement');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-1150 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[min(640px,96vw)]">
        <h3 className="text-lg font-black">Votre commande est arrivée ! 🎉</h3>
        <p className="text-sm text-slate-600 mt-1">Comment évaluez-vous votre livraison ?</p>

        <div className="flex items-center gap-2 mt-4">
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className={`px-3 py-2 rounded ${rating>=n ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {Array.from({length:n}).map((_,i)=>'⭐')}
            </button>
          ))}
        </div>

        <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Votre commentaire (facultatif)" className="w-full mt-4 p-3 rounded-xl border border-slate-200" rows={4}></textarea>

        <div className="mt-3">
          <p className="text-sm font-bold mb-2">Raisons rapides</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map(r => (
              <button key={r} onClick={() => toggleReason(r)} className={`px-3 py-1 rounded-full text-sm ${selectedReasons.includes(r) ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div>
            <button onClick={async () => {
              const reason = window.prompt('Choisissez une catégorie (Retard important, Comportement irrespectueux, Mauvaise communication, Commande endommagée, Problème de paiement, Autre)');
              if (!reason) return;
              const description = window.prompt('Expliquez le problème (facultatif)') || '';
              try {
                const payload = new URLSearchParams();
                payload.append('order_id', orderId);
                payload.append('reason', reason);
                payload.append('description', description);
                const res = await fetch('/backend/index.php/api/reviews/report', { method: 'POST', body: payload, credentials: 'include' });
                const data = await res.json();
                if (data.success) {
                  addNotification('Signalement envoyé', 'Merci, nous avons bien reçu votre signalement.', 'client');
                } else {
                  alert(data.error || 'Erreur lors de l\'envoi du signalement');
                }
              } catch (e) {
                alert('Erreur réseau lors de l\'envoi du signalement');
              }
            }} className="text-sm text-rose-500">Signaler un problème</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-200">Annuler</button>
            <button onClick={submit} disabled={submitting} className="px-4 py-2 rounded-2xl bg-orange-500 text-white font-bold">Envoyer mon avis</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
