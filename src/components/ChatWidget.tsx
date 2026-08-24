import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Send, MessageCircle, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import axios from 'axios';
import { buildApiUrl } from '../utils/media';
import type { Order } from '../types';

const roleNames: Record<string, string> = {
  client: 'Client',
  vendeur: 'Restaurant',
  restaurant: 'Restaurant',
  livreur: 'Livreur',
  admin: 'Administrateur',
};

const CHAT_OPEN_STATUSES = ['pending', 'confirmed', 'rider_requested', 'rider_assigned', 'picked_up', 'delivering'];
const CHAT_READ_STATUSES = [...CHAT_OPEN_STATUSES, 'delivered'];

function orderDbId(order?: Order | null): string {
  if (!order) return '';
  return String(order.databaseId || String(order.id || '').replace(/^ord-/, '')).trim();
}

function sameUserId(a?: string | null, b?: string | null) {
  return String(a || '').replace(/^usr-/, '') === String(b || '').replace(/^usr-/, '');
}

export const ChatWidget: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser, activeTrackingOrder, orders, activeRole, stores } = useApp();
  const [draft, setDraft] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [canSend, setCanSend] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);

  const chatOrders = useMemo(() => {
    const myStoreIds = new Set(
      stores
        .filter((store) => sameUserId(store.ownerId, currentUser?.id) || store.id === currentUser?.storeId)
        .map((store) => store.id.replace(/^store-/, '')),
    );
    const mine = orders.filter((order) => {
      if (!CHAT_READ_STATUSES.includes(order.status)) return false;
      const storeBare = String(order.storeId || '').replace(/^store-/, '');
      if (activeRole === 'client') return sameUserId(order.clientId, currentUser?.id);
      if (activeRole === 'vendeur' || activeRole === 'restaurant') {
        return myStoreIds.has(storeBare) || sameUserId(order.clientId, currentUser?.id);
      }
      if (activeRole === 'livreur') {
        return sameUserId(order.riderId, currentUser?.id);
      }
      return true;
    });
    const unique = mine.filter((order, index, list) => list.findIndex((item) => item.id === order.id) === index);
    return unique.sort((a, b) => Number(Boolean(CHAT_OPEN_STATUSES.includes(b.status))) - Number(Boolean(CHAT_OPEN_STATUSES.includes(a.status))));
  }, [orders, currentUser?.id, currentUser?.storeId, activeRole, stores]);

  const selectedOrder = useMemo(() => {
    return chatOrders.find((order) => order.id === selectedOrderId || orderDbId(order) === selectedOrderId)
      || chatOrders.find((order) => order.id === activeTrackingOrder?.id)
      || activeTrackingOrder
      || chatOrders[0]
      || null;
  }, [chatOrders, selectedOrderId, activeTrackingOrder]);

  const selectedDbId = orderDbId(selectedOrder);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTrackingOrder?.id) {
      setSelectedOrderId(activeTrackingOrder.id);
      return;
    }
    if (!selectedOrderId && chatOrders[0]) {
      setSelectedOrderId(chatOrders[0].id);
    }
  }, [isOpen, activeTrackingOrder?.id, chatOrders, selectedOrderId]);

  const fetchMessages = async (orderId = selectedDbId) => {
    if (!isOpen || !orderId || !currentUser) return;
    try {
      const res = await axios.get(buildApiUrl('/backend/index.php/api/chat/messages'), {
        params: { order_id: orderId },
        withCredentials: true,
      });
      const chatMessages = res.data.messages || [];
      setMessages(chatMessages);
      if (res.data.conversation_id) setConversationId(String(res.data.conversation_id));
      else if (chatMessages[0]?.conversation_id) setConversationId(String(chatMessages[0].conversation_id));
      setCanSend(res.data.can_send !== false && CHAT_OPEN_STATUSES.includes(selectedOrder?.status || 'pending'));
    } catch (e: any) {
      setSendError(e?.response?.data?.error || e?.response?.data?.message || 'Impossible de charger le chat.');
    }
  };

  const ensureConversation = async (orderId = selectedDbId) => {
    if (!orderId || !currentUser) return null;
    const res = await axios.post(
      buildApiUrl('/backend/index.php/api/chat/create'),
      new URLSearchParams({ order_id: String(orderId) }),
      { withCredentials: true },
    );
    const id = res.data?.id ? String(res.data.id) : null;
    if (id) setConversationId(id);
    setCanSend(res.data?.can_send !== false);
    return id;
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedDbId || !currentUser) return;
    setSendState('sending');
    setSendError(null);
    try {
      let convId = conversationId;
      if (!convId) {
        convId = await ensureConversation(selectedDbId);
      }
      await axios.post(
        buildApiUrl('/backend/index.php/api/chat/send'),
        new URLSearchParams({
          conversation_id: String(convId || ''),
          order_id: selectedDbId,
          message: text,
          message_type: 'text',
        }),
        { withCredentials: true },
      );
      setDraft('');
      setSendState('sent');
      await fetchMessages(selectedDbId);
    } catch (e: any) {
      setSendState('failed');
      setSendError(e?.response?.data?.message || e?.response?.data?.error || 'Envoi échoué.');
    }
  };

  useEffect(() => {
    if (!isOpen || !selectedDbId || !currentUser) {
      setConversationId(null);
      setMessages([]);
      return;
    }
    setSendError(null);
    setSendState('idle');
    (async () => {
      try {
        await ensureConversation(selectedDbId);
        await fetchMessages(selectedDbId);
      } catch (e: any) {
        setSendError(e?.response?.data?.message || e?.response?.data?.error || 'Impossible d’ouvrir la conversation.');
      }
    })();
  }, [isOpen, selectedDbId, currentUser?.id]);

  useEffect(() => {
    if (!isOpen || !selectedDbId) return;
    const interval = setInterval(() => { void fetchMessages(selectedDbId); }, 2500);
    return () => clearInterval(interval);
  }, [isOpen, selectedDbId, conversationId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1200 bg-slate-900/60 backdrop-blur-sm flex items-end justify-end p-4 sm:p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-950 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <MessageCircle className="w-5 h-5 text-orange-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-black truncate">
                Discussion {selectedOrder?.code ?? ''}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {selectedOrder ? `${selectedOrder.storeName} · ${selectedOrder.clientName}` : 'Aucune commande active'}
                {conversationId ? ' · Connecté' : ''}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {chatOrders.length > 1 && (
          <div className="px-4 py-2 border-b border-slate-100 bg-white">
            <select
              value={selectedOrder?.id || ''}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-800"
            >
              {chatOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.code} — {order.storeName} ({order.status})
                </option>
              ))}
            </select>
          </div>
        )}

        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {!currentUser ? (
            <p className="text-xs text-slate-500 text-center py-8">Connectez-vous pour discuter.</p>
          ) : !selectedOrder ? (
            <p className="text-xs text-slate-500 text-center py-8">
              Passez une commande pour ouvrir une discussion avec le restaurant et le livreur.
            </p>
          ) : messages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Aucun message. Écrivez le premier.</p>
          ) : (
            messages.map((msg, idx) => {
              const mine = sameUserId(msg.sender_id || msg.senderId, currentUser?.id);
              return (
                <div key={msg.id || idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${mine ? 'bg-orange-500 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                    <p className="font-bold text-[10px] opacity-80 mb-0.5">
                      {roleNames[msg.sender_role || msg.senderRole || msg.role] || 'Utilisateur'}
                    </p>
                    <p className="whitespace-pre-wrap break-words">{msg.message || msg.content}</p>
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
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
            placeholder={canSend ? 'Écrire un message…' : 'Discussion en lecture seule'}
            disabled={!canSend || !selectedOrder}
            className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-orange-400 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sendState === 'sending' || !canSend || !selectedOrder}
            className="p-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
