import { ServiceExpress } from '../models/ServiceExpress.js';
import { User } from '../models/User.js';
import { currentUser, currentUserId } from '../middleware/auth.js';
import { getPayload, parseJsonField } from '../utils/http.js';
import { publicId, toObjectId } from '../utils/ids.js';

async function serializeMission(mission) {
  const client = await User.findById(mission.clientId);
  const rider = mission.livreurId ? await User.findById(mission.livreurId) : null;
  return {
    id: publicId(mission),
    clientId: String(mission.clientId),
    livreurId: mission.livreurId ? String(mission.livreurId) : null,
    type: mission.type,
    description: mission.description,
    fromName: mission.fromName,
    fromAddress: mission.fromAddress,
    fromPhone: mission.fromPhone,
    fromNotes: mission.fromNotes,
    toName: mission.toName,
    toAddress: mission.toAddress,
    toPhone: mission.toPhone,
    toNotes: mission.toNotes,
    details: mission.details || {},
    distanceKm: mission.distanceKm,
    fee: mission.fee,
    status: mission.status,
    createdAt: mission.createdAt,
    completedAt: mission.completedAt,
    clientName: client ? `${client.prenom} ${client.nom}`.trim() : 'Client',
    clientPhone: client?.telephone || '',
    vehicle: rider?.vehicle || null,
  };
}

export async function createMission(req, res) {
  const clientId = currentUserId(req);
  const payload = getPayload(req);
  const required = ['type', 'description', 'fromAddress', 'toAddress', 'distanceKm', 'fee'];
  for (const field of required) {
    if (!String(payload[field] ?? '').trim()) {
      return res.status(400).json({ success: false, message: 'Informations de mission incomplètes.' });
    }
  }
  const distance = Number(payload.distanceKm);
  const fee = Number(payload.fee);
  if (!(distance > 0) || fee < 300) {
    return res.status(400).json({ success: false, message: 'Distance ou tarif invalide.' });
  }

  try {
    const details = parseJsonField(payload.details, {});
    const mission = await ServiceExpress.create({
      clientId,
      type: payload.type,
      description: payload.description,
      fromName: payload.fromName || null,
      fromAddress: payload.fromAddress,
      fromPhone: payload.fromPhone || null,
      fromNotes: payload.fromNotes || null,
      toName: payload.toName || null,
      toAddress: payload.toAddress,
      toPhone: payload.toPhone || null,
      toNotes: payload.toNotes || null,
      details,
      distanceKm: distance,
      fee,
      status: 'searching',
      history: [{ status: 'searching', at: new Date() }],
    });
    return res.status(201).json({ success: true, mission: await serializeMission(mission) });
  } catch (error) {
    console.error('Service Express creation error:', error);
    return res.status(500).json({ success: false, message: 'Impossible d’enregistrer la mission.' });
  }
}

export async function listMissions(req, res) {
  const userId = currentUserId(req);
  const role = currentUser(req)?.role || 'client';
  const filter = role === 'livreur'
    ? { status: { $in: ['searching', 'assigned', 'to_pickup', 'picked_up', 'delivering'] } }
    : { clientId: userId };
  const missions = await ServiceExpress.find(filter).sort({ createdAt: -1 });
  return res.json({
    success: true,
    missions: await Promise.all(missions.map((mission) => serializeMission(mission))),
  });
}

export async function updateMissionStatus(req, res) {
  const userId = currentUserId(req);
  const payload = getPayload(req);
  const missionId = toObjectId(payload.missionId);
  const status = String(payload.status || '');
  const allowed = ['assigned', 'to_pickup', 'picked_up', 'delivering', 'delivered', 'completed', 'cancelled'];
  if (!missionId || !allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Mission ou statut invalide.' });
  }

  const mission = await ServiceExpress.findById(missionId);
  const role = currentUser(req)?.role || 'client';
  if (!mission || (role === 'client' && String(mission.clientId) !== String(userId))) {
    return res.status(403).json({ success: false, message: 'Accès refusé.' });
  }
  if (role !== 'livreur' && !(role === 'client' && status === 'cancelled')) {
    return res.status(403).json({ success: false, message: 'Seul un livreur peut faire avancer cette mission.' });
  }
  if (role === 'livreur' && status === 'assigned') {
    mission.livreurId = userId;
  }
  mission.status = status;
  if (status === 'completed') mission.completedAt = new Date();
  mission.history.push({ status, at: new Date() });
  await mission.save();
  return res.json({ success: true, mission: await serializeMission(mission) });
}
