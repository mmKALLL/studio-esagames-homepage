// FireRogue service worker — makes the installed app work offline.
//   Page loads: network-first (3s timeout, bypassing the HTTP cache), falling back to the cached copy;
//               every successful load refreshes the cache, so deploys need no version bump.
//               The app is a single page, so it is cached under ONE normalized key ('./', the scope
//               root) regardless of query string or index.html; other navigations are never cached.
//   Other same-origin GETs (manifest, icons): stale-while-revalidate, keyed by exact URL.
//   Cross-origin requests: untouched. Redirected or non-OK responses are never cached.
// Bump VERSION only when this file's caching logic changes.
// See docs/plans/2026-11-16-pwa-design.md.

const VERSION = 'v1'
// /fire-rogue/ and /fire-rogue-beta/ share an origin (and CacheStorage), so key caches by scope.
const PREFIX = `firerogue:${self.registration.scope}:`
const CACHE = PREFIX + VERSION
const NAV_TIMEOUT_MS = 3000
const PAGE_KEY = './' // resolves against this script's URL, i.e. the scope root
const SCOPE_PATH = new URL(self.registration.scope).pathname
const PRECACHE = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/favicon-96.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  event.respondWith(req.mode === 'navigate' ? networkFirst(event) : staleWhileRevalidate(event))
})

// Fetch `request` and store good responses under `key` (null = don't cache). The returned promise
// resolves with the response as soon as it arrives; the cache write is kept alive via
// event.waitUntil (called synchronously, before any await, so the event is still extendable).
function fetchAndCache(event, cache, request, key) {
  const network = fetch(request)
  event.waitUntil(
    network
      .then((res) => {
        if (!key || !res.ok || res.redirected) return
        const copy = res.clone() // clone now, before the page starts consuming the body
        return cache.then((c) => c.put(key, copy))
      })
      .catch(() => {}),
  )
  return network
}

async function networkFirst(event) {
  const req = event.request
  const path = new URL(req.url).pathname
  const isAppPage = path === SCOPE_PATH || path === SCOPE_PATH + 'index.html'
  const cache = caches.open(CACHE)
  // Built from `req` (not req.url) so redirect: 'manual' is preserved; no-cache skips the HTTP cache.
  // Very old engines threw when re-wrapping a navigate-mode request; fall back to plain `req` there.
  let netReq = req
  try {
    netReq = new Request(req, { cache: 'no-cache' })
  } catch {}
  const network = fetchAndCache(event, cache, netReq, isAppPage ? PAGE_KEY : null)
  const cached = async () => (await cache).match(PAGE_KEY)

  try {
    const timeout = new Promise((resolve) => setTimeout(resolve, NAV_TIMEOUT_MS))
    const res = await Promise.race([network, timeout])
    // Server error page: prefer the cached copy. Redirects must pass through to the browser.
    if (res && !res.ok && res.type !== 'opaqueredirect') return (await cached()) || res
    if (res) return res
    // Slow network: serve the cached copy if we have one, otherwise keep waiting.
    return (await cached()) || (await network)
  } catch {
    // Offline / network error.
    return (await cached()) || Response.error()
  }
}

async function staleWhileRevalidate(event) {
  const req = event.request
  const cache = caches.open(CACHE)
  const network = fetchAndCache(event, cache, req, req)
  const cached = await (await cache).match(req)
  if (cached) return cached
  return network
}
