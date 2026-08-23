import React, { useState } from 'react';
import { 
  X, User, Store, Truck, ShieldCheck, Camera, FileText, CheckCircle, Clock, ArrowRight, ArrowLeft, LogIn, UserPlus, Lock, Eye, EyeOff 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, CategoryType } from '../types';
import { uploadImageFile, uploadRegisterImageFile } from '../utils/imageUpload';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  initialMode?: 'register' | 'login';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'client',
  initialMode = 'register'
}) => {
  const { registerUser, loginUser, allUsers, setActiveRole, setIsAuthModalOpen } = useApp();

  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedRole(initialRole);
    }
  }, [isOpen, initialMode, initialRole]);

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

  if (!isOpen) return null;

const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
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
          newUser = await registerUser({
            name,
            email,
            password: password || '123456',
            phone,
            role: 'livreur',
            vehicle,
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
          newUser = await registerUser({
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
          newUser = await registerUser({
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
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);

    if (!loginEmail || !loginEmail.trim()) {
      setLoginError("Veuillez renseigner votre adresse e-mail ou nom d'utilisateur.");
      return;
    }

    const res = await loginUser(loginEmail, loginPassword);
    if (res.success && res.user) {
      setLoginSuccess('Connexion réussie !');
      setActiveRole(res.user.role, true);
      setIsAuthModalOpen(false);
      onClose();
      return;
    }

    setLoginError(res.error || "Adresse e-mail/identifiant ou mot de passe incorrect.");
  };

  const roleConfigs = [
    {
      role: 'client' as UserRole,
      title: 'Acheteur / Client',
      desc: 'Commander repas, courses & produits',
      icon: User,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      activeColor: 'bg-orange-500 text-white border-orange-500 shadow-md',
    },
    {
      role: 'vendeur' as UserRole,
      title: 'Vendeur / Boutique',
      desc: 'Gérer boutique, produits & ventes',
      icon: Store,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      activeColor: 'bg-blue-600 text-white border-blue-600 shadow-md',
    },
    {
      role: 'livreur' as UserRole,
      title: 'Livreur Moto Express',
      desc: 'Livrer des commandes & recevoir des gains',
      icon: Truck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      activeColor: 'bg-emerald-600 text-white border-emerald-600 shadow-md',
    },
  ];

  return (
    <div className="fixed inset-0 z-[1100] bg-slate-950/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-6 overflow-y-auto overscroll-contain">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] sm:max-h-[85vh] overflow-y-auto p-4 sm:p-7 shadow-2xl border border-slate-100 my-auto space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Top Header with Back Button and Close */}
        <div className="sticky -top-4 sm:-top-7 -mx-4 sm:-mx-7 px-4 sm:px-7 pt-3.5 pb-3 bg-white/95 backdrop-blur-md z-30 border-b border-slate-100 flex items-center justify-between gap-2 shadow-xs">
          <button 
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="truncate">← Retour à l'Accueil</span>
          </button>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer shrink-0"
            title="Fermer la fenêtre"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Title Banner */}
        <div className="space-y-1 text-left">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {mode === 'register' ? 'Créer un Compte Livriko' : 'Se Connecter à Votre Compte'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'register'
              ? 'Choisissez votre rôle (Client, Vendeur, Livreur) pour activer votre espace dédié.'
              : 'Accédez directement à votre espace de gestion ou marché en saisissant votre email.'}
          </p>
        </div>

        {/* Success Alert */}
        {registrationSuccessMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-3 animate-in fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>{registrationSuccessMessage}</div>
          </div>
        )}

        {/* FORM CONTENT */}
        {mode === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {registrationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{registrationError}</span>
              </div>
            )}

            {/* Role Selection Grid */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Sélectionnez le type de compte à créer :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {roleConfigs.map(cfg => {
                  const Icon = cfg.icon;
                  const isSel = selectedRole === cfg.role;
                  return (
                    <button
                      type="button"
                      key={cfg.role}
                      onClick={() => setSelectedRole(cfg.role)}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                        isSel ? cfg.activeColor : `${cfg.color} hover:brightness-95`
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isSel ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs sm:text-sm font-bold leading-tight truncate">{cfg.title}</span>
                          {isSel && <CheckCircle className="w-4 h-4 text-white shrink-0" />}
                        </div>
                        <p className={`text-[11px] leading-snug mt-0.5 ${isSel ? 'text-white/90' : 'text-slate-500'}`}>
                          {cfg.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="ex: Jean Dossou"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Numéro Téléphone / WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="ex: +229 96 00 00 00"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Adresse Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ex: jean.dossou@gmail.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Créer un Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ville de résidence</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition font-medium"
              >
                <option value="Lokossa">Lokossa (Ville couverte - 100%)</option>
              </select>
            </div>

            {/* Vendeur specific fields */}
            {selectedRole === 'vendeur' && (
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase">
                  <Store className="w-4 h-4 text-blue-600" />
                  Informations de votre Commerce
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nom de la boutique ou restaurant</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="ex: Saveurs de la Haie Vive"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Catégorie</label>
                    <select
                      value={storeCategory}
                      onChange={e => setStoreCategory(e.target.value as CategoryType)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    >
                      <option value="restaurants">Restaurant / Maquis</option>
                      <option value="supermarches">Supermarché / Épicerie</option>
                      <option value="boutiques">Boutique High-Tech / Mode</option>
                      <option value="autres">Services Express</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Adresse exacte</label>
                    <input
                      type="text"
                      required
                      value={storeAddress}
                      onChange={e => setStoreAddress(e.target.value)}
                      placeholder="ex: Rue 350, Cadjehoun"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Livreur Security Onboarding specific fields */}
            {selectedRole === 'livreur' && (
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Dossier Obligatoire de Sécurité & Conformité (Examen sous 12h)
                </div>

                <p className="text-[11px] text-emerald-800">
                  Afin de garantir la sécurité des livraisons, vous devez renseigner la marque de votre moto et fournir vos 3 pièces justificatives.
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Marque & Modèle de Moto</label>
                  <input
                    type="text"
                    required
                    value={vehicle}
                    onChange={e => setVehicle(e.target.value)}
                    placeholder="ex: Moto TVS HLX 125 (Plaque CB-1234-RB)"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  
                  {/* Selfie Photo */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center space-y-1.5">
                    <Camera className="w-5 h-5 text-emerald-600 mx-auto" />
                    <span className="text-[10px] font-bold text-slate-800 block">1. Photo de vous (Selfie)</span>
                    <img src={selfiePhoto} alt="Selfie" className="w-12 h-12 rounded-full object-cover mx-auto border border-slate-200" />
                    <label className="block w-full text-[10px] text-slate-700 font-semibold">
                      <span className="inline-flex items-center justify-center w-full rounded-2xl border border-slate-300 bg-slate-100 px-2.5 py-2 cursor-pointer hover:bg-slate-200 transition">
                        Choisir une image depuis votre appareil
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          onChange={e => handleImageFileSelect(e.target.files?.[0] || null, setSelfiePhoto, setSelfieFile)}
                          className="hidden"
                        />
                      </span>
                    </label>
                    <input
                      type="text"
                      value={selfiePhoto}
                      onChange={e => setSelfiePhoto(e.target.value)}
                      className="w-full p-1 bg-slate-50 border text-[9px] rounded text-slate-600 truncate"
                      placeholder="URL photo ou choisir un fichier depuis votre appareil"
                    />
                  </div>

                  {/* CIP Photo */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center space-y-1.5">
                    <FileText className="w-5 h-5 text-blue-600 mx-auto" />
                    <span className="text-[10px] font-bold text-slate-800 block">2. Carte CIP / Pièce ID</span>
                    <img src={cipPhoto} alt="Carte CIP" className="w-full h-12 rounded object-cover border border-slate-200" />
                    <label className="block w-full text-[10px] text-slate-700 font-semibold">
                      <span className="inline-flex items-center justify-center w-full rounded-2xl border border-slate-300 bg-slate-100 px-2.5 py-2 cursor-pointer hover:bg-slate-200 transition">
                        Choisir une image depuis votre appareil
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={e => handleImageFileSelect(e.target.files?.[0] || null, setCipPhoto, setCipFile)}
                          className="hidden"
                        />
                      </span>
                    </label>
                    <input
                      type="text"
                      value={cipPhoto}
                      onChange={e => setCipPhoto(e.target.value)}
                      className="w-full p-1 bg-slate-50 border text-[9px] rounded text-slate-600 truncate"
                      placeholder="URL carte CIP ou choisir un fichier depuis votre appareil"
                    />
                  </div>

                  {/* Vehicle Photo */}
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center space-y-1.5">
                    <Truck className="w-5 h-5 text-orange-600 mx-auto" />
                    <span className="text-[10px] font-bold text-slate-800 block">3. Photo de la Moto</span>
                    <img src={vehiclePhoto} alt="Photo Moto" className="w-full h-12 rounded object-cover border border-slate-200" />
                    <label className="block w-full text-[10px] text-slate-700 font-semibold">
                      <span className="inline-flex items-center justify-center w-full rounded-2xl border border-slate-300 bg-slate-100 px-2.5 py-2 cursor-pointer hover:bg-slate-200 transition">
                        Choisir une image depuis votre appareil
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={e => handleImageFileSelect(e.target.files?.[0] || null, setVehiclePhoto, setVehicleFile)}
                          className="hidden"
                        />
                      </span>
                    </label>
                    <input
                      type="text"
                      value={vehiclePhoto}
                      onChange={e => setVehiclePhoto(e.target.value)}
                      className="w-full p-1 bg-slate-50 border text-[9px] rounded text-slate-600 truncate"
                      placeholder="URL Moto ou choisir un fichier depuis votre appareil"
                    />
                  </div>

                </div>

                <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Délai de traitement : Les pièces seront vérifiées sous 12h max par l'administrateur Livriko.</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-xl shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Créer mon Espace & Activer mon Compte</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Option to Switch to Login */}
              <div className="pt-3 border-t border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  Vous avez déjà un compte Livriko ?
                </p>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-orange-50 text-slate-800 hover:text-orange-600 border border-slate-200 hover:border-orange-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-orange-500" />
                  <span>J'ai déjà un compte — Se Connecter</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-200 text-slate-600 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>← Annuler et Retourner au Marché</span>
              </button>
            </div>
          </form>
        ) : (
          /* LOGIN FORM MODE */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Adresse Email ou Nom d'utilisateur
                </label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="ex: jean.dupont@example.com ou JeanD"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Se Connecter à Mon Espace</span>
            </button>

            {/* Switch back to Register */}
            <div className="pt-3 border-t border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-600 font-medium">
                Vous n'avez pas encore de compte Livriko ?
              </p>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-orange-50 text-slate-800 hover:text-orange-600 border border-slate-200 hover:border-orange-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-orange-500" />
                <span>Créer un Nouveau Compte</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-200 text-slate-600 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>← Annuler et Retourner au Marché</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
