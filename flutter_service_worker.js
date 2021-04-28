'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "6b083db73c7f83adc4d11063ee536728",
"index.html": "7e0ab9dde3b768e54048f058bfb9ed08",
"/": "7e0ab9dde3b768e54048f058bfb9ed08",
"main.dart.js": "b78ec372e7a38d1357faee01e4cda11e",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "34ed558417f27d567380b805ab514e11",
"assets/AssetManifest.json": "3a2cbbd099949cf33b8a91b60cdfe657",
"assets/NOTICES": "cc2f0d5bd06387f149bea3053d4d28a2",
"assets/FontManifest.json": "a3f5cd6b5c777a5de8f18d3bd1f08da3",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/assets/responsive/MediumScreen/flutterdayindiposterIPAD.svg": "f1bd894ed6602f2459b38bf19f5e2f22",
"assets/assets/responsive/FlutterDayIndiaMobilePoster.svg": "50d4c6359c2944bedf0bc8ee4984f5fc",
"assets/assets/images/svg/gdgpower.svg": "f1b7662e066e4bcd0905b01bbfbfb91a",
"assets/assets/images/svg/flutterdayIndia.svg": "cd79bbc17e52f012bebe27426a28bd79",
"assets/assets/images/svg/youtube.svg": "c2f9dff239f42fa393100fb065eaf79c",
"assets/assets/images/svg/LinkdIn.svg": "a765798aeb26295b08ff300a1ec8d17a",
"assets/assets/images/svg/FlutterDayIndiaPoster.svg": "06048b4dd14461c414ed9d5a24a08618",
"assets/assets/images/svg/flutterlogo.svg": "4a0be29c350f1e01ba88fda258e0fd43",
"assets/assets/images/socialIcons/meetup.png": "7074273ed118c49cfcf42cf94e45fbb7",
"assets/assets/images/socialIcons/Youtube_Icon.png": "1be360384b17d71469c342d7e777b059",
"assets/assets/images/socialIcons/add_to_slack.png": "a333a01b236e1ce2f2920963496c41e4",
"assets/assets/images/socialIcons/twitter.png": "1dec5847bd57aec3f54ce6ad3087d92e",
"assets/assets/images/socialIcons/youtube.png": "bd19288cf524ccbd6c5226f0bf83f2eb",
"assets/assets/images/socialIcons/facebook.png": "079d7215d66abc03002cc4f1e85cb04a",
"assets/assets/json/organizer.json": "4a7fbcf5660ecff3800fd0a04d7d1d10",
"assets/assets/fonts/ProductSans-Regular.ttf": "af98833e80c029f42e7e7a55d8270fdf",
"assets/assets/animations/mypersonalLogo.gif": "1062ffe1819e9aa70e9c6cbb3074ac87",
"assets/assets/animations/study.gif": "3c19d4c077395d9ddb81b492e48593da",
"assets/assets/animations/ghost.gif": "1fcdbf896b2d0e573d7caa8bf7715098"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
