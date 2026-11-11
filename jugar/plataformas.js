/* Calificador IA — Juego «Aventura pixel»: plataformas retro con mundos (pradera, cueva, nieve y castillo).
   Cada pregunta es un nivel corto: cruza fosos y bichos, golpea desde abajo el bloque con la respuesta, se abre la
   reja y llegas a la bandera. Potenciadores (estrella y corazón), cuatro personajes y un jefe en la última pregunta.
   Gráficos y personajes propios. Diseñado por Lic. Salvador Ortega Pardo. */
"use strict";

(() => {
  const T = 16, VW = 320, VH = 176, FILAS = 11, SUELO = 9;      // filas 9 y 10: suelo
  const GRAV = 900, SALTO = -340, ACEL = 650, MAXV = 118, FRENO = 900;
  const AN = 11, AL = 15;                                        // caja del héroe

  /* ------------------------------------------------------------ personajes */
  const CUERPO = ["....bbbbbb..", "...bbbbbbbbb", "...ssssss...", "..sskssks...", "..ssssssss..", "...sskkss...", "....ssss....",
                  "..rrrrrrrr..", ".rrrrrrrrrr.", ".srrrrrrrrs.", ".s.rrrrrr.s.", "...pppppp...", "...pppppp..."];
  const SALTO_SP = ["....bbbbbb..", "...bbbbbbbbb", "s..ssssss..s", "s.sskssks..s", "srssssssssrs", ".rrsskkssrr.", "..rrssssrr..",
                    "..rrrrrrrr..", "..rrrrrrrr..", "...rrrrrr...", "...rrrrrr...", "...pppppp...", "..pppppppp..", ".pp......pp.", ".kk......kk.", "............"];
  const PERSONAJES = [
    { nombre: "Pixi", pal: { b: "#1d2c73", r: "#e5484d", p: "#2f3e9e", s: "#ffcf9e" } },
    { nombre: "Lima", pal: { b: "#14532d", r: "#22c55e", p: "#1e3a8a", s: "#c68642" } },
    { nombre: "Uva", pal: { b: "#581c87", r: "#a855f7", p: "#1f2937", s: "#f1c27d" } },
    { nombre: "Sol", pal: { b: "#9a3412", r: "#f59e0b", p: "#7c2d12", s: "#8d5524" } },
  ].map((pj) => {
    const pal = { k: "#1a1a2e", w: "#ffffff", ...pj.pal };
    return { ...pj, sp: {
      quieto: spritePixel([...CUERPO, "...pp..pp...", "...pp..pp...", "..kkk..kkk.."], pal),
      paso1: spritePixel([...CUERPO, "..pp....pp..", ".kkp....pp..", ".........kk."], pal),
      paso2: spritePixel([...CUERPO, "....pppp....", "....pp.pp...", "...kkk.kkk.."], pal),
      salto: spritePixel(SALTO_SP, pal) } };
  });

  /* ------------------------------------------------------------ enemigos, objetos y jefe */
  const CAMINANTE_F = [[
    "......gggg......", "....gggggggg....", "...gggggggggg...", "..gggwwggwwggg..", "..ggwkwggwkwgg..", "..gggggggggggg..",
    ".gggggkkkkggggg.", ".gggggggggggggg.", ".gggggggggggggg.", "..gggggggggggg..", "..gg..gg..gg..gg", "................"], [
    "................", "................", ".....gggggg.....", "...gggggggggg...", "..gggwwggwwggg..", "..ggwkwggwkwgg..",
    ".gggggggggggggg.", ".ggggkkkkkkgggg.", "gggggggggggggggg", "gggggggggggggggg", ".gg.gg.gg.gg.gg.", "................"]];
  const caminante = (color) => CAMINANTE_F.map((f) => spritePixel(f, { g: color, w: "#ffffff", k: "#1a1a2e" }));
  const VOLADOR = [[
    "g..............g", "gg............gg", "ggg..gggggg..ggg", "gggggwkggwkggggg", ".gggggggggggggg.", "....gggggggg....", ".....g....g.....", "................"], [
    "................", "................", ".....gggggg.....", "...ggwkggwkgg...", ".gggggggggggggg.", "gggggggggggggggg", "gg..gggggggg..gg", "g.....g..g.....g"]]
    .map((f) => spritePixel(f, { g: "#4c1d95", w: "#fde68a", k: "#1a1a2e" }));
  const PINCHO = spritePixel([
    "..x...x...x...x.", ".xx..xx..xx..xx.", ".xxxxxxxxxxxxxx.", "xxooooooooooooxx", "xoowkooooowkooox", "xoooooooooooooox",
    "xooookkkkkkoooox", ".oooooooooooooo.", "..oo..oo..oo..oo"], { x: "#e5e7eb", o: "#dc2626", w: "#ffffff", k: "#1a1a2e" });
  const JEFE = spritePixel([
    "...y..y..y..y...", "...yyyyyyyyyy...", "...yryyyyyyyry..", "..gggggggggggg..", ".gggggggggggggg.", ".ggwwwgggwwwggg.",
    ".ggwkwgggwkwggg.", "gggggggggggggggg", "gggkkkkkkkkkkggg", "gggkwkwkwkwkkggg", "gggggggggggggggg", ".gggggggggggggg.",
    ".gg.gg....gg.gg.", ".kk.kk....kk.kk."], { y: "#f5b400", r: "#e5484d", g: "#6d28d9", w: "#ffffff", k: "#1a1a2e" });
  const MONEDA = spritePixel(["..yyyy..", ".yywwyy.", "yywyyyyy", "yywyyyyy", "yyyyyyyy", "yyyyyyyy", ".yyyyyy.", "..yyyy.."], { y: "#f5b400", w: "#fff6c2" });
  const CORAZON = spritePixel([".rr..rr.", "rwrrrrrr", "rrrrrrrr", "rrrrrrrr", ".rrrrrr.", "..rrrr..", "...rr...", "........"], { r: "#ef4444", w: "#fecaca" });
  const ESTRELLA = spritePixel(["...yy...", "...yy...", "yyyyyyyy", ".ykyyky.", "..yyyy..", ".yyyyyy.", ".yy..yy.", "y......y"], { y: "#fde047", k: "#1a1a2e" });
  const FUEGO = spritePixel(["..oo..", ".oyyo.", "oyyyyo", "oyyyyo", ".oyyo.", "..oo.."], { o: "#f97316", y: "#fde047" });

  /* ------------------------------------------------------------ mundos */
  const MUNDOS = [
    { nombre: "Pradera", cielo: ["#5ec8ff", "#bfe9ff"], suelo: "#b5651d", sueloOsc: "#8a4b14", borde: "#3cb043", bordeOsc: "#2a8a33",
      ladrillo: "#d9773b", ladrilloOsc: "#8a3f12", enemigo: "#7c3aed", fondo: "pradera" },
    { nombre: "Cueva", cielo: ["#14112a", "#2d2550"], suelo: "#4b5563", sueloOsc: "#374151", borde: "#9ca3af", bordeOsc: "#6b7280",
      ladrillo: "#0f766e", ladrilloOsc: "#134e4a", enemigo: "#f97316", fondo: "cueva", voladores: true },
    { nombre: "Nieve", cielo: ["#93c5fd", "#e0f2fe"], suelo: "#7aa7d9", sueloOsc: "#5b84b8", borde: "#f8fafc", bordeOsc: "#cbd5e1",
      ladrillo: "#60a5fa", ladrilloOsc: "#1e40af", enemigo: "#2563eb", fondo: "nieve" },
    { nombre: "Castillo", cielo: ["#2a0f1f", "#6b1d1d"], suelo: "#57534e", sueloOsc: "#3f3a36", borde: "#a8a29e", bordeOsc: "#78716c",
      ladrillo: "#78716c", ladrilloOsc: "#44403c", enemigo: "#dc2626", fondo: "castillo", lava: true, voladores: true },
  ].map((m) => ({ ...m, caminante: caminante(m.enemigo) }));

  /* Generador simple con semilla (cada ronda tiene su propio nivel) */
  const azar = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  const recordar = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } return null; };

  JUEGOS.plataformas = {
    nombre: "Aventura pixel", icono: "🍄", bandera: true,
    descripcion: "Plataformas retro con 4 mundos: elige tu personaje, cruza fosos y bichos, golpea el bloque con la respuesta correcta y llega a la bandera. ¡Jefe final en la última pregunta!",
    crear(ctx) {
      const lienzo = ctx.canvas;
      let g = ajustarLienzo(lienzo, VW, VH);
      const teclas = {};
      const semilla = Math.floor(Math.random() * 1e6);
      let vivo = true, ultimo = performance.now(), cuadro = 0, ronda = 0, nOpciones = 4, info = { indice: 0, total: 1 };
      let estado = "elegir", eleccion = Math.max(0, Math.min(3, +(recordar("pixel.personaje") || 0))), pj = PERSONAJES[eleccion];
      let nivel, mundo, heroe, bichos, monedas, bloques, items, fuegos, particulas, camara = 0, cartel = 0, jefe = null;
      let reja = { x: 0, abierta: false, sube: 0 }, meta = { x: 0, tocada: 0 }, control = { x: 2 * T };

      /* ---------------------------------------------------------- nivel corto por pregunta */
      const crearNivel = () => {
        const rnd = azar(semilla + ronda * 7919);
        const esJefe = info.total >= 3 && info.indice === info.total - 1;
        mundo = esJefe ? MUNDOS[3] : MUNDOS[(ronda - 1) % MUNDOS.length];
        const zona0 = 22, sep = 5, xReja = zona0 + nOpciones * sep + 1, ancho = xReja + 9;
        const t = Array.from({ length: FILAS }, (_, y) => Array.from({ length: ancho }, (_, x) => (y >= SUELO ? "suelo" : x === 0 ? "muro" : null)));
        bloques = []; monedas = []; bichos = []; items = []; fuegos = []; particulas = [];
        // tramo 1: un foso, un tubo, una plataforma con bloque sorpresa y monedas
        const foso = 10 + Math.floor(rnd() * 3), anchoFoso = ronda === 1 ? 2 : 2 + (rnd() < 0.4 ? 1 : 0);
        for (let x = foso; x < foso + anchoFoso; x++) { t[SUELO][x] = null; t[SUELO + 1][x] = null; }
        for (let i = 0; i < 3; i++) monedas.push({ x: (foso - 0.5 + i * (anchoFoso + 1) / 2) * T + 4, y: (SUELO - 3 - (i === 1 ? 1 : 0)) * T + 4, tomada: false });
        const tubo = 4 + Math.floor(rnd() * 2);
        t[SUELO - 1][tubo] = "tubo"; if (ronda > 2 && rnd() < 0.5) t[SUELO - 2][tubo] = "tubo";
        const px = foso + anchoFoso + 3 + Math.floor(rnd() * 2);
        for (let i = 0; i < 3; i++) t[5][px + i] = "ladrillo";
        t[2][px + 1] = "sorpresa";
        for (let i = 0; i < 3; i++) monedas.push({ x: (px + i) * T + 4, y: 4 * T + 4, tomada: false });
        // zona de respuestas: suelo firme, bloques A-D en la fila 5 y una reja que se abre al responder
        for (let k = 0; k < nOpciones; k++) {
          const bx = zona0 + 2 + k * sep;
          t[5][bx] = "bloque"; bloques.push({ x: bx, y: 5, k, estado: "nuevo", salto: 0 });
        }
        for (let y = 0; y < SUELO; y++) t[y][xReja] = "reja";
        reja = { x: xReja, abierta: false, sube: 0 };
        meta = { x: (xReja + 5) * T, tocada: 0 };
        control = { x: 2 * T, zona: zona0 * T };
        // enemigos del tramo 1 (no entran en la zona de respuestas)
        const lim = [3 * T, (zona0 - 1) * T];
        const nB = Math.min(4, 1 + Math.floor(ronda / 2));
        // los de suelo patrullan tramos despejados: entre el tubo y el foso, o entre el foso y la plataforma
        // (nunca bajo los ladrillos, donde casi no hay espacio para saltarlos)
        const tramos = [[(tubo + 1) * T, (foso - 1) * T - 16], [(foso + anchoFoso) * T, (px - 1) * T - 16]].filter(([a, b]) => b - a >= T);
        let nSuelo = 0;
        for (let i = 0; i < nB; i++) {
          const tipo = mundo.voladores && i % 2 ? "volador" : ronda >= 3 && i === nB - 1 ? "pincho" : "caminante";
          const [min, max] = tipo === "volador" ? lim : tramos[nSuelo++ % tramos.length];
          const x = tipo === "volador" ? (8 + i * 4) * T : min + rnd() * (max - min);
          bichos.push({ tipo, x, y: tipo === "volador" ? 3 * T + i * 6 : SUELO * T - 12, y0: 3 * T + (i % 2) * 14,
            vx: (rnd() < 0.5 ? -1 : 1) * (tipo === "volador" ? 28 : 22 + ronda), min, max, vivo: true, aplastado: 0, fase: rnd() * 6 });
        }
        jefe = esJefe ? { x: (xReja + 3) * T, y: 2 * T, vy: 0, t: 0, disparo: 2.5, estado: "vivo", golpe: 0 } : null;
        nivel = { t, ancho, foso, anchoFoso };
        heroe = { x: 2 * T, y: SUELO * T - AL, vx: 0, vy: 0, suelo: false, mira: 1, invul: 1.0, paso: 0, estrella: 0 };
        camara = 0; cartel = 2.2;
      };
      const solido = (cx, cy) => {
        if (cx < 0 || cx >= nivel.ancho) return true;
        if (cy < 0 || cy >= FILAS) return false;                      // abajo: foso (no hay piso)
        return !!nivel.t[cy][cx];
      };
      const esFoso = (cx) => cx >= nivel.foso && cx < nivel.foso + nivel.anchoFoso;

      /* ---------------------------------------------------------- golpes de bloques */
      const golpearBloque = (cx, cy) => {
        const tipo = nivel.t[cy] && nivel.t[cy][cx];
        if (tipo === "sorpresa") {
          nivel.t[cy][cx] = "usado"; ctx.sonido.moneda();
          const clase = ctx.vidas() < 3 || Math.random() < 0.4 ? "corazon" : "estrella";
          items.push({ clase, x: cx * T + 4, y: cy * T - 8, vx: 30, vy: -60, sale: 0.4 });
          return;
        }
        const b = bloques.find((x) => x.x === cx && x.y === cy);
        if (!b || b.estado !== "nuevo") return;
        b.salto = 1;
        const bien = ctx.responder(b.k);
        if (bien === null) return;
        b.estado = bien ? "bien" : "mal";
        if (bien) { particulas.push({ x: cx * T + 4, y: cy * T - 8, vy: -160, t: 0.8, tipo: "moneda" }); ctx.sonido.moneda(); }
        bloques.forEach((x) => { if (x !== b && x.estado === "nuevo") x.estado = "apagado"; });
      };

      /* ---------------------------------------------------------- muerte y reaparición */
      const reaparecer = () => {
        const h = heroe;
        h.x = heroe.x > control.zona ? control.zona + T : control.x; h.y = SUELO * T - AL - 2; h.vx = h.vy = 0; h.invul = 2;
      };
      const herir = (desdeX) => {
        const h = heroe;
        if (h.invul > 0 || h.estrella > 0) return;
        ctx.perderVida(); h.invul = 1.8; h.vy = -180; h.vx = (h.x < desdeX ? -1 : 1) * 140;
      };

      /* ---------------------------------------------------------- héroe */
      const moverHeroe = (dt) => {
        const h = heroe, izq = teclas.izq, der = teclas.der;
        if (meta.tocada) { h.vx = 50; h.mira = 1; }
        else if (izq && !der) { h.vx = Math.max(-MAXV, h.vx - ACEL * dt); h.mira = -1; }
        else if (der && !izq) { h.vx = Math.min(MAXV, h.vx + ACEL * dt); h.mira = 1; }
        else { const f = FRENO * dt; h.vx = Math.abs(h.vx) <= f ? 0 : h.vx - Math.sign(h.vx) * f; }
        if (teclas._saltar && h.suelo && !meta.tocada) { h.vy = SALTO; h.suelo = false; ctx.sonido.salto(); }
        teclas._saltar = false;
        if (!teclas.saltar && h.vy < -140) h.vy = -140;                 // salto corto si sueltas el botón
        h.vy = Math.min(420, h.vy + GRAV * dt);
        // eje X
        h.x += h.vx * dt;
        for (const cy of [Math.floor(h.y / T), Math.floor((h.y + AL - 1) / T)]) {
          if (h.vx > 0 && solido(Math.floor((h.x + AN) / T), cy)) { h.x = Math.floor((h.x + AN) / T) * T - AN - 0.01; h.vx = 0; }
          if (h.vx < 0 && solido(Math.floor(h.x / T), cy)) { h.x = (Math.floor(h.x / T) + 1) * T; h.vx = 0; }
        }
        // eje Y
        h.y += h.vy * dt; h.suelo = false;
        const cols = [Math.floor((h.x + 1) / T), Math.floor((h.x + AN - 1) / T)];
        if (h.vy > 0 && cols.some((cx) => solido(cx, Math.floor((h.y + AL) / T)))) { h.y = Math.floor((h.y + AL) / T) * T - AL; h.vy = 0; h.suelo = true; }
        if (h.vy < 0) {
          const cy = Math.floor(h.y / T);
          const golpe = cols.find((cx) => solido(cx, cy));
          if (golpe !== undefined) {
            h.y = (cy + 1) * T; h.vy = 40;
            const centro = Math.floor((h.x + AN / 2) / T);
            golpearBloque(solido(centro, cy) ? centro : golpe, cy);
          }
        }
        if (h.vx) h.paso += Math.abs(h.vx) * dt;
        h.invul = Math.max(0, h.invul - dt); h.estrella = Math.max(0, h.estrella - dt);
        if (h.x > control.zona && control.x < control.zona) control.x = control.zona + T;   // punto de control
        // cayó al foso
        if (h.y > VH + 10) { ctx.sonido.golpe(); h.invul = 0; h.estrella = 0; ctx.perderVida(); reaparecer(); }
        // monedas
        monedas.forEach((m) => { if (!m.tomada && Math.abs(m.x + 4 - (h.x + 6)) < 9 && Math.abs(m.y + 4 - (h.y + 8)) < 11) { m.tomada = true; ctx.sumar(10); ctx.sonido.moneda(); } });
        // bandera
        if (reja.abierta && !meta.tocada && h.x + AN >= meta.x) { meta.tocada = 0.01; ctx.sonido.fin(); ctx.sumar(50); }
      };

      /* ---------------------------------------------------------- enemigos, objetos y jefe */
      const moverBichos = (dt) => {
        const h = heroe;
        bichos.forEach((b) => {
          if (!b.vivo) { b.aplastado -= dt; return; }
          b.fase += dt;
          b.x += b.vx * dt;
          if (b.tipo === "volador") {
            b.y = b.y0 + Math.sin(b.fase * 2.4) * 16;
            if (b.x < b.min || b.x > b.max) b.vx = -b.vx;
          } else {
            const frente = Math.floor((b.x + (b.vx > 0 ? 16 : 0)) / T);
            if (solido(frente, SUELO - 1) || !solido(frente, SUELO) || b.x < b.min || b.x > b.max) b.vx = -b.vx;
          }
          const alto = b.tipo === "volador" ? 8 : b.tipo === "pincho" ? 9 : 12;
          const by = b.tipo === "pincho" ? b.y + 3 : b.y;
          if (Math.abs(b.x + 8 - (h.x + 6)) < 12 && Math.abs(by + alto / 2 - (h.y + 8)) < 6 + alto / 2) {
            if (h.estrella > 0) { b.vivo = false; b.aplastado = 0.5; ctx.sumar(50); ctx.sonido.pisar(); }
            else if (b.tipo !== "pincho" && h.vy > 60 && h.y + 15 < by + alto * 0.75) { b.vivo = false; b.aplastado = 0.5; h.vy = -220; ctx.sumar(50); ctx.sonido.pisar(); }
            else herir(b.x);
          }
        });
      };
      const moverItems = (dt) => {
        const h = heroe;
        items.forEach((it) => {
          if (it.sale > 0) { it.sale -= dt; it.y -= 20 * dt; return; }
          it.vy = Math.min(300, it.vy + GRAV * 0.6 * dt); it.x += it.vx * dt; it.y += it.vy * dt;
          const cx = Math.floor((it.x + (it.vx > 0 ? 8 : 0)) / T), cy = Math.floor((it.y + 8) / T);
          if (solido(Math.floor((it.x + 4) / T), cy)) { it.y = cy * T - 8; it.vy = it.clase === "estrella" ? -200 : 0; }
          if (solido(cx, Math.floor((it.y + 4) / T))) it.vx = -it.vx;
          if (Math.abs(it.x + 4 - (h.x + 6)) < 10 && Math.abs(it.y + 4 - (h.y + 8)) < 12) {
            it.fuera = true;
            if (it.clase === "corazon") { ctx.ganarVida(); ctx.sumar(20); ctx.sonido.correcto(); }
            else { h.estrella = 8; ctx.sumar(20); ctx.sonido.fin(); }
          }
          if (it.y > VH + 20) it.fuera = true;
        });
        items = items.filter((it) => !it.fuera);
      };
      const moverJefe = (dt) => {
        if (!jefe) return;
        const j = jefe; j.t += dt;
        if (j.estado === "vivo") {
          j.y = 2 * T + Math.sin(j.t * 1.6) * 18;
          j.disparo -= dt;
          if (j.disparo <= 0) {                                        // bola de fuego lenta, se puede esquivar
            j.disparo = 3.2;
            const dx = heroe.x - j.x, dy = heroe.y - (j.y + 14), d = Math.hypot(dx, dy) || 1;
            fuegos.push({ x: j.x, y: j.y + 14, vx: (dx / d) * 70, vy: (dy / d) * 70, t: 6 });
          }
        } else if (j.estado === "rayo") { j.golpe -= dt; if (j.golpe <= 0) { j.estado = "cae"; j.vy = -120; } }
        else if (j.estado === "cae") { j.vy += GRAV * dt; j.y += j.vy * dt; if (j.y > VH + 40) { j.estado = "fuera"; abrirReja(); } }
        else if (j.estado === "huye") { j.y -= 90 * dt; j.x += 40 * dt; if (j.y < -40) { j.estado = "fuera"; abrirReja(); } }
        fuegos.forEach((f) => {
          f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt;
          if (Math.abs(f.x + 3 - (heroe.x + 6)) < 8 && Math.abs(f.y + 3 - (heroe.y + 8)) < 10) { f.t = 0; herir(f.x); }
        });
        fuegos = fuegos.filter((f) => f.t > 0);
      };
      const abrirReja = () => {
        if (reja.abierta) return;
        reja.abierta = true;
        for (let y = 0; y < SUELO; y++) nivel.t[y][reja.x] = null;
        ctx.sonido.salto();
      };

      /* ---------------------------------------------------------- dibujo */
      const fondo = () => {
        const cielo = g.createLinearGradient(0, 0, 0, VH); cielo.addColorStop(0, mundo.cielo[0]); cielo.addColorStop(1, mundo.cielo[1]);
        g.fillStyle = cielo; g.fillRect(0, 0, VW, VH);
        const lejos = camara * 0.25, medio = camara * 0.5;
        if (mundo.fondo === "pradera") {
          g.fillStyle = "#a7dca3";
          for (let i = -1; i < 6; i++) { const cx = i * 140 - lejos % 140; g.beginPath(); g.ellipse(cx + 70, SUELO * T + 10, 90, 70, 0, Math.PI, 0); g.fill(); }
          g.fillStyle = "#79c374";
          for (let i = -1; i < 6; i++) { const cx = i * 110 - medio % 110; g.beginPath(); g.ellipse(cx + 50, SUELO * T + 6, 60, 40, 0, Math.PI, 0); g.fill(); }
          g.fillStyle = "#ffffff";
          for (let i = -1; i < 5; i++) { const cx = i * 130 - (camara * 0.4 + cuadro * 0.08) % 130 + 30, cy = 18 + (i % 2) * 18;
            g.fillRect(cx, cy, 34, 8); g.fillRect(cx + 6, cy - 6, 20, 6); g.fillRect(cx + 26, cy - 3, 10, 4); }
        } else if (mundo.fondo === "cueva") {
          g.fillStyle = "#231d45";
          for (let i = -1; i < 9; i++) { const cx = i * 46 - lejos % 46; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx + 23, 30 + (i % 3) * 14); g.lineTo(cx + 46, 0); g.fill(); }
          g.fillStyle = "#2f2860";
          for (let i = -1; i < 7; i++) { const cx = i * 70 - medio % 70; g.beginPath(); g.moveTo(cx, SUELO * T); g.lineTo(cx + 35, SUELO * T - 40 - (i % 2) * 20); g.lineTo(cx + 70, SUELO * T); g.fill(); }
          ["#22d3ee", "#a78bfa", "#f472b6"].forEach((c, k) => { g.fillStyle = c;
            for (let i = -1; i < 5; i++) { const cx = i * 90 + k * 30 - medio % 90; const brilla = (Math.sin(cuadro / 20 + i + k) + 1) / 2;
              g.globalAlpha = 0.4 + brilla * 0.6; g.fillRect(cx, SUELO * T - 10 - k * 4, 3, 6); g.fillRect(cx - 1, SUELO * T - 8 - k * 4, 5, 2); } });
          g.globalAlpha = 1;
        } else if (mundo.fondo === "nieve") {
          for (const [vel, alto, col, ancho] of [[0.2, 70, "#c7d7ea", 120], [0.45, 46, "#a9c0dc", 90]]) {
            for (let i = -1; i < 6; i++) { const cx = i * ancho - (camara * vel) % ancho;
              g.fillStyle = col; g.beginPath(); g.moveTo(cx, SUELO * T); g.lineTo(cx + ancho / 2, SUELO * T - alto); g.lineTo(cx + ancho, SUELO * T); g.fill();
              g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(cx + ancho / 2 - 12, SUELO * T - alto + 16); g.lineTo(cx + ancho / 2, SUELO * T - alto); g.lineTo(cx + ancho / 2 + 12, SUELO * T - alto + 16); g.fill(); }
          }
          g.fillStyle = "#ffffff";
          for (let i = 0; i < 40; i++) { const x = (i * 53 + cuadro * (0.3 + (i % 3) * 0.2) - camara * 0.6) % VW, y = (i * 37 + cuadro * (0.6 + (i % 4) * 0.15)) % VH;
            g.fillRect((x + VW) % VW, y, i % 3 ? 1 : 2, i % 3 ? 1 : 2); }
        } else {
          g.fillStyle = "#3a1424";
          for (let i = -1; i < 5; i++) { const cx = i * 150 - lejos % 150;
            g.fillRect(cx + 20, 60, 70, 100); g.fillRect(cx + 10, 40, 22, 120); g.fillRect(cx + 78, 40, 22, 120);
            for (let a = 0; a < 3; a++) { g.fillRect(cx + 10 + a * 8, 34, 5, 6); g.fillRect(cx + 78 + a * 8, 34, 5, 6); }
            g.fillStyle = "#fbbf24"; g.fillRect(cx + 50, 80, 6, 9); g.fillRect(cx + 18, 60, 4, 6); g.fillRect(cx + 86, 60, 4, 6); g.fillStyle = "#3a1424"; }
          g.fillStyle = "#ff7a18";
          for (let i = 0; i < 18; i++) { const x = (i * 71 - camara * 0.5) % VW, y = VH - ((cuadro * (0.5 + (i % 3) * 0.3) + i * 29) % VH);
            g.globalAlpha = 0.6; g.fillRect((x + VW) % VW, y, 2, 2); }
          g.globalAlpha = 1;
        }
      };
      const tile = (tipo, x, y, cx, cy) => {
        const m = mundo;
        if (tipo === "suelo") {
          g.fillStyle = m.suelo; g.fillRect(x, y, T, T);
          g.fillStyle = m.sueloOsc; g.fillRect(x + 3, y + 7, 3, 3); g.fillRect(x + 11, y + 12, 2, 2);
          if (cy === SUELO) { g.fillStyle = m.borde; g.fillRect(x, y, T, 4); g.fillStyle = m.bordeOsc; g.fillRect(x, y + 4, T, 1); }
        } else if (tipo === "ladrillo") {
          g.fillStyle = m.ladrillo; g.fillRect(x, y, T, T); g.fillStyle = m.ladrilloOsc;
          g.fillRect(x, y + 7, T, 1); g.fillRect(x, y + 15, T, 1); g.fillRect(x + 7, y, 1, 7); g.fillRect(x + 3, y + 8, 1, 7); g.fillRect(x + 12, y + 8, 1, 7);
        } else if (tipo === "tubo") {
          g.fillStyle = "#1f9d55"; g.fillRect(x + 1, y, T - 2, T); g.fillStyle = "#56d68d"; g.fillRect(x + 3, y, 2, T);
          if (!(nivel.t[cy - 1] && nivel.t[cy - 1][cx] === "tubo")) { g.fillStyle = "#14713c"; g.fillRect(x - 1, y, T + 2, 4); }
        } else if (tipo === "muro") {
          g.fillStyle = "#6b7280"; g.fillRect(x, y, T, T); g.fillStyle = "#4b5563"; g.fillRect(x, y + 7, T, 1);
        } else if (tipo === "sorpresa" || tipo === "usado") {
          g.fillStyle = "#1a1a2e"; g.fillRect(x, y, T, T);
          g.fillStyle = tipo === "usado" ? "#8b7355" : "#f5b400"; g.fillRect(x + 1, y + 1, T - 2, T - 2);
          if (tipo === "sorpresa") { g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(x + 1, y + 1, T - 2, 2); letraPixel(g, "?", x + 3, y + 1 + (Math.floor(cuadro / 20) % 2), "#7c2d12", 2); }
        } else if (tipo === "reja") {
          g.fillStyle = "#374151"; g.fillRect(x + 2, y, 3, T); g.fillRect(x + 7, y, 3, T); g.fillRect(x + 12, y, 3, T);
          g.fillStyle = "#9ca3af"; g.fillRect(x + 2, y, 1, T); g.fillRect(x + 7, y, 1, T); g.fillRect(x + 12, y, 1, T);
          if (cy % 3 === 0) { g.fillStyle = "#4b5563"; g.fillRect(x, y + 6, T, 3); }
        }
      };
      const texto = (s, x, y, tam, color, centro = true) => {
        g.font = `bold ${tam}px "Courier New", monospace`; g.textAlign = centro ? "center" : "left"; g.textBaseline = "middle";
        g.fillStyle = "#1a1a2e"; g.fillText(s, x + 1, y + 1); g.fillStyle = color; g.fillText(s, x, y);
      };
      const dibujarHeroe = (sp, x, y, mira) => {
        g.save(); g.translate(Math.round(x) + (mira < 0 ? 12 : 0), Math.round(y) - 1); g.scale(mira, 1); g.drawImage(sp, 0, 0); g.restore();
      };
      const dibujar = () => {
        fondo();
        const x0 = Math.floor(camara / T), dx = -Math.round(camara);
        for (let y = 0; y < FILAS; y++) for (let x = x0; x < x0 + VW / T + 2 && x < nivel.ancho; x++) {
          const tipo = nivel.t[y][x];
          if (tipo && tipo !== "bloque") tile(tipo, x * T + dx, y * T, x, y);
        }
        // foso con lava en el castillo
        if (mundo.lava) {
          const fx = nivel.foso * T + dx;
          g.fillStyle = "#dc2626"; g.fillRect(fx, SUELO * T + 8, nivel.anchoFoso * T, VH);
          g.fillStyle = "#f97316"; for (let i = 0; i < nivel.anchoFoso * 4; i++) g.fillRect(fx + i * 4, SUELO * T + 6 + Math.round(Math.sin(cuadro / 8 + i) * 2), 4, 3);
        }
        // reja que sube al abrirse
        if (reja.abierta && reja.sube < 1) {
          const rx = reja.x * T + dx, sube = Math.round(reja.sube * SUELO * T);
          g.save(); g.beginPath(); g.rect(rx - 2, 0, T + 4, SUELO * T); g.clip();
          for (let y = 0; y < SUELO; y++) tile("reja", rx, y * T - sube, reja.x, y);
          g.restore();
        }
        // bloques de respuesta
        bloques.forEach((b) => {
          const x = b.x * T + dx, y = b.y * T - Math.round(Math.sin(b.salto * Math.PI) * 5);
          const color = b.estado === "bien" ? "#f5b400" : b.estado === "mal" || b.estado === "apagado" ? "#9ca3af" : ctx.colores[b.k];
          g.fillStyle = "#1a1a2e"; g.fillRect(x, y, T, T); g.fillStyle = color; g.fillRect(x + 1, y + 1, T - 2, T - 2);
          g.fillStyle = "rgba(255,255,255,.45)"; g.fillRect(x + 1, y + 1, T - 2, 2);
          letraPixel(g, b.estado === "bien" ? "!" : ctx.letras[b.k], x + 3, y + 1, "#ffffff", 2);
        });
        // bandera
        const mx = meta.x + dx, baja = meta.tocada ? Math.min(1, meta.tocada) : 0;
        g.fillStyle = "#e5e7eb"; g.fillRect(mx + 7, 2 * T, 2, SUELO * T - 2 * T); g.fillStyle = "#f5b400"; g.fillRect(mx + 5, 2 * T - 4, 6, 5);
        g.fillStyle = reja.abierta ? "#22c55e" : "#9ca3af";
        const fy = 2 * T + 4 + Math.round(baja * (SUELO * T - 3 * T - 16));
        g.beginPath(); g.moveTo(mx + 7, fy); g.lineTo(mx - 13, fy + 7); g.lineTo(mx + 7, fy + 14); g.fill();
        g.fillStyle = "#57534e"; g.fillRect(mx + 2, SUELO * T - 6, 12, 6);
        // monedas, objetos y partículas
        monedas.forEach((m) => !m.tomada && g.drawImage(MONEDA, Math.round(m.x + dx), Math.round(m.y + Math.sin((cuadro + m.x) / 10) * 1.5)));
        items.forEach((it) => g.drawImage(it.clase === "corazon" ? CORAZON : ESTRELLA, Math.round(it.x + dx), Math.round(it.y)));
        particulas.forEach((p) => g.drawImage(MONEDA, Math.round(p.x + dx), Math.round(p.y)));
        // enemigos
        bichos.forEach((b) => {
          if (!b.vivo && b.aplastado <= 0) return;
          const x = Math.round(b.x + dx), y = Math.round(b.y), f = Math.floor(cuadro / 12) % 2;
          if (b.tipo === "volador") { if (b.vivo) g.drawImage(VOLADOR[Math.floor(cuadro / 7) % 2], x, y); return; }
          if (b.tipo === "pincho") { if (b.vivo) g.drawImage(PINCHO, x, y + 3); return; }
          if (!b.vivo) { g.drawImage(mundo.caminante[1], 0, 6, 16, 6, x, y + 6, 16, 6); return; }
          g.drawImage(mundo.caminante[f], x, y);
        });
        // jefe
        if (jefe && jefe.estado !== "fuera") {
          const jx = Math.round(jefe.x + dx), jy = Math.round(jefe.y);
          g.save(); if (jefe.estado === "rayo" && Math.floor(cuadro / 3) % 2) g.globalAlpha = 0.4;
          g.drawImage(JEFE, jx, jy, 32, 28); g.restore();
          if (jefe.estado === "rayo") {
            g.strokeStyle = "#fde047"; g.lineWidth = 3;
            for (let r = 0; r < 3; r++) { g.beginPath(); let px = jx + 6 + r * 10, py = 0; g.moveTo(px, py);
              while (py < jy + 10) { py += 8; px += (Math.random() - 0.5) * 10; g.lineTo(px, py); } g.stroke(); }
          }
          if (jefe.estado === "huye") texto("¡Ja, ja!", jx + 16, jy - 8, 10, "#fde047");
          if (jefe.estado === "vivo") texto("REY BICHO", jx + 16, jy - 6, 8, "#fca5a5");
        }
        fuegos.forEach((f) => g.drawImage(FUEGO, Math.round(f.x + dx), Math.round(f.y)));
        // héroe (parpadea si es invulnerable; arcoíris con la estrella)
        const h = heroe;
        if (!(h.invul > 0 && Math.floor(cuadro / 4) % 2)) {
          const sp = !h.suelo ? pj.sp.salto : h.vx ? (Math.floor(h.paso / 10) % 2 ? pj.sp.paso1 : pj.sp.paso2) : pj.sp.quieto;
          dibujarHeroe(sp, h.x + dx, h.y, h.mira);
          if (h.estrella > 0) { g.fillStyle = `hsla(${(cuadro * 12) % 360},90%,60%,.45)`; g.fillRect(Math.round(h.x + dx) - 1, Math.round(h.y) - 2, 14, 18); }
        }
        // carteles
        if (cartel > 0) {
          g.globalAlpha = Math.min(1, cartel);
          g.fillStyle = "rgba(10,12,40,.75)"; g.fillRect(VW / 2 - 90, 34, 180, 34);
          texto(`MUNDO ${MUNDOS.indexOf(mundo) + 1}-${Math.ceil(ronda / MUNDOS.length)} · ${mundo.nombre.toUpperCase()}`, VW / 2, 45, 10, "#fde047");
          texto(jefe ? "¡Jefe final! Responde bien para vencerlo" : "Golpea el bloque con la respuesta correcta", VW / 2, 58, 7, "#ffffff");
          g.globalAlpha = 1;
        }
        if (reja.abierta && !meta.tocada && Math.floor(cuadro / 30) % 2) texto("¡A la bandera! →", VW - 60, 20, 9, "#ffffff");
        if (h.estrella > 0) texto(`★ ${Math.ceil(h.estrella)}`, 22, 12, 9, "#fde047");
      };
      const dibujarEleccion = () => {
        const antes = mundo; mundo = MUNDOS[0]; camara = cuadro * 0.6; fondo(); camara = 0; mundo = antes;
        g.fillStyle = "rgba(10,12,40,.55)"; g.fillRect(0, 0, VW, VH);
        texto("ELIGE TU PERSONAJE", VW / 2, 22, 13, "#fde047");
        PERSONAJES.forEach((p, i) => {
          const cx = 40 + i * 80, sel = i === eleccion;
          g.fillStyle = sel ? "rgba(253,224,71,.25)" : "rgba(255,255,255,.08)"; g.fillRect(cx - 30, 40, 60, 90);
          if (sel) { g.strokeStyle = "#fde047"; g.lineWidth = 2; g.strokeRect(cx - 30, 40, 60, 90); }
          const sp = sel ? (Math.floor(cuadro / 10) % 2 ? p.sp.paso1 : p.sp.paso2) : p.sp.quieto;
          g.drawImage(sp, cx - 18, 52 + (sel ? -Math.abs(Math.sin(cuadro / 8)) * 4 : 0), 36, 48);
          texto(p.nombre, cx, 118, 10, sel ? "#fde047" : "#ffffff");
        });
        texto("◀ ▶ para cambiar · Salto o Enter para empezar", VW / 2, 150, 8, "#ffffff");
        texto("(en pantalla táctil: toca tu personaje dos veces)", VW / 2, 163, 7, "#cbd5e1");
      };
      const empezar = () => {
        if (estado !== "elegir") return;
        pj = PERSONAJES[eleccion]; recordar("pixel.personaje", String(eleccion));
        estado = "jugando"; cartel = 2.2; ctx.reiniciarReloj(); ctx.sonido.correcto();
        teclas._saltar = false;
      };

      /* ---------------------------------------------------------- ciclo */
      const paso = (t) => {
        if (!vivo) return;
        const dt = Math.min(0.034, (t - ultimo) / 1000); ultimo = t; cuadro++;
        if (estado === "elegir") { dibujarEleccion(); requestAnimationFrame(paso); return; }
        if (!ctx.pausado()) {
          moverHeroe(dt); moverBichos(dt); moverItems(dt); moverJefe(dt);
          bloques.forEach((b) => (b.salto = Math.max(0, b.salto - dt * 5)));
          particulas.forEach((p) => { p.vy += GRAV * dt; p.y += p.vy * dt; p.t -= dt; });
          particulas = particulas.filter((p) => p.t > 0);
          if (reja.abierta) reja.sube = Math.min(1, reja.sube + dt * 1.5);
          cartel = Math.max(0, cartel - dt);
          if (meta.tocada) { meta.tocada += dt; if (meta.tocada > 1.3 && !meta.listo) { meta.listo = true; ctx.siguiente(); } }
          camara = Math.max(0, Math.min(nivel.ancho * T - VW, heroe.x - VW * 0.4));
        }
        dibujar();
        requestAnimationFrame(paso);
      };

      const MAPEO = { ArrowLeft: "izq", a: "izq", A: "izq", ArrowRight: "der", d: "der", D: "der", ArrowUp: "saltar", w: "saltar", W: "saltar", " ": "saltar", z: "saltar", Z: "saltar", Enter: "saltar" };
      const abajo = (e) => {
        const k = MAPEO[e.key]; if (!k) return; e.preventDefault();
        if (estado === "elegir") {
          if (e.repeat) return;
          if (k === "izq") eleccion = (eleccion + 3) % 4; else if (k === "der") eleccion = (eleccion + 1) % 4; else empezar();
          ctx.sonido.punto(); return;
        }
        if (k === "saltar" && !teclas.saltar) teclas._saltar = true; teclas[k] = true;
      };
      const arriba = (e) => { const k = MAPEO[e.key]; if (k) teclas[k] = false; };
      const tocar = (e) => {
        if (estado !== "elegir") return;
        const r = lienzo.getBoundingClientRect(), x = (e.clientX - r.left) * VW / r.width;
        const i = Math.max(0, Math.min(3, Math.floor(x / 80)));
        if (i === eleccion) empezar(); else { eleccion = i; ctx.sonido.punto(); }
      };
      window.addEventListener("keydown", abajo); window.addEventListener("keyup", arriba);
      lienzo.addEventListener("pointerdown", tocar);
      const mando = lienzo.parentElement.querySelector(".juego-mando");
      mandoTactil(mando, [["izq", "◀", "m-izq"], ["der", "▶", "m-der"], ["saltar", "⤒", "m-saltar"]], teclas);
      mando.addEventListener("pointerdown", (e) => {               // en la elección, el mando también sirve
        if (estado !== "elegir") return;
        const b = e.target.closest("[data-tecla]"); if (!b) return;
        if (b.dataset.tecla === "izq") eleccion = (eleccion + 3) % 4; else if (b.dataset.tecla === "der") eleccion = (eleccion + 1) % 4; else empezar();
      });
      const alRedimensionar = () => { g = ajustarLienzo(lienzo, VW, VH); };
      window.addEventListener("resize", alRedimensionar);
      document.addEventListener("fullscreenchange", alRedimensionar);
      requestAnimationFrame((t) => { ultimo = t; paso(t); });
      JUEGOS.plataformas._estado = () => ({ heroe, nivel, estado, reja, meta, jefe, bichos });   // para pruebas

      return {
        ronda(n, i) { nOpciones = n; info = i || info; ronda++; crearNivel(); },
        /* El marco avisa que ya se respondió: abre la reja (o el jefe cae o huye primero). */
        trasResponder(bien) {
          if (jefe && jefe.estado === "vivo") {
            fuegos = [];
            if (bien) { jefe.estado = "rayo"; jefe.golpe = 1.0; ctx.sumar(300); ctx.sonido.golpe(); }
            else jefe.estado = "huye";
          } else abrirReja();
        },
        reiniciarJugador() { reaparecer(); },
        destruir() {
          vivo = false; window.removeEventListener("keydown", abajo); window.removeEventListener("keyup", arriba);
          lienzo.removeEventListener("pointerdown", tocar);
          window.removeEventListener("resize", alRedimensionar); document.removeEventListener("fullscreenchange", alRedimensionar);
        },
      };
    },
  };
})();
