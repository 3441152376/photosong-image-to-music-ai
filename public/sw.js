const CACHE_NAME = 'photo-song-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const OFFLINE_PAGE = '/offline.html';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/css/app.css',
  '/js/app.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(CACHE_NAME).then(cache => {
        console.log('Caching offline page');
        return cache.add(OFFLINE_PAGE);
      })
    ])
  );
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => {
            // 清除所有旧缓存，包括可能包含 UEditor 引用的缓存
            return !key.startsWith('photo-song-v') && 
                   !key.startsWith('static-v') && 
                   !key.startsWith('dynamic-v');
          })
          .map(key => {
            console.log('Deleting old cache', key);
            return caches.delete(key);
          })
      );
    })
  );
  return self.clients.claim();
});

// 处理请求
self.addEventListener('fetch', event => {
  // 跳过不需要缓存的请求
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/auth/') ||
    event.request.url.includes('/payment/')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // 返回缓存的响应
      if (response) {
        return response;
      }

      // 克隆请求
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then(response => {
          // 检查响应是否有效
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应
          const responseToCache = response.clone();

          // 只缓存http和https请求
          if (event.request.url.startsWith('http')) {
            // 缓存响应
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // 离线时返回离线页面
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_PAGE);
          }
        });
    })
  );
});

// 后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-music') {
    event.waitUntil(syncMusic());
  }
});

// 推送通知
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看详情'
      },
      {
        action: 'close',
        title: '关闭'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Photo Song', options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 定期清理缓存
const cleanupCache = async () => {
  const keys = await caches.keys();
  const deletePromises = keys.map(key => {
    if (key !== CACHE_NAME && key !== STATIC_CACHE) {
      return caches.delete(key);
    }
  });
  return Promise.all(deletePromises);
};

// 每天清理一次缓存
setInterval(cleanupCache, 24 * 60 * 60 * 1000); 