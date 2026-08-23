import React, { useState } from 'react';
import { 
  Store as StoreIcon, Package, Plus, Edit3, Trash2, Truck, CheckCircle2, AlertCircle, Clock, DollarSign, Eye, ToggleLeft, ToggleRight, X, Image as ImageIcon, ShieldCheck, XCircle, Settings, User, ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, Order, CategoryType, Store } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { uploadImageFile } from '../../utils/imageUpload';

export const VendeurView: React.FC = () => {
  const { 
    currentUser, 
    setActiveRole,
    stores, 
    products, 
    orders, 
    requestRiderForOrder, 
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    updateUserProfile,
    updateStore,
  } = useApp();

  const currentStore = stores.find(s => s.id === currentUser?.storeId || s.ownerId === currentUser?.id);

  const storeProducts = products.filter(p => p.storeId === currentStore?.id);
  const storeOrders = orders.filter(o => o.storeId === currentStore?.id);

  // Modal for editing store profile & user avatar
  const [isStoreProfileModalOpen, setIsStoreProfileModalOpen] = useState(false);
  const [storeName, setStoreName] = useState(currentStore?.name || '');
  const [storePhone, setStorePhone] = useState(currentStore?.phone || '');
  const [storeAddress, setStoreAddress] = useState(currentStore?.address || '');
  const [storeLogo, setStoreLogo] = useState(currentStore?.logo || '');
  const [userAvatar, setUserAvatar] = useState(currentUser?.avatar || '');
  const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null);
  const [userAvatarFile, setUserAvatarFile] = useState<File | null>(null);
  const [storeIsOpen, setStoreIsOpen] = useState(currentStore?.isOpen || false);

  // Modal for adding/editing product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(1500);
  const [category, setCategory] = useState<CategoryType>('restaurants');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  if (!currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Aucun magasin associé</h2>
          <p className="text-sm text-slate-600 leading-6">
            Votre compte n&apos;a pas encore de boutique enregistrée dans le système. Si vous venez de vous inscrire, veuillez actualiser la page ou compléter votre profil.
          </p>
        </div>
      </div>
    );
  }

  const handleProductImageSelect = (file: File | null) => {
    setImageError(null);
    if (!file) {
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Format d’image non pris en charge. Utilisez JPEG, PNG ou WEBP.');
      return;
    }
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice(1500);
    setCategory(currentStore.category || 'restaurants');
    setSelectedImageFile(null);
    setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80');
    setIsProductModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setDescription(prod.description);
    setPrice(prod.price);
    setCategory(prod.category);
    setSelectedImageFile(null);
    setImage(prod.image);
    setIsProductModalOpen(true);
  };

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    let nextLogo = storeLogo;
    let nextAvatar = userAvatar;
    try {
      if (storeLogoFile) {
        nextLogo = await uploadImageFile(storeLogoFile, 'stores');
        setStoreLogo(nextLogo);
      }
      if (userAvatarFile) {
        nextAvatar = await uploadImageFile(userAvatarFile, 'avatars');
        setUserAvatar(nextAvatar);
      }
    } catch (error: any) {
      setImageError(error.message || 'Impossible d’envoyer l’image.');
      return;
    }

    updateStore({
      ...currentStore,
      name: storeName,
      phone: storePhone,
      address: storeAddress,
      logo: nextLogo,
      isOpen: storeIsOpen,
    });
    if (nextAvatar && currentUser) {
      updateUserProfile(currentUser.id, { avatar: nextAvatar });
    }
    setStoreLogoFile(null);
    setUserAvatarFile(null);
    setIsStoreProfileModalOpen(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payloadImage = selectedImageFile ?? image;

    try {
      if (editingProduct) {
        await updateProduct({
          ...editingProduct,
          name,
          description,
          price: Number(price),
          category,
          image: payloadImage,
        });
      } else {
        await addProduct({
          storeId: currentStore.id,
          storeName: currentStore.name,
          name,
          description,
          price: Number(price),
          category,
          image: payloadImage,
          inStock: true,
          unit: 'portion',
        });
      }
      setIsProductModalOpen(false);
    } catch (error: any) {
      setImageError(error.message || 'Impossible d’enregistrer le produit.');
    }
  };

  // Stats
  const totalRevenue = storeOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.subtotal, 0);

  const pendingOrdersCount = storeOrders.filter(o => ['pending', 'confirmed', 'rider_requested'].includes(o.status)).length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Back Button to Client Market */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <button
          onClick={() => setActiveRole('client')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-400" />
          <span>← Retour à l'Accueil (Marché Client)</span>
        </button>
        <span className="text-xs font-semibold text-slate-500">
          Espace Vendeur • {currentStore.name}
        </span>
      </div>

      {/* Store Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentStore.logo}
              alt={currentStore.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
            />
            {currentStore.isCertified && (
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-md" title="Boutique Certifiée">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px] uppercase">
                {currentStore.category}
              </span>
              <span className="text-xs text-slate-500">• {currentStore.city}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentStore.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {currentStore.isOpen ? 'Ouvert' : 'Fermé'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 flex flex-wrap items-center gap-2 wrap-break-word">
              {currentStore.name}
              {currentStore.isCertified && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Certifié Livriko
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 wrap-break-word">{currentStore.address} • Contact : {currentStore.phone}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsStoreProfileModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Paramètres & Photo
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ajouter un produit
          </button>
        </div>
      </div>

      {/* Zero Subscription Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-orange-950 text-white rounded-3xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              Modèle Sans Abonnement — 100% Gratuit au Lancement
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                Option 1 Active
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Inscription gratuite • Création de boutique gratuite • Ajout de produits illimité. 
              LIVRIKO prélève uniquement <strong>5% de commission</strong> lors de la réalisation d'une commande.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 bg-white/10 px-3 py-2 rounded-2xl border border-white/10 text-xs">
          <span className="text-[10px] text-slate-300 block uppercase font-bold">Exemple pour 10 000 F</span>
          <span className="text-emerald-400 font-bold">Vous recevez 9 500 F (Net)</span>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium wrap-break-word">Ventes Brutes (Subtotal)</p>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 wrap-break-word">{totalRevenue.toLocaleString()} FCFA</h3>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium wrap-break-word">Revenu Net Boutique (95%)</p>
            <h3 className="text-lg sm:text-xl font-black text-emerald-600 wrap-break-word">{Math.round(totalRevenue * 0.95).toLocaleString()} FCFA</h3>
            <span className="text-[10px] text-slate-400 font-medium wrap-break-word">Commission 5%: {Math.round(totalRevenue * 0.05).toLocaleString()} F</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium wrap-break-word">Commandes à Traiter</p>
            <h3 className="text-lg sm:text-xl font-black text-orange-600 wrap-break-word">{pendingOrdersCount} en attente</h3>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
            <Package className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 font-medium wrap-break-word">Catalogue Produits</p>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 wrap-break-word">{storeProducts.length} référence(s)</h3>
          </div>
        </div>
      </div>

      {/* Orders Management Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Commandes Clients En Tranchées</h2>
            <p className="text-xs text-slate-500">Acceptez et sollicitez un livreur dès que le colis est emballé</p>
          </div>
        </div>

        {storeOrders.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">Aucune commande reçue pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {storeOrders.map(order => (
              <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-blue-600">{order.code}</span>
                    <span className="text-xs text-slate-400">{order.createdAt}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                      {order.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900">
                    Client : {order.clientName} ({order.clientPhone})
                  </p>

                  <p className="text-xs text-slate-600">
                    Livraison : {order.clientAddress}
                  </p>

                  <div className="text-xs text-slate-500 pt-1">
                    Articles : {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Vente articles : <strong className="text-slate-900 font-black">{order.subtotal.toLocaleString()} FCFA</strong></span>
                    <span className="text-[11px] text-emerald-700 font-bold block bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-0.5">
                      Net Reçu (95%) : {Math.round(order.subtotal * 0.95).toLocaleString()} FCFA
                    </span>
                    <span className="text-[10px] text-slate-400 block pt-0.5">Commission Livriko (5%) : {Math.round(order.subtotal * 0.05).toLocaleString()} F</span>
                    <span className="text-[10px] text-orange-600 font-medium block">+ {order.deliveryFee.toLocaleString()} F Livraison ({order.distanceKm ? `${order.distanceKm} km` : 'distance indisponible'})</span>
                  </div>

                  {/* Accept / Reject / Request Rider Buttons */}
                  {order.status === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] text-slate-500">Le client a envoyé sa demande. Accusez sa réception pour démarrer la préparation.</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Reçu • Commencer la préparation
                        </button>

                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Refuser
                        </button>
                      </div>
                    </div>
                  )}

                  {order.status === 'confirmed' && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500">La commande est prête. Lancez la recherche du livreur le plus proche.</p>
                      <button
                        onClick={() => requestRiderForOrder(order.id)}
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-4 h-4" />
                        Préparation terminée • Rechercher un livreur
                      </button>
                    </div>
                  )}

                  {order.status === 'rider_requested' && (
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      Recherche de livreur en cours...
                    </span>
                  )}

                  {['rider_assigned', 'picked_up', 'delivering'].includes(order.status) && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Livreur assigné : {order.riderName}
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Product Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Mes Produits en Vente</h2>
            <p className="text-xs text-slate-500">Mettez à jour vos prix, descriptions et photos de votre boutique</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storeProducts.map(prod => (
            <div key={prod.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img src={prod.image} alt={prod.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{prod.name}</h4>
                  <p className="text-[11px] font-bold text-blue-600">{prod.price.toLocaleString()} FCFA</p>
                  <span className={`text-[10px] font-semibold ${prod.inStock ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {prod.inStock ? 'En stock' : 'Rupture'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(prod)}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 transition"
                  title="Modifier"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteProduct(prod.id)}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Store & Profile Settings Modal */}
      {isStoreProfileModalOpen && (
        <div className="fixed inset-0 z-1100 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                Paramètres du Commerce & Profil Vendeur
              </h3>
              <button onClick={() => setIsStoreProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStoreProfile} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-5 space-y-3 flex-1 overflow-y-auto min-h-0">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nom du commerce</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Téléphone officiel</label>
                  <input
                    type="text"
                    required
                    value={storePhone}
                    onChange={e => setStorePhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Adresse physique</label>
                  <input
                    type="text"
                    required
                    value={storeAddress}
                    onChange={e => setStoreAddress(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Logo du commerce</label>
                  {storeLogo && <img src={storeLogo} alt="Logo boutique" className="w-16 h-16 rounded-xl object-cover mb-2 border border-slate-200" />}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setStoreLogoFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') setStoreLogo(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Photo de profil (Avatar)</label>
                  {userAvatar && <img src={userAvatar} alt="Avatar vendeur" className="w-16 h-16 rounded-full object-cover mb-2 border border-slate-200" />}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setUserAvatarFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') setUserAvatar(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Statut du Commerce</span>
                  <button
                    type="button"
                    onClick={() => setStoreIsOpen(!storeIsOpen)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold text-white transition ${storeIsOpen ? 'bg-emerald-600' : 'bg-rose-600'}`}
                  >
                    {storeIsOpen ? 'Ouvert' : 'Fermé'}
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsStoreProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  Sauvegarder les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-1100 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-5 space-y-3 flex-1 overflow-y-auto min-h-0">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nom du produit</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="ex: Poulet Braisé XL"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Prix (en FCFA)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Catégorie</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as CategoryType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description détaillée du produit..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Photo du produit</label>
                  <div className="flex flex-col gap-3">
                    <img
                      src={image}
                      alt="Aperçu du produit"
                      className="w-full h-40 rounded-3xl object-cover border border-slate-200 bg-slate-100"
                    />

                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition">
                      <ImageIcon className="w-4 h-4" />
                      Ajouter une photo (galerie ou caméra)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleProductImageSelect(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>

                    {imageError && (
                      <p className="text-[11px] text-rose-600">{imageError}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  {editingProduct ? 'Enregistrer les modifications' : 'Ajouter le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
