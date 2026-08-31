import React, { useState } from 'react';
import {
  X, User, ShoppingBag, MapPin, Settings, LogOut, Check, Phone, Mail,
  ChevronRight, ArrowLeft, Key, Camera, Shield, Wallet, Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { uploadImageFile } from '../utils/imageUpload';
import { buildApiUrl } from '../utils/media';
import axios from 'axios';

type ProfileTab = 'profil' | 'commandes' | 'adresses' | 'parametres';

const TAB_CONFIG: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
  { id: 'profil', label: 'Mon profil', icon: User },
  { id: 'commandes', label: 'Mes commandes', icon: ShoppingBag },
  { id: 'adresses', label: 'Mes adresses', icon: MapPin },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  vendeur: 'Vendeur',
  restaurant: 'Restaurant',
  livreur: 'Livreur',
  admin: 'Administrateur',
};

function WalletHistory() {
  const [txs, setTxs] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    axios.get(buildApiUrl('/backend/index.php/api/wallet'), { withCredentials: true })
      .then((res) => {
        if (res.data?.success) setTxs(res.data.transactions || []);
      })
      .catch((e) => setError(e?.response?.data?.message || 'Historique indisponible'));
  }, []);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (txs.length === 0) return <p className="text-sm text-teal-700">Aucune transaction pour le moment.</p>;

  return (
    <div className="max-h-36 overflow-y-auto space-y-2">
      {txs.slice(0, 8).map((tx) => (
        <div key={tx.id} className="flex items-center justify-between text-sm text-teal-900 bg-white rounded-xl px-3 py-2 border border-teal-100">
          <span className="font-bold uppercase text-xs">{tx.type}</span>
          <span className="font-semibold">{Number(tx.amount).toLocaleString()} F</span>
          <span className="text-teal-600 text-xs">{tx.status}</span>
        </div>
      ))}
    </div>
  );
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ProfileTab;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profil',
}) => {
  const {
    currentUser,
    logoutUser,
    updateUserProfile,
    orders,
    setActiveTrackingOrder,
    setActiveRole,
    deleteUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || 'Lokossa');
  const [isSaved, setIsSaved] = useState(false);
  const [savedAddress, setSavedAddress] = useState(
    currentUser?.location?.address || `${currentUser?.city || 'Lokossa'}, Quartier Agamé`,
  );
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setCity(currentUser.city || 'Lokossa');
      setSavedAddress(currentUser.location?.address || `${currentUser.city || 'Lokossa'}, Quartier Agamé`);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('');
    }
  }, [currentUser]);

  const handleImageFileSelect = async (file: File | null) => {
    if (!file || !currentUser) return;
    try {
      const url = await uploadImageFile(file, 'avatars');
      setSelectedAvatar(url);
      updateUserProfile(currentUser.id, { avatar: url, selfiePhoto: url });
    } catch (error: any) {
      setPasswordMessage(error.message || 'Impossible d\'envoyer la photo de profil.');
    }
  };

  if (!isOpen || !currentUser) return null;

  const userOrders = orders.filter(o => o.clientId === currentUser.id || o.clientPhone === currentUser.phone);
  const avatarSrc = selectedAvatar || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
  const initials = (currentUser.name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2) || 'U';
  const roleLabel = ROLE_LABELS[currentUser.role] || currentUser.role;

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, { name, email, phone, city });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddressSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, {
      city,
      ...(currentUser.location ? {
        location: { ...currentUser.location, address: savedAddress },
      } : {}),
    });
    setIsAddressSaved(true);
    setTimeout(() => setIsAddressSaved(false), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Veuillez remplir tous les champs du mot de passe.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    try {
      await updateUserProfile(currentUser.id, { password: newPassword, currentPassword } as any);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Mot de passe mis à jour avec succès.');
    } catch (error: any) {
      setPasswordMessage(error.message || 'Impossible de mettre à jour le mot de passe.');
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-white border border-[#e6dac8] rounded-xl text-sm font-medium text-slate-900 focus:border-[#ff8a1f] focus:outline-none focus:ring-2 focus:ring-[#ff8a1f]/20 transition';
  const labelClass = 'text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5';

  const renderPageHeader = (title: string, subtitle: string) => (
    <section className="shrink-0 rounded-2xl bg-gradient-to-r from-[#0c1a2e] to-[#1a3d66] px-6 py-5 text-white">
      <p className="text-xs font-bold uppercase tracking-wider text-[#ffb86a]">Mon compte</p>
      <h2 className="text-2xl font-black mt-1">{title}</h2>
      <p className="text-sm text-[#c5d3e4] mt-1">{subtitle}</p>
    </section>
  );

  const renderProfilTab = () => (
    <form onSubmit={handleProfileSave} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-2xl border border-[#e6dac8] bg-white">
        <div className="relative shrink-0 mx-auto sm:mx-0">
          <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-[#ff8a1f]/40 shadow-lg">
            {avatarSrc ? (
              <img src={avatarSrc} alt={currentUser.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#ff8a1f] to-[#e86f00] flex items-center justify-center text-white text-2xl font-black">
                {initials}
              </div>
            )}
          </div>
          <label className="absolute -bottom-2 -right-2 h-9 w-9 rounded-xl bg-[#0c1a2e] text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#132d4d] transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => void handleImageFileSelect(e.target.files?.[0] || null)}
            />
            <Camera className="w-4 h-4" />
          </label>
        </div>
        <div className="flex-1 text-center sm:text-left min-w-0">
          <h3 className="text-xl font-black text-slate-900 truncate">{currentUser.name}</h3>
          <p className="text-sm text-slate-500 mt-0.5 truncate">{currentUser.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ff8a1f]/10 text-[#e86f00] text-xs font-bold uppercase">
              <Shield className="w-3 h-3" />
              {roleLabel}
            </span>
            {currentUser.role === 'client' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                <Wallet className="w-3 h-3" />
                {(currentUser.walletBalance ?? 0).toLocaleString()} FCFA
              </span>
            )}
          </div>
        </div>
        {isSaved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold shrink-0">
            <Check className="w-4 h-4" /> Enregistré
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-[#e6dac8] bg-[#fffdf8] p-5 space-y-4">
        <h4 className="text-sm font-black text-slate-900">Informations personnelles</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nom et prénom</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Adresse email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={`${inputClass} pl-10`} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Téléphone / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={`${inputClass} pl-10`} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Ville principale</label>
            <select value={city} onChange={e => setCity(e.target.value)} className={inputClass}>
              <option value="Lokossa">Lokossa (Ville couverte — 100 %)</option>
            </select>
          </div>
        </div>
      </div>

      {currentUser.role === 'client' && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-teal-900">Portefeuille Livriko</p>
              <p className="text-xs text-teal-700 mt-0.5">Solde utilisable au paiement</p>
            </div>
            <p className="text-2xl font-black text-teal-800">
              {(currentUser.walletBalance ?? 0).toLocaleString()} <span className="text-sm font-bold">FCFA</span>
            </p>
          </div>
          <WalletHistory />
        </div>
      )}

      {currentUser.role !== 'client' && (
        <div className="rounded-2xl border border-[#ff8a1f]/30 bg-[#fff8f0] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-slate-900">Accès professionnel — {roleLabel}</p>
            <p className="text-xs text-slate-600 mt-1">Retournez à votre espace de gestion dédié.</p>
          </div>
          <button
            type="button"
            onClick={() => { setActiveRole(currentUser.role); onClose(); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-sm font-bold transition shrink-0"
          >
            Ouvrir l&apos;espace {roleLabel}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => { logoutUser(); onClose(); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-sm font-bold transition"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0c1a2e] hover:bg-[#132d4d] text-white text-sm font-bold transition"
        >
          Enregistrer les modifications
        </button>
      </div>

      <div className="pt-2 border-t border-[#e6dac8]">
        <button
          type="button"
          onClick={() => {
            const ok = window.confirm('Désactiver votre compte ? Vous ne pourrez plus vous connecter. Les historiques de commandes sont conservés.');
            if (!ok) return;
            void deleteUser(currentUser.id);
            onClose();
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer mon compte
        </button>
      </div>
    </form>
  );

  const renderCommandesTab = () => (
    <div className="space-y-4">
      {userOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e6dac8] bg-[#faf6ef] p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">Aucune commande pour le moment</p>
          <p className="text-sm text-slate-500 mt-2">Explorez le marché et passez votre première commande.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userOrders.map(order => (
            <article key={order.id} className="rounded-2xl border border-[#e6dac8] bg-white p-5 flex flex-wrap items-center justify-between gap-4 hover:shadow-sm transition">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-black text-[#1d4ed8]">{order.code}</span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status === 'delivered' ? 'Livré' : 'En cours'}
                  </span>
                </div>
                <p className="text-base font-bold text-slate-900 mt-2">{order.storeName}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {order.items.length} article(s) · {order.totalAmount.toLocaleString()} FCFA
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {order.distanceKm ?? 2} km · {(order.finalDeliveryFee ?? order.estimatedDeliveryFee ?? order.deliveryFee).toLocaleString()} FCFA livraison
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setActiveTrackingOrder(order); onClose(); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c1a2e] hover:bg-[#132d4d] text-white text-sm font-bold transition shrink-0"
              >
                Suivre
                <ChevronRight className="w-4 h-4" />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderAdressesTab = () => (
    <form onSubmit={handleAddressSave} className="space-y-5">
      <div className="rounded-2xl border border-[#e6dac8] bg-[#fffdf8] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900">Adresse de livraison</h4>
          {isAddressSaved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-bold">
              <Check className="w-4 h-4" /> Enregistrée
            </span>
          )}
        </div>
        <div>
          <label className={labelClass}>Adresse habituelle</label>
          <input
            type="text"
            required
            value={savedAddress}
            onChange={e => setSavedAddress(e.target.value)}
            placeholder="ex : Quartier Agamé, près du Marché Central, Lokossa"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Ville</label>
          <select value={city} onChange={e => setCity(e.target.value)} className={inputClass}>
            <option value="Lokossa">Lokossa (Ville couverte — 100 %)</option>
          </select>
        </div>
      </div>
      <div className="text-right">
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0c1a2e] hover:bg-[#132d4d] text-white text-sm font-bold transition"
        >
          Enregistrer l&apos;adresse
        </button>
      </div>
    </form>
  );

  const renderParametresTab = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { title: 'Notifications SMS & WhatsApp', desc: 'Suivi en direct sur votre téléphone', control: <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#ff8a1f] rounded cursor-pointer" /> },
          { title: 'Langue de l\'interface', desc: 'Français (Bénin)', control: <span className="text-sm font-bold text-slate-600">FR 🇧🇯</span> },
          { title: 'Sécurité du compte', desc: 'Mot de passe chiffré, session sécurisée', control: <span className="text-sm font-bold text-emerald-600">Protégé</span> },
        ].map(item => (
          <div key={item.title} className="rounded-2xl border border-[#e6dac8] bg-white p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
            {item.control}
          </div>
        ))}
      </div>

      <form onSubmit={handlePasswordChange} className="rounded-2xl border border-[#e6dac8] bg-[#fffdf8] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-[#ff8a1f]" />
          <h4 className="text-sm font-black text-slate-900">Changer mon mot de passe</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Mot de passe actuel</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nouveau mot de passe</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Confirmer le nouveau mot de passe</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
          </div>
        </div>
        {passwordMessage && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
            passwordMessage.includes('succès') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {passwordMessage}
          </div>
        )}
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-sm font-bold transition"
        >
          Enregistrer le nouveau mot de passe
        </button>
      </form>
    </div>
  );

  const TAB_CONTENT: Record<ProfileTab, { title: string; subtitle: string; body: React.ReactNode }> = {
    profil: { title: 'Mon profil', subtitle: 'Gérez vos informations personnelles et votre photo.', body: renderProfilTab() },
    commandes: { title: 'Mes commandes', subtitle: `${userOrders.length} commande(s) dans votre historique.`, body: renderCommandesTab() },
    adresses: { title: 'Mes adresses', subtitle: 'Votre adresse de livraison par défaut.', body: renderAdressesTab() },
    parametres: { title: 'Paramètres', subtitle: 'Préférences, notifications et sécurité.', body: renderParametresTab() },
  };

  const currentPage = TAB_CONTENT[activeTab];

  const renderSidebarNav = () => (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {TAB_CONFIG.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const badge = tab.id === 'commandes' ? userOrders.length : undefined;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition cursor-pointer ${
              isActive
                ? 'bg-[#ff8a1f]/12 text-white shadow-[inset_3px_0_0_#ff8a1f]'
                : 'text-[#b8c5d6] hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isActive ? 'bg-[#ff8a1f] text-white' : 'bg-white/6 text-[#9eb0c7]'
            }`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <span className={`flex-1 text-[13px] ${isActive ? 'font-bold' : 'font-semibold'}`}>
              {tab.label}
            </span>
            {badge != null && badge > 0 && (
              <span className={`shrink-0 min-w-[1.35rem] h-[1.35rem] px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
                isActive ? 'bg-[#ff8a1f] text-white' : 'bg-[#ff8a1f]/20 text-[#ffb86a]'
              }`}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="fixed inset-0 z-1100 bg-[#0c1a2e]/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#f4f0e8] rounded-3xl w-full max-w-5xl min-h-0 my-auto shadow-2xl overflow-hidden flex flex-col sm:flex-row relative animate-in fade-in zoom-in-95 duration-200 sm:h-[min(90vh,820px)]">

        {/* Sidebar */}
        <aside className="hidden sm:flex flex-col w-64 shrink-0 bg-[#0c1a2e] text-[#f8f4ec] border-r border-[#1e3a5f]/60">
          <div className="px-5 pt-6 pb-4 border-b border-white/8">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#c5d3e4] hover:text-white transition mb-5"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-[#ff8a1f]/40 shrink-0">
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#ffb86a] mt-0.5">{roleLabel}</p>
              </div>
            </div>
          </div>
          {renderSidebarNav()}
          <div className="px-3 pb-5 pt-3 border-t border-white/8">
            <button
              type="button"
              onClick={() => { logoutUser(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/12 border border-rose-400/25 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </aside>

        {/* Mobile header + tabs */}
        <div className="sm:hidden shrink-0 bg-[#0c1a2e] text-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 text-sm font-semibold text-[#c5d3e4]">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <button type="button" onClick={onClose} className="p-2 rounded-xl bg-white/8 text-[#c5d3e4]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex overflow-x-auto gap-1 p-2">
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isActive ? 'bg-[#ff8a1f] text-white' : 'text-[#b8c5d6]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-h-0 flex flex-col lg:overflow-hidden">
          <div className="hidden sm:flex items-center justify-end px-5 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white border border-[#e6dac8] text-slate-500 hover:text-slate-800 hover:bg-[#fffdf8] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
            {renderPageHeader(currentPage.title, currentPage.subtitle)}
            <div className="rounded-2xl border border-[#e6dac8] bg-[#fffdf8] p-4 sm:p-5 shadow-sm">
              {currentPage.body}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
