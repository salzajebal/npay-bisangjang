const CACHE_NAME = 'fallback-urls-v1';
const API_ENDPOINT = '/api/domain-redirect';

async function updateCache(data) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      API_ENDPOINT,
      new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch (_) {}
}

async function getCachedUrls() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(API_ENDPOINT);
    if (!cached) return [];
    const data = await cached.json();
    return (data.urls || [])
      .filter((u) => u.isActive)
      .sort((a, b) => a.priority - b.priority)
      .map((u) => u.url);
  } catch (_) {
    return [];
  }
}

async function findReachableUrl(urls) {
  if (!urls.length) return null;
  return new Promise((resolve) => {
    let settled = 0;
    let resolved = false;
    urls.forEach((url) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      fetch(url, { mode: 'no-cors', signal: controller.signal, cache: 'no-store' })
        .then(() => {
          clearTimeout(timer);
          if (!resolved) {
            resolved = true;
            resolve(url);
          }
        })
        .catch(() => {
          clearTimeout(timer);
          settled++;
          if (settled === urls.length && !resolved) {
            resolve(null);
          }
        });
    });
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    fetch(API_ENDPOINT)
      .then((r) => r.json())
      .then((data) => updateCache(data))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'UPDATE_FALLBACK_CACHE' && event.data.payload) {
    updateCache(event.data.payload);
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const urls = await getCachedUrls();
      const target = await findReachableUrl(urls);

      if (target) {
        return Response.redirect(target, 302);
      }

      return new Response(
        `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>연결 중...</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #f4f6f8;
    }
    .box {
      text-align: center; padding: 48px 40px; background: #fff;
      border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.08);
      max-width: 380px; width: 90%;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h2 { color: #03C75A; font-size: 20px; margin-bottom: 12px; }
    p { color: #666; font-size: 14px; line-height: 1.7; }
    button {
      margin-top: 24px; padding: 12px 32px;
      background: #03C75A; color: #fff; border: none;
      border-radius: 8px; font-size: 15px; cursor: pointer;
      font-weight: 600; transition: opacity .15s;
    }
    button:hover { opacity: .88; }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">📡</div>
    <h2>서버에 연결할 수 없습니다</h2>
    <p>네트워크 상태를 확인하거나<br>잠시 후 다시 시도해주세요.</p>
    <button onclick="window.location.reload()">다시 시도</button>
  </div>
</body>
</html>`,
        {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    })
  );
});
