import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bike, Check, CheckCircle2, ChevronRight, Clock3,
  FileText, MapPin, Package, Phone, Search, ShoppingBag, Star, Truck,
  UserRound, X,
} from 'lucide-react';
import axios from 'axios';
import { useApp } from '../../context/AppContext';
import { calculateDeliveryFee, calculateHaversineDistance } from '../../utils/deliveryCalculator';

type ServiceType = 'parcel' | 'document' | 'errand' | 'pickup' | 'buy' | 'other';
type FlowStep = 'select' | 'form' | 'summary' | 'tracking' | 'history';

const serviceOptions: Array<{ id: ServiceType; title: string; description: string; icon: React.ElementType }> = [
  { id: 'parcel', title: 'Envoyer un colis', description: 'Envoyer un objet d’un point à un autre.', icon: Package },
  { id: 'document', title: 'Envoyer un document', description: 'Dossiers, enveloppes et documents urgents.', icon: FileText },
  { id: 'errand', title: 'Faire une course', description: 'Confier une course précise à un livreur.', icon: ShoppingBag },
  { id: 'pickup', title: 'Récupérer un colis', description: 'Récupérer un objet et le rapporter ou le livrer.', icon: ArrowLeft },
  { id: 'buy', title: 'Acheter et livrer', description: 'Faire acheter un article puis le faire livrer.', icon: Truck },
  { id: 'other', title: 'Autre demande', description: 'Décrire une mission personnalisée.', icon: ChevronRight },
];

const statusSteps = [
  'Demande envoyée',
  'Recherche d’un livreur',
  'Livreur trouvé',
  'En route vers le départ',
  'Objet récupéré',
  'En route vers la destination',
  'Livraison effectuée',
  'Mission terminée',
];

const serviceLabel = (type: ServiceType) => serviceOptions.find(option => option.id === type)?.title || 'Service Express';

