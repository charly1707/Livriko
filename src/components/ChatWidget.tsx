import React, { useMemo, useState, useEffect } from 'react';
import { X, Send, MessageCircle, User, Store, Truck, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ChatChannel } from '../types';

const channelLabels: Record<ChatChannel, string> = {
  'client-vendeur': 'Client ⇄ Restaurant',
  'vendeur-livreur': 'Restaurant ⇄ Livreur',
  'livreur-client': 'Livreur ⇄ Client',
  assistant: 'Assistant Livriko',
};

const roleNames: Record<string, string> = {
  client: 'Client',
  vendeur: 'Restaurant',
  livreur: 'Livreur',
  admin: 'Administrateur',
  bot: 'Assistant',
};

const answerFromRole = (channel: ChatChannel, senderRole: string, text: string) => {
  const lower = text.toLowerCase();
  if (channel === 'assistant') {
    if (lower.includes('commande')) return 'Je peux aider à suivre une commande, vérifier votre panier, ou expliquer les étapes de livraison.';
    if (lower.includes('livreur') || lower.includes('course') || lower.includes('distance')) return 'Le livreur est affecté une fois que le restaurant a confirmé la commande. La distance finale est validée au compteur.';
    if (lower.includes('momo') || lower.includes('paiement') || lower.includes('reçu')) return 'Vous pouvez payer avec MoMo, Moov, Celtis Cash ou en espèces. Attachez le reçu si nécessaire.';
    if (lower.includes('restaurant') || lower.includes('vendeur')) return 'Le restaurant confirme d’abord la commande, puis demande un livreur après préparation.';
    return 'Je suis le robot assistant Livriko. Posez-moi une question sur votre commande, la livraison, ou le fonctionnement du site.';
  }
  if (channel === 'client-vendeur') {
    if (senderRole === 'client') {
      if (lower.includes('heure')) return 'Le restaurant prépare votre commande et vous confirme dès que c’est prêt.';
      return 'Merci pour la précision, nous préparons votre commande et vous contactons si nécessaire.';
    }
    if (senderRole === 'vendeur') {
      if (lower.includes('retard')) return 'La préparation prend un peu plus de temps, je vous informe dès que c’est prêt.';
      return 'Commande bien reçue, je confirme la préparation dès que possible.';
    }
  }
  if (channel === 'vendeur-livreur') {
    if (senderRole === 'vendeur') {
      if (lower.includes('presque')) return 'Je serai sur place dans quelques minutes pour récupérer le colis.';
      return 'Je prends la demande de livraison et je vous confirme l’arrivée au restaurant.';
    }
    if (senderRole === 'livreur') {
      if (lower.includes('retard') || lower.includes('traffic')) return 'Je suis en route, je prévois un léger retard à cause du trafic.';
      return 'Je prends en charge la commande, j’arrive au restaurant dans quelques minutes.';
    }
  }
  if (channel === 'livreur-client') {
    if (senderRole === 'client') {
      if (lower.includes('attendez') || lower.includes('ou')) return 'Je suis à proximité, j’arrive à votre adresse bientôt.';
      return 'Merci, je vous préviens dès que je suis devant la porte.';
    }
    if (senderRole === 'livreur') {
      if (lower.includes('arrivé') || lower.includes('devant')) return 'Je suis arrivé devant votre adresse, descendez s’il vous plaît.';
      return 'Je suis en route avec votre commande, je vous préviens à l’arrivée.';
    }
  }
  return 'Message reçu. Nous revenons vers vous très vite.';
};

export const ChatWidget: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser, activeRole, chatMessages, sendChatMessage, activeTrackingOrder } = useApp();
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel>('assistant');
  const [draft, setDraft] = useState('');

  const availableChannels = useMemo(() => {
    if (activeRole === 'client') return ['client-vendeur', 'assistant'] as ChatChannel[];
    if (activeRole === 'vendeur') return ['client-vendeur', 'vendeur-livreur', 'assistant'] as ChatChannel[];
    if (activeRole === 'livreur') return ['livreur-client', 'vendeur-livreur', 'assistant'] as ChatChannel[];
    return ['assistant'] as ChatChannel[];
  }, [activeRole]);

  useEffect(() => {
    if (!availableChannels.includes(selectedChannel)) {
      setSelectedChannel(availableChannels[0]);
    }
  }, [availableChannels, selectedChannel]);

  const channelMessages = chatMessages.filter(msg => msg.channel === selectedChannel);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    sendChatMessage({
      orderId: activeTrackingOrder?.id,
      channel: selectedChannel,
      senderRole: currentUser?.role || 'client',
      senderId: currentUser?.id,
      text,
    });
    setDraft('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-900/60 backdrop-blur-sm flex items-end justify-end p-4 sm:p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-sm font-black">Chat Livriko</p>
              <p className="text-[11px] text-slate-300">Communication entre acteurs + robot assistant.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-900/80 hover:bg-slate-800 transition flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2 bg-slate-50">
          {availableChannels.map(channel => (
            <button
              key={channel}
              onClick={() => setSelectedChannel(channel)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition ${selectedChannel === channel ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}`}
            >
              {channelLabels[channel]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
          {channelMessages.length === 0 ? (
            <div className="text-center text-slate-500 text-sm leading-relaxed space-y-3 py-10">
              <MessageCircle className="mx-auto w-10 h-10 text-orange-500" />
              <p>Aucun message dans ce canal pour l’instant.</p>
              <p>Écrivez un message pour démarrer la conversation.</p>
            </div>
          ) : (
            channelMessages.map(message => {
              const isMine = message.senderRole === currentUser?.role;
              const isBot = message.senderRole === 'bot';
              return (
                <div key={message.id} className={`max-w-[85%] ${isMine ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
                  <div className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span>{isBot ? 'Assistant' : roleNames[message.senderRole] || 'Participant'}</span>
                    <span className="text-slate-400">• {message.timestamp}</span>
                  </div>
                  <div className={`mt-2 rounded-3xl p-4 text-sm leading-6 ${isMine ? 'bg-orange-500 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                    {message.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 relative">
              <textarea
                rows={2}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Écrire un message..."
                className="w-full min-h-[3rem] resize-none rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-orange-400"
              />
            </div>
            <button
              type="button"
              onClick={handleSend}
              className="inline-flex items-center gap-2 rounded-3xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition"
            >
              <Send className="w-4 h-4" />
              Envoyer
            </button>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            Canal sélectionné : <strong>{channelLabels[selectedChannel]}</strong> • {activeTrackingOrder ? `Commande ${activeTrackingOrder.code}` : 'Aucune commande activée'}.
          </div>
        </div>
      </div>
    </div>
  );
};
