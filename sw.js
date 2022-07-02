"use strict";

const cacheName = "Kudasai-Collection"; //nombre con el que se guardará en caché

//Recursos que queremos almacenar
const recursos = [
  "/",
  "index.html",
  "css/styles.css",
  "css/bootstrap.css",
  "js/main.js",
  "js/bootstrap.js",
  "img/capricorn.jpg",
  "img/predestinada.jpg",
  "img/deathnote.jpg",
  "img/wonderful.jpg",
  "img/firepunch.jpg",
  "img/museum.jpg",
  "img/century.jpg",
  "img/pesadillas.jpg",
  "img/lupa.png",
  "img/lupa2.png",
  "img/banner.png",
  "img/bannerperfil.png",
  "img/foto.png",
  "img/online.png",
  "img/offline.png",
  "img/notfound.png",
  "img/compartir.png",
  "img/compartirhover.png",
  "img/leido.png",
  "img/leidohover.png",
  "img/quiero.png",
  "img/quierohover.png",
  "img/ver.png",
  "img/luego.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  //Precaching
  event.waitUntil(
    // elimina inmediatamente el sw existente y activa el nuevo, omitiendo el estado de espera normal.
    caches.open(cacheName).then((cache) => {
      cache.addAll(recursos);
    })
  );
});

//Deteccion del evento fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => {
      if (res) {
        return res;
      }
      let requestToCache = event.request.clone();
      // se clona porque una solicitud es un flujo que solo se pude consumir una vez
      return fetch(requestToCache).then((res) => {
        if (!res || res.status !== 200) {
          //si la solicitud falla o el servidor responde con un codigo de error, devolverlo inmediatamente.
          return res;
        }
        let responseToCache2 = res.clone(); // clonamos la respuesta porque necesitamos agregarla al cache y porque se usa para la respuesta final
        caches.open(cacheName).then((cache) => {
          cache.put(requestToCache, responseToCache2); //añadimos respuesta en cache
        });
        return res;
      });
    })
  );
});

//Escuchamos el evento push para mostrar las notificaciones
self.addEventListener("push", function (pushEvent) {
  let title = pushEvent.data.text();

  let options = {
    body: "Nuevo comic en tu cuenta de Kudasai!",
    icon: "img/icon-192x192.png",
    vibrate: [300, 100, 300],
    data: { id: 1 },
    actions: [
      { action: "Genial!", title: "Ver comic", icon: "img/ver.png" },
      { action: "Oh no!", title: "Ver luego", icon: "img/luego.png" },
    ],
  };

  pushEvent.waitUntil(self.registration.showNotification(title, options)); //sobre el pushEvent que capturamos le decimos que no se termine de ejecutar hasta que aparezca el title y options
});

// para saber cuando el usuario hizo click en algun evento de notificacion
self.addEventListener("notificationclick", function (notificationEvent) {
  if (notificationEvent.action === "Genial!") {
    console.log("El usuario clickeo en Ver comic");
  } else if (notificationEvent.action === "Oh no!") {
    console.log("El usuario clickeo en Ver luego");
  }
  notificationEvent.notification.close();
});