export const ServiceExpressView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { currentUser } = useApp();
  const [step, setStep] = useState<FlowStep>('select');
  const [selectedType, setSelectedType] = useState<ServiceType>('parcel');
  const [history, setHistory] = useState<Array<{ id: string; type: ServiceType; date: string; from: string; to: string; price: number; status: string }>>([]);
  const [statusIndex, setStatusIndex] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [missionId, setMissionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({
    fromName: '', fromAddress: '', fromPhone: '', fromNotes: '',
    toName: '', toAddress: '', toPhone: '', toNotes: '',
    description: '', packageType: '', size: '', weight: '', documentType: '', documentCount: '1',
    budget: '', purchaseLocation: '', quantity: '1', instructions: '', distanceKm: '',
  });

  const selectedService = serviceOptions.find(option => option.id === selectedType) || serviceOptions[0];
  const updateField = (field: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [field]: value }));
  const distanceKm = fromCoords && toCoords ? calculateHaversineDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng) : null;
  const quote = distanceKm !== null ? calculateDeliveryFee(distanceKm) : null;
  const canContinue = Boolean(form.fromAddress.trim() && form.toAddress.trim() && form.description.trim() && quote);

  const detailLabel = useMemo(() => {
    if (selectedType === 'parcel') return 'Description du colis';
    if (selectedType === 'document') return 'Type de document';
    if (selectedType === 'errand') return 'Description exacte de la course';
    if (selectedType === 'buy') return 'Produit à acheter';
    return 'Description complète de la demande';
  }, [selectedType]);

  const resetFlow = () => {
    setStep('select');
    setStatusIndex(0);
    setRating(0);
    setComment('');
  };

  const confirmRequest = () => {
    if (!quote) return;
    const payload = new URLSearchParams();
    payload.append('type', selectedType);
    payload.append('description', form.description);
    payload.append('fromName', form.fromName);
    payload.append('fromAddress', form.fromAddress);
    payload.append('fromPhone', form.fromPhone);
    payload.append('fromNotes', form.fromNotes);
    payload.append('toName', form.toName);
    payload.append('toAddress', form.toAddress);
    payload.append('toPhone', form.toPhone);
    payload.append('toNotes', form.toNotes);
    payload.append('distanceKm', String(quote.distanceKm));
    payload.append('fee', String(quote.deliveryFee));
    payload.append('details', JSON.stringify({ packageType: form.packageType, size: form.size, weight: form.weight, documentType: form.documentType, documentCount: form.documentCount, budget: form.budget, purchaseLocation: form.purchaseLocation, quantity: form.quantity, instructions: form.instructions }));

    void axios.post('/backend/index.php/api/service-express', payload, { withCredentials: true })
      .then(response => {
        const mission = response.data?.mission;
        setMissionId(mission?.id ? String(mission.id) : null);
        setStatusIndex(1);
        setStep('tracking');
        setHistory(previous => [{ id: String(mission.id), type: selectedType, date: new Date(mission.createdAt).toLocaleDateString('fr-FR'), from: form.fromAddress, to: form.toAddress, price: quote.deliveryFee, status: 'Recherche d’un livreur' }, ...previous]);
      })
      .catch(apiError => setError(apiError.response?.data?.message || 'Impossible d’enregistrer la mission.'));
  };

  React.useEffect(() => {
    axios.get('/backend/index.php/api/service-express', { withCredentials: true })
      .then(response => {
        const missions = response.data?.missions || [];
        setHistory(missions.map((mission: any) => ({ id: String(mission.id), type: mission.type, date: new Date(mission.createdAt).toLocaleDateString('fr-FR'), from: mission.fromAddress, to: mission.toAddress, price: mission.fee, status: mission.status })));
      })
      .catch(() => {
        setHistory([]);
        setError('Historique Service Express indisponible.');
      });
  }, []);

  const advanceMission = () => {
    if (!missionId) {
      setError('Cette mission n’est pas enregistrée sur le serveur.');
      return;
    }
    const nextIndex = Math.min(statusSteps.length - 1, statusIndex + 1);
    const statusMap = ['searching', 'searching', 'assigned', 'to_pickup', 'picked_up', 'delivering', 'delivered', 'completed'];
    void axios.post('/backend/index.php/api/service-express/status', new URLSearchParams([['missionId', String(missionId)], ['status', statusMap[nextIndex]]]), { withCredentials: true })
      .then(() => setStatusIndex(nextIndex))
      .catch(apiError => setError(apiError.response?.data?.message || 'Impossible de mettre à jour la mission.'));
  };

  const setCurrentLocation = (field: 'fromAddress' | 'toAddress') => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n’est pas disponible sur ce navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        updateField(field, `Position actuelle (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
        if (field === 'fromAddress') setFromCoords(coords);
        else setToCoords(coords);
      },
      () => setError('Autorisez la géolocalisation pour calculer la distance réelle.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-3 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
            <ArrowLeft className="h-4 w-4 text-orange-500" /> Retour au marché
          </button>
          <button onClick={() => setStep('history')} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">
            <Clock3 className="h-4 w-4 text-orange-400" /> Historique des missions
          </button>
        </div>

        <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-9">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-300">
              <Bike className="h-3.5 w-3.5" /> Mission à la demande
            </span>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">Service Express</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Besoin d’envoyer, récupérer ou faire livrer quelque chose ? Nous nous en chargeons rapidement.</p>
          </div>
        </section>

        {step === 'select' && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Quel service vous faut-il ?</h2>
              <p className="mt-1 text-sm text-slate-500">Choisissez une mission, puis indiquez le départ et la destination.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serviceOptions.map(option => {
                const Icon = option.icon;
                return (
                  <button key={option.id} onClick={() => { setSelectedType(option.id); setStep('form'); }} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><Icon className="h-5 w-5" /></span>
                    <h3 className="mt-4 text-sm font-black text-slate-900">{option.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{option.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-orange-600">Commencer <ArrowRight className="h-3.5 w-3.5" /></span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 'form' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div><p className="text-[10px] font-black uppercase tracking-wider text-orange-500">Étape 1 sur 2</p><h2 className="mt-1 text-xl font-black text-slate-900">{serviceLabel(selectedType)}</h2></div>
              <button onClick={resetFlow} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <AddressFields title="Point de récupération" address={form.fromAddress} name={form.fromName} phone={form.fromPhone} notes={form.fromNotes} onChange={updateField} onLocate={() => setCurrentLocation('fromAddress')} prefix="from" />
              <AddressFields title="Point de livraison" address={form.toAddress} name={form.toName} phone={form.toPhone} notes={form.toNotes} onChange={updateField} onLocate={() => setCurrentLocation('toAddress')} prefix="to" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label={detailLabel} value={form.description} onChange={value => updateField('description', value)} multiline placeholder="Décrivez précisément la mission" />
              <p className="rounded-2xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">Utilisez « Ma position » pour le départ et la destination. Le tarif est calculé uniquement à partir de ces coordonnées GPS réelles.</p>
            </div>
            {selectedType === 'parcel' && <div className="mt-4 grid gap-4 sm:grid-cols-3"><Field label="Type de colis" value={form.packageType} onChange={value => updateField('packageType', value)} placeholder="Petit colis" /><Field label="Taille" value={form.size} onChange={value => updateField('size', value)} placeholder="Petite / moyenne" /><Field label="Poids approximatif" value={form.weight} onChange={value => updateField('weight', value)} placeholder="Ex. 2 kg" /></div>}
            {selectedType === 'document' && <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Type de document" value={form.documentType} onChange={value => updateField('documentType', value)} placeholder="Dossier, enveloppe..." /><Field label="Nombre de documents" value={form.documentCount} onChange={value => updateField('documentCount', value)} type="number" /></div>}
            {(selectedType === 'errand' || selectedType === 'buy') && <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label={selectedType === 'buy' ? 'Lieu d’achat' : 'Adresse de la course'} value={selectedType === 'buy' ? form.purchaseLocation : form.fromAddress} onChange={value => updateField(selectedType === 'buy' ? 'purchaseLocation' : 'fromAddress', value)} placeholder="Adresse précise" /><Field label="Budget prévu (FCFA)" value={form.budget} onChange={value => updateField('budget', value)} type="number" /></div>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-500" />Départ → Destination</span><span>{quote ? `${quote.distanceKm} km • ${quote.deliveryFee.toLocaleString('fr-FR')} FCFA` : 'Tarif en attente des deux adresses et de la distance'}</span></div>
            <div className="mt-6 flex justify-end"><button disabled={!canContinue} onClick={() => setStep('summary')} className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Voir le récapitulatif <ArrowRight className="h-4 w-4" /></button></div>
          </section>
        )}

        {step === 'summary' && quote && (
          <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-wider text-orange-500">Étape 2 sur 2</p><h2 className="mt-1 text-2xl font-black text-slate-900">Résumé de votre demande</h2>
            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5 text-sm"><SummaryRow label="Service" value={serviceLabel(selectedType)} /><SummaryRow label="Départ" value={form.fromAddress} /><SummaryRow label="Destination" value={form.toAddress} /><SummaryRow label="Description" value={form.description} /><SummaryRow label="Distance" value={`${quote.distanceKm} km`} /><SummaryRow label="Mode de paiement" value="À confirmer avec le livreur" /><div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-black"><span>Total</span><span className="text-orange-600">{quote.deliveryFee.toLocaleString('fr-FR')} FCFA</span></div></div>
            <p className="mt-4 text-xs text-slate-500">Le tarif affiché est calculé selon la grille de distance Livriko. Aucun montant n’est affiché sans distance renseignée.</p>
            <div className="mt-6 flex flex-wrap justify-between gap-3"><button onClick={() => setStep('form')} className="rounded-2xl bg-slate-100 px-4 py-3 text-xs font-bold text-slate-700">Modifier</button><button onClick={confirmRequest} className="rounded-2xl bg-orange-500 px-5 py-3 text-xs font-black text-white">Confirmer la demande</button></div>
          </section>
        )}

        {step === 'tracking' && (
          <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><Search className="h-5 w-5 animate-pulse" /></span><div><p className="text-[10px] font-black uppercase text-orange-500">Mission en cours</p><h2 className="text-xl font-black text-slate-900">{serviceLabel(selectedType)}</h2></div></div><div className="mt-7 space-y-3">{statusSteps.map((status, index) => <div key={status} className={`flex items-center gap-3 rounded-xl p-3 text-sm ${index <= statusIndex ? 'bg-orange-50 font-bold text-slate-900' : 'text-slate-400'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${index <= statusIndex ? 'bg-orange-500 text-white' : 'bg-slate-100'}`}>{index < statusIndex ? <Check className="h-4 w-4" /> : index + 1}</span>{status}</div>)}</div><div className="mt-6 flex flex-wrap gap-2"><button onClick={advanceMission} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Actualiser le statut</button><button className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700"><Phone className="h-3.5 w-3.5" /> Appeler</button><button className="rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700">Message</button></div>{error && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</p>}</div>
            <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm"><p className="text-xs font-bold text-slate-400">Livreur</p><div className="mt-3 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500"><UserRound className="h-6 w-6" /></span><div><h3 className="font-black">Recherche en cours</h3><p className="text-xs text-slate-400">Un livreur certifié sera affecté automatiquement.</p></div></div>{statusIndex >= statusSteps.length - 1 && <div className="mt-6 border-t border-slate-700 pt-5"><p className="font-black text-emerald-400">Mission terminée</p><div className="mt-4 flex gap-1">{[1, 2, 3, 4, 5].map(value => <button key={value} onClick={() => setRating(value)}><Star className={`h-6 w-6 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} /></button>)}</div><textarea value={comment} onChange={event => setComment(event.target.value)} placeholder="Comment s’est passée votre livraison ?" className="mt-3 w-full rounded-xl bg-slate-800 p-3 text-xs text-white placeholder:text-slate-500" /></div>}</div>
          </section>
        )}

        {step === 'history' && <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-900">Historique Service Express</h2><p className="text-xs text-slate-500">Retrouvez vos anciennes missions.</p></div><button onClick={() => setStep('select')} className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white">Nouvelle mission</button></div>{history.length === 0 ? <p className="py-12 text-center text-sm text-slate-500">Aucune mission enregistrée pour le moment.</p> : <div className="mt-5 grid gap-3">{history.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"><div><p className="text-sm font-black text-slate-900">{serviceLabel(item.type)}</p><p className="text-xs text-slate-500">{item.from} → {item.to}</p><p className="text-[11px] text-slate-400">{item.date}</p></div><div className="text-right"><p className="font-black text-orange-600">{item.price.toLocaleString('fr-FR')} FCFA</p><p className="text-xs font-bold text-amber-600">{item.status}</p></div></div>)}</div>}</section>}
      </div>
    </div>
  );
};

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; multiline?: boolean; hint?: string }) {
  const className = 'w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 outline-none transition focus:border-orange-500';
  return <label className="block text-xs font-bold text-slate-700"><span>{label}</span>{multiline ? <textarea value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} rows={3} className={`${className} mt-1 resize-none`} /> : <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className={`${className} mt-1`} />}{hint && <small className="mt-1 block text-[10px] font-normal text-slate-400">{hint}</small>}</label>;
}

