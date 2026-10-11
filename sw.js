const CACHE_NAME = “btcjudge-v3”;
const APP_FILES = [”./”, “./index.html”, “./manifest.json”];

self.addEventListener(“install”, (event) => {
event.waitUntil(
caches.open(CACHE_NAME)
.then((cache) => cache.addAll(APP_FILES))
.then(() => self.skipWaiting())
);
});

self.addEventListener(“activate”, (event) => {
event.waitUntil(
caches.keys()
.then((keys) =>
Promise.all(
keys
.filter((key) => key.startsWith(“btcjudge-”) && key !== CACHE_NAME)
.map((key) => caches.delete(key))
)
)
.then(() => self.clients.claim())
);
});

self.addEventListener(“fetch”, (event) => {
const request = event.request;
const url = new URL(request.url);

// 外部サイトやWorkerへの通信には干渉しない
if (url.origin !== self.location.origin || request.method !== “GET”) {
return;
}

// アプリ本体はネットワーク優先で取得
if (request.mode === “navigate” || url.pathname.endsWith(”/index.html”)) {
event.respondWith(
fetch(request, { cache: “no-store” })
.then((response) => {
if (response.ok) {
const copy = response.clone();
caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
}
return response;
})
.catch(() => caches.match(request).then((cached) => cached || caches.match(”./index.html”)))
);
return;
}

// その他のファイルはキャッシュ優先
event.respondWith(
caches.match(request).then((cached) => cached || fetch(request))
);
});
