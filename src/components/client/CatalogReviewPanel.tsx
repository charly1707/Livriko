import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { CatalogReview, CatalogReviewStats } from '../../types';
import { useApp } from '../../context/AppContext';
import { RatingInput, RatingStars } from './RatingStars';

type TargetType = 'store' | 'product';

interface CatalogReviewPanelProps {
  targetType: TargetType;
  targetId: string;
  targetName: string;
  compact?: boolean;
}

const stripPrefix = (value: string) => value.replace(/^(store-|prod-)/, '');

export const CatalogReviewPanel: React.FC<CatalogReviewPanelProps> = ({
  targetType,
  targetId,
  targetName,
  compact = false,
}) => {
  const { currentUser, openAuthModal, refreshCatalogData } = useApp();
  const [reviews, setReviews] = useState<CatalogReview[]>([]);
  const [stats, setStats] = useState<CatalogReviewStats>({ average: 0, count: 0 });
  const [userReview, setUserReview] = useState<CatalogReview | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const bareId = stripPrefix(targetId);

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const param = targetType === 'store' ? `store_id=${bareId}` : `product_id=${bareId}`;
      const res = await fetch(`/backend/index.php/api/reviews/catalog?${param}`, { credentials: 'include' });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Impossible de charger les avis');
        return;
      }
      setReviews(data.reviews || []);
      setStats(data.stats || { average: 0, count: 0 });
      setUserReview(data.userReview || null);
      setCanReview(Boolean(data.canReview));
      if (data.userReview) {
        setRating(data.userReview.rating);
        setComment(data.userReview.comment || '');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [targetType, targetId]);

  const submitReview = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (rating < 1 || rating > 5) return;

    setSubmitting(true);
    setError('');
    const payload = new URLSearchParams();
    payload.append('target_type', targetType);
    payload.append('target_id', bareId);
    payload.append('rating', String(rating));
    payload.append('comment', comment);

    try {
      const res = await fetch('/backend/index.php/api/reviews/catalog/create', {
        method: 'POST',
        body: payload,
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Impossible d\'enregistrer l\'avis');
        return;
      }
      await loadReviews();
      await refreshCatalogData();
    } catch {
      setError('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl border border-[#e6dac8] bg-[#fffdf8] ${compact ? 'p-4' : 'p-5'}`}>
        <p className="text-sm text-slate-500">Chargement des avis…</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-[#e6dac8] bg-[#fffdf8] ${compact ? 'p-4 space-y-3' : 'p-5 space-y-4'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff8a1f]">Avis clients</p>
          <h3 className="text-base font-black text-slate-900 mt-0.5">
            {targetName}
          </h3>
        </div>
        {stats.count > 0 ? (
          <RatingStars rating={stats.average} showValue reviewCount={stats.count} />
        ) : (
          <span className="text-xs font-medium text-slate-400">Pas encore noté</span>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {userReview ? (
        <div className="rounded-xl bg-[#f4f0e8] border border-[#e6dac8] p-3.5">
          <p className="text-xs font-bold text-slate-700 mb-1">Votre avis</p>
          <RatingStars rating={userReview.rating} size="sm" />
          {userReview.comment && (
            <p className="text-sm text-slate-600 mt-2">{userReview.comment}</p>
          )}
        </div>
      ) : canReview ? (
        <div className="rounded-xl bg-[#f4f0e8] border border-[#e6dac8] p-3.5 space-y-3">
          <p className="text-xs font-bold text-slate-700">Donnez votre avis</p>
          <RatingInput value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire (facultatif)"
            rows={compact ? 2 : 3}
            className="w-full p-3 rounded-xl border border-[#e6dac8] bg-white text-sm text-slate-800 focus:outline-none focus:border-[#ff8a1f] resize-none"
          />
          <button
            type="button"
            onClick={submitReview}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-xs font-black disabled:opacity-50"
          >
            {submitting ? 'Envoi…' : 'Publier mon avis'}
          </button>
        </div>
      ) : currentUser ? (
        <p className="text-xs text-slate-500">
          Commandez et recevez {targetType === 'store' ? 'cette boutique' : 'cet article'} pour laisser un avis.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="text-xs font-bold text-[#ff8a1f] hover:underline"
        >
          Connectez-vous pour voir si vous pouvez noter
        </button>
      )}

      {reviews.length > 0 && (
        <div className="space-y-2.5 pt-1">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-[#efe6d8] bg-white px-3.5 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-800">
                  {review.isOwn ? 'Vous' : review.clientName}
                </p>
                <span className="text-[10px] text-slate-400">{formatDate(review.createdAt)}</span>
              </div>
              <RatingStars rating={review.rating} size="sm" className="mt-1" />
              {review.comment ? (
                <p className="text-sm text-slate-600 mt-2">{review.comment}</p>
              ) : (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Sans commentaire
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
