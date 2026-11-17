// ===== 그룹 조합 생성기 서비스워커 =====
// ⚠️ 파일을 수정할 때마다 아래 버전 숫자를 1씩 올려주세요 (v1 → v2)
const CACHE = '그룹조합-v1';
const FILES = [
  './group-combo.html',
  './group-combo-manifest.json',
  './group-combo-icon-192.png',
  './group-combo-icon-512.png'
];

// ===== 설치: 파일 미리 저장 =====
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).catch(() => {}));
  self.skipWaiting();
});

// ===== 활성화: 예전 버전 캐시 정리 (이 앱 캐시만) =====
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('그룹조합-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ===== 요청 처리: 인터넷 먼저, 안 되면 저장본 =====
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        } catch (err) {}
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
