// RoomPacker iCal CORS Proxy Worker
// Cloudflare Workers에 배포하세요 (무료)

export default {
  async fetch(request) {
    // OPTIONS preflight 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing ?url= parameter', { status: 400 });
    }

    // 에어비앤비 iCal만 허용 (보안)
    if (!targetUrl.includes('airbnb.com') && !targetUrl.includes('airbnb.co.kr')) {
      return new Response('Only Airbnb iCal URLs allowed', { status: 403 });
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/calendar, text/plain, */*',
        },
        cf: { cacheTtl: 60 } // 60초 캐시
      });

      const text = await response.text();

      return new Response(text, {
        status: response.status,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Cache-Control': 'no-cache',
        }
      });
    } catch (e) {
      return new Response('Fetch error: ' + e.message, { status: 500 });
    }
  }
}
