/**
 * Security and HTTPS utility helpers
 */

/**
 * Ensures that any external resource or image URL uses HTTPS only.
 * Replaces 'http://' with 'https://' if present.
 */
export function ensureHttps(url?: string): string {
  if (!url) return '';
  
  // Trim and handle whitespace
  const trimmed = url.trim();
  
  // If it starts with http://, make it secure
  if (trimmed.toLowerCase().startsWith('http://')) {
    return 'https://' + trimmed.slice(7);
  }
  
  // For relative or external protocol-relative URLs (e.g., //example.com)
  if (trimmed.startsWith('//')) {
    return 'https:' + trimmed;
  }
  
  return trimmed;
}

/**
 * Elegant luxury fallback base64 SVG image in case network requests
 * for external items or Cloudinary assets fail.
 */
export const LUXURY_FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" style="background-color:%23FDFBF7;"><rect width="100%" height="100%" fill="%23FDFBF7" /><line x1="20" y1="20" x2="380" y2="20" stroke="%23D4AF37" stroke-width="0.5" opacity="0.3" /><line x1="20" y1="480" x2="380" y2="480" stroke="%23D4AF37" stroke-width="0.5" opacity="0.3" /><line x1="20" y1="20" x2="20" y2="480" stroke="%23D4AF37" stroke-width="0.5" opacity="0.3" /><line x1="380" y1="20" x2="380" y2="480" stroke="%23D4AF37" stroke-width="0.5" opacity="0.3" /><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="26" letter-spacing="4" fill="%23721c24" font-weight="bold">ANSHI</text><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" letter-spacing="3" fill="%232D3E50" font-weight="600" opacity="0.7">CURATED ARTISTRY</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" fill="%23D4AF37">✦ ✦ ✦</text></svg>';

/**
 * Handle image loading errors by substituting with a beautiful brand placeholder.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  if (target.src !== LUXURY_FALLBACK_IMAGE) {
    target.src = LUXURY_FALLBACK_IMAGE;
  }
}
