import React, { useState, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import axios from 'axios';

const roleNames: Record<string, string> = {
  client: 'Client',
  vendeur: 'Restaurant',
  restaurant: 'Restaurant',
  livreur: 'Livreur',
  admin: 'Administrateur',
};

export const ChatWidget: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser, activeTrackingOrder } = useApp();
  const [draft, setDraft] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;

    if (!activeTrackingOrder?.databaseId || !currentUser) {
      return;
    }

    if (!conversationId) return;

    try {
      await axios.post('/backend/index.php/api/chat/send', new URLSearchParams({
        conversation_id: String(conversationId),
        message: text,
        message_type: 'text'
      }), { withCredentials: true });
      setDraft('');
      fetchMessages();
    } catch (e) {
      console.error('Chat send failed', e);
    }
  };

  const fetchMessages = async () => {
    if (!isOpen) return;

    if (!activeTrackingOrder?.databaseId || !currentUser) return;

    try {
      const params: any = { order_id: activeTrackingOrder.databaseId };
      const res = await axios.get('/backend/index.php/api/chat/messages', { params, withCredentials: true });
      const chatMessages = res.data.messages || [];
      setMessages(chatMessages);
      if (chatMessages.length > 0 && !conversationId && chatMessages[0].conversation_id) {
        setConversationId(chatMessages[0].conversation_id);
      }
    } catch (e) {
      console.error('Chat fetch failed', e);
    }
  };

  useEffect(() => {
    if (!activeTrackingOrder?.databaseId || !currentUser) {
      setConversationId(null);
      setMessages([]);
      return;
    }

    setConversationId(null);
    setMessages([]);
    const createConv = async () => {
      try {
        const res = await axios.post('/backend/index.php/api/chat/create', new URLSearchParams({ order_id: String(activeTrackingOrder.databaseId) }), { withCredentials: true });
        if (res.data && res.data.id) {
          setConversationId(res.data.id);
        }
      } catch (e) {
        console.error('Chat create failed', e);
      }
    };

    createConv();
  }, [activeTrackingOrder]);

  useEffect(() => {
    if (!isOpen) return;
    fetchMessages();
    const interval = setInterval(() => fetchMessages(), 2500);
    return () => clearInterval(interval);
  }, [isOpen, activeTrackingOrder, conversationId]);

  if (!isOpen) return null;

  const orderCode = activeTrackingOrder?.code ?? 'commande';

  return (
    <div className="fixed inset-0 z-1200 bg-slate-900/60 backdrop-blur-sm flex items-end justify-end p-4 sm:p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-sm font-black">Conversation avec le {orderCode}</p>
              <p className="text-[11px] text-slate-300">Discussion partagée entre le client, le restaurant et le livreur.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-900/80 hover:bg-slate-800 transition flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
          {(!activeTrackingOrder || messages.length === 0) ? (
            <div className="text-center text-slate-500 text-sm leading-relaxed space-y-3 py-10">
              <MessageCircle className="mx-auto w-10 h-10 text-orange-500" />
              {!activeTrackingOrder || !currentUser ? (
                <>
                  <p>Une commande active et une session authentifiée sont nécessaires.</p>
                  <p>Les conversations sont enregistrées sur le serveur.</p>
                </>
              ) : (
                <>
                  <p>Aucun message pour le moment.</p>
                  <p>Envoyez un message pour démarrer cette conversation de commande.</p>
                </>
              )}
            </div>
          ) : (
            messages.map(message => {
              const isMine = message.sender_id === currentUser?.id;
              return (
                <div key={message.id} className={`max-w-[85%] ${isMine ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
                  <div className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span>{roleNames[message.role] || roleNames[message.sender_role] || 'Participant'}</span>
                    <span className="text-slate-400">• {message.created_at || message.timestamp}</span>
                  </div>
                  <div className={`mt-2 rounded-3xl p-4 text-sm leading-6 ${isMine ? 'bg-orange-500 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
                    {message.message || message.text}
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
                className="w-full min-h-12 resize-none rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-orange-400"
              />
            </div>
            <button
              type="button"
              onClick={handleSend}
              className="inline-flex items-center gap-2 rounded-3xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition disabled:bg-slate-300 disabled:text-slate-500"
            >
              <Send className="w-4 h-4" />
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
