import React, { useState, startTransition, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, User, Store, Truck, ShieldCheck, CheckCircle, Clock, ArrowRight, LogIn, UserPlus, Eye, EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, CategoryType } from '../types';
import { uploadRegisterImageFile } from '../utils/imageUpload';
import { MediaPicker } from './MediaPicker';
import livrikoLogo from '../assets/images/livriko_logo_1785408725718.jpg';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  initialMode?: 'register' | 'login';
}

export const AuthModal: React.FC<AuthModalProps> = memo(function AuthModal({
  isOpen,
  onClose,
  initialRole = 'client',
  initialMode = 'register'
}) {
  const { registerUser, loginUser, setActiveRole, closeAuthModal } = useApp();
  const actionsRef = useRef({ registerUser, loginUser, setActiveRole, closeAuthModal });
  actionsRef.current = { registerUser, loginUser, setActiveRole, closeAuthModal };

  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [registerMounted, setRegisterMounted] = useState(initialMode === 'register');

  React.useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setSelectedRole(initialRole);
    if (initialMode === 'register') {
      setRegisterMounted(true);
    }
    setRegistrationError(null);
    setLoginError(null);
    setLoginSuccess(null);
    setRegistrationSuccessMessage(null);
    // Reset uniquement à l’ouverture du modal, pas à chaque re-render parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const switchMode = (nextMode: 'register' | 'login') => {
    if (nextMode === mode) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    if (nextMode === 'register') {
      setRegisterMounted(true);
    }
    startTransition(() => {
      setMode(nextMode);
      setRegistrationError(null);
      setLoginError(null);
      setLoginSuccess(null);
      setRegistrationSuccessMessage(null);
    });
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Common form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Lokossa');

  // Login form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Vendeur specific
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState<CategoryType>('restaurants');
  const [storeAddress, setStoreAddress] = useState('Quartier Agamé, Lokossa');

  // Livreur specific security fields
  const [vehicle, setVehicle] = useState('Moto TVS HLX 125');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [selfiePhoto, setSelfiePhoto] = useState('');
  const [cipPhoto, setCipPhoto] = useState('');
  const [vehiclePhoto, setVehiclePhoto] = useState('');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [cipFile, setCipFile] = useState<File | null>(null);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const handleImageFileSelect = (
    file: File | null,
    setter: React.Dispatch<React.SetStateAction<string>>,
    fileSetter?: React.Dispatch<React.SetStateAction<File | null>>,
  ) => {
    if (!file) return;
    fileSetter?.(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Security feedback state
  const [registrationSuccessMessage, setRegistrationSuccessMessage] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isRegistering) return;
      setRegistrationError(null);
      setLoginError(null);

      if (!name.trim()) {
        setRegistrationError("Veuillez renseigner votre nom complet.");
        return;
      }
      if (!email.trim()) {
        setRegistrationError("Veuillez renseigner votre adresse e-mail.");
        return;
      }
      const emailValue = email.trim().toLowerCase();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailValue)) {
        setRegistrationError("Veuillez renseigner une adresse e-mail valide.");
        return;
      }
      if (!phone.trim()) {
        setRegistrationError("Veuillez renseigner votre numéro de téléphone.");
        return;
      }
      if (!password.trim()) {
        setRegistrationError("Veuillez renseigner un mot de passe.");
        return;
      }
      if (password.trim().length < 8) {
        setRegistrationError("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }

      setIsRegistering(true);
      try {
        let newUser;
        let uploadedAvatar = avatarPreview;
        let uploadedSelfie = selfiePhoto;
        let uploadedCip = cipPhoto;
        let uploadedVehicle = vehiclePhoto;

        if (avatarFile) {
          uploadedAvatar = await uploadRegisterImageFile(avatarFile);
        }
        if (selfieFile) {
          uploadedSelfie = await uploadRegisterImageFile(selfieFile);
        }
        if (cipFile) {
          uploadedCip = await uploadRegisterImageFile(cipFile);
        }
        if (vehicleFile) {
          uploadedVehicle = await uploadRegisterImageFile(vehicleFile);
        }

        if (selectedRole === 'livreur') {
          if (!vehicle.trim()) {
            setRegistrationError("Veuillez renseigner la marque et le modèle de votre moto.");
            return;
          }
          if (!vehiclePlate.trim()) {
            setRegistrationError("Veuillez renseigner le numéro d'immatriculation de votre moto.");
            return;
          }
          if (!uploadedSelfie) {
            setRegistrationError("Ajoutez votre photo selfie.");
            return;
          }
          if (!uploadedCip) {
            setRegistrationError("Ajoutez la photo de votre CIP / pièce d'identité.");
            return;
          }
          if (!uploadedVehicle) {
            setRegistrationError("Ajoutez la photo de votre moto.");
            return;
          }
          newUser = await actionsRef.current.registerUser({
            name,
            email,
            password: password || '123456',
            phone,
            role: 'livreur',
            vehicle,
            vehiclePlate,
            city,
            avatar: uploadedSelfie,
            selfiePhoto: uploadedSelfie,
            cipPhoto: uploadedCip,
            vehiclePhoto: uploadedVehicle,
            verificationStatus: 'pending',
            verificationSubmittedAt: 'À l\'instant',
          });

          setRegistrationSuccessMessage(
            `Compte créé ! Dossier de sécurité N° #LVK-RIDER-${newUser.id.slice(-4)} soumis pour vérification.`
          );
        } else if (selectedRole === 'vendeur') {
          if (!storeName.trim()) {
            setRegistrationError("Le nom de la boutique est obligatoire.");
            return;
          }
          if (!storeAddress.trim()) {
            setRegistrationError("L'adresse de la boutique est obligatoire.");
            return;
          }
          newUser = await actionsRef.current.registerUser({
            name,
            email,
            password: password || '123456',
            phone,
            role: 'vendeur',
            city,
            avatar: uploadedAvatar,
            storeName: storeName || `Boutique de ${name}`,
            storeCategory,
            storeAddress,
          });

          setRegistrationSuccessMessage(`Félicitations ! Votre espace boutique "${newUser.name}" a été activé.`);
        } else {
          newUser = await actionsRef.current.registerUser({
            name,
            email,
            password: password || '123456',
            phone,
            role: selectedRole,
            city,
            avatar: uploadedAvatar || undefined,
          });

          setRegistrationSuccessMessage(`Compte créé avec succès ! Bienvenue sur Livriko, ${newUser.name}.`);
        }

        setTimeout(() => {
          setRegistrationSuccessMessage(null);
          onClose();
        }, 1200);
      } catch (err: any) {
        setRegistrationError(err.message || 'Échec de l’inscription.');
      } finally {
        setIsRegistering(false);
      }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setLoginError(null);
    setLoginSuccess(null);

    if (!loginEmail || !loginEmail.trim()) {
      setLoginError("Veuillez renseigner votre adresse e-mail ou nom d'utilisateur.");
      return;
    }
    if (!loginPassword || !loginPassword.trim()) {
      setLoginError('Veuillez renseigner votre mot de passe.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await actionsRef.current.loginUser(loginEmail, loginPassword);
      if (res.success && res.user) {
        setLoginSuccess('Connexion réussie !');
        actionsRef.current.setActiveRole(res.user.role, true);
        actionsRef.current.closeAuthModal();
        onClose();
        return;
      }

      setLoginError(res.error || "Adresse e-mail/identifiant ou mot de passe incorrect.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const roleConfigs = [
    {
      role: 'client' as UserRole,
      title: 'Client',
      desc: 'Commander',
      icon: User,
    },
    {
      role: 'vendeur' as UserRole,
      title: 'Vendeur',
      desc: 'Vendre',
      icon: Store,
    },
    {
      role: 'livreur' as UserRole,
      title: 'Livreur',
      desc: 'Livrer',
      icon: Truck,
    },
  ];

  const inputClass =
    'w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900 placeholder:text-slate-400 transition focus:border-[#ff8a1f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff8a1f]/20';
  const labelClass = 'mb-1.5 block text-[13px] font-bold text-slate-700';

  if (!isOpen) return null;

  const submitRegisterClass =
    'inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff8a1f] text-sm font-black text-white transition hover:bg-[#ff9a3d] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:scale-[0.99]';
  const submitLoginClass =
    'inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff8a1f] text-sm font-black text-white transition hover:bg-[#ff9a3d] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 active:scale-[0.99]';

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-stretch justify-center bg-[#0b2a4a]/55 backdrop-blur-[2px] sm:items-center sm:p-6">
      <div className="flex h-[100svh] w-full max-w-lg flex-col overflow-hidden bg-[#f4f8fc] sm:h-[min(92vh,760px)] sm:max-h-[min(92vh,760px)] sm:rounded-[1.75rem] sm:border sm:border-slate-200/80 sm:shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={livrikoLogo} alt="" className="h-9 w-9 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#0b2a4a]">
                Livr<span className="text-[#ff8a1f]">iko</span>
              </p>
              <p className="truncate text-[11px] font-medium text-slate-500">
                <span className={mode === 'register' ? 'inline' : 'hidden'}>Créer un compte</span>
                <span className={mode === 'login' ? 'inline' : 'hidden'}>Connexion</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a]/30"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode switch */}
        <div className="shrink-0 bg-white px-4 pb-3 pt-1 sm:px-6">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Mode d’authentification">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
                mode === 'login'
                  ? 'bg-[#0b2a4a] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#0b2a4a]'
              }`}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Connexion
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => switchMode('register')}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
                mode === 'register'
                  ? 'bg-[#0b2a4a] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#0b2a4a]'
              }`}
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              Inscription
            </button>
          </div>
        </div>

        {/* Les deux formulaires restent montés — évite le crash removeChild au changement d’onglet */}
        <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {registrationSuccessMessage && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-semibold text-emerald-800">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>{registrationSuccessMessage}</div>
            </div>
          )}

          {registerMounted && (
          <div
            className={mode === 'register' ? 'block' : 'pointer-events-none invisible absolute h-0 w-0 overflow-hidden'}
            aria-hidden={mode !== 'register'}
          >
            <form onSubmit={handleRegisterSubmit} className="space-y-4 pb-4">
              {registrationError && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <span>{registrationError}</span>
                </div>
              )}

              <div>
                <p className={labelClass}>Type de compte</p>
                <div className="grid grid-cols-3 gap-2">
                  {roleConfigs.map((cfg) => {
                    const Icon = cfg.icon;
                    const isSel = selectedRole === cfg.role;
                    return (
                      <button
                        type="button"
                        key={cfg.role}
                        onClick={() => setSelectedRole(cfg.role)}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition ${
                          isSel
                            ? 'border-[#0b2a4a] bg-[#0b2a4a] text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSel ? 'text-[#ffb45c]' : 'text-slate-500'}`} aria-hidden />
                        <span className="text-xs font-bold leading-tight">{cfg.title}</span>
                        <span className={`text-[10px] leading-tight ${isSel ? 'text-white/75' : 'text-slate-400'}`}>
                          {cfg.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelClass} htmlFor="reg-name">Nom complet</label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Jean Dossou"
                    className={inputClass}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="reg-phone">Téléphone / WhatsApp</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ex: +229 96 00 00 00"
                    className={inputClass}
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="reg-email">Adresse e-mail</label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: jean.dossou@gmail.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="reg-password">Mot de passe</label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Au moins 8 caractères"
                      className={`${inputClass} pr-12`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="reg-city">Ville</label>
                  <select
                    id="reg-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`${inputClass} font-medium`}
                  >
                    <option value="Lokossa">Lokossa</option>
                  </select>
                </div>
              </div>

              {selectedRole === 'vendeur' && (
                <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-[#0b2a4a]">
                    <Store className="h-4 w-4 text-blue-600" aria-hidden />
                    Votre commerce
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="reg-store">Nom de la boutique</label>
                    <input
                      id="reg-store"
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="ex: Saveurs de Lokossa"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="reg-category">Catégorie</label>
                    <select
                      id="reg-category"
                      value={storeCategory}
                      onChange={(e) => setStoreCategory(e.target.value as CategoryType)}
                      className={inputClass}
                    >
                      <option value="restaurants">Restaurant / Maquis</option>
                      <option value="supermarches">Supermarché / Épicerie</option>
                      <option value="boutiques">Boutique / Mode</option>
                      <option value="autres">Services Express</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="reg-address">Adresse</label>
                    <input
                      id="reg-address"
                      type="text"
                      required
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="ex: Quartier Agamé, Lokossa"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {selectedRole === 'livreur' && (
                <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-[#0b2a4a]">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
                    Dossier livreur
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-900/80">
                    Moto + 3 justificatifs requis. Vérification sous 12h par Livriko.
                  </p>

                  <div>
                    <label className={labelClass} htmlFor="reg-vehicle">Marque & modèle</label>
                    <input
                      id="reg-vehicle"
                      type="text"
                      required
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      placeholder="ex: Moto TVS HLX 125"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="reg-plate">Immatriculation</label>
                    <input
                      id="reg-plate"
                      type="text"
                      required
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="ex: CB-1234-RB"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <MediaPicker
                      label="1. Selfie"
                      value={selfiePhoto}
                      captureMode="user"
                      compact
                      onChange={(preview, file) => {
                        setSelfiePhoto(preview);
                        setSelfieFile(file);
                      }}
                      onClear={() => {
                        setSelfiePhoto('');
                        setSelfieFile(null);
                      }}
                    />
                    <MediaPicker
                      label="2. CIP / pièce"
                      value={cipPhoto}
                      captureMode="environment"
                      allowDocuments
                      onChange={(preview, file) => {
                        setCipPhoto(preview);
                        setCipFile(file);
                      }}
                      onClear={() => {
                        setCipPhoto('');
                        setCipFile(null);
                      }}
                    />
                    <MediaPicker
                      label="3. Photo moto"
                      value={vehiclePhoto}
                      captureMode="environment"
                      onChange={(preview, file) => {
                        setVehiclePhoto(preview);
                        setVehicleFile(file);
                      }}
                      onClear={() => {
                        setVehiclePhoto('');
                        setVehicleFile(null);
                      }}
                    />
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                    <span>Traitement sous 12h max après envoi du dossier.</span>
                  </div>
                </div>
              )}

              <button type="submit" className={submitRegisterClass} disabled={isRegistering}>
                {isRegistering ? 'Création du compte…' : 'Créer mon compte'}
                {!isRegistering && <ArrowRight className="h-4 w-4" aria-hidden />}
              </button>
            </form>
          </div>
          )}

          <div
            className={mode === 'login' ? 'block' : 'pointer-events-none invisible absolute h-0 w-0 overflow-hidden'}
            aria-hidden={mode !== 'login'}
          >
            <form onSubmit={handleLoginSubmit} className="space-y-4 pb-4">
              {loginError && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              <div>
                <label className={labelClass} htmlFor="login-email">E-mail ou nom d&apos;utilisateur</label>
                <input
                  id="login-email"
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ex: jean.dupont@example.com"
                  className={inputClass}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="login-password">Mot de passe</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-12`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600"
                    aria-label={showLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" className={submitLoginClass} disabled={isLoggingIn}>
                <LogIn className="h-4 w-4" aria-hidden />
                {isLoggingIn ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
});
