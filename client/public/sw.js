const CACHE_NAME = 'fleetflow-v1'
const urlsToCache = [
    '/',
    '/index.html',
]

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    )
})

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    )
})

// Network-first strategy with offline fallback
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return

    // For API calls, try network first
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone()
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
                    return response
                })
                .catch(() => caches.match(event.request))
        )
        return
    }

    // For static assets, cache first
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request)
                .then(fetchResponse => {
                    const clone = fetchResponse.clone()
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
                    return fetchResponse
                })
            )
    )
})

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-trip-updates') {
        event.waitUntil(syncPendingActions())
    }
})

async function syncPendingActions() {
    try {
        const cache = await caches.open('fleetflow-pending')
        const requests = await cache.keys()
        for (const req of requests) {
            const data = await cache.match(req)
            const body = await data.json()
            await fetch(body.url, { method: body.method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body.payload) })
            await cache.delete(req)
        }
    } catch (e) { /* will retry on next sync */ }
}
