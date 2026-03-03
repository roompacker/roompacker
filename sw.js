const CACHE_NAME = 'roompacker-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap'
];

// ── Firebase Messaging (FCM) Background ──
try {
  importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');
} catch(e) {
  console.log('Firebase scripts not loaded in SW');
}

// Firebase config from main app
self.addEventListener('message', event => {
  if(event.data && event.data.type === 'FIREBASE_CONFIG'){
    try {
      if(typeof firebase !== 'undefined' && !firebase.apps.length){
        firebase.initializeApp(event.data.config);
        const messaging = firebase.messaging();
        messaging.onBackgroundMessage((payload) => {
          const title = payload.notification?.title || 'RoomPacker';
          const body = payload.notification?.body || payload.data?.message || '새 알림';
          self.registration.showNotification(title, {
            body, icon:'./icon-192.png', badge:'./icon-192.png',
            vibrate:[200,100,200], data:{url:self.location.origin},
            actions:[{action:'open',title:'열기'}]
          });
        });
      }
    } catch(e) { console.log('SW Firebase init:', e.message); }
  }
});

// ── Push Event ──
self.addEventListener('push', event => {
  let title='RoomPacker', body='새 알림이 있습니다';
  if(event.data){
    try {
      const p = event.data.json();
      title = p.notification?.title || p.data?.title || title;
      body = p.notification?.body || p.data?.body || body;
    } catch(e) { body = event.data.text() || body; }
  }
  event.waitUntil(
    self.registration.showNotification(title, {
      body, icon:'./icon-192.png', badge:'./icon-192.png',
      vibrate:[200,100,200], tag:'rp-'+Date.now(),
      data:{url:self.location.origin},
      actions:[{action:'open',title:'열기'},{action:'dismiss',title:'닫기'}]
    })
  );
});

// ── Notification Click ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if(event.action==='dismiss') return;
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(wc => {
      for(const c of wc){
        if(c.url.includes(self.location.origin)) return c.focus();
      }
      return clients.openWindow(self.location.origin);
    })
  );
});

// ── Install ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ──
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('allorigins') || url.includes('corsproxy') ||
      url.includes('codetabs') || url.includes('cors.sh') ||
      url.includes('everyorigin') || url.includes('airbnb') ||
      url.includes('firebaseio.com') || url.includes('firebase') ||
      url.includes('googleapis.com/fcm') || url.includes('fcmregistrations')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if(resp.ok){const cl=resp.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,cl));}
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
