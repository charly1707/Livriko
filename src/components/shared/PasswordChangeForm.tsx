import React, { useState } from 'react';
import { Key } from 'lucide-react';

interface PasswordChangeFormProps {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  className?: string;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onSubmit, className = '' }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const inputClass = 'w-full px-4 py-3 bg-white border border-[#e6dac8] rounded-xl text-sm font-medium text-slate-900 focus:border-[#ff8a1f] focus:outline-none focus:ring-2 focus:ring-[#ff8a1f]/20 transition';
  const labelClass = 'text-xs font-bold uppercase tracking-wide text-slate-500 block mb-1.5';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('Veuillez remplir tous les champs du mot de passe.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await onSubmit(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Mot de passe mis à jour avec succès.');
    } catch (error: any) {
      setMessage(error?.message || 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`rounded-2xl border border-[#e6dac8] bg-[#fffdf8] p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Key className="w-5 h-5 text-[#ff8a1f]" />
        <h4 className="text-sm font-black text-slate-900">Changer mon mot de passe</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Mot de passe actuel</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
        </div>
        <div>
          <label className={labelClass}>Nouveau mot de passe</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Confirmer le nouveau mot de passe</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
        </div>
      </div>
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          message.includes('succès') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {message}
        </div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#ff8a1f] hover:bg-[#e86f00] disabled:opacity-50 text-white text-sm font-bold transition"
      >
        {busy ? 'Enregistrement…' : 'Enregistrer le nouveau mot de passe'}
      </button>
    </form>
  );
};
