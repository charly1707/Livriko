import React, { useState } from 'react';
import {
  Store as StoreIcon, Package, Plus, Edit3, Trash2, Truck, CheckCircle2, Clock,
  DollarSign, X, Image as ImageIcon, ShieldCheck, XCircle, Settings,
  MessageCircle, LayoutDashboard, ShoppingBag, Menu, ChevronRight, TrendingUp, Camera, LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, CategoryType } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { uploadImageFile } from '../../utils/imageUpload';
import livrikoLogo from '../../assets/images/livriko-logo-sm.webp';

type VendeurTab = 'overview' | 'orders' | 'catalog' | 'settings';

const TAB_LABELS: Record<VendeurTab, string> = {
  overview: 'Tableau de bord',
  orders: 'Commandes',
  catalog: 'Catalogue',
  settings: 'Paramètres',
};

const NAV_SECTIONS: { title: string; items: VendeurTab[] }[] = [
  { title: 'Pilotage', items: ['overview'] },
  { title: 'Opérations', items: ['orders', 'catalog'] },
  { title: 'Boutique', items: ['settings'] },
];

export const VendeurView: React.FC<{ onOpenChat?: () => void }> = ({ onOpenChat }) => {
  const {
    currentUser,
    stores,
    storesReady,
    products,
    orders,
    requestRiderForOrder,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    updateUserProfile,
    updateStore,
    setActiveTrackingOrder,
    archiveOrder,
    logoutUser,
  } = useApp();

  const currentStore = stores.find(s =>
    (currentUser?.storeId && s.id === currentUser.storeId)
    || s.ownerId === currentUser?.id,
  );

  const [activeTab, setActiveTab] = useState<VendeurTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [storeName, setStoreName] = useState(currentStore?.name || '');
  const [storePhone, setStorePhone] = useState(currentStore?.phone || '');
  const [storeAddress, setStoreAddress] = useState(currentStore?.address || '');
  const [storeLogo, setStoreLogo] = useState(currentStore?.logo || '');
  const [userAvatar, setUserAvatar] = useState(currentUser?.avatar || '');
  const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null);
  const [userAvatarFile, setUserAvatarFile] = useState<File | null>(null);
  const [storeIsOpen, setStoreIsOpen] = useState(currentStore?.isOpen || false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(1500);
  const [category, setCategory] = useState<CategoryType>('restaurants');
  const [image, setImage] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const MAX_IMAGE_SIZE_MB = 5;

  if (!storesReady) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-[#f4f0e8]">
        <div className="max-w-md w-full text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full border-2 border-[#ff8a1f] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Vérification de votre boutique…</p>
        </div>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-[#f4f0e8]">
        <div className="max-w-xl w-full bg-[#fffdf8] border border-[#e6dac8] rounded-3xl p-8 shadow-sm text-center">
          <StoreIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-3">Aucun magasin associé</h2>
          <p className="text-sm text-slate-600 leading-6">
            Votre compte n&apos;a pas encore de boutique enregistrée. Actualisez la page ou complétez votre profil.
          </p>
          <button
            type="button"
            onClick={() => void logoutUser()}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const storeProducts = products.filter(p => {
    if (p.storeId !== currentStore.id) return false;
    if (productCategoryFilter === 'all') return true;
    return p.category === productCategoryFilter;
  });
  const storeOrders = orders.filter(o => o.storeId === currentStore.id && !o.archived);
  const totalRevenue = storeOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.subtotal, 0);
  const netRevenue = Math.round(totalRevenue * 0.95);
  const commission = Math.round(totalRevenue * 0.05);
  const pendingOrdersCount = storeOrders.filter(o => ['pending', 'confirmed', 'rider_requested'].includes(o.status)).length;
  const deliveredCount = storeOrders.filter(o => o.status === 'delivered').length;

  const navItems: { id: VendeurTab; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', icon: LayoutDashboard },
    { id: 'orders', icon: ShoppingBag, badge: pendingOrdersCount },
    { id: 'catalog', icon: Package, badge: storeProducts.length },
    { id: 'settings', icon: Settings },
  ];
  const navItemMap = Object.fromEntries(navItems.map(item => [item.id, item])) as Record<VendeurTab, (typeof navItems)[number]>;

  const inputClass = 'w-full px-4 py-3 bg-white border border-[#e6dac8] rounded-xl text-sm font-medium text-slate-900 focus:border-[#ff8a1f] focus:outline-none focus:ring-2 focus:ring-[#ff8a1f]/20 transition';
  const labelClass = 'text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5';

  const handleProductImageSelect = (file: File | null) => {
    setImageError(null);
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Format non pris en charge. Utilisez JPEG, PNG ou WEBP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setImageError(`L'image ne doit pas dépasser ${MAX_IMAGE_SIZE_MB} Mo.`);
      return;
    }
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') setImage(reader.result); };
    reader.readAsDataURL(file);
  };

  const clearProductImage = () => {
    setSelectedImageFile(null);
    setImage('');
    setImageError(null);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice(1500);
    setCategory(currentStore.category || 'restaurants');
    setSelectedImageFile(null);
    setImage('');
    setImageError(null);
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
    setImageError(null);
    setIsProductModalOpen(true);
  };

  const handleStoreLogoSelect = (file: File | null) => {
    if (!file) return;
    setSettingsError(null);
    setStoreLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setStoreLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUserAvatarSelect = (file: File | null) => {
    if (!file) return;
    setSettingsError(null);
    setUserAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setUserAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
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
      setSettingsError(error.message || 'Impossible d\'envoyer l\'image.');
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
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError(null);
    if (!editingProduct && !selectedImageFile) {
      setImageError('Ajoutez une photo pour publier votre article.');
      return;
    }
    const payloadImage = selectedImageFile ?? (image || undefined);
    if (!payloadImage) {
      setImageError('Une photo est requise pour cet article.');
      return;
    }
    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        await updateProduct({ ...editingProduct, name, description, price: Number(price), category, image: payloadImage });
      } else {
        await addProduct({
          storeId: currentStore.id,
          storeName: currentStore.name,
          name, description, price: Number(price), category,
          image: payloadImage, inStock: true, unit: 'portion',
        });
      }
      setIsProductModalOpen(false);
    } catch (error: any) {
      setImageError(error.message || 'Impossible d\'enregistrer l\'article.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const selectTab = (id: VendeurTab) => {
    setActiveTab(id);
    setIsMobileSidebarOpen(false);
  };

  const renderPageHeader = (title: string, subtitle: string, stats?: { label: string; value: string | number }[]) => (
    <section className="shrink-0 rounded-2xl bg-gradient-to-r from-[#0c1a2e] to-[#1a3d66] px-6 py-5 sm:px-7 sm:py-6 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#ffb86a]">Espace boutique</p>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">{title}</h1>
          <p className="text-sm text-[#c5d3e4] mt-1.5">{subtitle}</p>
        </div>
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto lg:min-w-[24rem]">
            {stats.map(stat => (
              <div key={stat.label} className="rounded-xl bg-white/10 px-3.5 py-3 text-center">
                <p className="text-[11px] font-bold uppercase text-[#9eb0c7]">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-black mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const renderOrderCard = (order: typeof storeOrders[number]) => (
    <article key={order.id} className="rounded-2xl border border-[#e6dac8] bg-white p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div className="space-y-2 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-black text-[#1d4ed8]">{order.code}</span>
          <span className="text-xs text-slate-400">{order.createdAt}</span>
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase">{order.status}</span>
        </div>
        <p className="text-sm font-bold text-slate-900">Client : {order.clientName} · {order.clientPhone}</p>
        <p className="text-sm text-slate-600">Livraison : {order.clientAddress}</p>
        <p className="text-xs text-slate-500">
          {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
        </p>
        {['pending', 'confirmed', 'rider_requested', 'rider_assigned', 'picked_up', 'delivering'].includes(order.status) && (
          <button
            type="button"
            onClick={() => { setActiveTrackingOrder(order); onOpenChat?.(); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-bold hover:bg-blue-100 transition"
          >
            <MessageCircle className="w-4 h-4" />
            Discuter avec le client
          </button>
        )}
      </div>
      <div className="flex flex-col items-stretch lg:items-end gap-3 shrink-0">
        <div className="text-left lg:text-right">
          <p className="text-sm text-slate-500">Vente : <strong className="text-slate-900">{order.subtotal.toLocaleString()} FCFA</strong></p>
          <p className="text-sm font-bold text-emerald-700 mt-1">Net (95 %) : {Math.round(order.subtotal * 0.95).toLocaleString()} FCFA</p>
          <p className="text-xs text-slate-400 mt-0.5">Commission 5 % : {Math.round(order.subtotal * 0.05).toLocaleString()} F</p>
        </div>
        {['delivered', 'cancelled'].includes(order.status) && (
          <button type="button" onClick={() => void archiveOrder(order.id)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold">
            Archiver
          </button>
        )}
        {order.status === 'pending' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Accusez réception pour démarrer la préparation.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => updateOrderStatus(order.id, 'confirmed')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" /> Commencer la préparation
              </button>
              <button type="button" onClick={() => updateOrderStatus(order.id, 'cancelled')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold">
                <XCircle className="w-4 h-4" /> Refuser
              </button>
            </div>
          </div>
        )}
        {order.status === 'confirmed' && (
          <button type="button" onClick={() => requestRiderForOrder(order.id)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-sm font-bold">
            <Truck className="w-4 h-4" /> Rechercher un livreur
          </button>
        )}
        {order.status === 'rider_requested' && (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold">
            <Clock className="w-4 h-4 animate-spin" /> Recherche livreur…
          </span>
        )}
        {['rider_assigned', 'picked_up', 'delivering'].includes(order.status) && (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" /> Livreur : {order.riderName}
          </span>
        )}
      </div>
    </article>
  );

  const renderOverview = () => (
    <div className="flex flex-col gap-3.5 xl:gap-5 lg:h-full lg:overflow-hidden">
      {renderPageHeader(
        currentStore.name,
        `${currentStore.category} · ${currentStore.city} · ${currentStore.isOpen ? 'Ouverte' : 'Fermée'}`,
        [
          { label: 'Commandes', value: storeOrders.length },
          { label: 'En attente', value: pendingOrdersCount },
          { label: 'Articles', value: storeProducts.length },
          { label: 'Livrées', value: deliveredCount },
        ],
      )}

      <section className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: 'Ventes brutes', value: `${totalRevenue.toLocaleString()} F`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Revenu net (95 %)', value: `${netRevenue.toLocaleString()} F`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Commission 5 %', value: `${commission.toLocaleString()} F`, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'À traiter', value: pendingOrdersCount, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-2xl border border-[#e6dac8] bg-white px-5 py-4 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-500">{card.label}</p>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-1 truncate">{card.value}</p>
              </div>
              <div className={`h-11 w-11 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </article>
          );
        })}
      </section>

      <section className="lg:flex-1 lg:min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-3.5">
        <div className="xl:col-span-4 flex flex-col min-h-0 rounded-2xl border border-[#e6dac8] bg-white lg:overflow-hidden">
          <div className="shrink-0 px-5 py-3.5 border-b border-[#efe6d8]">
            <h2 className="text-lg font-black text-slate-900">Actions rapides</h2>
          </div>
          <div className="p-3.5 space-y-2.5">
            {[
              { tab: 'orders' as VendeurTab, label: 'Traiter les commandes', count: pendingOrdersCount, icon: ShoppingBag },
              { tab: 'catalog' as VendeurTab, label: 'Gérer le catalogue', count: storeProducts.length, icon: Package },
              { tab: 'settings' as VendeurTab, label: 'Photo & paramètres boutique', count: null, icon: Camera },
            ].map(action => {
              const Icon = action.icon;
              return (
                <button key={action.tab} type="button" onClick={() => selectTab(action.tab)} className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-left hover:bg-slate-100 transition">
                  <span className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-slate-700" />
                    </div>
                    <span className="text-[15px] font-bold text-slate-800 truncate">{action.label}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    {action.count != null && <span className="text-lg font-black text-slate-900">{action.count}</span>}
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </span>
                </button>
              );
            })}
            <button type="button" onClick={openAddModal} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-sm font-bold transition">
              <Plus className="w-4 h-4" /> Publier un article
            </button>
          </div>
        </div>

        <div className="xl:col-span-8 flex flex-col min-h-0 rounded-2xl border border-[#e6dac8] bg-white lg:overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[#efe6d8]">
            <h2 className="text-lg font-black text-slate-900">Commandes récentes</h2>
            <button type="button" onClick={() => selectTab('orders')} className="text-sm font-bold text-[#ff8a1f] hover:underline">Tout voir</button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3">
            {storeOrders.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">Aucune commande reçue.</p>
            ) : storeOrders.slice(0, 5).map(renderOrderCard)}
          </div>
        </div>
      </section>
    </div>
  );

  const renderOrders = () => (
    <div className="flex flex-col gap-3.5 lg:h-full lg:overflow-hidden">
      {renderPageHeader('Commandes clients', 'Acceptez, préparez et sollicitez un livreur.', [
        { label: 'Total', value: storeOrders.length },
        { label: 'En attente', value: pendingOrdersCount },
        { label: 'Livrées', value: deliveredCount },
      ])}
      <div className="flex-1 lg:min-h-0 lg:overflow-y-auto rounded-2xl border border-[#e6dac8] bg-[#fffdf8] p-4 sm:p-5 space-y-4">
        {storeOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e6dac8] bg-[#faf6ef] p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Aucune commande reçue</p>
            <p className="text-sm text-slate-500 mt-2">Les commandes de vos clients apparaîtront ici.</p>
          </div>
        ) : storeOrders.map(renderOrderCard)}
      </div>
    </div>
  );

  const renderCatalog = () => (
    <div className="flex flex-col gap-3.5 lg:h-full lg:overflow-hidden">
      {renderPageHeader('Catalogue', 'Publiez et gérez vos articles en vente.', [
        { label: 'Articles', value: storeProducts.length },
        { label: 'En stock', value: storeProducts.filter(p => p.inStock).length },
      ])}
      <div className="flex-1 lg:min-h-0 lg:overflow-y-auto rounded-2xl border border-[#e6dac8] bg-[#fffdf8] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setProductCategoryFilter('all')} className={`px-4 py-2 rounded-full text-sm font-bold ${productCategoryFilter === 'all' ? 'bg-[#0c1a2e] text-white' : 'bg-slate-100 text-slate-600'}`}>Tous</button>
            {CATEGORIES.map(cat => (
              <button key={cat.id} type="button" onClick={() => setProductCategoryFilter(cat.id)} className={`px-4 py-2 rounded-full text-sm font-bold ${productCategoryFilter === cat.id ? 'bg-[#ff8a1f] text-white' : 'bg-slate-100 text-slate-600'}`}>{cat.label}</button>
            ))}
          </div>
          <button type="button" onClick={openAddModal} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-sm font-bold shrink-0">
            <Plus className="w-4 h-4" /> Publier un article
          </button>
        </div>
        {storeProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e6dac8] bg-[#faf6ef] p-12 text-center">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Aucun article publié</p>
            <p className="text-sm text-slate-500 mt-2 mb-4">Ajoutez votre premier article avec une photo.</p>
            <button type="button" onClick={openAddModal} className="px-5 py-2.5 rounded-xl bg-[#ff8a1f] text-white text-sm font-bold">Publier mon premier article</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {storeProducts.map(prod => (
              <article key={prod.id} className="rounded-2xl border border-[#e6dac8] bg-white p-4 flex items-center gap-4 shadow-sm">
                <img src={prod.image} alt={prod.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#e6dac8]" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{prod.name}</h4>
                  <p className="text-sm font-black text-[#1d4ed8] mt-0.5">{prod.price.toLocaleString()} FCFA</p>
                  <span className={`text-xs font-bold ${prod.inStock ? 'text-emerald-600' : 'text-rose-500'}`}>{prod.inStock ? 'En stock' : 'Rupture'}</span>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button type="button" onClick={() => openEditModal(prod)} className="p-2 rounded-lg bg-slate-50 border border-[#e6dac8] text-slate-600 hover:text-blue-600" title="Modifier"><Edit3 className="w-4 h-4" /></button>
                  <button type="button" onClick={() => deleteProduct(prod.id)} className="p-2 rounded-lg bg-slate-50 border border-[#e6dac8] text-slate-600 hover:text-rose-600" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col gap-3.5 lg:h-full lg:overflow-hidden">
      {renderPageHeader('Paramètres', 'Photo de boutique, informations et statut d\'ouverture.')}
      <div className="flex-1 lg:min-h-0 overflow-y-auto rounded-2xl border border-[#e6dac8] bg-[#fffdf8] p-4 sm:p-5">
        <form onSubmit={handleSaveStoreProfile} className="max-w-3xl space-y-5">
          {/* Photo de la boutique — zone visible */}
          <section className="rounded-2xl border border-[#e6dac8] bg-white p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Photo de la boutique</h3>
              <p className="text-sm text-slate-500 mt-1">
                Cette image s&apos;affiche sur le marché Livriko à côté du nom de votre commerce.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative shrink-0 mx-auto sm:mx-0">
                <div className="h-28 w-28 rounded-2xl overflow-hidden border-2 border-[#ff8a1f]/40 bg-[#faf6ef] shadow-lg">
                  {storeLogo || currentStore.logo ? (
                    <img src={storeLogo || currentStore.logo} alt="Logo boutique" className="h-full w-full object-contain bg-white p-1" />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <StoreIcon className="w-10 h-10" />
                      <span className="text-[10px] font-bold">Aucune photo</span>
                    </div>
                  )}
                </div>
                <label
                  htmlFor="store-logo-camera"
                  className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-[#0c1a2e] text-white flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#132d4d] transition"
                  title="Changer la photo de la boutique"
                >
                  <Camera className="w-5 h-5" />
                  <input
                    id="store-logo-camera"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => handleStoreLogoSelect(e.target.files?.[0] || null)}
                  />
                </label>
                {currentStore.isCertified && (
                  <span className="absolute -top-2 -left-2 bg-emerald-500 text-white p-1.5 rounded-full shadow" title="Boutique certifiée">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-3 min-w-0">
                <div className="min-w-0">
                  <h4 className="text-lg font-black text-slate-900 truncate">{storeName || currentStore.name}</h4>
                  <p className="text-sm text-slate-500">{currentStore.category} · {currentStore.city}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${storeIsOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {storeIsOpen ? 'Ouvert' : 'Fermé'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] text-white text-sm font-bold cursor-pointer transition">
                    <ImageIcon className="w-4 h-4" />
                    Choisir une photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={e => handleStoreLogoSelect(e.target.files?.[0] || null)}
                    />
                  </label>
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-[#e6dac8] text-slate-800 text-sm font-bold cursor-pointer transition">
                    <Camera className="w-4 h-4" />
                    Prendre une photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      className="hidden"
                      onChange={e => handleStoreLogoSelect(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-400">JPEG, PNG ou WEBP — recommandé : image carrée, min. 200×200 px</p>
                {storeLogoFile && (
                  <p className="text-xs font-bold text-[#ff8a1f]">Nouvelle photo sélectionnée — cliquez sur « Sauvegarder » pour l&apos;appliquer.</p>
                )}
              </div>
            </div>
          </section>

          {/* Photo du vendeur */}
          <section className="rounded-2xl border border-[#e6dac8] bg-white p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Votre photo de profil</h3>
              <p className="text-sm text-slate-500 mt-1">Photo personnelle du gérant (distincte du logo boutique).</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative shrink-0 mx-auto sm:mx-0">
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-[#e6dac8] bg-[#faf6ef]">
                  {userAvatar || currentUser?.avatar ? (
                    <img src={userAvatar || currentUser?.avatar} alt="Profil vendeur" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="vendor-avatar-camera"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#0c1a2e] text-white flex items-center justify-center cursor-pointer shadow"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="vendor-avatar-camera"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => handleUserAvatarSelect(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <label className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-[#e6dac8] text-slate-800 text-sm font-bold cursor-pointer transition sm:w-auto w-full">
                <ImageIcon className="w-4 h-4" />
                Modifier ma photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => handleUserAvatarSelect(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </section>

          <div className="rounded-2xl border border-[#ff8a1f]/20 bg-[#fff8f0] p-4 text-sm text-slate-700">
            <strong className="text-slate-900">Modèle sans abonnement</strong> — inscription et boutique gratuites. Livriko prélève <strong>5 %</strong> uniquement sur les commandes réalisées.
          </div>

          <section className="rounded-2xl border border-[#e6dac8] bg-white p-5 space-y-4">
            <h3 className="text-base font-black text-slate-900">Informations du commerce</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Nom du commerce</label>
                <input type="text" required value={storeName} onChange={e => setStoreName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Téléphone</label>
                <input type="text" required value={storePhone} onChange={e => setStorePhone(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Adresse</label>
                <input type="text" required value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className={inputClass} />
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between p-4 rounded-2xl border border-[#e6dac8] bg-white">
            <div>
              <p className="text-sm font-bold text-slate-900">Statut du commerce</p>
              <p className="text-xs text-slate-500 mt-0.5">Les clients ne peuvent commander que si vous êtes ouvert.</p>
            </div>
            <button type="button" onClick={() => setStoreIsOpen(!storeIsOpen)} className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition ${storeIsOpen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
              {storeIsOpen ? 'Ouvert' : 'Fermé'}
            </button>
          </div>

          {settingsError && <p className="text-sm text-rose-600">{settingsError}</p>}
          {settingsSaved && <p className="text-sm text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Modifications enregistrées</p>}

          <button type="submit" className="px-6 py-3 rounded-xl bg-[#0c1a2e] hover:bg-[#132d4d] text-white text-sm font-bold">
            Sauvegarder les modifications
          </button>
        </form>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'orders': return renderOrders();
      case 'catalog': return renderCatalog();
      case 'settings': return renderSettings();
      default: return null;
    }
  };

  const sidebarShellClass = 'flex flex-col h-full bg-[#0c1a2e] text-[#f8f4ec] border-r border-[#1e3a5f]/60';

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-12 w-12 rounded-2xl overflow-hidden bg-white p-1 ring-2 ring-[#ff8a1f]/40 shrink-0">
            <img src={livrikoLogo} alt="Livriko" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-black leading-none">Livr<span className="text-[#ff8a1f]">iko</span></p>
            <p className="text-[11px] text-[#c9d4e3] mt-1">Espace boutique</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
          <button type="button" onClick={() => selectTab('settings')} className="relative shrink-0 group" title="Modifier la photo de la boutique">
            {(storeLogo || currentStore.logo) ? (
              <img src={storeLogo || currentStore.logo} alt="" className="w-12 h-12 rounded-xl object-contain bg-white p-0.5 border border-white/10" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                <StoreIcon className="w-5 h-5 text-[#9eb0c7]" />
              </div>
            )}
            <span className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <Camera className="w-5 h-5 text-white" />
            </span>
          </button>
          <button type="button" onClick={() => selectTab('settings')} className="min-w-0 text-left flex-1">
            <p className="text-sm font-bold text-white truncate">{currentStore.name}</p>
            <p className="text-[10px] uppercase tracking-wide text-[#ffb86a] mt-0.5">{currentStore.isOpen ? 'Ouvert' : 'Fermé'} · Photo boutique</p>
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {NAV_SECTIONS.map(section => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7f93ad]">{section.title}</p>
            <div className="space-y-1">
              {section.items.map(tabId => {
                const item = navItemMap[tabId];
                const Icon = item.icon;
                const isActive = activeTab === tabId;
                return (
                  <button key={tabId} type="button" onClick={() => selectTab(tabId)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition ${isActive ? 'bg-[#ff8a1f]/12 text-white shadow-[inset_3px_0_0_#ff8a1f]' : 'text-[#b8c5d6] hover:bg-white/5 hover:text-white'}`}>
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-[#ff8a1f] text-white' : 'bg-white/6 text-[#9eb0c7]'}`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className={`flex-1 text-[13px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{TAB_LABELS[tabId]}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span className={`shrink-0 min-w-[1.35rem] h-[1.35rem] px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${isActive ? 'bg-[#ff8a1f] text-white' : 'bg-[#ff8a1f]/20 text-[#ffb86a]'}`}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-white/8">
        <button
          type="button"
          onClick={() => void logoutUser()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/12 border border-rose-400/25 text-[12px] font-semibold text-rose-300 hover:bg-rose-500/20 transition"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen lg:h-screen lg:max-h-screen w-full bg-[#f4f0e8] overflow-y-auto lg:overflow-hidden">
      <aside className={`hidden lg:flex w-[17.5rem] xl:w-[19rem] shrink-0 h-screen ${sidebarShellClass}`}>
        {renderSidebarContent()}
      </aside>

      {isMobileSidebarOpen && (
        <button type="button" aria-label="Fermer" className="fixed inset-0 z-40 bg-[#0c1a2e]/60 backdrop-blur-[2px] lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[18.5rem] max-w-[88vw] shadow-2xl transition-transform duration-300 lg:hidden ${sidebarShellClass} ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-end px-4 pt-4">
          <button type="button" onClick={() => setIsMobileSidebarOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-[#c5d3e4]"><X className="w-5 h-5" /></button>
        </div>
        <div className="h-[calc(100%-3.25rem)]">{renderSidebarContent()}</div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col lg:min-h-0 lg:overflow-hidden">
        <div className="lg:hidden shrink-0 flex items-center gap-3 px-4 py-3 bg-[#0c1a2e] text-white border-b border-[#1e3a5f]/60">
          <button type="button" onClick={() => setIsMobileSidebarOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/8"><Menu className="w-5 h-5" /></button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#ff8a1f]">Boutique</p>
            <p className="text-[15px] font-bold truncate">{TAB_LABELS[activeTab]}</p>
          </div>
        </div>
        <div className="flex-1 lg:min-h-0 p-4 sm:p-5">
          <div key={activeTab} className="lg:h-full lg:overflow-hidden">{renderContent()}</div>
        </div>
      </div>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-1100 bg-[#0c1a2e]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#fffdf8] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#e6dac8] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#e6dac8] shrink-0">
              <h3 className="text-base font-black text-slate-900">{editingProduct ? 'Modifier l\'article' : 'Publier un article'}</h3>
              <button type="button" onClick={() => setIsProductModalOpen(false)} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 min-h-0">
              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className={labelClass}>Nom de l&apos;article</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="ex : Poulet braisé XL" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Prix (FCFA)</label>
                    <input type="number" required value={price} onChange={e => setPrice(Number(e.target.value))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Catégorie</label>
                    <select value={category} onChange={e => setCategory(e.target.value as CategoryType)} className={inputClass}>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Photo {!editingProduct && <span className="text-rose-500">*</span>}</label>
                  {image ? (
                    <div className="relative">
                      <img src={image} alt="" className="w-full h-44 rounded-2xl object-cover border border-[#e6dac8]" />
                      <button type="button" onClick={clearProductImage} className="absolute top-2 right-2 p-1.5 rounded-full bg-white border border-[#e6dac8]"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="w-full h-44 rounded-2xl border-2 border-dashed border-[#e6dac8] bg-[#faf6ef] flex flex-col items-center justify-center gap-2 text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-sm font-semibold">Photo requise</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-sm font-bold cursor-pointer">
                      Galerie
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => handleProductImageSelect(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff8a1f]/10 text-[#e86f00] text-sm font-bold cursor-pointer">
                      Appareil photo
                      <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => handleProductImageSelect(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">JPEG, PNG ou WEBP — max {MAX_IMAGE_SIZE_MB} Mo</p>
                  {imageError && <p className="text-sm text-rose-600 mt-2">{imageError}</p>}
                </div>
              </div>
              <div className="p-5 border-t border-[#e6dac8] flex justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">Annuler</button>
                <button type="submit" disabled={isSavingProduct} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] disabled:opacity-60 text-white text-sm font-bold">
                  {isSavingProduct && <Clock className="w-4 h-4 animate-spin" />}
                  {isSavingProduct ? 'Publication…' : editingProduct ? 'Enregistrer' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
