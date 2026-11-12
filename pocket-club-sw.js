// ===== POCKET CLUB 서비스워커 (v2.1) =====
// ⚠️ 이 파일은 pocket-club.html 에만 적용돼요 (RoomPacker 등 다른 앱과 충돌 방지)
// ⚠️ 수정할 때마다 아래 CACHE 숫자를 올려주세요
const CACHE='pocket-club-shell-v13';
const ASSETS=['./pocket-club.html','./pocket-club-icon.svg','./pocket-club-icon-192.png','./pocket-club-icon-512.png','./pocket-club.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pocket-club-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
  // 화면(HTML): 인터넷 먼저 → 안 되면 저장본
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put('./pocket-club.html',copy))}return r}).catch(()=>caches.match('./pocket-club.html')));
    return;
  }
  // 아이콘·매니페스트: 저장본 먼저
  if(ASSETS.some(a=>new URL(a,self.location.href).pathname===u.pathname))e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
});
