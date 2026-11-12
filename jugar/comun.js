/* Calificador IA — Juegos para clase: marco común (pregunta, opciones, vidas, puntos, sonido y resultados).
   Cada juego (laberinto, plataformas…) solo dibuja su mundo y avisa qué opción eligió el jugador.
   No depende del resto de la app: también servirá para jugar desde el celular. Diseñado por Lic. Salvador Ortega Pardo. */
"use strict";

const JUEGOS = {};                 // clave -> { nombre, descripcion, icono, crear(ctx) }
const LETRAS_OPCION = ["A", "B", "C", "D"];
const COLORES_OPCION = ["#e5484d", "#3b82f6", "#f5b400", "#22a55b"];

/* ---------------------------------------------------------------- sonidos (chiptune con WebAudio) */
const Sonido = {
  activo: true, ctx: null,
  _ctx() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ctx = null; } } return this.ctx; },
  nota(frec, dur = 0.1, tipo = "square", vol = 0.06, cuando = 0) {
    if (!this.activo) return;
    const c = this._ctx(); if (!c) return;
    const t = c.currentTime + cuando, o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(frec, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  correcto() { [523, 659, 784, 1047].forEach((f, i) => this.nota(f, 0.12, "square", 0.06, i * 0.08)); },
  error() { [330, 262, 196].forEach((f, i) => this.nota(f, 0.16, "sawtooth", 0.05, i * 0.11)); },
  golpe() { this.nota(140, 0.25, "sawtooth", 0.07); this.nota(90, 0.3, "square", 0.05, 0.08); },
  salto() { const c = this._ctx(); if (!c || !this.activo) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = "square"; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.12);
    g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.16); },
  moneda() { this.nota(988, 0.06, "square", 0.04); this.nota(1319, 0.12, "square", 0.04, 0.06); },
  punto() { this.nota(880, 0.03, "triangle", 0.03); },
  pisar() { this.nota(220, 0.08, "square", 0.05); this.nota(440, 0.08, "square", 0.04, 0.05); },
  fin() { [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this.nota(f, 0.16, "square", 0.05, i * 0.13)); },
};

/* ---------------------------------------------------------------- dibujo pixel */
/* Sprite a partir de filas de texto: cada carácter es un color de la paleta ("." = transparente). */
function spritePixel(filas, paleta, escala = 1) {
  const c = document.createElement("canvas");
  c.width = filas[0].length * escala; c.height = filas.length * escala;
  const g = c.getContext("2d");
  filas.forEach((f, y) => [...f].forEach((ch, x) => {
    if (ch !== "." && paleta[ch]) { g.fillStyle = paleta[ch]; g.fillRect(x * escala, y * escala, escala, escala); }
  }));
  return c;
}
/* Letra pixel 5x7 para dibujar A, B, C, D y «?» dentro del mundo del juego. */
const FUENTE_PIXEL = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"], D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"], "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
};
function letraPixel(g, letra, x, y, color, tam = 1) {
  const m = FUENTE_PIXEL[letra]; if (!m) return;
  g.fillStyle = color;
  m.forEach((f, j) => [...f].forEach((b, i) => { if (b === "1") g.fillRect(x + i * tam, y + j * tam, tam, tam); }));
}
/* Ajusta el canvas a su caja. Se dibuja en coordenadas del juego (ancho × alto) pero el lienzo real tiene la
   resolución de la pantalla (escala entera): el pixel art sale nítido y los textos, legibles. */
function ajustarLienzo(canvas, ancho, alto) {
  const caja = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const css = Math.max(0.5, Math.min(caja.width / ancho, caja.height / alto) || 1);   // ocupa todo el espacio disponible
  const k = Math.max(1, Math.ceil(css * dpr));                                       // se dibuja al menos a la resolución mostrada
  canvas.width = ancho * k; canvas.height = alto * k;
  canvas.style.width = `${Math.floor(ancho * css)}px`; canvas.style.height = `${Math.floor(alto * css)}px`;
  const g = canvas.getContext("2d");
  g.setTransform(k, 0, 0, k, 0, 0); g.imageSmoothingEnabled = false;
  return g;
}
/* Texto legible dentro del lienzo (con sombra). */
function textoJuego(g, s, x, y, tam, color, { alinear = "center", peso = 800, sombra = "rgba(10,12,40,.9)" } = {}) {
  g.font = `${peso} ${tam}px "Segoe UI", system-ui, sans-serif`; g.textAlign = alinear; g.textBaseline = "middle";
  if (sombra) { g.fillStyle = sombra; g.fillText(s, x + 0.6, y + 0.8); }
  g.fillStyle = color; g.fillText(s, x, y);
}

