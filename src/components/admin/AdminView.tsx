import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Store,
  Truck,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LayoutDashboard,
  Archive,
  Star,
  DollarSign,
  LogOut,
  Menu,
  X,
  ChevronRight,
  UserCog,
  UserPlus,
  FileText,
  Eye,
  Loader2,
  Search,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { downloadLivreurDossierPdf, downloadStoreDossierPdf } from '../../utils/dossierPdf';
import livrikoLogo from '../../assets/images/livriko-logo-sm.webp';

type AdminTab = 'overview' | 'verifications' | 'stores' | 'orders' | 'accounts' | 'admins' | 'archive' | 'reviews';

const TAB_LABELS: Record<AdminTab, string> = {
  overview: 'Tableau de bord',
  verifications: 'Candidatures livreurs',
  stores: 'Boutiques',
  orders: 'Commandes',
  accounts: 'Utilisateurs',
  admins: 'Administrateurs',
  archive: 'Archives',
  reviews: 'Avis livreurs',
};

const NAV_SECTIONS: { title: string; items: AdminTab[] }[] = [
  { title: 'Pilotage', items: ['overview'] },
  { title: 'Opérations', items: ['verifications', 'stores', 'orders'] },
  { title: 'Administration', items: ['accounts', 'admins', 'archive', 'reviews'] },
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
    deleteStore,
    deleteUser,
    archiveOrder,
    logoutUser,
    createAdminUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewFilters, setReviewFilters] = useState({ driver_id: '', rating: '' });
  const [storeCategoryFilter, setStoreCategoryFilter] = useState<string>('all');
  const [accountRoleFilter, setAccountRoleFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'account' | 'store';
    id: string;
    name: string;
    email?: string;
  } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [archivedOrders, setArchivedOrders] = useState<any[]>([]);
  const [adminForm, setAdminForm] = useState({
    prenom: '',
    nom: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [adminFormError, setAdminFormError] = useState('');
  const [adminFormSuccess, setAdminFormSuccess] = useState('');
  const [adminFormBusy, setAdminFormBusy] = useState(false);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);
  const [verificationFilter, setVerificationFilter] = useState<'todo' | 'pending' | 'incomplete' | 'rejected' | 'approved' | 'all'>('todo');
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; label: string } | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    type: 'approve' | 'reject' | 'incomplete';
    rider: User;
  } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [riderQuery, setRiderQuery] = useState('');

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
    u.role === 'livreur' && (u.verificationStatus === 'pending' || u.verificationStatus === 'incomplete' || !u.verificationStatus)
  );
  const allLivreurs = allUsers.filter(u => u.role === 'livreur');
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
  const adminUsers = allUsers.filter(u => u.role === 'admin');

  const navItems: { id: AdminTab; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', icon: LayoutDashboard },
    { id: 'verifications', icon: ShieldCheck, badge: pendingLivreurs.length },
    { id: 'stores', icon: Store, badge: stores.filter(s => !s.isCertified).length },
    { id: 'orders', icon: ShoppingBag, badge: activeOrders.length },
    { id: 'accounts', icon: Users },
    { id: 'admins', icon: UserCog },
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

  const downloadLivreurPdf = async (rider: User) => {
    setPdfBusyId(rider.id);
    try {
      await downloadLivreurDossierPdf(rider);
    } catch (error: any) {
      window.alert(error?.message || 'Impossible de générer le PDF.');
    } finally {
      setPdfBusyId(null);
    }
  };

  const downloadStorePdf = async (store: typeof stores[number]) => {
    setPdfBusyId(store.id);
    try {
      await downloadStoreDossierPdf(store);
    } catch (error: any) {
      window.alert(error?.message || 'Impossible de générer le PDF.');
    } finally {
      setPdfBusyId(null);
    }
  };

  const confirmDecision = async () => {
    if (!decisionModal) return;
    setDecisionBusy(true);
    try {
      if (decisionModal.type === 'approve') {
        await approveLivreur(decisionModal.rider.id);
      } else if (decisionModal.type === 'reject') {
        await rejectLivreur(decisionModal.rider.id, decisionReason.trim() || 'Pièces illisibles ou non conformes');
      } else {
        await requestIncompleteLivreur(decisionModal.rider.id, decisionReason.trim() || 'Merci de compléter votre dossier.');
      }
      setDecisionModal(null);
      setDecisionReason('');
    } catch (error: any) {
      window.alert(error?.message || 'Impossible de traiter la candidature.');
    } finally {
      setDecisionBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteBusy(true);
    try {
      if (deleteConfirm.type === 'store') {
        await deleteStore(deleteConfirm.id);
      } else {
        await deleteUser(deleteConfirm.id);
      }
      setDeleteConfirm(null);
    } catch (error: any) {
      window.alert(error?.message || 'Impossible de supprimer.');
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
              { tab: 'verifications' as AdminTab, label: 'Candidatures livreurs', count: pendingLivreurs.length, icon: ShieldCheck },
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

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError('');
    setAdminFormSuccess('');

    const { prenom, nom, username, email, phone, password, confirmPassword } = adminForm;
    if (!prenom.trim() || !nom.trim() || !username.trim() || !email.trim() || !phone.trim() || !password) {
      setAdminFormError('Tous les champs sont obligatoires.');
      return;
    }
    if (password.length < 8) {
      setAdminFormError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setAdminFormError('Les mots de passe ne correspondent pas.');
      return;
    }

    setAdminFormBusy(true);
    try {
      await createAdminUser({
        prenom: prenom.trim(),
        nom: nom.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });
      setAdminFormSuccess(`Compte administrateur créé pour ${email.trim().toLowerCase()}.`);
      setAdminForm({
        prenom: '',
        nom: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      setAdminFormError(error instanceof Error ? error.message : 'Impossible de créer le compte.');
    } finally {
      setAdminFormBusy(false);
    }
  };

  const renderVerifications = () => {
    const rejectedLivreurs = allLivreurs.filter(u => u.verificationStatus === 'rejected');
    const query = riderQuery.trim().toLowerCase();
    const filteredRiders = allLivreurs.filter(rider => {
      const status = rider.verificationStatus || 'pending';
      if (verificationFilter === 'all') return true;
      if (verificationFilter === 'todo') return status === 'pending' || status === 'incomplete';
      return status === verificationFilter;
    }).filter(rider => {
      if (!query) return true;
      return [rider.name, rider.phone, rider.email, rider.vehiclePlate]
        .some(value => (value || '').toLowerCase().includes(query));
    }).sort((a, b) => {
      const rank = (status?: string) => (
        status === 'pending' ? 0 : status === 'incomplete' ? 1 : status === 'rejected' ? 2 : 3
      );
      return rank(a.verificationStatus) - rank(b.verificationStatus);
    });
    const selectedRider = filteredRiders.find(r => r.id === selectedRiderId) || filteredRiders[0] || null;

    const formatDate = (value?: string) => {
      if (!value) return 'Non renseignée';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const statusMeta = (status?: string) => {
      if (status === 'approved') return { label: 'Certifié', className: 'bg-emerald-100 text-emerald-800' };
      if (status === 'rejected') return { label: 'Refusé', className: 'bg-rose-100 text-rose-800' };
      if (status === 'incomplete') return { label: 'Incomplet', className: 'bg-amber-100 text-amber-800' };
      return { label: 'En attente', className: 'bg-orange-100 text-orange-800' };
    };

    const docsOf = (rider: User) => ([
      { label: 'Selfie', src: rider.selfiePhoto || rider.avatar },
      { label: 'CIP / pièce', src: rider.cipPhoto },
      { label: 'Photo moto', src: rider.vehiclePhoto },
    ]);

    return renderAdminPage(
      'Candidatures livreurs',
      'Examinez les pièces, téléchargez le dossier PDF, puis approuvez ou renvoyez la candidature.',
      (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={riderQuery}
              onChange={(e) => { setRiderQuery(e.target.value); setSelectedRiderId(null); }}
              placeholder="Rechercher un candidat (nom, téléphone, e-mail, plaque)…"
              className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#e6dac8] bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ff8a1f]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'todo' as const, label: 'À traiter', count: pendingLivreurs.length },
              { id: 'pending' as const, label: 'Nouvelles', count: allLivreurs.filter(u => (u.verificationStatus || 'pending') === 'pending').length },
              { id: 'incomplete' as const, label: 'Incomplets', count: allLivreurs.filter(u => u.verificationStatus === 'incomplete').length },
              { id: 'rejected' as const, label: 'Refusés', count: rejectedLivreurs.length },
              { id: 'approved' as const, label: 'Certifiés', count: approvedLivreurs.length },
              { id: 'all' as const, label: 'Tous', count: allLivreurs.length },
            ].map(filter => (
              <button
                key={filter.id}
                type="button"
                onClick={() => { setVerificationFilter(filter.id); setSelectedRiderId(null); }}
                className={`h-9 px-3.5 rounded-full text-xs font-bold transition ${
                  verificationFilter === filter.id
                    ? 'bg-[#0c1a2e] text-white'
                    : 'bg-white border border-[#e6dac8] text-slate-600 hover:border-[#ff8a1f]'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {filteredRiders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e6dac8] bg-[#faf6ef] p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-800">Aucune candidature dans cette vue</p>
              <p className="text-sm text-slate-500 mt-2">Les nouveaux dossiers livreurs apparaîtront ici automatiquement.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] gap-4">
              <div className="space-y-2 xl:max-h-[calc(100vh-18rem)] xl:overflow-y-auto pr-1">
                {filteredRiders.map(rider => {
                  const meta = statusMeta(rider.verificationStatus);
                  const missing = docsOf(rider).filter(d => !d.src).length + (rider.vehiclePlate ? 0 : 1);
                  const active = (selectedRider?.id || '') === rider.id;
                  return (
                    <button
                      key={rider.id}
                      type="button"
                      onClick={() => setSelectedRiderId(rider.id)}
                      className={`w-full text-left rounded-2xl border p-3.5 transition ${
                        active
                          ? 'border-[#ff8a1f] bg-white shadow-sm'
                          : 'border-[#e6dac8] bg-[#fffdf8] hover:border-[#ffb86a]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {rider.avatar || rider.selfiePhoto ? (
                          <img src={rider.avatar || rider.selfiePhoto} alt="" className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          <span className="w-11 h-11 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center">
                            {(rider.name || '?').slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900 truncate">{rider.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{rider.phone || rider.email}</p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${meta.className}`}>
                          {meta.label}
                        </span>
                      </div>
                      {missing > 0 && rider.verificationStatus !== 'approved' && (
                        <p className="mt-2 text-[11px] font-semibold text-amber-700">{missing} élément(s) manquant(s)</p>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedRider && (
                <article className="rounded-2xl border border-[#e6dac8] bg-white p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      {selectedRider.avatar || selectedRider.selfiePhoto ? (
                        <img src={selectedRider.avatar || selectedRider.selfiePhoto} alt={selectedRider.name} className="w-16 h-16 rounded-2xl object-cover border border-[#e6dac8]" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 font-black text-xl">
                          {(selectedRider.name || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${statusMeta(selectedRider.verificationStatus).className}`}>
                          {statusMeta(selectedRider.verificationStatus).label}
                        </span>
                        <h3 className="text-xl font-black text-slate-900 mt-2">{selectedRider.name}</h3>
                        <p className="text-sm text-slate-600 mt-1 break-words">{selectedRider.phone} · {selectedRider.email}</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">
                          {selectedRider.vehicle || 'Véhicule non renseigné'}
                          {selectedRider.vehiclePlate ? ` · ${selectedRider.vehiclePlate}` : ' · plaque manquante'}
                          {selectedRider.city ? ` · ${selectedRider.city}` : ''}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Inscription : {formatDate(selectedRider.createdAt)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={pdfBusyId === selectedRider.id}
                      onClick={() => void downloadLivreurPdf(selectedRider)}
                      className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full bg-[#0c1a2e] hover:bg-[#132d4d] text-white text-sm font-bold disabled:opacity-60"
                    >
                      {pdfBusyId === selectedRider.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      Télécharger le PDF
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Téléphone', value: selectedRider.phone || '—' },
                      { label: 'E-mail', value: selectedRider.email || '—' },
                      { label: 'Plaque', value: selectedRider.vehiclePlate || 'Manquante' },
                      { label: 'Ville', value: selectedRider.city || 'Lokossa' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl border border-[#e6dac8] bg-[#fffdf8] px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5 truncate" title={item.value}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {docsOf(selectedRider).map(item => (
                      <div key={item.label} className="rounded-xl border border-[#e6dac8] bg-[#fffdf8] p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase text-slate-500">{item.label}</span>
                          <span className={`text-[10px] font-bold uppercase ${item.src ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {item.src ? 'Fourni' : 'Manquant'}
                          </span>
                        </div>
                        {item.src ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ src: item.src as string, label: item.label })}
                            className="relative block w-full group"
                          >
                            <img src={item.src} alt={item.label} className="w-full h-40 object-cover rounded-lg" />
                            <span className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/25 transition flex items-center justify-center">
                              <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                            </span>
                          </button>
                        ) : (
                          <div className="h-40 rounded-lg bg-slate-100 flex items-center justify-center text-sm text-slate-400">
                            Non fourni
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedRider.rejectionReason && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <span className="font-bold">Observation : </span>{selectedRider.rejectionReason}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => { setDecisionReason(''); setDecisionModal({ type: 'approve', rider: selectedRider }); }}
                      className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
                    >
                      <ShieldCheck className="w-4 h-4" /> Approuver
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDecisionReason('Pièces illisibles ou non conformes'); setDecisionModal({ type: 'reject', rider: selectedRider }); }}
                      className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
                    >
                      <XCircle className="w-4 h-4" /> Refuser
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDecisionReason('Merci de compléter votre dossier.'); setDecisionModal({ type: 'incomplete', rider: selectedRider }); }}
                      className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold"
                    >
                      <AlertTriangle className="w-4 h-4" /> Demander un complément
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'account', id: selectedRider.id, name: selectedRider.name, email: selectedRider.email })}
                      className="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </article>
              )}
            </div>
          )}
        </div>
      ),
      [
        { label: 'À traiter', value: pendingLivreurs.length },
        { label: 'Certifiés', value: approvedLivreurs.length },
        { label: 'Total', value: ridersCount },
      ],
    );
  };

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
                  <img src={store.logo} alt={store.name} className="w-14 h-14 rounded-xl object-contain bg-white p-1 border border-[#e6dac8]" />
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
                  type="button"
                  disabled={pdfBusyId === store.id}
                  onClick={() => void downloadStorePdf(store)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0c1a2e] text-white text-sm font-bold disabled:opacity-60"
                >
                  {pdfBusyId === store.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  PDF
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirm({
                      type: 'store',
                      id: store.id,
                      name: store.name,
                      email: store.phone,
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
                            onClick={() => setDeleteConfirm({ type: 'account', id: user.id, name: user.name, email: user.email })}
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

      case 'admins':
        return renderAdminPage(
          'Administrateurs',
          'Créez et gérez les comptes ayant accès à la console d\'administration Livriko.',
          (
            <div className="space-y-6">
              <form onSubmit={handleCreateAdmin} className="rounded-2xl border border-[#e6dac8] bg-white p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-[#ff8a1f]/10 text-[#ff8a1f] flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Nouvel administrateur</h3>
                    <p className="text-sm text-slate-500">Le compte sera actif immédiatement après création.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Prénom
                    <input
                      type="text"
                      value={adminForm.prenom}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, prenom: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e6dac8] bg-[#fffdf8] text-sm focus:outline-none focus:border-[#ff8a1f]"
                      required
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-700">
                    Nom
                    <input
                      type="text"
                      value={adminForm.nom}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, nom: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e6dac8] bg-[#fffdf8] text-sm focus:outline-none focus:border-[#ff8a1f]"
                      required
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-700">
                    Nom d&apos;utilisateur
                    <input
                      type="text"
                      value={adminForm.username}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, username: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e6dac8] bg-[#fffdf8] text-sm focus:outline-none focus:border-[#ff8a1f]"
                      required
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-700">
                    Téléphone
                    <input
                      type="tel"
                      value={adminForm.phone}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+229 ..."
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e6dac8] bg-[#fffdf8] text-sm focus:outline-none focus:border-[#ff8a1f]"
                      required
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
                    E-mail
                    <input
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e6dac8] bg-[#fffdf8] text-sm focus:outline-none focus:border-[#ff8a1f]"
                      required
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-700">
                    Mot de passe
                    <input
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                      minLength={8}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e6dac8] bg-[#fffdf8] text-sm focus:outline-none focus:border-[#ff8a1f]"
                      required
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-700">
                    Confirmer le mot de passe
                    <input
                      type="password"
                      value={adminForm.confirmPassword}
                      onChange={(e) => setAdminForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      minLength={8}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#e6dac8] bg-[#fffdf8] text-sm focus:outline-none focus:border-[#ff8a1f]"
                      required
                    />
                  </label>
                </div>

                {adminFormError && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                    {adminFormError}
                  </p>
                )}
                {adminFormSuccess && (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    {adminFormSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={adminFormBusy}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c1a2e] hover:bg-[#132d4d] text-white text-sm font-bold transition disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {adminFormBusy ? 'Création...' : 'Créer l\'administrateur'}
                </button>
              </form>

              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-900">Comptes administrateurs ({adminUsers.length})</h3>
                <div className={adminTableWrapClass}>
                  <table className={`${adminTableClass} min-w-[640px]`}>
                    <thead className={adminTheadClass}>
                      <tr>
                        <th className={adminThClass}>Nom</th>
                        <th className={adminThClass}>E-mail</th>
                        <th className={adminThClass}>Téléphone</th>
                        <th className={adminThClass}>Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#efe6d8]">
                      {adminUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                            Aucun administrateur listé pour le moment.
                          </td>
                        </tr>
                      ) : (
                        adminUsers.map(user => (
                          <tr key={user.id} className="hover:bg-[#fffdf8]">
                            <td className={`${adminTdClass} font-bold text-slate-900`}>
                              {user.name}
                              {user.id === currentUser?.id && (
                                <span className="ml-2 text-[10px] font-bold uppercase text-[#ff8a1f]">(vous)</span>
                              )}
                            </td>
                            <td className={`${adminTdClass} text-slate-600`}>{user.email}</td>
                            <td className={`${adminTdClass} text-slate-600`}>{user.phone || '—'}</td>
                            <td className={adminTdClass}>
                              <span className="inline-flex px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase">
                                {user.statut || 'actif'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ),
          [
            { label: 'Admins', value: adminUsers.length },
            { label: 'Actifs', value: adminUsers.filter(u => (u.statut || 'actif') === 'actif').length },
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
          <div className="h-12 w-12 rounded-2xl overflow-hidden bg-white p-1 ring-2 ring-[#ff8a1f]/40 shadow-lg shadow-[#ff8a1f]/10 shrink-0">
            <img src={livrikoLogo} alt="Livriko" className="h-full w-full object-contain" />
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
              <UserIcon className="w-4 h-4" />
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

      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {decisionModal.type === 'approve' && 'Approuver cette candidature'}
              {decisionModal.type === 'reject' && 'Refuser cette candidature'}
              {decisionModal.type === 'incomplete' && 'Demander un complément'}
            </h3>
            <p className="text-sm text-slate-600">
              {decisionModal.rider.name} · {decisionModal.rider.email}
            </p>
            {decisionModal.type === 'approve' ? (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                Le livreur pourra ensuite accepter des courses Livriko.
              </p>
            ) : (
              <label className="block text-sm font-bold text-slate-700">
                Motif envoyé au candidat
                <textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-[#e6dac8] bg-[#fffdf8] px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#ff8a1f]"
                />
              </label>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={decisionBusy}
                onClick={() => setDecisionModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={decisionBusy}
                onClick={() => void confirmDecision()}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-60 ${
                  decisionModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : decisionModal.type === 'reject' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {decisionBusy ? 'Traitement…' : decisionModal.type === 'approve' ? 'Confirmer l’approbation' : 'Envoyer la décision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setPreviewImage(null)}>
          <div className="w-full max-w-3xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between text-white">
              <p className="text-sm font-bold">{previewImage.label}</p>
              <button type="button" onClick={() => setPreviewImage(null)} className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={previewImage.src} alt={previewImage.label} className="w-full max-h-[80vh] object-contain rounded-2xl bg-black" />
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Confirmer la suppression</h3>
            <p className="text-sm text-slate-600">
              {deleteConfirm.type === 'store'
                ? 'Vous êtes sur le point de désactiver la boutique :'
                : 'Vous êtes sur le point de désactiver le compte :'}
            </p>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm">
              <p className="font-bold text-slate-900">{deleteConfirm.name}</p>
              {deleteConfirm.email && <p className="text-slate-600">{deleteConfirm.email}</p>}
              <p className="text-[11px] text-rose-700 mt-2">
                {deleteConfirm.type === 'store'
                  ? 'La boutique sera retirée du catalogue. Les historiques de commandes sont conservés.'
                  : 'Suppression douce : le compte sera désactivé. Les historiques de commandes sont conservés.'}
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
                onClick={() => void confirmDelete()}
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
