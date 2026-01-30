const CACHE_NAME = 'survival-timer-v3'; // 再次升级版本号以确保触发更新
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn-icons-png.flaticon.com/512/3563/3563411.png'
];

// 安装阶段：强制缓存所有资源
self.addEventListener('install', (e) => {
  // 强制接管，不等待旧的 SW 退出
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('正在预缓存关键资源...');
      // 使用相对路径和绝对路径结合，确保在不同环境下都能缓存成功
      return Promise.allSettled(
        ASSETS.map(url => cache.add(new Request(url, { cache: 'reload' })))
      );
    })
  );
});

// 激活阶段：彻底清理旧缓存并通知页面
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('清理旧缓存:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // 立即接管所有受控页面
      return self.clients.claim();
    })
  );
});

// 拦截请求：实现秒开的关键
self.addEventListener('fetch', (e) => {
  // 只处理 GET 请求
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((response) => {
      // 如果缓存中有，直接返回
      if (response) return response;

      // 如果缓存没有，尝试联网
      return fetch(e.request).then((fetchRes) => {
        // 如果是有效的请求，可以考虑动态加入缓存（此处暂不增加复杂度）
        return fetchRes;
      }).catch(() => {
        // 彻底离线且没缓存时的终极保底
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});
