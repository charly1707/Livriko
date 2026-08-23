import React, { useState, useEffect } from 'react';
import { X, Send, MessageCircle, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { buildApiUrl } from '../utils/media';

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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const fetchMessages = async () => {
    if (!isOpen || !activeTrackingOrder?.databaseId || !currentUser) return;
    try {
      const res = await axios.get(buildApiUrl('/backend/index.php/api/chat/messages'), {
        params: { order_id: activeTrackingOrder.databaseId },
        withCredentials: true,
      });
      const chatMessages = res.data.messages || [];
      setMessages(chatMessages);
      if (chatMessages.length > 0 && !conversationId && chatMessages[0].conversation_id) {
        setConversationId(String(chatMessages[0].conversation_id));
      }
    } catch (e) {
      console.error('Chat fetch failed', e);
    }
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeTrackingOrder?.databaseId || !currentUser) return;
    if (!conversationId) {
      setSendError('Conversation en cours de création… réessayez.');
      return;
    }
    setSendState('sending');
    setSendError(null);
    try {
      await axios.post(
        buildApiUrl('/backend/index.php/api/chat/send'),
        new URLSearchParams({
          conversation_id: String(conversationId),
          message: text,
          message_type: 'text',
        }),
        { withCredentials: true },
      );
      setDraft('');
      setSendState('sent');
      await fetchMessages();
    } catch (e: any) {
      setSendState('failed');
      setSendError(e?.response?.data?.message || e?.response?.data?.error || 'Envoi échoué.');
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
    setSendError(null);
    (async () => {
      try {
        const res = await axios.post(
          buildApiUrl('/backend/index.php/api/chat/create'),
          new URLSearchParams({ order_id: String(activeTrackingOrder.databaseId) }),
          { withCredentials: true },
        );
        if (res.data?.id) setConversationId(String(res.data.id));
      } catch (e: any) {
        setSendError(e?.response?.data?.message || 'Impossible d’ouvrir la conversation.');
      }
    })();
  }, [activeTrackingOrder?.databaseId, currentUser?.id]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchMessages();
    const interval = setInterval(() => { void fetchMessages(); }, 2500);
    return () => clearInterval(interval);
  }, [isOpen, activeTrackingOrder?.databaseId, conversationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1200 bg-slate-900/60 backdrop-blur-sm flex items-end justify-end p-4 sm:p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-sm font-black">Discussion {activeTrackingOrder?.code ?? 'commande'}</p>
              <p className="text-[11px] text-slate-400">
                {conversationId ? 'Connecté' : 'Connexion…'}
                {sendState === 'sent' ? ' · Envoyé' : ''}
                {sendState === 'failed' ? ' · Échec' : ''}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Aucun message. Écrivez le premier.</p>
          ) : (
            messages.map((msg, idx) => {
              const mine = String(msg.sender_id || msg.senderId) === String(currentUser?.id);
              return (
                <div key={msg.id || idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${mine ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                    <p className="font-bold text-[10px] opacity-80 mb-0.5">
                      {roleNames[msg.sender_role || msg.senderRole] || 'Utilisateur'}
                    </p>
                    <p>{msg.message || msg.content}</p>
                    {mine && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[9px] opacity-80">
                        <Check className="w-3 h-3" /> Envoyé
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {sendError && (
            <p className="text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {sendError}
            </p>
          )}
        </div>

        <div className="p-3 border-t border-slate-200 flex items-center gap-2 bg-white">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
            placeholder="Écrire un message…"
            className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-orange-400"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sendState === 'sending'}
            className="p-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