/* ---------------------------------------------------------------- partida */
function barajar(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* Partida completa. Reglas: cada respuesta equivocada (o pregunta sin responder a tiempo) quita una vida, igual que un
   enemigo; sin vidas, el juego TERMINA y lo que faltaba cuenta como incorrecto.
   Opciones: vidas · tiempo (segundos por pregunta; por defecto el del juego) · repetir («Jugar otra vez») ·
   sinSalir (oculta ✕, paquete para Moodle) · alProgreso(r) tras cada respuesta · alTerminar(r) una vez · alSalir(r) */
function jugar(paquete, clave, { alSalir = () => {}, alTerminar = () => {}, alProgreso = () => {}, mezclar = true, vidas = 3, tiempo = 0,
                                 repetir = true, sinSalir = false, mensajeFinal = "" } = {}) {
  const def = JUEGOS[clave];
  if (!def) throw new Error("Juego no disponible.");
  const limite = tiempo || def.tiempo || 45;
  // estos juegos usan preguntas de opciones (opción múltiple y verdadero/falso); los otros tipos son para el Quiz y la Torre en vivo
  const deOpciones = (paquete.preguntas || []).filter((q) => (!q.tipo || q.tipo === "opcion" || q.tipo === "vf") && (q.opciones || []).length >= 2 && q.correcta >= 0);
  if (!deOpciones.length) throw new Error("Este juego no tiene preguntas de opción múltiple o verdadero/falso (los otros tipos se juegan en el Quiz en vivo).");
  const preguntas = (mezclar ? barajar(deOpciones) : deOpciones).map((q) => {
    // mezcla también las opciones (la correcta cambia de lugar en cada partida)
    const orden = mezclar ? barajar(q.opciones.map((_, i) => i)) : q.opciones.map((_, i) => i);
    return { ...q, opciones: orden.map((i) => q.opciones[i]), correcta: orden.indexOf(q.correcta) };
  });
  const st = { i: 0, puntos: 0, vidas, vidasMax: vidas, aciertos: 0, respuestas: [], esperando: false, pausado: false,
               respondida: false, terminado: false, restante: limite, relojActivo: true, tPregunta: Date.now() };
  const capa = document.createElement("div");
  capa.className = "juego-capa";
  capa.innerHTML = `
    <div class="juego-barra">
      <div class="juego-titulo">${def.icono} ${escJuego(paquete.titulo || def.nombre)}</div>
      <div class="juego-marcador"><span class="juego-vidas"></span><span class="juego-puntos">0</span><span class="juego-progreso"></span></div>
      <div class="juego-botones">
        <button data-j="sonido" title="Sonido">🔊</button><button data-j="pausa" title="Pausa (P)">⏸</button>
        <button data-j="pantalla" title="Pantalla completa (F)">⛶</button>${sinSalir ? "" : `<button data-j="salir" title="Salir (Esc)">✕</button>`}</div>
    </div>
    <div class="juego-pregunta"><div class="juego-pregunta-texto"></div><div class="juego-reloj"><i></i><span></span></div></div>
    <div class="juego-cuerpo"><div class="juego-lienzo"><canvas></canvas><div class="juego-mando"></div></div><div class="juego-opciones"></div></div>
    <div class="juego-aviso oculto"></div>`;
  document.body.appendChild(capa);
  const $j = (s) => capa.querySelector(s);
  const aviso = $j(".juego-aviso");

  const pintarMarcador = () => {
    $j(".juego-vidas").innerHTML = Array.from({ length: Math.max(st.vidasMax, st.vidas) }, (_, k) => `<i class="${k < st.vidas ? "" : "vacia"}">♥</i>`).join("");
    $j(".juego-puntos").textContent = `${st.puntos} pts`;
    $j(".juego-progreso").textContent = `${Math.min(st.i + 1, preguntas.length)} / ${preguntas.length}`;
  };
  const pintarReloj = () => {
    const f = Math.max(0, st.restante / limite);
    const barra = $j(".juego-reloj i");
    barra.style.width = `${f * 100}%`;
    barra.className = f < 0.25 ? "urgente" : "";
    $j(".juego-reloj span").textContent = st.respondida ? "" : `${Math.ceil(st.restante)} s`;
  };
  const pintarPregunta = () => {
    const q = preguntas[st.i];
    const img = q.imagen && paquete.baseImagen ? paquete.baseImagen + q.imagen : "";   // imagen de la pregunta (si la tiene)
    $j(".juego-pregunta-texto").innerHTML = (img ? `<img class="juego-pregunta-img" src="${escJuego(img)}" alt="Imagen de la pregunta" title="Clic para ampliar">` : "")
      + `<span>${escJuego(q.pregunta)}</span>`;
    $j(".juego-opciones").innerHTML = q.opciones.map((o, k) => `<div class="juego-opcion" data-k="${k}">
      <b style="background:${COLORES_OPCION[k]}">${LETRAS_OPCION[k]}</b><span>${escJuego(o)}</span></div>`).join("");
    pintarMarcador(); pintarReloj();
  };
  const mostrarAviso = (html, clase, ms) => new Promise((ok) => {
    aviso.className = `juego-aviso ${clase}`; aviso.innerHTML = html;
    if (ms) setTimeout(() => { aviso.className = "juego-aviso oculto"; ok(); }, ms);
    else ok();
  });
  /* Registra la respuesta (k = null: se acabó el tiempo). Equivocarse quita una vida. */
  const registrar = (k, motivo) => {
    const q = preguntas[st.i], bien = k === q.correcta;
    st.esperando = true; st.respondida = true;
    st.respuestas.push({ pregunta: q.pregunta, elegida: k == null ? null : q.opciones[k], correcta: q.opciones[q.correcta], bien,
                         sinTiempo: motivo === "tiempo", explicacion: q.explicacion });
    capa.querySelectorAll(".juego-opcion").forEach((el) => el.classList.add(+el.dataset.k === q.correcta ? "es-correcta" : +el.dataset.k === k ? "es-error" : "apagada"));
    if (bien) { st.aciertos++; st.puntos += 100 + Math.round(50 * Math.max(0, st.restante) / limite); Sonido.correcto(); }
    else { st.vidas = Math.max(0, st.vidas - 1); Sonido.error(); }
    pintarMarcador(); pintarReloj();
    try { alProgreso(resultado()); } catch (e) { console.error(e); }
    const sinVidas = st.vidas <= 0;
    const titulo = bien ? "¡Correcto! 🎉" : motivo === "tiempo" ? "⏰ ¡Se acabó el tiempo!" : "Incorrecto ❌";
    mostrarAviso(`<div class="juego-aviso-caja"><div class="juego-aviso-titulo">${titulo}</div>
      ${bien ? "" : `<div class="juego-aviso-vida">−1 ♥ ${sinVidas ? "· ¡Sin vidas!" : `· te quedan ${st.vidas}`}</div>`}
      ${bien ? "" : `<div>La respuesta correcta era: <b>${LETRAS_OPCION[q.correcta]}) ${escJuego(q.opciones[q.correcta])}</b></div>`}
      ${q.explicacion ? `<div class="juego-aviso-expl">${escJuego(q.explicacion)}</div>` : ""}</div>`, bien ? "bien" : "mal", bien ? 2000 : 4200)
      .then(() => {
        if (st.terminado) return;
        if (sinVidas) return terminar("vidas");
        st.esperando = false;
        // los juegos con «meta» (plataformas) la abren y avisan con ctx.siguiente(); los demás pasan solos
        if (def.bandera && juego.trasResponder) juego.trasResponder(bien);
        else siguiente();
      });
    return bien;
  };

  const ctx = {
    canvas: $j("canvas"), sonido: Sonido, colores: COLORES_OPCION, letras: LETRAS_OPCION,
    pausado: () => st.pausado || st.esperando || st.terminado,
    sumar(n) { st.puntos += n; pintarMarcador(); },
    vidas: () => st.vidas,
    ganarVida() { st.vidas = Math.min(st.vidasMax + 2, st.vidas + 1); pintarMarcador(); },
    /* El juego puede detener el reloj (pantalla de elegir personaje) y reiniciarlo al empezar. */
    reiniciarReloj() { st.restante = limite; st.relojActivo = true; st.tPregunta = Date.now(); capa.classList.remove("sin-pregunta"); pintarReloj(); },
    // antes de empezar (elegir personaje) la pregunta queda oculta y el reloj quieto: nadie la lee con ventaja
    detenerReloj() { st.relojActivo = false; capa.classList.add("sin-pregunta"); },
    pregunta: () => preguntas[st.i],
    /* El juego avisa la opción elegida; devuelve si fue correcta. */
    responder(k) {
      if (st.esperando || st.respondida || st.terminado || st.i >= preguntas.length) return null;
      return registrar(k, null);
    },
    /* Un enemigo, una caída… quitan una vida. Sin vidas, el juego termina. */
    perderVida() {
      if (st.esperando || st.terminado) return;
      st.vidas--; Sonido.golpe(); pintarMarcador();
      if (st.vidas <= 0) { st.esperando = true; setTimeout(() => terminar("vidas"), 900); }
    },
    /* Juegos con meta: el jugador llegó → siguiente pregunta. */
    siguiente() { if (st.respondida && !st.esperando && !st.terminado) siguiente(); },
  };

  let juego;
  const reloj = setInterval(() => {
    // la pausa NO detiene el reloj (si no, se podría pausar para leer con calma); solo lo detienen los avisos de respuesta
    if (st.terminado || st.respondida || st.esperando || !st.relojActivo) return;
    st.restante -= 0.1; pintarReloj();
    if (st.restante <= 0) registrar(null, "tiempo");
  }, 100);
  const siguiente = () => {
    st.i++; st.esperando = false; st.respondida = false;
    if (st.i >= preguntas.length) return terminar("fin");
    st.restante = limite; st.tPregunta = Date.now(); pintarPregunta();
    juego.ronda(preguntas[st.i].opciones.length, { indice: st.i, total: preguntas.length });
  };
  const resultado = () => ({ puntos: st.puntos, aciertos: st.aciertos, total: preguntas.length, respondidas: st.respuestas.filter((x) => !x.sinResponder).length,
    nota: Math.round(100 * st.aciertos / Math.max(1, preguntas.length)), respuestas: st.respuestas, terminado: st.terminado });
  const terminar = (motivo) => {
    if (st.terminado) return;
    st.terminado = true; st.esperando = true; clearInterval(reloj); Sonido.fin();
    // las preguntas que no alcanzó a responder cuentan como incorrectas
    for (let n = st.respuestas.length; n < preguntas.length; n++) {
      const q = preguntas[n];
      st.respuestas.push({ pregunta: q.pregunta, elegida: null, correcta: q.opciones[q.correcta], bien: false, sinResponder: true, explicacion: q.explicacion });
    }
    const r = resultado();
    try { alTerminar(r); } catch (e) { console.error(e); }
    const titulo = motivo === "vidas" ? "💀 ¡Sin vidas! Fin del juego" : "🏆 ¡Juego terminado!";
    mostrarAviso(`<div class="juego-aviso-caja final"><div class="juego-aviso-titulo">${titulo}</div>
      <div class="juego-final-cifras"><div><b>${st.puntos}</b><span>puntos</span></div><div><b>${st.aciertos}/${preguntas.length}</b><span>aciertos</span></div><div><b>${r.nota}</b><span>nota sobre 100</span></div></div>
      ${mensajeFinal ? `<div class="juego-aviso-expl" style="margin:0 0 10px">${mensajeFinal}</div>` : ""}
      <div class="juego-final-lista">${st.respuestas.map((x, n) => `<div class="${x.bien ? "ok" : "no"}"><b>${x.bien ? "✔" : "✘"} ${n + 1}.</b> ${escJuego(x.pregunta)}
        <small>Respuesta: ${escJuego(x.correcta)}${x.bien ? "" : x.sinResponder ? " · sin responder (se acabaron las vidas)" : x.sinTiempo ? " · se acabó el tiempo" : ` · elegida: ${escJuego(x.elegida || "—")}`}</small></div>`).join("")}</div>
      <div class="juego-aviso-botones">${repetir ? `<button data-j="otra">Jugar otra vez</button>` : ""}${sinSalir ? "" : `<button data-j="salir">Salir</button>`}</div></div>`, "final");
  };
  const quitar = () => { clearInterval(reloj); juego && juego.destruir(); window.removeEventListener("keydown", teclas, true); capa.remove(); };
  const cerrar = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    quitar(); alSalir(resultado());
  };
  const pausar = (b) => {
    if (st.terminado) return;
    st.pausado = b; $j('[data-j="pausa"]').textContent = b ? "▶" : "⏸";
    if (b && !st.esperando) mostrarAviso(`<div class="juego-aviso-caja"><div class="juego-aviso-titulo">⏸ Pausa</div><div>El tiempo de la pregunta sigue corriendo.</div><div>Pulsa P o ▶ para seguir.</div></div>`, "pausa");
    else if (!b && aviso.classList.contains("pausa")) aviso.className = "juego-aviso oculto";
  };
  const teclas = (e) => {
    if (e.key === "Escape") { e.preventDefault(); if (document.fullscreenElement) document.exitFullscreen(); else if (!sinSalir) cerrar(); }
    else if (e.key === "p" || e.key === "P") pausar(!st.pausado);
    else if (e.key === "f" || e.key === "F") pantalla();
  };
  const pantalla = () => { if (document.fullscreenElement) document.exitFullscreen(); else capa.requestFullscreen && capa.requestFullscreen().catch(() => {}); };
  window.addEventListener("keydown", teclas, true);
  capa.addEventListener("click", (e) => {
    const grande = capa.querySelector(".juego-imagen-grande");
    if (grande) { grande.remove(); return; }
    if (e.target.classList.contains("juego-pregunta-img")) {     // ampliar la imagen (el reloj sigue corriendo)
      const g = document.createElement("div"); g.className = "juego-imagen-grande"; g.title = "Clic para cerrar";
      g.innerHTML = `<img src="${escJuego(e.target.getAttribute("src"))}" alt="Imagen de la pregunta">`; capa.appendChild(g); return;
    }
    const b = e.target.closest("[data-j]"); if (!b) return;
    const a = b.dataset.j;
    if (a === "salir") cerrar();
    else if (a === "pausa") pausar(!st.pausado);
    else if (a === "pantalla") pantalla();
    else if (a === "sonido") { Sonido.activo = !Sonido.activo; b.textContent = Sonido.activo ? "🔊" : "🔇"; }
    else if (a === "otra") { quitar(); jugar(paquete, clave, { alSalir, alTerminar, alProgreso, mezclar, vidas, tiempo, repetir, sinSalir, mensajeFinal }); }
  });

  pintarPregunta();
  juego = def.crear(ctx);
  juego.ronda(preguntas[0].opciones.length, { indice: 0, total: preguntas.length });
  return { cerrar };
}

function escJuego(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* Mando táctil (celulares y pantallas táctiles): botones que simulan teclas. */
function mandoTactil(cont, botones, teclasActivas) {
  cont.innerHTML = botones.map(([clave, txt, clase]) => `<button class="${clase || ""}" data-tecla="${clave}">${txt}</button>`).join("");
  const set = (e, v) => { const b = e.target.closest("[data-tecla]"); if (!b) return; e.preventDefault(); teclasActivas[b.dataset.tecla] = v; if (v) teclasActivas["_" + b.dataset.tecla] = true; };
  cont.addEventListener("pointerdown", (e) => set(e, true));
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => cont.addEventListener(ev, (e) => set(e, false)));
}
