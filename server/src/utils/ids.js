import mongoose from 'mongoose';

export function stripPrefix(value) {
  return String(value ?? '').replace(/^(ord-|store-|prod-|usr-)/, '').trim();
}

export function toObjectId(value) {
  const id = stripPrefix(value);
  if (!id || id.length !== 24 || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return new mongoose.Types.ObjectId(id);
}

export function publicId(doc) {
  return String(doc?._id ?? doc ?? '');
}

export function storePublicId(store) {
  return `store-${publicId(store)}`;
}

export function orderPublicId(order) {
  return `ord-${publicId(order)}`;
}