function AddressFields({ title, address, name, phone, notes, prefix, onChange, onLocate }: { title: string; address: string; name: string; phone: string; notes: string; prefix: 'from' | 'to'; onChange: (field: keyof ReturnType<typeof emptyForm>, value: string) => void; onLocate: () => void }) {
  return <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-black text-slate-900">{title}</h3><button type="button" onClick={onLocate} className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600"><MapPin className="h-3.5 w-3.5" /> Ma position</button></div><div className="mt-3 grid gap-3"><Field label="Nom du lieu / destinataire" value={name} onChange={value => onChange(`${prefix}Name` as keyof ReturnType<typeof emptyForm>, value)} placeholder="Nom" /><Field label="Adresse précise" value={address} onChange={value => onChange(`${prefix}Address` as keyof ReturnType<typeof emptyForm>, value)} placeholder="Adresse" /><Field label="Téléphone" value={phone} onChange={value => onChange(`${prefix}Phone` as keyof ReturnType<typeof emptyForm>, value)} placeholder="+229 ..." /><Field label="Informations complémentaires" value={notes} onChange={value => onChange(`${prefix}Notes` as keyof ReturnType<typeof emptyForm>, value)} placeholder="Repère, étage..." multiline /></div></div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex flex-wrap justify-between gap-2"><span className="text-slate-500">{label}</span><strong className="max-w-[70%] text-right text-slate-900">{value}</strong></div>; }
function emptyForm() { return { fromName: '', fromAddress: '', fromPhone: '', fromNotes: '', toName: '', toAddress: '', toPhone: '', toNotes: '', description: '', packageType: '', size: '', weight: '', documentType: '', documentCount: '1', budget: '', purchaseLocation: '', quantity: '1', instructions: '', distanceKm: '' }; }