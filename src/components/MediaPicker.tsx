import React, { useId, useRef, useState } from 'react';
import { Camera, FolderOpen, Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';

const DEFAULT_MAX_MB = 5;
const DEFAULT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type MediaPickerProps = {
  label: string;
  value?: string;
  onChange: (previewUrl: string, file: File | null) => void;
  onClear?: () => void;
  accept?: string;
  maxSizeMb?: number;
  captureMode?: 'user' | 'environment' | false;
  allowDocuments?: boolean;
  uploading?: boolean;
  compact?: boolean;
};

export const MediaPicker: React.FC<MediaPickerProps> = ({
  label,
  value,
  onChange,
  onClear,
  accept = 'image/*',
  maxSizeMb = DEFAULT_MAX_MB,
  captureMode = 'environment',
  allowDocuments = false,
  uploading = false,
  compact = false,
}) => {
  const inputId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | null) => {
    setError(null);
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isDoc = allowDocuments && (
      file.type === 'application/pdf'
      || file.type.startsWith('image/')
    );

    if (!isImage && !isDoc) {
      setError('Format non pris en charge. Utilisez JPEG, PNG, WEBP ou PDF.');
      return;
    }

    if (isImage && !DEFAULT_TYPES.includes(file.type) && !allowDocuments) {
      setError('Format non pris en charge. Utilisez JPEG, PNG ou WEBP.');
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Le fichier ne doit pas dépasser ${maxSizeMb} Mo.`);
      return;
    }

    if (isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result, file);
        }
      };
      reader.readAsDataURL(file);
    } else {
      onChange(file.name, file);
    }
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-white space-y-2 ${compact ? 'p-2.5' : 'p-3'}`}>
      <span className="text-[10px] font-bold text-slate-800 block text-center">{label}</span>

      {value && (value.startsWith('data:') || value.startsWith('http') || value.startsWith('blob:')) ? (
        <img
          src={value}
          alt={label}
          className={`mx-auto rounded-lg object-cover border border-slate-100 ${compact ? 'w-12 h-12 rounded-full' : 'w-full h-24'}`}
        />
      ) : value ? (
        <div className="text-[10px] text-slate-600 text-center truncate px-1">{value}</div>
      ) : (
        <div className={`mx-auto flex items-center justify-center rounded-lg bg-slate-50 border border-dashed border-slate-200 text-slate-400 ${compact ? 'w-12 h-12' : 'w-full h-20'}`}>
          <ImageIcon className="w-5 h-5" />
        </div>
      )}

      {uploading ? (
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-orange-600 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Envoi en cours…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1.5">
          {captureMode !== false && (
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              Prendre une photo
            </button>
          )}
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
            Choisir depuis la galerie
          </button>
          {allowDocuments && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <Upload className="w-3.5 h-3.5 text-orange-600" />
              Choisir un fichier
            </button>
          )}
          {value && onClear && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                onClear();
              }}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border border-rose-100 bg-rose-50 px-2 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Retirer
            </button>
          )}
        </div>
      )}

      {error && <p className="text-[10px] text-rose-600 font-semibold text-center">{error}</p>}

      {/* Hidden inputs — separate for camera vs gallery for mobile browsers */}
      <input
        ref={cameraRef}
        id={`${inputId}-camera`}
        type="file"
        accept={accept}
        capture={captureMode || undefined}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0] || null);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryRef}
        id={`${inputId}-gallery`}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0] || null);
          e.target.value = '';
        }}
      />
      {allowDocuments && (
        <input
          ref={fileRef}
          id={`${inputId}-file`}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0] || null);
            e.target.value = '';
          }}
        />
      )}
    </div>
  );
};
