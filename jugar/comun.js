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
/* Ajusta el canvas a su caja con escala entera (píxeles nítidos). */
function ajustarLienzo(canvas, ancho, alto) {
  const caja = canvas.parentElement.getBoundingClientRect();
  const k = Math.max(1, Math.floor(Math.min(caja.width / ancho, caja.height / alto) * 4) / 4);
  canvas.width = ancho; canvas.height = alto;
  canvas.style.width = `${ancho * k}px`; canvas.style.height = `${alto * k}px`;
  const g = canvas.getContext("2d"); g.imageSmoothingEnabled = false;
  return g;
}

/* ---------------------------------------------------------------- partida */
function barajar(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* Partida completa. Opciones:
   vidas      vidas iniciales (al perderlas todas el juego TERMINA; ya no hay «continuar» infinito)
   saltarTras muertes en una misma pregunta que la dan por incorrecta y pasan a la siguiente
   repetir    muestra «Jugar otra vez» al final · sinSalir oculta el botón ✕ (paquete para Moodle)
   alProgreso(resultado) tras cada respuesta · alTerminar(resultado) una sola vez al terminar · alSalir(resultado) al cerrar */
function jugar(paquete, clave, { alSalir = () => {}, alTerminar = () => {}, alProgreso = () => {}, mezclar = true, vidas = 3, saltarTras = 2,
                                 repetir = true, sinSalir = false, mensajeFinal = "" } = {}) {
  const def = JUEGOS[clave];
  if (!def) throw new Error("Juego no disponible.");
  const preguntas = (mezclar ? barajar(paquete.preguntas) : paquete.preguntas).map((q) => {
    // mezcla también las opciones (la correcta cambia de lugar en cada partida)
    const orden = mezclar ? barajar(q.opciones.map((_, i) => i)) : q.opciones.map((_, i) => i);
    return { ...q, opciones: orden.map((i) => q.opciones[i]), correcta: orden.indexOf(q.correcta) };
  });
  const st = { i: 0, puntos: 0, vidas, vidasMax: vidas, aciertos: 0, respuestas: [], esperando: false, pausado: false,
               respondida: false, muertes: 0, terminado: false, inicio: Date.now(), tPregunta: Date.now() };
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
    <div class="juego-pregunta"></div>
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
  const pintarPregunta = () => {
    const q = preguntas[st.i];
    $j(".juego-pregunta").textContent = q.pregunta;
    $j(".juego-opciones").innerHTML = q.opciones.map((o, k) => `<div class="juego-opcion" data-k="${k}">
      <b style="background:${COLORES_OPCION[k]}">${LETRAS_OPCION[k]}</b><span>${escJuego(o)}</span></div>`).join("");
    pintarMarcador();
  };
  const mostrarAviso = (html, clase, ms) => new Promise((ok) => {
    aviso.className = `juego-aviso ${clase}`; aviso.innerHTML = html;
    if (ms) setTimeout(() => { aviso.className = "juego-aviso oculto"; ok(); }, ms);
    else ok();
  });
  /* Registra la respuesta (k = null: pregunta perdida) y muestra la explicación. */
  const registrar = (k, saltada) => {
    const q = preguntas[st.i], bien = k === q.correcta;
    const segundos = (Date.now() - st.tPregunta) / 1000;
    st.esperando = true; st.respondida = true;
    st.respuestas.push({ pregunta: q.pregunta, elegida: k == null ? null : q.opciones[k], correcta: q.opciones[q.correcta], bien, saltada: !!saltada, explicacion: q.explicacion });
    capa.querySelectorAll(".juego-opcion").forEach((el) => el.classList.add(+el.dataset.k === q.correcta ? "es-correcta" : +el.dataset.k === k ? "es-error" : "apagada"));
    if (bien) { st.aciertos++; st.puntos += 100 + Math.max(0, Math.round(50 - segundos * 2)); Sonido.correcto(); }
    else Sonido.error();
    pintarMarcador();
    try { alProgreso(resultado()); } catch (e) { console.error(e); }
    const titulo = bien ? "¡Correcto! 🎉" : saltada ? "Pregunta perdida 😵" : "Casi… ❌";
    mostrarAviso(`<div class="juego-aviso-caja"><div class="juego-aviso-titulo">${titulo}</div>
      ${saltada ? `<div>Perdiste ${saltarTras} vidas en esta pregunta: cuenta como incorrecta.</div>` : ""}
      ${bien ? "" : `<div>La respuesta correcta era: <b>${LETRAS_OPCION[q.correcta]}) ${escJuego(q.opciones[q.correcta])}</b></div>`}
      ${q.explicacion ? `<div class="juego-aviso-expl">${escJuego(q.explicacion)}</div>` : ""}</div>`, bien ? "bien" : "mal", bien ? 2000 : 4200)
      .then(() => {
        if (st.terminado) return;
        st.esperando = false;
        // los juegos con «bandera» abren la meta y avisan con ctx.siguiente(); los demás pasan solos
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
    reiniciarReloj() { st.tPregunta = Date.now(); },
    /* El juego avisa la opción elegida; devuelve si fue correcta. */
    responder(k) {
      if (st.esperando || st.respondida || st.terminado || st.i >= preguntas.length) return null;
      return registrar(k, false);
    },
    /* El jugador perdió una vida (enemigo, caída…). Sin vidas, el juego termina. */
    perderVida() {
      if (st.esperando || st.terminado) return;
      st.vidas--; Sonido.golpe(); pintarMarcador();
      if (st.vidas <= 0) { st.esperando = true; setTimeout(() => terminar("vidas"), 700); return; }
      if (!st.respondida && ++st.muertes >= saltarTras) registrar(null, true);
    },
    /* Para juegos con bandera: el jugador llegó a la meta → siguiente pregunta. */
    siguiente() { if (st.respondida && !st.esperando && !st.terminado) siguiente(); },
  };

  let juego;
  const siguiente = () => {
    st.i++; st.esperando = false; st.respondida = false; st.muertes = 0;
    if (st.i >= preguntas.length) return terminar("fin");
    st.tPregunta = Date.now(); pintarPregunta(); juego.ronda(preguntas[st.i].opciones.length, { indice: st.i, total: preguntas.length });
  };
  const resultado = () => ({ puntos: st.puntos, aciertos: st.aciertos, total: preguntas.length, respondidas: st.respuestas.filter((x) => !x.sinResponder).length,
    nota: Math.round(100 * st.aciertos / Math.max(1, preguntas.length)), respuestas: st.respuestas, terminado: st.terminado });
  const terminar = (motivo) => {
    if (st.terminado) return;
    st.terminado = true; st.esperando = true; Sonido.fin();
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
        <small>Respuesta: ${escJuego(x.correcta)}${x.bien ? "" : x.sinResponder ? " · sin responder" : x.saltada ? " · perdida (2 vidas en esa pregunta)" : ` · elegida: ${escJuego(x.elegida || "—")}`}</small></div>`).join("")}</div>
      <div class="juego-aviso-botones">${repetir ? `<button data-j="otra">Jugar otra vez</button>` : ""}${sinSalir ? "" : `<button data-j="salir">Salir</button>`}</div></div>`, "final");
  };
  const cerrar = () => {
    juego && juego.destruir(); window.removeEventListener("keydown", teclas, true);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    capa.remove(); alSalir(resultado());
  };
  const pausar = (b) => {
    if (st.terminado) return;
    st.pausado = b; $j('[data-j="pausa"]').textContent = b ? "▶" : "⏸";
    if (b && !st.esperando) mostrarAviso(`<div class="juego-aviso-caja"><div class="juego-aviso-titulo">⏸ Pausa</div><div>Pulsa P o ▶ para seguir.</div></div>`, "pausa");
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
    const b = e.target.closest("[data-j]"); if (!b) return;
    const a = b.dataset.j;
    if (a === "salir") cerrar();
    else if (a === "pausa") pausar(!st.pausado);
    else if (a === "pantalla") pantalla();
    else if (a === "sonido") { Sonido.activo = !Sonido.activo; b.textContent = Sonido.activo ? "🔊" : "🔇"; }
    else if (a === "otra") { juego && juego.destruir(); window.removeEventListener("keydown", teclas, true); capa.remove();
      jugar(paquete, clave, { alSalir, alTerminar, alProgreso, mezclar, vidas, saltarTras, repetir, sinSalir, mensajeFinal }); }
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
