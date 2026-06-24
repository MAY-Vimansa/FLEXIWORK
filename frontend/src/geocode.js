// Free-text address -> {lat, lng} via OpenStreetMap Nominatim, biased to Sri Lanka.
export async function geocodeAddress(query, signal) {
  if (!query || query.trim().length < 5) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=lk&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const results = await res.json();
  if (!results.length) return null;
  return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
}
