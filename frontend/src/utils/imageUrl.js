export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:5000/api';
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');

  // Relative upload path: /uploads/abc.png or uploads/abc.png
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${backendOrigin}${cleanPath}`;
  }

  // Localhost upload path pointing to localhost/127.0.0.1 on any port:
  const localhostMatch = trimmed.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/[^\s]+)$/i);
  if (localhostMatch) {
    return `${backendOrigin}${localhostMatch[1]}`;
  }

  return trimmed;
}

export function getListingImageUrl(listing) {
  if (!listing) return '';
  const raw = listing.imageUrl || listing.image || (Array.isArray(listing.images) ? listing.images[0] : '');
  return resolveImageUrl(raw);
}
