import { jsPDF } from 'jspdf';
import type { Store, User } from '../types';

const NAVY: [number, number, number] = [12, 26, 46];
const ORANGE: [number, number, number] = [255, 138, 31];
const SLATE: [number, number, number] = [71, 85, 105];
const MUTED: [number, number, number] = [148, 163, 184];

const loadJpeg = (src?: string | null): Promise<string | null> => {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const max = 1200;
        const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

const slug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '') || 'dossier';

const drawHeader = (doc: jsPDF, title: string, subtitle: string) => {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(...ORANGE);
  doc.rect(0, 28, 210, 1.6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Livriko', 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 184, 106);
  doc.text('LOKOSSA', 14, 19);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, 196, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(197, 211, 228);
  doc.text(subtitle, 196, 19, { align: 'right' });
};

const drawFooter = (doc: jsPDF) => {
  const generated = new Date().toLocaleString('fr-FR');
  doc.setDrawColor(230, 218, 200);
  doc.line(14, 282, 196, 282);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Document généré le ${generated} — Confidentiel, usage administration Livriko.`, 14, 288);
};

const field = (doc: jsPDF, label: string, value: string, x: number, y: number, width = 88) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  const lines = doc.splitTextToSize(value || '—', width);
  doc.text(lines, x, y + 5);
  return y + 5 + lines.length * 4.4;
};

const statusLabel = (status?: User['verificationStatus']) => {
  if (status === 'approved') return 'CERTIFIE';
  if (status === 'rejected') return 'REFUSE';
  if (status === 'incomplete') return 'INCOMPLET';
  return 'EN ATTENTE';
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
};

const addPhotoPage = (doc: jsPDF, label: string, data: string | null) => {
  doc.addPage();
  drawHeader(doc, 'Pièce jointe', label);
  if (!data) {
    doc.setFontSize(12);
    doc.setTextColor(...MUTED);
    doc.text('Pièce non fournie dans le dossier.', 105, 140, { align: 'center' });
    drawFooter(doc);
    return;
  }
  try {
    const maxW = 182;
    const maxH = 230;
    const props = doc.getImageProperties(data);
    const ratio = props.width / Math.max(1, props.height);
    let width = maxW;
    let height = width / ratio;
    if (height > maxH) {
      height = maxH;
      width = height * ratio;
    }
    const x = 14 + (maxW - width) / 2;
    const y = 36;
    doc.addImage(data, 'JPEG', x, y, width, height, undefined, 'FAST');
  } catch {
    doc.setFontSize(12);
    doc.setTextColor(...MUTED);
    doc.text('Impossible d’afficher cette pièce.', 105, 140, { align: 'center' });
  }
  drawFooter(doc);
};

export async function downloadLivreurDossierPdf(rider: User) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, 'Dossier livreur', 'Candidature & pièces d’identité');

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(rider.name || 'Livreur', 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...ORANGE);
  doc.text(statusLabel(rider.verificationStatus), 14, 49);

  let y = 58;
  y = Math.max(
    field(doc, 'Téléphone', rider.phone || '—', 14, y),
    field(doc, 'E-mail', rider.email || '—', 108, y),
  ) + 6;
  y = Math.max(
    field(doc, 'Ville', rider.city || 'Lokossa', 14, y),
    field(doc, 'Véhicule', rider.vehicle || 'Non renseigné', 108, y),
  ) + 6;
  y = Math.max(
    field(doc, 'Immatriculation', rider.vehiclePlate || 'Non renseignée', 14, y),
    field(doc, 'Statut compte', (rider.statut || 'actif').toUpperCase(), 108, y),
  ) + 6;
  y = Math.max(
    field(doc, 'Inscription', formatDate(rider.createdAt), 14, y),
    field(doc, 'Référence', rider.id, 108, y),
  ) + 8;

  if (rider.rejectionReason) {
    y = field(doc, 'Motif / observation', rider.rejectionReason, 14, y, 182) + 8;
  }

  const photos = [
    { label: 'Selfie', src: rider.selfiePhoto || rider.avatar },
    { label: 'CIP / pièce d’identité', src: rider.cipPhoto },
    { label: 'Photo moto', src: rider.vehiclePhoto },
  ];
  const loaded = await Promise.all(photos.map(async (photo) => ({
    ...photo,
    data: await loadJpeg(photo.src),
  })));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('Contrôle des pièces', 14, y);
  y += 8;

  const checks = [
    ['Selfie', Boolean(rider.selfiePhoto || rider.avatar)],
    ['CIP / pièce', Boolean(rider.cipPhoto)],
    ['Photo moto', Boolean(rider.vehiclePhoto)],
    ['Immatriculation', Boolean(rider.vehiclePlate)],
  ];
  checks.forEach((item, index) => {
    const x = 14 + (index % 2) * 94;
    const rowY = y + Math.floor(index / 2) * 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...SLATE);
    doc.text(`${item[0]} : ${item[1] ? 'Fourni' : 'Manquant'}`, x, rowY);
  });
  y += 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('Aperçu des pièces', 14, y);
  y += 6;

  const boxW = 58;
  const boxH = 52;
  loaded.forEach((photo, index) => {
    const x = 14 + index * 62;
    doc.setDrawColor(230, 218, 200);
    doc.setFillColor(250, 246, 239);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(photo.label.toUpperCase(), x + 3, y + 6);
    if (photo.data) {
      doc.addImage(photo.data, 'JPEG', x + 3, y + 9, boxW - 6, boxH - 13, undefined, 'FAST');
    } else {
      doc.setTextColor(...MUTED);
      doc.setFontSize(8);
      doc.text('Non fourni', x + boxW / 2, y + boxH / 2 + 4, { align: 'center' });
    }
  });

  drawFooter(doc);
  loaded.forEach((photo) => addPhotoPage(doc, photo.label, photo.data));
  doc.save(`dossier-livreur-${slug(rider.name || rider.id)}.pdf`);
}

export async function downloadStoreDossierPdf(store: Store) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  drawHeader(doc, 'Dossier boutique', 'Fiche partenaire Livriko');

  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(store.name || 'Boutique', 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...ORANGE);
  doc.text(store.isCertified ? 'CERTIFIEE' : 'A CERTIFIER', 14, 49);

  let y = 58;
  y = Math.max(
    field(doc, 'Catégorie', store.category || '—', 14, y),
    field(doc, 'Ville', store.city || 'Lokossa', 108, y),
  ) + 6;
  y = Math.max(
    field(doc, 'Adresse', store.address || '—', 14, y, 182),
    0,
  ) + 6;
  y = Math.max(
    field(doc, 'Téléphone', store.phone || '—', 14, y),
    field(doc, 'Mobile Money', store.momoPhone || 'Non renseigné', 108, y),
  ) + 6;
  y = Math.max(
    field(doc, 'Délai', store.deliveryTime || '—', 14, y),
    field(doc, 'Ouverture', store.isOpen ? 'Ouverte' : 'Fermée', 108, y),
  ) + 8;
  if (store.description) {
    y = field(doc, 'Description', store.description, 14, y, 182) + 8;
  }

  const [logo, cover] = await Promise.all([
    loadJpeg(store.logo),
    loadJpeg(store.coverImage),
  ]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('Identité visuelle', 14, y);
  y += 6;
  doc.setDrawColor(230, 218, 200);
  doc.setFillColor(250, 246, 239);
  doc.roundedRect(14, y, 50, 50, 2, 2, 'FD');
  if (logo) {
    doc.addImage(logo, 'JPEG', 17, y + 3, 44, 44, undefined, 'FAST');
  } else {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('Logo absent', 39, y + 27, { align: 'center' });
  }

  drawFooter(doc);
  addPhotoPage(doc, 'Logo boutique', logo);
  addPhotoPage(doc, 'Photo de couverture', cover);
  doc.save(`dossier-boutique-${slug(store.name || store.id)}.pdf`);
}
