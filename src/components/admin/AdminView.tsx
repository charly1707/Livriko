import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Store,
  Truck,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Download,
  LayoutDashboard,
  Archive,
  Star,
  DollarSign,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import livrikoLogo from '../../assets/images/livriko-logo-sm.webp';

type AdminTab = 'overview' | 'verifications' | 'stores' | 'orders' | 'accounts' | 'archive' | 'reviews';

const TAB_LABELS: Record<AdminTab, string> = {
  overview: 'Tableau de bord',
  verifications: 'Certification livreurs',
  stores: 'Boutiques',
  orders: 'Commandes',
  accounts: 'Utilisateurs',
  archive: 'Archives',
  reviews: 'Avis livreurs',
};

const NAV_SECTIONS: { title: string; items: AdminTab[] }[] = [
  { title: 'Pilotage', items: ['overview'] },
  { title: 'Opérations', items: ['verifications', 'stores', 'orders'] },
  { title: 'Administration', items: ['accounts', 'archive', 'reviews'] },
];

export const AdminView: React.FC<{
  onOpenUserProfile?: (tab?: 'profil' | 'commandes' | 'adresses' | 'parametres') => void;
}> = ({ onOpenUserProfile }) => {
  const {
    stores,
    orders,
    allUsers,
    currentUser,
    approveLivreur,
    rejectLivreur,
    requestIncompleteLivreur,
    toggleStoreCertification,
    deleteUser,
    archiveOrder,
    logoutUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewFilters, setReviewFilters] = useState({ driver_id: '', rating: '' });
  const [storeCategoryFilter, setStoreCategoryFilter] = useState<string>('all');
  const [accountRoleFilter, setAccountRoleFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; email: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [archivedOrders, setArchivedOrders] = useState<any[]>([]);

  React.useEffect(() => {
    if (activeTab !== 'reviews') return;
    const params = new URLSearchParams();
    if (reviewFilters.driver_id) params.append('driver_id', reviewFilters.driver_id);
    if (reviewFilters.rating) params.append('rating', reviewFilters.rating);
    fetch('/backend/index.php/api/reviews/admin?' + params.toString(), { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.success) setReviews(data.reviews || []); });
  }, [activeTab, reviewFilters]);

  React.useEffect(() => {
    if (activeTab !== 'archive') return;
    fetch('/backend/index.php/api/orders?archivedOnly=true', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.success) setArchivedOrders(data.orders || []); })
      .catch(() => setArchivedOrders([]));
  }, [activeTab, orders]);

  const totalGMV = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommission = Math.round(totalGMV * 0.10);
  const pendingLivreurs = allUsers.filter(u =>
    u.role === 'livreur' && (u.verificationStatus === 'pending' || u.verificationStatus === 'incomplete')
  );
  const approvedLivreurs = allUsers.filter(u => u.role === 'livreur' && u.verificationStatus === 'approved');
  const vendorsCount = stores.length;
  const ridersCount = allUsers.filter(u => u.role === 'livreur').length;
  const clientsCount = allUsers.filter(u => u.role === 'client').length;
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const filteredStores = storeCategoryFilter === 'all'
    ? stores
    : stores.filter(s => s.category === storeCategoryFilter);
  const filteredAccounts = accountRoleFilter === 'all'
    ? allUsers.filter(u => u.role !== 'admin')
    : allUsers.filter(u => u.role === accountRoleFilter);

  const navItems: { id: AdminTab; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', icon: LayoutDashboard },
    { id: 'verifications', icon: ShieldCheck, badge: pendingLivreurs.length },
    { id: 'stores', icon: Store, badge: stores.filter(s => !s.isCertified).length },
    { id: 'orders', icon: ShoppingBag, badge: activeOrders.length },
    { id: 'accounts', icon: Users },
    { id: 'archive', icon: Archive },
    { id: 'reviews', icon: Star },
  ];
  const navItemMap = Object.fromEntries(navItems.map(item => [item.id, item])) as Record<AdminTab, (typeof navItems)[number]>;
  const adminInitials = (currentUser?.name || 'AD')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2) || 'AD';
  const adminDisplayName = currentUser?.name?.trim() || 'Administrateur';

  const downloadDossier = (data: object, fileName: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const confirmDeleteAccount = async () => {
    if (!deleteConfirm) return;
    setDeleteBusy(true);
    try {
      await deleteUser(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (error: any) {
      window.alert(error?.message || 'Impossible de supprimer le compte.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const uncertifiedStores = stores.filter(s => !s.isCertified).length;
  const recentOrders = [...orders].slice(0, 6);
  const certifiedStores = stores.filter(s => s.isCertified).length;

  const renderOverview = () => (
    <div className="flex flex-col gap-3.5 xl:gap-5 lg:h-full lg:overflow-hidden">
      {/* Ligne 1 — accueil + stats rapides */}
      <section className="shrink-0 rounded-2xl bg-gradient-to-r from-[#0c1a2e] to-[#1a3d66] px-6 py-5 sm:px-7 sm:py-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#ffb86a]">Tableau de bord</p>
            <h1 className="text-3xl sm:text-[2rem] font-black truncate mt-1">
              Bonjour, {adminDisplayName.split(' ')[0]}
            </h1>
            <p className="text-sm text-[#c5d3e4] mt-1.5 hidden sm:block">Vue d&apos;ensemble de la marketplace Livriko</p>
          </div>
          <div className="grid grid-cols-4 gap-3 w-full lg:w-auto lg:min-w-[28rem]">
            {[
              { label: 'Commandes', value: orders.length },
              { label: 'Actives', value: activeOrders.length },
              { label: 'Livrées', value: deliveredOrders },
              { label: 'Boutiques', value: vendorsCount },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-white/10 px-3.5 py-3 text-center">
                <p className="text-[11px] font-bold uppercase text-[#9eb0c7]">{item.label}</p>
                <p className="text-2xl sm:text-3xl font-black leading-tight mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ligne 2 — finances + indicateurs clés */}
      <section className="shrink-0 grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <article className="col-span-1 lg:col-span-2 rounded-2xl border border-[#e6dac8] bg-white px-5 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-slate-500">Volume d&apos;affaires</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 truncate mt-1.5">
                {totalGMV.toLocaleString()} <span className="text-base font-bold text-slate-500">FCFA</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </article>
        <article className="col-span-1 lg:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-emerald-700/80">Commission 10%</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 truncate mt-1.5">
                {totalCommission.toLocaleString()} <span className="text-base font-bold">FCFA</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </article>
        {[
          { label: 'Clients', value: clientsCount, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Livreurs', value: `${approvedLivreurs.length}/${ridersCount}`, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-2xl border border-[#e6dac8] bg-white px-5 py-4 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-500">{card.label}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{card.value}</p>
              </div>
              <div className={`h-11 w-11 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </article>
          );
        })}
      </section>

      {/* Ligne 3 — corps */}
      <section className="lg:flex-1 lg:min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-3.5 xl:gap-5">
        <div className="xl:col-span-4 flex flex-col min-h-0 rounded-2xl border border-[#e6dac8] bg-white lg:overflow-hidden">
          <div className="shrink-0 px-5 py-3.5 border-b border-[#efe6d8]">
            <h2 className="text-lg font-black text-slate-900">À traiter en priorité</h2>
            <p className="text-sm text-slate-500 mt-1">{pendingLivreurs.length} dossier(s) · {uncertifiedStores} boutique(s)</p>
          </div>
          <div className="flex-1 min-h-0 lg:overflow-hidden p-3.5 space-y-2.5">
            {[
              { tab: 'verifications' as AdminTab, label: 'Certifier les livreurs', count: pendingLivreurs.length, icon: ShieldCheck },
              { tab: 'stores' as AdminTab, label: 'Certifier les boutiques', count: uncertifiedStores, icon: Store },
              { tab: 'orders' as AdminTab, label: 'Suivre les commandes', count: activeOrders.length, icon: ShoppingBag },
              { tab: 'accounts' as AdminTab, label: 'Gérer les comptes', count: allUsers.filter(u => u.role !== 'admin').length, icon: Users },
            ].map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.tab}
                  type="button"
                  onClick={() => setActiveTab(action.tab)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-left hover:bg-slate-100 transition cursor-pointer"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-slate-700" />
                    </div>
                    <span className="text-[15px] font-bold text-slate-800 truncate">{action.label}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="text-lg font-black text-slate-900">{action.count}</span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="xl:col-span-8 flex flex-col min-h-0 rounded-2xl border border-[#e6dac8] bg-white lg:overflow-hidden">
          <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#efe6d8]">
            <div>
              <h2 className="text-lg font-black text-slate-900">Activité récente</h2>
              <p className="text-sm text-slate-500 mt-1">{certifiedStores}/{vendorsCount} boutiques certifiées</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0c1a2e] text-white text-sm font-bold hover:bg-[#132d4d] transition"
            >
              Tout voir
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0 lg:overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-[#faf6ef]">
                <tr className="text-xs font-bold uppercase text-slate-500">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3 hidden md:table-cell">Boutique</th>
                  <th className="px-5 py-3 hidden lg:table-cell">Livreur</th>
                  <th className="px-5 py-3">Montant</th>
                  <th className="px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efe6d8]">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">Aucune commande</td>
                  </tr>
                ) : recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-[#fffdf8]">
                    <td className="px-5 py-3 font-mono font-bold text-[#1d4ed8]">{o.code}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900 truncate max-w-[140px]">{o.clientName}</td>
                    <td className="px-5 py-3 text-slate-600 truncate max-w-[160px] hidden md:table-cell">{o.storeName}</td>
                    <td className="px-5 py-3 text-slate-600 truncate max-w-[130px] hidden lg:table-cell">{o.riderName || '—'}</td>
                    <td className="px-5 py-3 font-bold text-slate-900 whitespace-nowrap">{o.totalAmount.toLocaleString()} F</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );

  const renderAdminPageHeader = (title: string, subtitle: string, stats?: { label: string; value: string | number }[]) => (
    <section className="shrink-0 rounded-2xl bg-gradient-to-r from-[#0c1a2e] to-[#1a3d66] px-6 py-5 sm:px-7 sm:py-6 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#ffb86a]">Administration</p>
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

  const renderAdminPageBody = (children: React.ReactNode) => (
    <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto rounded-2xl border border-[#e6dac8] bg-[#fffdf8] p-4 sm:p-5 xl:p-6 shadow-sm">
      {children}
    </div>
  );

  const renderAdminPage = (title: string, subtitle: string, body: React.ReactNode, stats?: { label: string; value: string | number }[]) => (
    <div className="flex flex-col gap-3.5 xl:gap-5 lg:h-full lg:overflow-hidden">
      {renderAdminPageHeader(title, subtitle, stats)}
      {renderAdminPageBody(body)}
    </div>
  );

  const adminTableClass = 'w-full text-left text-[15px]';
  const adminTheadClass = 'bg-[#faf6ef] border-b border-[#e6dac8]';
  const adminThClass = 'px-5 py-3 text-xs font-bold uppercase text-slate-500';
  const adminTdClass = 'px-5 py-3';
  const adminTableWrapClass = 'overflow-x-auto rounded-2xl border border-[#e6dac8] bg-white shadow-sm';

  const renderVerifications = () => renderAdminPage(
    'Certification livreurs',
    'Examinez les dossiers et validez les livreurs sous 12 heures maximum.',
    (
      <div className="space-y-4">
        {pendingLivreurs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e6dac8] bg-[#faf6ef] p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-800">Tous les dossiers livreurs sont à jour</p>
            <p className="text-sm text-slate-500 mt-2">Les nouvelles demandes apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          pendingLivreurs.map(rider => (
            <article key={rider.id} className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5 sm:p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  {rider.avatar ? (
                    <img src={rider.avatar} alt={rider.name} className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 shrink-0 flex items-center justify-center text-amber-700 font-black">
                      {(rider.name || '?').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase">
                      En attente · 12h max
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-2 truncate">{rider.name}</h3>
                    <p className="text-sm text-slate-600 break-words mt-1">{rider.phone} · {rider.email}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {rider.vehicle || 'Moto non renseignée'}
                      {rider.vehiclePlate ? ` · ${rider.vehiclePlate}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => approveLivreur(rider.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Approuver
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Motif du refus :', 'Pièces illisibles ou non conformes');
                      if (reason === null) return;
                      rejectLivreur(rider.id, reason || 'Pièces illisibles');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Informations manquantes :', 'Merci de compléter votre dossier.');
                      if (reason === null) return;
                      requestIncompleteLivreur(rider.id, reason);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Incomplet
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ id: rider.id, name: rider.name, email: rider.email })}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold cursor-pointer"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Selfie', src: rider.selfiePhoto || rider.avatar },
                  { label: 'CIP / ID', src: rider.cipPhoto },
                  { label: 'Moto', src: rider.vehiclePhoto },
                ].map(item => (
                  <div key={item.label} className="rounded-xl border border-[#e6dac8] bg-white p-4 text-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">{item.label}</span>
                    {item.src ? (
                      <img src={item.src} alt={item.label} className="mt-3 w-full h-36 object-cover rounded-lg" />
                    ) : (
                      <div className="mt-3 h-36 rounded-lg bg-slate-100 flex items-center justify-center text-sm text-slate-400">Non fourni</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  Statut : <span className="font-bold">{rider.verificationStatus?.toUpperCase() || 'EN ATTENTE'}</span>
                  {rider.rejectionReason && <> · Motif : {rider.rejectionReason}</>}
                </p>
                <button
                  onClick={() => downloadDossier(rider, `dossier-livreur-${rider.id}.json`)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0c1a2e] text-white text-sm font-bold hover:bg-[#132d4d]"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le dossier
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    ),
    [
      { label: 'En attente', value: pendingLivreurs.length },
      { label: 'Certifiés', value: approvedLivreurs.length },
      { label: 'Total', value: ridersCount },
    ],
  );

  const renderStores = () => renderAdminPage(
    'Boutiques partenaires',
    'Certifiez les commerces pour renforcer la confiance des clients Livriko.',
    (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setStoreCategoryFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold ${storeCategoryFilter === 'all' ? 'bg-[#0c1a2e] text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Toutes ({stores.length})
          </button>
          {Array.from(new Set(stores.map(s => s.category))).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setStoreCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold ${storeCategoryFilter === cat ? 'bg-[#ff8a1f] text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredStores.map(store => (
            <article key={store.id} className="rounded-2xl border border-[#e6dac8] bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-4">
                {store.logo ? (
                  <img src={store.logo} alt={store.name} className="w-14 h-14 rounded-xl object-cover border border-[#e6dac8]" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-[#e6dac8] flex items-center justify-center">
                    <Store className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5 truncate">
                    {store.name}
                    {store.isCertified && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </h4>
                  <p className="text-sm text-slate-500 mt-0.5">{store.category} · {store.city}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{store.address}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleStoreCertification(store.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer ${
                    store.isCertified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-50 border border-[#e6dac8] text-slate-700'
                  }`}
                >
                  {store.isCertified ? 'Certifié · Retirer' : 'Certifier'}
                </button>
                <button
                  onClick={() => downloadDossier(store, `dossier-boutique-${store.id}.json`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0c1a2e] text-white text-sm font-bold"
                >
                  <Download className="w-4 h-4" />
                  Dossier
                </button>
                <button
                  onClick={() => {
                    const ownerId = store.ownerId;
                    if (!ownerId) return;
                    const owner = allUsers.find(u => u.id === ownerId);
                    setDeleteConfirm({
                      id: ownerId,
                      name: owner?.name || `Propriétaire de ${store.name}`,
                      email: owner?.email || store.phone,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    ),
    [
      { label: 'Total', value: stores.length },
      { label: 'Certifiées', value: certifiedStores },
      { label: 'À certifier', value: uncertifiedStores },
    ],
  );

  const ordersTable = (rows: typeof orders, showArchiveAction = false) => (
    <div className={adminTableWrapClass}>
      <table className={`${adminTableClass} min-w-[800px]`}>
        <thead className={adminTheadClass}>
          <tr>
            <th className={adminThClass}>Code</th>
            <th className={adminThClass}>Client</th>
            <th className={adminThClass}>Boutique</th>
            <th className={adminThClass}>Livreur</th>
            <th className={adminThClass}>Total</th>
            <th className={adminThClass}>Statut</th>
            {showArchiveAction && <th className={adminThClass}>Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#efe6d8]">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={showArchiveAction ? 7 : 6} className={`${adminTdClass} py-12 text-center text-slate-500`}>
                Aucune commande à afficher.
              </td>
            </tr>
          ) : rows.map(o => (
            <tr key={o.id} className="hover:bg-[#fffdf8]">
              <td className={`${adminTdClass} font-mono font-bold text-[#1d4ed8]`}>{o.code}</td>
              <td className={`${adminTdClass} font-semibold text-slate-900`}>{o.clientName}</td>
              <td className={`${adminTdClass} text-slate-700`}>{o.storeName}</td>
              <td className={`${adminTdClass} text-slate-600`}>{o.riderName || '—'}</td>
              <td className={`${adminTdClass} font-bold text-slate-900`}>{o.totalAmount.toLocaleString()} FCFA</td>
              <td className={adminTdClass}>
                <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase">{o.status}</span>
              </td>
              {showArchiveAction && (
                <td className={adminTdClass}>
                  {['delivered', 'cancelled'].includes(o.status) && (
                    <button
                      type="button"
                      onClick={() => void archiveOrder(o.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-sm font-bold text-slate-700"
                    >
                      Archiver
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();

      case 'verifications':
        return renderVerifications();

      case 'stores':
        return renderStores();

      case 'orders':
        return renderAdminPage(
          'Commandes',
          'Suivi global des commandes et livraisons en temps réel.',
          ordersTable(orders, true),
          [
            { label: 'Total', value: orders.length },
            { label: 'Actives', value: activeOrders.length },
            { label: 'Livrées', value: deliveredOrders },
          ],
        );

      case 'accounts':
        return renderAdminPage(
          'Utilisateurs',
          'Gérez les comptes de la plateforme. La suppression est douce et conserve l\'historique.',
          (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-slate-600">{filteredAccounts.length} compte(s) affiché(s)</p>
                <select
                  value={accountRoleFilter}
                  onChange={(e) => setAccountRoleFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-[#e6dac8] bg-white text-sm font-bold"
                >
                  <option value="all">Tous les rôles</option>
                  <option value="client">Clients</option>
                  <option value="vendeur">Vendeurs</option>
                  <option value="restaurant">Restaurants</option>
                  <option value="livreur">Livreurs</option>
                </select>
              </div>
              <div className={adminTableWrapClass}>
                <table className={`${adminTableClass} min-w-[720px]`}>
                  <thead className={adminTheadClass}>
                    <tr>
                      <th className={adminThClass}>Nom</th>
                      <th className={adminThClass}>Email</th>
                      <th className={adminThClass}>Téléphone</th>
                      <th className={adminThClass}>Rôle</th>
                      <th className={adminThClass}>Statut</th>
                      <th className={adminThClass}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe6d8]">
                    {filteredAccounts.map(user => (
                      <tr key={user.id} className="hover:bg-[#fffdf8]">
                        <td className={`${adminTdClass} font-bold text-slate-900`}>{user.name}</td>
                        <td className={`${adminTdClass} text-slate-600`}>{user.email}</td>
                        <td className={`${adminTdClass} text-slate-600`}>{user.phone}</td>
                        <td className={`${adminTdClass} uppercase text-xs font-bold`}>{user.role}</td>
                        <td className={adminTdClass}>
                          {user.role === 'livreur' ? (user.verificationStatus || '—') : (user.statut || 'actif')}
                        </td>
                        <td className={adminTdClass}>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ id: user.id, name: user.name, email: user.email })}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ),
          [
            { label: 'Clients', value: clientsCount },
            { label: 'Vendeurs', value: allUsers.filter(u => u.role === 'vendeur' || u.role === 'restaurant').length },
            { label: 'Livreurs', value: ridersCount },
          ],
        );

      case 'archive':
        return renderAdminPage(
          'Archives',
          'Consultez et restaurez les commandes archivées.',
          archivedOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e6dac8] bg-[#faf6ef] p-12 text-center">
              <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-700">Aucune commande archivée</p>
              <p className="text-sm text-slate-500 mt-2">Les commandes archivées apparaîtront ici.</p>
            </div>
          ) : (
            <div className={adminTableWrapClass}>
              <table className={`${adminTableClass} min-w-[640px]`}>
                <thead className={adminTheadClass}>
                  <tr>
                    <th className={adminThClass}>Code</th>
                    <th className={adminThClass}>Client</th>
                    <th className={adminThClass}>Boutique</th>
                    <th className={adminThClass}>Statut</th>
                    <th className={adminThClass}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#efe6d8]">
                  {archivedOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-[#fffdf8]">
                      <td className={`${adminTdClass} font-mono font-bold text-[#1d4ed8]`}>{o.code}</td>
                      <td className={`${adminTdClass} font-semibold`}>{o.clientName}</td>
                      <td className={adminTdClass}>{o.storeName}</td>
                      <td className={adminTdClass}>
                        <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase">{o.status}</span>
                      </td>
                      <td className={adminTdClass}>
                        <button
                          type="button"
                          onClick={() => void archiveOrder(o.id, true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-bold"
                        >
                          Restaurer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
          [{ label: 'Archivées', value: archivedOrders.length }],
        );

      case 'reviews':
        return renderAdminPage(
          'Avis livreurs',
          'Consultez les évaluations laissées par les clients sur les livreurs.',
          (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={reviewFilters.driver_id}
                  onChange={e => setReviewFilters(f => ({ ...f, driver_id: e.target.value }))}
                  className="px-4 py-2.5 rounded-xl border border-[#e6dac8] bg-white text-sm font-medium"
                >
                  <option value="">Tous les livreurs</option>
                  {allUsers.filter(u => u.role === 'livreur').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <select
                  value={reviewFilters.rating}
                  onChange={e => setReviewFilters(f => ({ ...f, rating: e.target.value }))}
                  className="px-4 py-2.5 rounded-xl border border-[#e6dac8] bg-white text-sm font-medium"
                >
                  <option value="">Toutes les notes</option>
                  {[5, 4, 3, 2, 1].map(n => (
                    <option key={n} value={String(n)}>{n} ⭐</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setReviewFilters({ driver_id: '', rating: '' })}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-sm font-bold text-slate-700"
                >
                  Réinitialiser
                </button>
              </div>
              <div className={adminTableWrapClass}>
                <table className={`${adminTableClass} min-w-[800px]`}>
                  <thead className={adminTheadClass}>
                    <tr>
                      <th className={adminThClass}>Date</th>
                      <th className={adminThClass}>Commande</th>
                      <th className={adminThClass}>Client</th>
                      <th className={adminThClass}>Livreur</th>
                      <th className={adminThClass}>Note</th>
                      <th className={adminThClass}>Commentaire</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#efe6d8]">
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`${adminTdClass} py-12 text-center text-slate-500`}>Aucune évaluation.</td>
                      </tr>
                    ) : reviews.map(r => (
                      <tr key={r.id} className="hover:bg-[#fffdf8]">
                        <td className={adminTdClass}>{r.createdAt || r.created_at || '—'}</td>
                        <td className={`${adminTdClass} font-mono font-bold text-[#1d4ed8]`}>{r.code_commande || r.order_id}</td>
                        <td className={adminTdClass}>{r.client_nom} {r.client_prenom}</td>
                        <td className={adminTdClass}>{r.driver_nom} {r.driver_prenom}</td>
                        <td className={`${adminTdClass} font-bold text-lg`}>{r.rating} ⭐</td>
                        <td className={`${adminTdClass} text-slate-700`}>{r.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ),
          [{ label: 'Avis', value: reviews.length }],
        );

      default:
        return null;
    }
  };

  const selectTab = (id: AdminTab) => {
    setActiveTab(id);
    setIsMobileSidebarOpen(false);
  };

  const sidebarShellClass = 'flex flex-col h-full bg-[#0c1a2e] text-[#f8f4ec] border-r border-[#1e3a5f]/60';

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* En-tête marque */}
      <div className="px-5 pt-6 pb-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl overflow-hidden ring-2 ring-[#ff8a1f]/40 shadow-lg shadow-[#ff8a1f]/10 shrink-0">
            <img src={livrikoLogo} alt="Livriko" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-black leading-none tracking-tight">
              Livr<span className="text-[#ff8a1f]">iko</span>
            </p>
            <p className="text-[11px] font-medium text-[#c9d4e3] mt-1">Console administrateur</p>
          </div>
        </div>
      </div>

      {/* Navigation groupée */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {NAV_SECTIONS.map(section => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7f93ad]">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map(tabId => {
                const item = navItemMap[tabId];
                const Icon = item.icon;
                const isActive = activeTab === tabId;
                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => selectTab(tabId)}
                    className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#ff8a1f]/12 text-white shadow-[inset_3px_0_0_#ff8a1f]'
                        : 'text-[#b8c5d6] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isActive ? 'bg-[#ff8a1f] text-white' : 'bg-white/6 text-[#9eb0c7] group-hover:bg-white/10 group-hover:text-white'
                    }`}>
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-[13px] leading-tight ${isActive ? 'font-bold' : 'font-semibold'}`}>
                        {TAB_LABELS[tabId]}
                      </span>
                    </span>
                    {item.badge != null && item.badge > 0 && (
                      <span className={`shrink-0 min-w-[1.35rem] h-[1.35rem] px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
                        isActive ? 'bg-[#ff8a1f] text-white' : 'bg-[#ff8a1f]/20 text-[#ffb86a]'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profil + actions */}
      <div className="mt-auto px-3 pb-5 pt-4 border-t border-white/8 space-y-3">
        <div className="flex items-start gap-3 rounded-2xl bg-white/5 px-3 py-3 overflow-hidden">
          <div
            className="relative h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-[#ff8a1f] to-[#e86f00] text-white flex items-center justify-center overflow-hidden isolate"
            aria-hidden
          >
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="text-[11px] font-black leading-none tracking-tight">{adminInitials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-[13px] font-bold text-white leading-snug line-clamp-2 break-words">
              {adminDisplayName}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#ffb86a] mt-1">
              Administrateur
            </p>
            <p className="text-[11px] text-[#8fa3bc] truncate mt-1">{currentUser?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {onOpenUserProfile && (
            <button
              type="button"
              onClick={() => onOpenUserProfile('profil')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/6 text-[12px] font-semibold text-[#d5e0ee] hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <User className="w-4 h-4" />
              Mon profil
            </button>
          )}
          <button
            type="button"
            onClick={() => void logoutUser()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/12 border border-rose-400/25 text-[12px] font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen lg:h-screen lg:max-h-screen w-full bg-[#f4f0e8] overflow-y-auto lg:overflow-hidden">
      {/* Sidebar desktop */}
      <aside className={`hidden lg:flex w-[17.5rem] xl:w-[19rem] shrink-0 h-screen sticky top-0 ${sidebarShellClass}`}>
        {renderSidebarContent()}
      </aside>

      {/* Sidebar mobile (drawer) */}
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-[#0c1a2e]/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[18.5rem] max-w-[88vw] shadow-2xl transition-transform duration-300 lg:hidden ${sidebarShellClass} ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-end px-4 pt-4 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-[#c5d3e4]"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-[calc(100%-3.25rem)]">{renderSidebarContent()}</div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 min-w-0 flex flex-col lg:min-h-0 lg:overflow-hidden">
        <div className="lg:hidden shrink-0 flex items-center gap-3 px-4 py-3 bg-[#0c1a2e] text-white border-b border-[#1e3a5f]/60">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-[#f8f4ec]"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#ff8a1f]">Administration</p>
            <p className="text-[15px] font-bold truncate text-[#f8f4ec]">{TAB_LABELS[activeTab]}</p>
          </div>
        </div>

        <div className="flex-1 lg:min-h-0 p-4 sm:p-5">
          <div key={activeTab} className="lg:h-full lg:overflow-hidden">
            {renderContent()}
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Confirmer la suppression</h3>
            <p className="text-sm text-slate-600">Vous êtes sur le point de désactiver le compte :</p>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm">
              <p className="font-bold text-slate-900">{deleteConfirm.name}</p>
              <p className="text-slate-600">{deleteConfirm.email}</p>
              <p className="text-[11px] text-rose-700 mt-2">
                Suppression douce : le compte sera désactivé. Les historiques de commandes sont conservés.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void confirmDeleteAccount()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-60"
              >
                {deleteBusy ? 'Suppression…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
