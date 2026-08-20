/* =========================================================
   ROOMMADE Calendar 전용 서비스워커 (오프라인 지원)
   ※ 코드를 고칠 때마다 아래 CACHE_VERSION 숫자를 올려주세요. v3 → v4 → v5
   ※ 이 파일은 roommade-cal 로 시작하는 주소만 담당합니다.
      (기존 RoomPacker 앱의 sw.js 와 서로 부딪히지 않습니다)
   ========================================================= */
const CACHE_VERSION = 'v5';
const CACHE_NAME = 'roommade-cal-' + CACHE_VERSION;
const APP_PAGE = '/roompacker/roommade-cal.html';

const APP_SHELL = [
  APP_PAGE,
  '/roompacker/roommade-cal-manifest.json'
];

/* ---------- 설치 : 앱 껍데기 저장 ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
    } catch (error) {
      console.log('[sw] 설치 중 캐시 실패:', error);
    }
    await self.skipWaiting();
  })());
});

/* ---------- 활성화 : 옛 버전 캐시 삭제 ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith('roommade-cal-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    } catch (error) {
      console.log('[sw] 옛 캐시 삭제 실패:', error);
    }
    await self.clients.claim();
  })());
});

/* ---------- 새 버전 즉시 적용 ---------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ---------- 네트워크 요청 처리 ---------- */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;

  // 화면 이동·새로고침 : 인터넷 우선, 실패하면 저장본
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(APP_PAGE, fresh.clone());
        return fresh;
      } catch (error) {
        const cached = await caches.match(APP_PAGE);
        return cached || new Response('오프라인 상태입니다.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // 그 외 파일 : 저장본 우선
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const fresh = await fetch(request);
      if (fresh && fresh.status === 200 && fresh.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch (error) {
      return new Response('', { status: 504 });
    }
  })());
});
