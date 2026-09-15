import React, { useEffect, useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import { captureActorPosition } from '../../utils/geolocation';

export interface ManualLocationValues {
  address: string;
  lat?: number;
  lng?: number;
}

interface ManualLocationFormProps {
  title?: string;
  description?: string;
  initialAddress?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onSave: (values: ManualLocationValues) => Promise<void>;
  addressPlaceholder?: string;
  className?: string;
}

export const ManualLocationForm: React.FC<ManualLocationFormProps> = ({
  title = 'Localisation',
  description = 'Saisissez votre adresse manuellement ou utilisez le GPS pour affiner la position.',
  initialAddress = '',
  initialLat = null,
  initialLng = null,
  onSave,
  addressPlaceholder = 'ex : Quartier Agamé, près du Marché Central, Lokossa',
  className = '',
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [lat, setLat] = useState(initialLat != null ? String(initialLat) : '');
  const [lng, setLng] = useState(initialLng != null ? String(initialLng) : '');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAddress(initialAddress);
    setLat(initialLat != null ? String(initialLat) : '');
    setLng(initialLng != null ? String(initialLng) : '');
  }, [initialAddress, initialLat, initialLng]);

  const inputClass = 'w-full px-4 py-3 bg-white border border-[#e6dac8] rounded-xl text-sm font-medium text-slate-900 focus:border-[#ff8a1f] focus:outline-none focus:ring-2 focus:ring-[#ff8a1f]/20 transition';
  const labelClass = 'text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5';

  const parseCoord = (value: string) => {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handleGps = async () => {
    setMessage('');
    try {
      const position = await captureActorPosition();
      setLat(String(position.lat));
      setLng(String(position.lng));
      if (!address.trim()) setAddress(position.address);
    } catch (error: any) {
      setMessage(error?.message || 'Impossible d’obtenir la position GPS.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setMessage('Indiquez une adresse ou un repère.');
      return;
    }
    const latValue = parseCoord(lat);
    const lngValue = parseCoord(lng);
    if ((lat.trim() && latValue === undefined) || (lng.trim() && lngValue === undefined)) {
      setMessage('Latitude ou longitude invalide.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await onSave({
        address: address.trim(),
        lat: latValue,
        lng: lngValue,
      });
      setSaved(true);
      setMessage('Localisation enregistrée avec succès.');
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      setMessage(error?.message || 'Impossible d’enregistrer la localisation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`rounded-2xl border border-[#e6dac8] bg-[#fffdf8] p-5 space-y-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-bold">
            <Check className="w-4 h-4" /> Enregistrée
          </span>
        )}
      </div>

      <div>
        <label className={labelClass}>Adresse / repère</label>
        <input
          type="text"
          required
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder={addressPlaceholder}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Latitude (optionnel)</label>
          <input
            type="text"
            inputMode="decimal"
            value={lat}
            onChange={e => setLat(e.target.value)}
            placeholder="6.6387"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Longitude (optionnel)</label>
          <input
            type="text"
            inputMode="decimal"
            value={lng}
            onChange={e => setLng(e.target.value)}
            placeholder="1.7167"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void handleGps()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#ff8a1f]/40 bg-[#ff8a1f]/10 text-xs font-bold text-[#9a4d00] hover:bg-[#ff8a1f]/15 transition"
        >
          <MapPin className="w-4 h-4" />
          Utiliser ma position GPS
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0c1a2e] hover:bg-[#132d4d] disabled:opacity-50 text-white text-sm font-bold transition"
        >
          {busy ? 'Enregistrement…' : 'Enregistrer la localisation'}
        </button>
      </div>

      {message && (
        <p className={`text-xs font-bold ${message.includes('succès') ? 'text-emerald-700' : 'text-rose-700'}`}>
          {message}
        </p>
      )}
    </form>
  );
};
