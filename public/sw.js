// ANSHI Boutique Curator - Service Worker
// Built with a extremely safe, stale-resistant network-first approach.
// Absolutely forbids intercepting third-party API or Firestore calls to avoid SSL/cors issues on proxy networks.

const CACHE_NAME = 'anshi-cache-v3';

self.addEventListener('install', (event) => {
  // Activate immediately without wait
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Skip anything that isn't a simple GET request
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // CRITICAL SECURITY GUARD: NEVER intercept external APIs, Firestore, or Cloudinary.
  // This completely eliminates CORS, Certificate Interception, and SSL issues
  // on custom WiFi routers (like WR1) or corporate firewalls!
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('cloudinary') ||
    url.hostname.includes('wa.me') ||
    url.hostname.includes('instagram.com')
  ) {
    return;
  }

  // Network-first, fallback-to-cache strategy for assets
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone);
          });
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(req).then((cachedRes) => {
          if (cachedRes) {
            return cachedRes;
          }
          // Return offline fallback if it's an image
          if (req.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" style="background-color:%23FDFBF7;"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="%23D4AF37">ANSHI ✦ Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
        });
      })
  );
});
