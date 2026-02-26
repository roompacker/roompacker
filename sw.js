const CACHE_NAME = 'roompacker-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap'
];

// 설치: 핵심 파일 캐싱
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 네트워크 우선, 실패시 캐시 (항상 최신 데이터 시도)
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // CORS 프록시/외부 API 요청은 캐시하지 않음
  if (url.includes('allorigins') || url.includes('corsproxy') ||
      url.includes('codetabs') || url.includes('cors.sh') ||
      url.includes('everyorigin') || url.includes('airbnb') ||
      url.includes('firebaseio.com') || url.includes('firebase')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // 성공하면 캐시 업데이트
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
