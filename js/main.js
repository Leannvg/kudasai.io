"use strict";

window.addEventListener("load", function () {
  if ("serviceWorker" in navigator) {
    //verificar si el objeto navigator tiene una propiedad llamada serviceWorker
    navigator.serviceWorker
      .register("sw.js") //registra el Service Worker
      .then((res) => console.log("SW registrado", res))
      .catch((err) => console.error("SW no registrado", err));
  }

  let enCache = [];

  let urlString = window.location.href;
  let url = new URL(urlString);
  let comicId = url.searchParams.get("id");

  let share = (e) => {
    let titleShare = e.target.dataset.title;
    let textShare = e.target.dataset.text;
    let urlShare = e.target.dataset.url;

    let infoShare = {
      title: titleShare,
      text: textShare,
      url: urlShare,
    };

    navigator
      .share(infoShare) //share del navegador
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  fetch("api/comics.json")
    .then((res) => res.json())
    .then((comics) => {
      //Buscador y botón lupa
      let input = document.querySelector("#buscador");
      let btnFiltrar = document.querySelector("#filtrar");

      let resultado = document.querySelector("#resultado");
      let catalogoHome = document.querySelector("#catalogoHome");
      let paginacion = document.querySelector("#paginacion");

      // Botones para filtrar por editorial
      let btnTodos = document.querySelector("#todos");
      let btnEditorial = document.querySelectorAll(".editorial");

      const filtrar = (e) => {
        let tipo = e.target.className == "editorial" ? 1 : 2;
        catalogoHome.setAttribute("class", "d-none");
        paginacion.setAttribute("class", "d-none");
        resultado.setAttribute("class", "row w-100 d-flex");

        resultado.innerHTML = "";

        const texto = input.value.toLowerCase();

        for (let comic of comics) {
          if (tipo == 1) {
            // buscamos por editorial
            if (comic.editorial == e.target.textContent) {
              cargarComics(comic, resultado);
            }
          } else {
            // buscamos por nombre
            if (comic.titulo.toLowerCase().indexOf(texto) !== -1) {
              cargarComics(comic, resultado);
            }
          }
        }

        detalles();

        if (resultado.innerHTML === "") {
          resultado.innerHTML +=
            '<h2 class="notfound">Oops! No se encontro el comic :(</h2>';
        }
      };

      btnEditorial.forEach((editoriales) => {
        editoriales.addEventListener("click", filtrar);
      });

      btnFiltrar.addEventListener("click", filtrar);

      const todos = () => {
        catalogoHome.setAttribute("class", "d-block");
        paginacion.setAttribute("class", "d-block");
        resultado.setAttribute("class", "row w-100 d-none");
        input.value = "";
      };

      btnTodos.addEventListener("click", todos);

      //Busqueda por paginación de hasta 8 comics

      let catalogo = document.getElementById("catalogo");
      let anterior = document.getElementById("anterior");
      let siguiente = document.getElementById("siguiente");

      let inicio = 0;
      let limite = 8;

      verificarComics(inicio, limite);

      anterior.addEventListener("click", (e) => {
        e.preventDefault();
        if (inicio != 0) {
          inicio -= 8;
          limite -= 8;
          removeChildNodes(catalogo);
          verificarComics(inicio, limite);
          detalles();
        }
      });

      siguiente.addEventListener("click", (e) => {
        e.preventDefault();
        if (limite < comics.length) {
          inicio += 8;
          limite += 8;
          removeChildNodes(catalogo);
          verificarComics(inicio, limite);
          detalles();
        }
      });

      function verificarComics(inicio, limite) {
        anterior.style.display = inicio == 0 ? "none" : "block";
        siguiente.style.display = limite >= comics.length ? "none" : "block";
        for (let i = inicio; i < limite; i++) {
          cargarComics(comics[i], catalogo);
        }
      }

      //Cargar comics segun busqueda por paginación

      function cargarComics(comic, contenedor) {
        if (localStorage.getItem("enCache") != null) {
          enCache = JSON.parse(localStorage.getItem("enCache"));
        }

        let div = document.createElement("div");
        div.setAttribute("class", "card");
        let body = document.createElement("div");
        body.setAttribute("class", "card-body d-flex flex-column");
        let h2 = document.createElement("h2");
        h2.setAttribute("class", "card-title h5");
        h2.innerHTML = comic.titulo;
        let p = document.createElement("p");
        p.setAttribute("class", "card-subtitle mb-2 text-muted fs-h6");
        p.innerHTML = comic.editorial;

        if (navigator.onLine || enCache.indexOf(comic.id) != -1) {
          if (enCache.indexOf(comic.id) == -1) {
            enCache.push(comic.id);
          }
          let img = document.createElement("img");
          img.setAttribute("class", "card-img-top portadas");
          img.setAttribute("src", comic.imagen);
          img.setAttribute("alt", comic.titulo);
          div.appendChild(img);
        } else {
          let notfound = document.createElement("img");
          notfound.setAttribute("class", "card-img-top portadas");
          notfound.setAttribute("src", "img/notfound.png");
          notfound.setAttribute("alt", "Imagen no disponible");
          div.appendChild(notfound);
          /* let aviso = document.createElement("p");
          aviso.innerHTML = "Imagen no disponible";
          div.appendChild(aviso); */
        }
        body.appendChild(h2);
        body.appendChild(p);
        div.appendChild(body);
        contenedor.appendChild(div);

        localStorage.setItem("enCache", JSON.stringify(enCache));
      }

      // LocalStorage

      let coleccion = {
        imagenes: [],
        mangas: [],
        volumenes: [],
        pendientes: [],
        leidos: 0,
        total: 0,
      };

      if (localStorage.coleccion) {
        coleccion = JSON.parse(localStorage.coleccion);
      } else {
        localStorage.coleccion = JSON.stringify(coleccion);
      }

      // Remover Contenido //

      function removeChildNodes(nodoPadre) {
        while (nodoPadre.firstChild) {
          nodoPadre.removeChild(nodoPadre.firstChild);
        }
      }

      // Cambio de contenido en pantalla
      let btnkudasai = document.querySelector(".home");
      let home = document.querySelector("#home");
      let section = document.querySelector("section");
      let detalle = document.querySelector("#detalle");
      let bannerPerfil = document.querySelector(".nameperfil");
      let perfil = document.querySelector("#perfil");

      btnkudasai.addEventListener("click", function () {
        removeChildNodes(detalle);
        bannerPerfil.setAttribute("class", "container nameperfil d-none");
        detalle.setAttribute("class", "d-none");
        section.setAttribute("class", "d-block");
        home.setAttribute("class", "d-block");
        perfil.setAttribute("class", "container d-none");

        location.reload();
      });

      detalles();

      // Mostrar detalle de comic clickeado
      function detalles() {
        let portadas = document.querySelectorAll(".portadas");

        for (let portada of portadas) {
          portada.addEventListener("click", function () {
            bannerPerfil.setAttribute("class", "container nameperfil d-none");
            detalle.setAttribute("class", "d-block");
            removeChildNodes(detalle);
            section.setAttribute("class", "d-none");
            home.setAttribute("class", "d-none");
            perfil.setAttribute("class", "container d-none");

            let titulo =
              portada.nextElementSibling.firstElementChild.textContent;

            for (let comic of comics) {
              if (titulo == comic.titulo) {
                cargarDetalle(comic);
              }
            }
          });
        }
      }

      // Botón Mi Perfil
      let btnperfil = document.querySelector("#btnperfil");

      btnperfil.addEventListener("click", function () {
        bannerPerfil.setAttribute("class", "container nameperfil d-block");
        home.setAttribute("class", "d-none");
        section.setAttribute("class", "d-block");
        removeChildNodes(detalle);
        detalle.setAttribute("class", "d-none");
        perfil.setAttribute("class", "container d-block");

        let contadorComics = document.querySelector("#contadorComics");
        contadorComics.textContent = coleccion.mangas.length + " Comics";

        detalles();
      });

      // Armado de página de detalle
      function cargarDetalle(comic) {
        if (localStorage.getItem("enCache") != null) {
          enCache = JSON.parse(localStorage.getItem("enCache"));
        }

        let detalle = document.querySelector("#detalle");

        let div = document.createElement("div");
        div.setAttribute("class", "container detalleComic mt-5 mb-5");
        let divImg = document.createElement("div");
        divImg.setAttribute("class", "imagen");

        if (navigator.onLine || enCache.indexOf(comic.id) != -1) {
          if (enCache.indexOf(comic.id) == -1) {
            enCache.push(comic.id);
          }
          let img = document.createElement("img");
          img.setAttribute("src", comic.imagen);
          img.setAttribute("alt", comic.titulo);
          divImg.appendChild(img);
        } else {
          let notfound = document.createElement("img");
          notfound.setAttribute("src", "img/notfound.png");
          notfound.setAttribute("alt", "Imagen no disponible");
          divImg.appendChild(notfound);
        }

        let divInfo = document.createElement("div");
        divInfo.setAttribute("class", "detalleTexto");

        let divTitulo = document.createElement("div");
        divTitulo.setAttribute("class", "d-flex mb-4 justify-content-between");
        let h2 = document.createElement("h2");
        h2.setAttribute("class", "titulodetalle");
        h2.innerHTML = comic.titulo;
        let btnLoQuiero = document.createElement("a");
        btnLoQuiero.setAttribute("class", "btnloquiero");
        btnLoQuiero.setAttribute("href", "#");
        btnLoQuiero.innerHTML = "Lo quiero!";

        let btnShare = document.createElement("a");
        btnShare.setAttribute("class", "btnshare");
        btnShare.setAttribute("href", "#");
        btnShare.setAttribute("data-title", comic.titulo);
        btnShare.setAttribute("data-text", comic.argumento);
        btnShare.setAttribute(
          "data-url",
          "http://localhost/kudasai/?id=" + comic.id
        );
        btnShare.innerHTML = "Compartir";

        btnShare.addEventListener("click", share);

        for (let i = 0; i < coleccion.mangas.length; i++) {
          if (coleccion.mangas[i] == comic.titulo) {
            btnLoQuiero.setAttribute("class", "btnlotengo");
            btnLoQuiero.innerHTML = "Lo tengo!";
          }
        }

        btnLoQuiero.addEventListener("click", function (e) {
          //Detengo la ejecucion default del elemento
          e.preventDefault();

          if (btnLoQuiero.innerHTML == "Lo quiero!") {
            btnLoQuiero.setAttribute("class", "btnlotengo");
            btnLoQuiero.innerHTML = "Lo tengo!";
          } else {
            btnLoQuiero.setAttribute("class", "btnloquiero");
            btnLoQuiero.innerHTML = "Lo quiero!";
          }
        });

        btnLoQuiero.addEventListener("click", agregarComic);

        let divArgumento = document.createElement("div");
        divArgumento.setAttribute("class", "argumento");
        let h3 = document.createElement("h3");
        h3.innerHTML = "Argumento";
        let p = document.createElement("p");
        p.innerHTML = comic.argumento;

        let divDetalles = document.createElement("div");
        divDetalles.setAttribute("class", "d-flex");

        let detalle1 = document.createElement("div");
        detalle1.setAttribute("class", "detalles1");
        let autor = document.createElement("h3");
        autor.innerHTML = "Autores";
        let autorDetalle = document.createElement("p");
        autorDetalle.innerHTML = comic.autor;
        let editorial = document.createElement("h3");
        editorial.innerHTML = "Editorial";
        let editorialDetalle = document.createElement("p");
        editorialDetalle.innerHTML = comic.editorial;

        let detalle2 = document.createElement("div");
        detalle2.setAttribute("class", "detalles2");
        let publicacion = document.createElement("h3");
        publicacion.innerHTML = "Fecha de publicación";
        let publiDetalle = document.createElement("p");
        publiDetalle.innerHTML = comic.publicacion;
        let volumenes = document.createElement("h3");
        volumenes.innerHTML = "Volumenes";
        let volumenDetalle = document.createElement("p");
        volumenDetalle.innerHTML = comic.volumenes;

        let divBotones = document.createElement("div");
        divBotones.setAttribute("class", "mt-5 d-flex justify-content-between");
        let leido = document.createElement("a");
        leido.setAttribute("class", "btnleido");
        leido.setAttribute("href", "#");
        leido.innerHTML = "Leer";

        leido.addEventListener("click", function (e) {
          //Detengo la ejecucion default del elemento
          e.preventDefault();
          for (let i = 0; i < coleccion.mangas.length; i++) {
            if (coleccion.mangas[i] == comic.titulo) {
              if (coleccion.pendientes[i] == "Leer") {
                coleccion.pendientes[i] = "Leido";
              } else {
                coleccion.pendientes[i] = "Leer";
              }
              localStorage.coleccion = JSON.stringify(coleccion);
            }
          }

          //Array de comics marcados como leidos
          leidos = coleccion.pendientes.filter(ComicsLeidos);

          function ComicsLeidos(leido) {
            return leido == "Leido";
          }

          let contadorLeidos = document.querySelector("#contadorLeidos");
          contadorLeidos.textContent = leidos.length + " Leídos";

          coleccion.leidos = leidos.length;
          localStorage.coleccion = JSON.stringify(coleccion);

          if (leido.innerHTML == "Leer") {
            leido.setAttribute("class", "btnleer");
            leido.innerHTML = "Leído";
          } else {
            leido.setAttribute("class", "btnleido");
            leido.innerHTML = "Leer";
          }
        });

        for (let i = 0; i < coleccion.mangas.length; i++) {
          if (coleccion.mangas[i] == comic.titulo) {
            if (coleccion.pendientes[i] == "Leido") {
              leido.setAttribute("class", "btnleer");
              leido.innerHTML = "Leído";
            } else {
              leido.setAttribute("class", "btnleido");
              leido.innerHTML = "Leer";
            }
          }
        }

        /* divImg.appendChild(img); */
        div.appendChild(divImg);

        divBotones.appendChild(btnShare);
        divBotones.appendChild(leido);

        detalle1.appendChild(editorial);
        detalle1.appendChild(editorialDetalle);
        detalle1.appendChild(autor);
        detalle1.appendChild(autorDetalle);
        divDetalles.appendChild(detalle1);

        detalle2.appendChild(volumenes);
        detalle2.appendChild(volumenDetalle);
        detalle2.appendChild(publicacion);
        detalle2.appendChild(publiDetalle);
        divDetalles.appendChild(detalle2);

        divArgumento.appendChild(h3);
        divArgumento.appendChild(p);

        divTitulo.appendChild(h2);
        divTitulo.appendChild(btnLoQuiero);

        divInfo.appendChild(divTitulo);
        divInfo.appendChild(divArgumento);
        divInfo.appendChild(divDetalles);
        divInfo.appendChild(divBotones);

        div.appendChild(divInfo);
        detalle.appendChild(div);

        localStorage.setItem("enCache", JSON.stringify(enCache));
      }

      for (let comic of comics) {
        if (comicId == comic.id) {
          bannerPerfil.setAttribute("class", "container nameperfil d-none");
          detalle.setAttribute("class", "d-block");
          section.setAttribute("class", "d-none");
          home.setAttribute("class", "d-none");
          perfil.setAttribute("class", "container d-none");

          cargarDetalle(comic);
        }
      }

      let leidos = [];

      //Sumar un comic a la colección
      function agregarComic() {
        let imagen = document
          .querySelector(".imagen")
          .firstElementChild.getAttribute("src");
        let titulo = document.querySelector(".titulodetalle").textContent;
        let volumenes =
          document.querySelector(".detalles2").firstElementChild
            .nextElementSibling.textContent;

        let indice = coleccion.mangas.indexOf(titulo);
        let cantidad = coleccion.mangas;
        let pendiente = "Leer";

        let agregados = document.querySelector(".agregados");
        let contenedor = document.querySelectorAll(".coleccion");

        let contadorLeidos = document.querySelector("#contadorLeidos");

        for (let i = 0; i < coleccion.mangas.length; i++) {
          if (coleccion.mangas[i] == titulo) {
            if (
              contenedor[i].lastElementChild.firstElementChild.textContent ==
              coleccion.mangas[i]
            ) {
              agregados.removeChild(contenedor[i]);
            }

            coleccion.imagenes.splice(i, 1);
            coleccion.pendientes.splice(i, 1);

            leidos = coleccion.pendientes.filter(ComicsLeidos);
            function ComicsLeidos(leido) {
              return leido == "Leido";
            }
            contadorLeidos.textContent = leidos.length + " Leídos";

            coleccion.mangas.splice(i, 1);
            coleccion.volumenes.splice(i, 1);
            coleccion.leidos = leidos.length;
            coleccion.total = cantidad.length;
          }
        }

        if (indice == -1) {
          coleccion.imagenes.push(imagen);
          coleccion.mangas.push(titulo);
          coleccion.volumenes.push(volumenes);
          coleccion.pendientes.push(pendiente);
          coleccion.total = cantidad.length;

          cargarColeccion(
            imagen,
            titulo,
            volumenes,
            cantidad.length,
            leidos.length
          );
        }

        localStorage.coleccion = JSON.stringify(coleccion);
      }

      for (let i = 0; i < coleccion.mangas.length; i++) {
        cargarColeccion(
          coleccion.imagenes[i],
          coleccion.mangas[i],
          coleccion.volumenes[i],
          coleccion.total,
          coleccion.leidos
        );
      }

      function cargarColeccion(imagen, titulo, volumenes, cantidad, leidos) {
        let contadorComics = document.querySelector("#contadorComics");
        contadorComics.textContent = cantidad + " Comics";
        let contadorLeidos = document.querySelector("#contadorLeidos");
        contadorLeidos.textContent = leidos + " Leídos";
        let agregados = document.querySelector(".agregados");
        let comicAgregado = document.createElement("div");
        comicAgregado.setAttribute("class", "coleccion");
        let imgComic = document.createElement("img");
        imgComic.setAttribute("src", imagen);
        imgComic.setAttribute("alt", titulo);
        imgComic.setAttribute("class", "portadas");
        let infoComic = document.createElement("div");
        infoComic.setAttribute("class", "d-flex flex-column");
        let tituloComic = document.createElement("h2");
        tituloComic.setAttribute("class", "mt-3 h5");
        tituloComic.innerHTML = titulo;
        let tomosComic = document.createElement("p");
        tomosComic.setAttribute("class", "mb-2 text-muted fs-h6");
        tomosComic.innerHTML = volumenes;

        infoComic.appendChild(tituloComic);
        infoComic.appendChild(tomosComic);
        comicAgregado.appendChild(imgComic);
        comicAgregado.appendChild(infoComic);
        agregados.appendChild(comicAgregado);
      }

      // CONEXIÓN
      let OnLineStatus = () => {
        if (navigator.onLine != true) {
          document.getElementById("conexion").innerHTML = "Conexión";
          document.getElementById("conexion").style.color =
            "rgba(255,255,255,.55)";
          document.querySelector(".share-app").style.display = "none";
          document.getElementById("offline").style.display = "block";
          document.getElementById("online").style.display = "none";
        } else if (navigator.onLine == true) {
          document.getElementById("conexion").innerHTML = "Conexión";
          document.getElementById("conexion").style.color =
            "rgba(255,255,255,.55)";
          document.querySelector(".share-app").style.display = "block";
          document.getElementById("offline").style.display = "none";
          document.getElementById("online").style.display = "block";
          //Verificación de imagen no encontrada en perfil
          for (let comic of comics) {
            for (let i = 0; i < coleccion.imagenes.length; i++) {
              if (coleccion.imagenes[i] == "img/notfound.png") {
                if (comic.titulo == coleccion.mangas[i]) {
                  coleccion.imagenes[i] = comic.imagen;
                }
              }
              localStorage.coleccion = JSON.stringify(coleccion);
            }
          }
        }
      };

      OnLineStatus();
      //Escuchamos los eventos online / offline para conocer el estado de la conexión
      window.addEventListener("online", OnLineStatus); // si hay conexión dara un true
      window.addEventListener("offline", OnLineStatus); // si no hay conexión dara un false
    });

  // INSTALAR APLICACION
  let eventInstall;
  let botonInstall = document.querySelector(".install-app");

  let InstallApp = () => {
    if (eventInstall) {
      // chequeamos que tenga algo en el event Install
      eventInstall.prompt(); // la funcion prompt ejecuta la promesa y usa el choice
      eventInstall.userChoice // espera a que el usuario responda, devuelve una promesa con el resultado
        .then((res) => {
          if (res.outcome == "accepted") {
            console.log("El usuario instalo la App");
            botonInstall.style.display = "none"; // se oculta el boton de instalacion
          } else {
            console.log("El usuario no instalo la App");
          }
        });
    }
  };

  let ShowInstallButton = () => {
    if (botonInstall != "undefined") {
      botonInstall.style.display = "flex";
      botonInstall.addEventListener("click", InstallApp);
    }
  };

  window.addEventListener("beforeinstallprompt", (e) => {
    // beforeinstallprompt Se activa cuando se cumplen los requisitos para desencadenar una experiencia de adición a la pantalla de inicio
    e.preventDefault(); // evita que chrome 67 y vers. anteriores muestren automaticamente el aviso
    eventInstall = e; // guardamos el evento para que pueda activarse mas tarde
    ShowInstallButton();
  });

  // COMPARTIR APLICACION
  let shareApp = document.querySelector(".share-app");

  if (shareApp != undefined) {
    shareApp.addEventListener("click", share);
  }

  // Solicitamos permiso para enviar notificaciones
  if (window.Notification && window.Notification.permission !== "denied") {
    //pregunto si existe el objeto notification // y si si existe el permission denied
    setTimeout(() => {
      Notification.requestPermission().then((res) => console.log(res));
    }, 10000);
  }
});
