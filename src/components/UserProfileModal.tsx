import React, { useState } from 'react';
import { 
  X, User, ShoppingBag, MapPin, Settings, LogOut, Check, Phone, Mail, Building, Truck, ShieldCheck, Clock, ChevronRight, ArrowLeft, Key, Camera
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profil' | 'commandes' | 'adresses' | 'parametres';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profil'
}) => {
  const { 
    currentUser, 
    logoutUser, 
    updateUserProfile, 
    orders, 
    setActiveTrackingOrder,
    setActiveRole
    , deleteUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profil' | 'commandes' | 'adresses' | 'parametres'>(initialTab);

  // Editable Profile fields
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || 'Lokossa');
  const [isSaved, setIsSaved] = useState(false);

  // Address state
  const [savedAddress, setSavedAddress] = useState(
    currentUser?.location?.address || `${currentUser?.city || 'Lokossa'}, Quartier Agamé`
  );
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Sync inputs dynamically whenever currentUser changes
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

  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleImageFileSelect = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedAvatar(reader.result);
        if (currentUser) {
          updateUserProfile(currentUser.id, { avatar: reader.result, selfiePhoto: reader.result });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !currentUser) return null;

  // Filter orders for this logged in user
  const userOrders = orders.filter(o => o.clientId === currentUser.id || o.clientPhone === currentUser.phone);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, {
      name,
      email,
      phone,
      city
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddressSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, {
      city,
      location: {
        address: savedAddress,
        city,
        lat: 6.365,
        lng: 2.418
      }
    });
    setIsAddressSaved(true);
    setTimeout(() => setIsAddressSaved(false), 2000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Veuillez remplir tous les champs du mot de passe.');
      return;
    }
    if (currentPassword !== currentUser.password) {
      setPasswordMessage('Le mot de passe actuel est incorrect.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    updateUserProfile(currentUser.id, { password: newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage('Mot de passe mis à jour avec succès.');
  };

  const firstName = currentUser.name.split(' ')[0] || currentUser.name;

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-950/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200 mx-3 sm:mx-0">
        
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between z-20 border-b border-slate-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button 
              onClick={onClose}
              type="button"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm sm:text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ring-1 ring-slate-700/40"
              title="Retour à l'application"
            >
              <ArrowLeft className="w-4 h-4 text-orange-400" />
              <span>Retour</span>
            </button>
            <div className="relative">
              <img
                src={selectedAvatar || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={currentUser.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-orange-500 shadow-md shrink-0"
              />
              <label className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border border-slate-200 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImageFileSelect(e.target.files?.[0] || null)}
                />
                <Camera className="w-4 h-4 text-slate-700" />
              </label>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-lg font-black text-white truncate">{currentUser.name}</h2>
                <span className="px-1.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-[9px] sm:text-[10px] font-bold uppercase shrink-0">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-100 p-1.5 flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profil')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'profil' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mon Profil</span>
          </button>

          <button
            onClick={() => setActiveTab('commandes')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'commandes' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Mes Commandes ({userOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('adresses')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'adresses' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Mes Adresses</span>
          </button>

          <button
            onClick={() => setActiveTab('parametres')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'parametres' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          
          {/* 1. MON PROFIL */}
          {activeTab === 'profil' && (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Informations Personnelles</h3>
                {isSaved && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Profil mis à jour !
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nom et Prénom</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Adresse Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Téléphone / WhatsApp</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ville principale</label>
                  <select 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Lokossa">Lokossa (Ville couverte - 100%)</option>
                  </select>
                </div>
              </div>

              {/* Special Pro Badge info */}
              {currentUser.role !== 'client' && (
                <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-orange-900">
                      Vous disposez d'un accès Pro ({currentUser.role.toUpperCase()})
                    </div>
                    <div className="text-[11px] text-orange-700">
                      Accédez à votre tableau de bord dédié pour la gestion.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRole(currentUser.role);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Ouvrir Espace {currentUser.role} →
                  </button>
                </div>
              )}

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const ok = window.confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.");
                      if (!ok) return;
                      if (currentUser) {
                        deleteUser(currentUser.id);
                        onClose();
                      }
                    }}
                    className="w-full mt-3 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    Supprimer mon compte
                  </button>
                </div>
            </form>
          )}

          {/* 2. MES COMMANDES */}
          {activeTab === 'commandes' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Historique de vos commandes
              </h3>

              {userOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                  <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold">Vous n'avez pas encore passé de commande.</p>
                  <p className="text-[11px] text-slate-400">Explorez le marché et ajoutez vos produits au panier !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.map(order => (
                    <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900">{order.code}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {order.status === 'delivered' ? 'Livré' : 'En cours'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1">{order.storeName}</p>
                        <p className="text-[11px] text-slate-500">{order.items.length} article(s) • {order.totalAmount.toLocaleString()} FCFA</p>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTrackingOrder(order);
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>Suivre la commande</span>
                        <ChevronRight className="w-4 h-4 text-orange-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. MES ADRESSES */}
          {activeTab === 'adresses' && (
            <form onSubmit={handleAddressSave} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Adresse de Livraison</h3>
                {isAddressSaved && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Adresse enregistrée !
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Adresse de livraison habituelle</label>
                  <input
                    type="text"
                    required
                    value={savedAddress}
                    onChange={e => setSavedAddress(e.target.value)}
                    placeholder="ex: Quartier Agamé, près du Marché Central, Lokossa"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ville</label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Lokossa">Lokossa (Ville couverte - 100%)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-right">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Enregistrer l'adresse
                </button>
              </div>
            </form>
          )}

          {/* 4. PARAMÈTRES */}
          {activeTab === 'parametres' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Préférences et Paramètres du compte
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Notifications SMS & WhatsApp</div>
                    <div className="text-[11px] text-slate-500">Recevoir le suivi en direct sur mon téléphone</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-orange-500 rounded cursor-pointer" />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Langue de l'interface</div>
                    <div className="text-[11px] text-slate-500">Français (Bénin)</div>
                  </div>
                  <span className="font-bold text-slate-600">FR 🇧🇯</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Sécurité du compte</div>
                    <div className="text-[11px] text-slate-500">Mot de passe chiffré et session sécurisée</div>
                  </div>
                  <span className="text-emerald-600 font-bold">Protégé</span>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4 p-4 bg-slate-50 rounded-3xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500 font-bold">
                  <Key className="w-4 h-4 text-orange-500" />
                  <span>Changer mon mot de passe</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-[11px] text-slate-600">
                    Mot de passe actuel
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </label>
                  <label className="block text-[11px] text-slate-600">
                    Nouveau mot de passe
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </label>
                  <label className="block text-[11px] text-slate-600 sm:col-span-2">
                    Confirmer le nouveau mot de passe
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </label>
                </div>

                {passwordMessage && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-[11px] text-slate-700">
                    {passwordMessage}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition"
                >
                  Enregistrer le nouveau mot de passe
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
