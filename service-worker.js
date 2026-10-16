const CACHE = "so-tay-dien-thoai-v11";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./data/phonebook.json", "./manifest.webmanifest", "./assets/logo-tphcm.png", "./assets/app-icon.svg", "./assets/trong-dong-background.png"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
