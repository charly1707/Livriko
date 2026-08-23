export const LOKOSSA_LAT = 6.3833;
export const LOKOSSA_LNG = 1.7167;

export function defaultStoreCoordinates(lat, lng) {
  return {
    lat: lat != null && !Number.isNaN(Number(lat)) ? Number(lat) : LOKOSSA_LAT,
    lng: lng != null && !Number.isNaN(Number(lng)) ? Number(lng) : LOKOSSA_LNG,
  };
}
