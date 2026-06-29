const CACHE_VERSION = 'edu-system-pwa-v6';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './archive_functions.js',
  './platform-subscriptions.js',
  './data.js',
  './manifest.webmanifest',
  './firebase-config.js',
  './app-icon-192.png',
  './app-icon-512.png',
  './app-icon-maskable-512.png',
  './apple-touch-icon.png'
];

// ─── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────
async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const fresh = await fetch(request, { cache: 'no-store' });
    if (fresh && fresh.ok) await cache.put(request, fresh.clone());
    return fresh;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return cache.match('./index.html');
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(networkFirst(request));
});

// ─── Periodic Background Sync (Android Chrome) ─────────────
// بيشتغل في الـ background حتى لو البرنامج مش مفتوح
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'treasury-daily-archive') {
    event.waitUntil(notifyClientsToArchive());
  }
});

// ─── Message من app.js ──────────────────────────────────────
// app.js بيبعت رسالة عشان يسجل الـ SW أو يطلب أرشفة
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // app.js يسجل periodic sync
  if (event.data.type === 'REGISTER_TREASURY_SYNC') {
    registerPeriodicSync();
  }

  // app.js يطلب تذكير باقي الـ clients بالأرشفة
  if (event.data.type === 'TREASURY_ARCHIVE_DONE') {
    // حفظ آخر تاريخ أرشفة في SW state
    self._lastArchiveDate = event.data.date;
  }
});

// ─── تسجيل Periodic Sync ───────────────────────────────────
async function registerPeriodicSync() {
  try {
    const registration = self.registration;
    if (registration && registration.periodicSync) {
      await registration.periodicSync.register('treasury-daily-archive', {
        minInterval: 12 * 60 * 60 * 1000 // كل 12 ساعة كحد أدنى
      });
    }
  } catch (e) {
    // المتصفح مش بيدعم periodicSync — app.js هيتعامل معاه
    console.log('[SW] periodicSync not supported, app.js will handle archiving');
  }
}

// ─── إرسال طلب أرشفة لكل الـ clients المفتوحة ─────────────
async function notifyClientsToArchive() {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const todayStr = new Date().toLocaleDateString('en-CA');

  if (clients.length > 0) {
    // فيه نافذة مفتوحة — نطلب منها تعمل الأرشفة
    clients.forEach(client => {
      client.postMessage({ type: 'RUN_TREASURY_ARCHIVE', date: todayStr });
    });
  } else {
    // مفيش نافذة مفتوحة — نحفظ طلب الأرشفة في SW state
    // لما يفتح البرنامج app.js هيشوف إن فيه أيام فايتة ويأرشفها
    self._pendingArchive = todayStr;
    console.log('[SW] No clients open. Archive will run when app opens.');
  }
}

// ─── Push Notification (تنبيه لما يفتح البرنامج) ───────────
self.addEventListener('push', (event) => {
  // مش بنستخدمه دلوقتي
});
