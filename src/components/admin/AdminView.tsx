import React, { useState } from 'react';
import { 
  ShieldCheck, Users, Store, Truck, DollarSign, TrendingUp, ShoppingBag, CheckCircle2, Clock, AlertTriangle, XCircle, ArrowLeft, Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminView: React.FC = () => {
  const { 
    stores, 
    products, 
    orders, 
    allUsers, 
    approveLivreur, 
    rejectLivreur, 
    toggleStoreCertification,
    setActiveRole,
    deleteUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'verifications' | 'stores' | 'orders'>('verifications');

  const totalGMV = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommission = Math.round(totalGMV * 0.10); // 10% platform commission

  const pendingLivreurs = allUsers.filter(u => u.role === 'livreur' && u.verificationStatus === 'pending');
  const approvedLivreurs = allUsers.filter(u => u.role === 'livreur' && u.verificationStatus === 'approved');
  const pendingStores = stores.filter(s => !s.isCertified);
  const vendorsCount = stores.length;
  const ridersCount = allUsers.filter(u => u.role === 'livreur').length;

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

  return (
    <div className="space-y-6 pb-12">
      
      {/* Back Button to Client Market */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <button
          onClick={() => setActiveRole('client')}
          className="inline-flex items-center gap-2 px-4 py-3 sm:py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-xs shadow-md transition cursor-pointer ring-1 ring-slate-700/40"
          title="Retourner au Marché"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          <span>← Retour à l'Accueil (Marché Client)</span>
        </button>
        <span className="text-xs font-semibold text-slate-500">
          Espace Administrateur Livriko
        </span>
      </div>

      {/* Admin Top Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] uppercase font-bold">
              SUPERVISION MARCHE & LIVRAISON LIVRIKO
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Tableau de Bord Super Administrateur</h1>
          <p className="text-xs text-slate-400">Certification des livreurs (CIP & Moto sous 12h), validation des boutiques et contrôle des flux.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Commission Plateforme (10%)</span>
            <span className="text-lg font-black text-emerald-400">{totalCommission.toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Volume d'Affaires (GMV)</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalGMV.toLocaleString()} FCFA</h3>
          <p className="text-[11px] text-emerald-600 font-semibold">↑ Flux réels Lokossa</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Dossiers Livreurs en Attente</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-amber-600">{pendingLivreurs.length} dossier(s)</h3>
          <p className="text-[11px] text-slate-500">Examen sous 12h max</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Boutiques Partenaires</span>
            <Store className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{vendorsCount}</h3>
          <p className="text-[11px] text-emerald-600 font-semibold">{stores.filter(s => s.isCertified).length} certifiées</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Livreurs Certifiés</span>
            <Truck className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{approvedLivreurs.length} / {ridersCount}</h3>
          <p className="text-[11px] text-slate-500">Flotte moto agréée</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-2 rounded-2xl bg-slate-100 p-1 max-w-xl">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'verifications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Sécurité Livreurs ({pendingLivreurs.length})
        </button>

        <button
          onClick={() => setActiveTab('stores')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'stores' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4 text-blue-600" />
          Boutiques ({stores.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-orange-500" />
          Commandes ({orders.length})
        </button>
      </div>

      {/* TAB 1: LIVREURS VERIFICATION HUB */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Vérification & Certification des Comptes Livreurs</h2>
              <p className="text-xs text-slate-500">Examinez les pièces d'identité (CIP) et les photos de motos avant d'accorder l'accès aux livraisons.</p>
            </div>
          </div>

          {pendingLivreurs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold">Tous les dossiers livreurs soumis ont été vérifiés !</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Lorsqu'un nouveau livreur crée un compte avec ses 3 pièces, il apparaîtra ici immédiatement.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingLivreurs.map(rider => (
                <div key={rider.id} className="p-6 bg-slate-50 rounded-2xl border-2 border-amber-300 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={rider.avatar} alt={rider.name} className="w-14 h-14 rounded-full object-cover border-2 border-amber-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                            EN ATTENTE DE VERIFICATION (12H)
                          </span>
                          <span className="text-xs font-mono text-slate-400">{rider.verificationSubmittedAt}</span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-0.5">{rider.name}</h3>
                        <p className="text-xs text-slate-500">Tél : {rider.phone} • Email : {rider.email} • Ville : {rider.city}</p>
                        <p className="text-xs font-bold text-slate-700">Moto : {rider.vehicle || 'Non renseignée'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveLivreur(rider.id)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Approuver & Certifier
                      </button>

                      <button
                        onClick={() => rejectLivreur(rider.id, 'Pièces illisibles')}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        Refuser le dossier
                      </button>

                      <button
                        onClick={() => {
                          const ok = window.confirm(`Supprimer le compte de ${rider.name} ? Cette action est irréversible.`);
                          if (!ok) return;
                          deleteUser(rider.id);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        Supprimer le compte
                      </button>
                    </div>
                  </div>

                  {/* 3 Uploaded Verification Items Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Photo Selfie</span>
                      <img src={rider.selfiePhoto || rider.avatar} alt="Selfie" className="w-full h-24 object-cover rounded-lg border border-slate-100" />
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Carte CIP / ID</span>
                      <img src={rider.cipPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'} alt="CIP Document" className="w-full h-24 object-cover rounded-lg border border-slate-100" />
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Moto & Immatriculation</span>
                      <img src={rider.vehiclePhoto || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80'} alt="Moto" className="w-full h-24 object-cover rounded-lg border border-slate-100" />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      <p><span className="font-semibold text-slate-700">Status dossier :</span> {rider.verificationStatus?.toUpperCase() || 'EN ATTENTE'}</p>
                      {rider.rejectionReason && <p><span className="font-semibold text-slate-700">Motif :</span> {rider.rejectionReason}</p>}
                    </div>
                    <button
                      onClick={() => downloadDossier(rider, `dossier-livreur-${rider.id}.json`)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger le dossier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STORE CERTIFICATION */}
      {activeTab === 'stores' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Boutiques & Commerces Inscrits</h2>
              <p className="text-xs text-slate-500">Attribuez le macaron "Certifié Livriko" pour renforcer la confiance des acheteurs.</p>
            </div>
            <span className="text-xs text-slate-500">{stores.length} commerces</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map(store => (
              <div key={store.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <img src={store.logo} alt={store.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      {store.name}
                      {store.isCertified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                    </h4>
                    <p className="text-[11px] text-slate-500">{store.category.toUpperCase()} • {store.city}</p>
                    <p className="text-[10px] text-slate-400">{store.address}</p>
                    <p className="text-[10px] text-slate-500">Tél: {store.phone}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <button
                    onClick={() => toggleStoreCertification(store.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      store.isCertified
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {store.isCertified ? 'Certifié (Retirer)' : 'Certifier la Boutique'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadDossier(store, `dossier-boutique-${store.id}.json`)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger le dossier
                    </button>

                    <button
                      onClick={() => {
                        const ownerId = store.ownerId;
                        if (!ownerId) return;
                        const ok = window.confirm(`Supprimer le compte du propriétaire de ${store.name} ? Cette action supprimera également la boutique.`);
                        if (!ok) return;
                        deleteUser(ownerId);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
                    >
                      Supprimer le propriétaire
                    </button>
                  </div>
                  <button
                    onClick={() => downloadDossier(store, `dossier-boutique-${store.id}.json`)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le dossier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL ORDERS TABLE */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Suivi Global des Commandes & Livraisons</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Code</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Boutique</th>
                  <th className="pb-3">Livreur</th>
                  <th className="pb-3">Total FCFA</th>
                  <th className="pb-3">Paiement</th>
                  <th className="pb-3">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/80">
                    <td className="py-3 font-mono font-bold text-blue-600">{o.code}</td>
                    <td className="py-3 text-slate-900">{o.clientName}</td>
                    <td className="py-3 text-slate-700">{o.storeName}</td>
                    <td className="py-3 text-slate-700">{o.riderName || 'Non assigné'}</td>
                    <td className="py-3 font-bold text-slate-900">{o.totalAmount.toLocaleString()} FCFA</td>
                    <td className="py-3 uppercase text-[10px] font-bold text-slate-600">{o.paymentMethod}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
