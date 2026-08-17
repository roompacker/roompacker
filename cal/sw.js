/* =========================================================
   ROOMMADE Calendar · 서비스워커 (오프라인 지원)
   ※ 코드를 수정할 때마다 아래 CACHE_VERSION 숫자를 꼭 올려주세요.
      예) v1 → v2 → v3 ... (숫자를 올려야 폰에 새 버전이 반영됩니다)
   ========================================================= */
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'roommade-cal-' + CACHE_VERSION;

/* 앱을 처음 켤 때 미리 저장해 둘 파일 목록 */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

/* ---------- 설치: 앱 껍데기 저장 ---------- */
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

/* ---------- 활성화: 예전 버전 캐시 삭제 ---------- */
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

/* ---------- 새 버전 즉시 적용 요청 받기 ---------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ---------- 네트워크 요청 처리 ---------- */
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // GET 요청만 처리 (저장/삭제 요청은 그대로 통과)
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 다른 사이트(구글, 파이어베이스 등) 요청은 건드리지 않음
  if (url.origin !== self.location.origin) return;

  // 서버 API 요청은 항상 최신 데이터를 받아야 하므로 캐시하지 않음
  if (url.pathname.includes('/api/')) return;

  // 화면 이동(주소창 접속·새로고침): 네트워크 우선 → 실패하면 저장본
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (error) {
        const cached = await caches.match('./index.html');
        return cached || new Response('오프라인 상태입니다.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // 그 외 파일: 저장본 우선 → 없으면 네트워크에서 받고 저장
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
