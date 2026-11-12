/* Calificador IA — Juego «Aventura pixel»: plataformas retro. Cada pregunta es un nivel corto y cada mundo se juega
   distinto:
     Pradera  → golpea desde abajo el bloque con la respuesta.
     Cueva    → sube al escalón y salta al cristal colgante con la respuesta.
     Nieve    → revienta la burbuja con la respuesta (el hielo resbala).
     Castillo → cae encima del botón con la respuesta (cuidado con la lava).
     Jefe     → la última pregunta: golpea el bloque correcto para lanzarle un rayo al Rey Bicho.
   Al responder se abre la reja y hay que llegar a la bandera. Cada error cuesta una vida (lo maneja el marco común).
   El salto es siempre completo y todo lo que se debe tocar está a su alcance. Gráficos propios.
   Diseñado por Lic. Salvador Ortega Pardo. */
"use strict";

(() => {
  const T = 16, VW = 320, VH = 176, FILAS = 11, SUELO = 9;      // filas 9 y 10: suelo (techo del suelo en y = 144)
  const GRAV = 900, SALTO = -340;                                // salto completo: sube 64 px (4 bloques)
  const AN = 11, AL = 15;                                        // caja del héroe
  const SOLIDOS = new Set(["suelo", "ladrillo", "sorpresa", "usado", "tubo", "muro", "piedra", "losa", "bloque", "reja"]);

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

  /* ------------------------------------------------------------ mundos (cada uno con su forma de responder) */
  const MUNDOS = {
    pradera: { nombre: "Pradera", mec: "bloques", cielo: ["#5ec8ff", "#bfe9ff"], suelo: "#b5651d", sueloOsc: "#8a4b14", borde: "#3cb043", bordeOsc: "#2a8a33",
      ladrillo: "#d9773b", ladrilloOsc: "#8a3f12", piedra: "#a8a29e", enemigo: "#7c3aed",
      ayuda: "Golpea DESDE ABAJO el bloque con la respuesta correcta" },
    cueva: { nombre: "Cueva", mec: "gemas", cielo: ["#14112a", "#2d2550"], suelo: "#4b5563", sueloOsc: "#374151", borde: "#9ca3af", bordeOsc: "#6b7280",
      ladrillo: "#0f766e", ladrilloOsc: "#134e4a", piedra: "#64748b", enemigo: "#f97316", voladores: true,
      ayuda: "Sube al escalón y SALTA para tocar el cristal con la respuesta" },
    nieve: { nombre: "Nieve", mec: "burbujas", cielo: ["#93c5fd", "#e0f2fe"], suelo: "#7aa7d9", sueloOsc: "#5b84b8", borde: "#f8fafc", bordeOsc: "#cbd5e1",
      ladrillo: "#60a5fa", ladrilloOsc: "#1e40af", piedra: "#cbd5e1", enemigo: "#2563eb", hielo: true,
      ayuda: "Salta y REVIENTA la burbuja con la respuesta (¡el hielo resbala!)" },
    castillo: { nombre: "Castillo", mec: "botones", cielo: ["#2a0f1f", "#6b1d1d"], suelo: "#57534e", sueloOsc: "#3f3a36", borde: "#a8a29e", bordeOsc: "#78716c",
      ladrillo: "#78716c", ladrilloOsc: "#44403c", piedra: "#57534e", enemigo: "#dc2626", lava: true, voladores: true,
      ayuda: "CAE ENCIMA del botón con la respuesta (¡cuidado con la lava!)" },
  };
  Object.values(MUNDOS).forEach((m) => (m.caminante = caminante(m.enemigo)));
  const ORDEN = ["pradera", "cueva", "nieve", "castillo"];

  const azar = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  const recordar = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } return null; };

  JUEGOS.plataformas = {
    nombre: "Aventura pixel", icono: "🍄", bandera: true, tiempo: 75,
    descripcion: "Plataformas retro con 4 mundos que se juegan distinto (bloques, cristales, burbujas y botones) y un jefe final. Elige tu personaje y llega a la bandera.",
    crear(ctx) {
      const lienzo = ctx.canvas;
      let g = ajustarLienzo(lienzo, VW, VH);
      const teclas = {};
      const semilla = JUEGOS.plataformas._semilla || Math.floor(Math.random() * 1e6);   // _semilla: solo para pruebas
      let vivo = true, ultimo = performance.now(), cuadro = 0, ronda = 0, nOpciones = 4, info = { indice: 0, total: 1 };
      let estado = "elegir", eleccion = Math.max(0, Math.min(3, +(recordar("pixel.personaje") || 0))), pj = PERSONAJES[eleccion];
      let nivel, mundo, heroe, bichos, monedas, opciones, items, fuegos, particulas, moviles, camara = 0, cartel = 0, jefe = null, t = 0;
      let reja = { x: 0, abierta: false, sube: 0 }, meta = { x: 0, tocada: 0 }, control = { x: 2 * T, zona: 0 };
      ctx.detenerReloj();                                         // el tiempo corre al elegir personaje

      /* ---------------------------------------------------------- generador de niveles por tramos */
      const crearNivel = () => {
        const rnd = azar(semilla + ronda * 7919);
        const esJefe = info.total >= 3 && info.indice === info.total - 1;
        mundo = MUNDOS[esJefe ? "castillo" : ORDEN[(ronda - 1) % ORDEN.length]];
        const mec = esJefe ? "bloques" : mundo.mec;
        const ancho = 120;
        const tt = Array.from({ length: FILAS }, (_, y) => Array.from({ length: ancho }, (_, x) => (y >= SUELO ? "suelo" : x === 0 ? "muro" : null)));
        const lava = new Set(), patrullas = [];
        monedas = []; bichos = []; items = []; fuegos = []; particulas = []; moviles = []; opciones = [];
        const hueco = (x0, w) => { for (let x = x0; x < x0 + w; x++) { tt[SUELO][x] = null; tt[SUELO + 1][x] = null; if (mundo.lava) lava.add(x); } };
        const arco = (x0, w, alto) => { for (let i = 0; i <= w; i++) monedas.push({ x: (x0 + i) * T + 4, y: (SUELO - 1) * T - Math.round(Math.sin((i / w) * Math.PI) * alto) - 6, tomada: false }); };
        // tramos (todos verificados: se cruzan con el salto completo)
        const TRAMOS = {
          llano: (x) => { patrullas.push([x, x + 5]); arco(x + 1, 3, 10); return 7; },
          foso: (x) => { const w = ronda === 1 ? 2 : 2 + Math.floor(rnd() * 2); hueco(x + 2, w); arco(x + 1, w + 1, 40); return w + 5; },
          tubos: (x) => {
            const h1 = 1 + Math.floor(rnd() * 2), h2 = 1 + Math.floor(rnd() * 2);
            for (let i = 0; i < h1; i++) tt[SUELO - 1 - i][x + 1] = "tubo";
            for (let i = 0; i < h2; i++) tt[SUELO - 1 - i][x + 6] = "tubo";
            patrullas.push([x + 2, x + 5]); return 12;            // saltando desde el tubo alto se aterriza hasta 6,2 bloques más allá
          },
          escalera: (x) => {
            [1, 2, 3, 3, 2, 1].forEach((h, i) => { for (let k = 0; k < h; k++) tt[SUELO - 1 - k][x + 1 + i] = "piedra"; });
            monedas.push({ x: (x + 3) * T + 4, y: (SUELO - 5) * T, tomada: false }, { x: (x + 4) * T + 4, y: (SUELO - 5) * T, tomada: false });
            return 11;                                             // saltar desde arriba lleva lejos: suelo amplio después
          },
          sorpresa: (x) => {   // fila 5: alcanzable desde el suelo (sube 33 px de 64)
            tt[5][x + 2] = "ladrillo"; tt[5][x + 3] = "sorpresa"; tt[5][x + 4] = "ladrillo";
            arco(x + 1, 4, 8); return 7;
          },
          islas: (x) => {      // foso ancho con una isla de piedra en medio (fila 7: sube 32 px)
            hueco(x + 1, 6); tt[7][x + 3] = "piedra"; tt[7][x + 4] = "piedra";
            monedas.push({ x: (x + 3) * T + 8, y: 5 * T, tomada: false }); return 11;
          },
          movil: (x) => {      // foso con plataforma que va y viene
            hueco(x + 1, 6);
            moviles.push({ x: (x + 1) * T, y: SUELO * T, w: 40, min: (x + 1) * T, max: (x + 7) * T - 40, vx: 34 });
            return 11;
          },
        };
        const faciles = ["llano", "foso", "tubos", "sorpresa"];
        const todos = ["llano", "foso", "tubos", "sorpresa", "escalera", "islas", "movil"].filter((x) => !(mundo.hielo && x === "movil"));
        const lista = ronda === 1 ? ["sorpresa", "foso"] : [0, 1, 2].map(() => (ronda < 3 ? faciles : todos)[Math.floor(rnd() * (ronda < 3 ? faciles : todos).length)]);
        if (mundo === MUNDOS.cueva && !lista.includes("movil") && ronda > 1) lista[1] = "movil";
        let cx = 4;
        lista.forEach((nombre) => { cx += TRAMOS[nombre](cx) + 1; });   // +1: siempre suelo plano entre obstáculos para tomar impulso
        cx += 5;                                                  // tramo plano antes de las respuestas: nadie responde sin querer al bajar de un salto
        // zona de respuestas (suelo firme)
        const zona0 = cx, sep = 5;
        for (let k = 0; k < nOpciones; k++) {
          const bx = zona0 + 2 + k * sep;
          if (mec === "bloques") { tt[5][bx] = "bloque"; opciones.push({ tipo: "bloque", k, x: bx, y: 5, estado: "nuevo", salto: 0 }); }
          else if (mec === "gemas") {
            // escalón de 2 de alto (techo y = 112) y el cristal colgado arriba: solo se toca saltando DESDE el escalón
            for (const y of [7, 8]) { tt[y][bx] = "piedra"; tt[y][bx + 1] = "piedra"; }
            opciones.push({ tipo: "gema", k, x: (bx + 1) * T, y: 44, estado: "nuevo" });
          } else if (mec === "burbujas") {
            opciones.push({ tipo: "burbuja", k, x0: bx * T + 8, y0: 86, fase: k * 1.7, x: bx * T + 8, y: 86, estado: "nuevo" });
          } else if (mec === "botones") {
            tt[6][bx] = "losa"; tt[6][bx + 1] = "losa";
            opciones.push({ tipo: "boton", k, x: bx, estado: "nuevo" });
          }
        }
        const xReja = zona0 + nOpciones * sep + 2;
        for (let y = 0; y < SUELO; y++) tt[y][xReja] = "reja";
        const fin = xReja + 9;
        for (let y = 0; y < FILAS; y++) for (let x = fin; x < ancho; x++) tt[y][x] = y >= SUELO ? "suelo" : null;
        for (let y = 0; y < SUELO; y++) tt[y][fin] = "muro";
        reja = { x: xReja, abierta: false, sube: 0 };
        meta = { x: (xReja + 5) * T, tocada: 0, listo: false };
        control = { x: 2 * T, zona: zona0 * T };
        // enemigos: caminantes en los tramos llanos; voladores en cueva y castillo; pinchos desde la ronda 3
        const nB = Math.min(patrullas.length, 1 + Math.floor(ronda / 2));
        for (let i = 0; i < nB; i++) {
          const [a, b] = patrullas[i];
          const tipo = ronda >= 3 && i === nB - 1 ? "pincho" : "caminante";
          bichos.push({ tipo, x: a * T + rnd() * (b - a) * T, y: SUELO * T - 12, vx: (rnd() < 0.5 ? -1 : 1) * (22 + ronda * 1.5),
            min: a * T, max: b * T, vivo: true, aplastado: 0, fase: 0 });
        }
        if (mundo.voladores) bichos.push({ tipo: "volador", x: 10 * T, y: 3 * T, y0: 3 * T + 6, vx: 30, min: 6 * T, max: (zona0 - 2) * T, vivo: true, aplastado: 0, fase: rnd() * 6 });
        jefe = esJefe ? { x: (xReja + 3) * T, y: 2 * T, t: 0, disparo: 3, estado: "vivo", golpe: 0, vy: 0 } : null;
        nivel = { t: tt, ancho: fin + 1, lava, zona0, mec };
        heroe = { x: 2 * T, y: SUELO * T - AL, vx: 0, vy: 0, suelo: false, mira: 1, invul: 1.0, paso: 0, estrella: 0, sobre: null };
        camara = 0; cartel = 2.6;
      };
      const solido = (cx, cy) => {
        if (cx < 0 || cx >= nivel.ancho) return true;
        if (cy < 0 || cy >= FILAS) return false;                      // abajo: foso
        return SOLIDOS.has(nivel.t[cy][cx]);
      };

      /* ---------------------------------------------------------- respuestas */
      const responder = (o) => {
        if (o.estado !== "nuevo") return;
        const bien = ctx.responder(o.k);
        if (bien === null) return;
        o.estado = bien ? "bien" : "mal";
        if (bien) { particulas.push({ x: (o.tipo === "bloque" || o.tipo === "boton" ? o.x * T : o.x) + 4, y: (o.tipo === "bloque" ? o.y * T : o.y || 100) - 8, vy: -160, t: 0.8 }); ctx.sonido.moneda(); }
        opciones.forEach((x) => { if (x !== o && x.estado === "nuevo") x.estado = "apagado"; });
      };
      const golpearTile = (cx, cy) => {
        const tipo = nivel.t[cy] && nivel.t[cy][cx];
        if (tipo === "sorpresa") {
          nivel.t[cy][cx] = "usado"; ctx.sonido.moneda();
          const clase = ctx.vidas() < 3 || Math.random() < 0.4 ? "corazon" : "estrella";
          items.push({ clase, x: cx * T + 4, y: cy * T - 8, vx: 30, vy: -60, sale: 0.4 });
        } else if (tipo === "bloque") {
          const o = opciones.find((x) => x.tipo === "bloque" && x.x === cx && x.y === cy);
          if (o) { o.salto = 1; responder(o); }
        }
      };

      /* ---------------------------------------------------------- héroe */
      const reaparecer = () => {
        const h = heroe;
        h.x = h.x > control.zona ? control.zona + T : control.x; h.y = SUELO * T - AL - 2; h.vx = h.vy = 0; h.invul = 2; h.sobre = null;
      };
      const herir = (desdeX) => {
        const h = heroe;
        if (h.invul > 0 || h.estrella > 0) return;
        ctx.perderVida(); h.invul = 1.8; h.vy = -180; h.vx = (h.x < desdeX ? -1 : 1) * 140;
      };
      const moverHeroe = (dt) => {
        const h = heroe, izq = teclas.izq, der = teclas.der;
        // solo el suelo de nieve resbala (piedras, escalones y plataformas no); en el aire se conserva el control normal
        const bajoPie = nivel.t[Math.floor((h.y + AL + 1) / T)] && nivel.t[Math.floor((h.y + AL + 1) / T)][Math.floor((h.x + AN / 2) / T)];
        const hielo = mundo.hielo && !h.sobre && h.suelo && bajoPie === "suelo";
        const ACEL = hielo ? 380 : 650, FRENO = hielo ? 160 : 900, MAXV = hielo ? 125 : 118;
        if (meta.tocada) { h.vx = 50; h.mira = 1; }
        else if (izq && !der) { h.vx = Math.max(-MAXV, h.vx - ACEL * dt); h.mira = -1; }
        else if (der && !izq) { h.vx = Math.min(MAXV, h.vx + ACEL * dt); h.mira = 1; }
        else { const f = FRENO * dt; h.vx = Math.abs(h.vx) <= f ? 0 : h.vx - Math.sign(h.vx) * f; }
        if (teclas._saltar && h.suelo && !meta.tocada) { h.vy = SALTO; h.suelo = false; h.sobre = null; ctx.sonido.salto(); }
        teclas._saltar = false;
        h.vy = Math.min(420, h.vy + GRAV * dt);
        if (h.sobre) h.x += h.sobre.vx * dt;                          // la plataforma móvil lo lleva
        // eje X
        h.x += h.vx * dt;
        for (const cy of [Math.floor(h.y / T), Math.floor((h.y + AL - 1) / T)]) {
          if (h.vx >= 0 && solido(Math.floor((h.x + AN) / T), cy)) { h.x = Math.floor((h.x + AN) / T) * T - AN - 0.01; h.vx = Math.min(0, h.vx); }
          if (h.vx <= 0 && solido(Math.floor(h.x / T), cy)) { h.x = (Math.floor(h.x / T) + 1) * T; h.vx = Math.max(0, h.vx); }
        }
        // eje Y
        const pie0 = h.y + AL;
        h.y += h.vy * dt; h.suelo = false; h.sobre = null;
        const cols = [Math.floor((h.x + 1) / T), Math.floor((h.x + AN - 1) / T)];
        if (h.vy >= 0 && cols.some((cx) => solido(cx, Math.floor((h.y + AL) / T)))) {
          const cy = Math.floor((h.y + AL) / T);
          h.y = cy * T - AL; h.vy = 0; h.suelo = true;
          // caer encima de un botón responde
          if (nivel.mec === "botones") for (const cx of cols) if (nivel.t[cy][cx] === "losa") {
            const o = opciones.find((b) => b.tipo === "boton" && (cx === b.x || cx === b.x + 1));
            if (o) responder(o);
          }
        }
        if (h.vy >= 0) for (const p of moviles) {
          if (pie0 <= p.y + 1 && h.y + AL >= p.y && h.x + AN > p.x && h.x < p.x + p.w) { h.y = p.y - AL; h.vy = 0; h.suelo = true; h.sobre = p; }
        }
        if (h.vy < 0) {
          const cy = Math.floor(h.y / T);
          const golpe = cols.find((cx) => solido(cx, cy));
          if (golpe !== undefined) {
            h.y = (cy + 1) * T; h.vy = 40;
            const centro = Math.floor((h.x + AN / 2) / T);
            golpearTile(solido(centro, cy) ? centro : golpe, cy);
          }
        }
        if (h.vx) h.paso += Math.abs(h.vx) * dt;
        h.invul = Math.max(0, h.invul - dt); h.estrella = Math.max(0, h.estrella - dt);
        if (h.x > control.zona && control.x < control.zona) control.x = control.zona + T;   // punto de control
        if (h.y > VH + 10) { ctx.sonido.golpe(); h.estrella = 0; h.invul = 0; ctx.perderVida(); reaparecer(); }
        // tocar cristales y burbujas
        for (const o of opciones) {
          if (o.estado !== "nuevo" || (o.tipo !== "gema" && o.tipo !== "burbuja")) continue;
          const r = o.tipo === "gema" ? 7 : 10;
          if (h.x + AN > o.x - r && h.x < o.x + r && h.y < o.y + r && h.y + AL > o.y - r) responder(o);
        }
        monedas.forEach((m) => { if (!m.tomada && Math.abs(m.x + 4 - (h.x + 6)) < 9 && Math.abs(m.y + 4 - (h.y + 8)) < 11) { m.tomada = true; ctx.sumar(10); ctx.sonido.moneda(); } });
        if (reja.abierta && !meta.tocada && h.x + AN >= meta.x) { meta.tocada = 0.01; ctx.sonido.fin(); ctx.sumar(50); }
      };

      /* ---------------------------------------------------------- mundo en movimiento */
      const moverResto = (dt) => {
        const h = heroe;
        moviles.forEach((p) => { p.x += p.vx * dt; if (p.x < p.min || p.x > p.max) { p.vx = -p.vx; p.x = Math.max(p.min, Math.min(p.max, p.x)); } });
        opciones.forEach((o) => { if (o.tipo === "burbuja") { o.y = o.y0 + Math.sin(t * 1.6 + o.fase) * 12; o.x = o.x0 + Math.sin(t * 0.9 + o.fase) * 10; } });
        bichos.forEach((b) => {
          if (!b.vivo) { b.aplastado -= dt; return; }
          b.fase += dt; b.x += b.vx * dt;
          if (b.tipo === "volador") { b.y = b.y0 + Math.sin(b.fase * 2.4) * 16; if (b.x < b.min || b.x > b.max) b.vx = -b.vx; }
          else {
            const frente = Math.floor((b.x + (b.vx > 0 ? 16 : 0)) / T);
            if (solido(frente, SUELO - 1) || !solido(frente, SUELO) || b.x < b.min || b.x > b.max) { b.vx = -b.vx; b.x = Math.max(b.min, Math.min(b.max, b.x)); }
          }
          const alto = b.tipo === "volador" ? 8 : b.tipo === "pincho" ? 9 : 12, by = b.tipo === "pincho" ? b.y + 3 : b.y;
          if (Math.abs(b.x + 8 - (h.x + 6)) < 12 && Math.abs(by + alto / 2 - (h.y + 8)) < 6 + alto / 2) {
            if (h.estrella > 0) { b.vivo = false; b.aplastado = 0.5; ctx.sumar(50); ctx.sonido.pisar(); }
            else if (b.tipo !== "pincho" && h.vy > 60 && h.y + 15 < by + alto * 0.75) { b.vivo = false; b.aplastado = 0.5; h.vy = -230; ctx.sumar(50); ctx.sonido.pisar(); }
            else herir(b.x);
          }
        });
        items.forEach((it) => {
          if (it.sale > 0) { it.sale -= dt; it.y -= 20 * dt; return; }
          it.vy = Math.min(300, it.vy + GRAV * 0.6 * dt); it.x += it.vx * dt; it.y += it.vy * dt;
          const cy = Math.floor((it.y + 8) / T);
          if (solido(Math.floor((it.x + 4) / T), cy)) { it.y = cy * T - 8; it.vy = it.clase === "estrella" ? -200 : 0; }
          if (solido(Math.floor((it.x + (it.vx > 0 ? 8 : 0)) / T), Math.floor((it.y + 4) / T))) it.vx = -it.vx;
          if (Math.abs(it.x + 4 - (h.x + 6)) < 10 && Math.abs(it.y + 4 - (h.y + 8)) < 12) {
            it.fuera = true;
            if (it.clase === "corazon") { ctx.ganarVida(); ctx.sumar(20); ctx.sonido.correcto(); } else { h.estrella = 8; ctx.sumar(20); ctx.sonido.fin(); }
          }
          if (it.y > VH + 20) it.fuera = true;
        });
        items = items.filter((it) => !it.fuera);
        if (jefe) {
          const j = jefe; j.t += dt;
          if (j.estado === "vivo") {
            j.y = 2 * T + Math.sin(j.t * 1.6) * 18;
            j.disparo -= dt;
            if (j.disparo <= 0 && h.x > nivel.zona0 * T - 4 * T) {      // dispara solo cuando el héroe está cerca, lento y esquivable
              j.disparo = 3.4;
              const dx = h.x - j.x, dy = h.y - (j.y + 14), d = Math.hypot(dx, dy) || 1;
              fuegos.push({ x: j.x, y: j.y + 14, vx: (dx / d) * 65, vy: (dy / d) * 65, t: 6 });
            }
          } else if (j.estado === "rayo") { j.golpe -= dt; if (j.golpe <= 0) { j.estado = "cae"; j.vy = -120; } }
          else if (j.estado === "cae") { j.vy += GRAV * dt; j.y += j.vy * dt; if (j.y > VH + 40) { j.estado = "fuera"; abrirReja(); } }
          else if (j.estado === "huye") { j.y -= 90 * dt; j.x += 40 * dt; if (j.y < -40) { j.estado = "fuera"; abrirReja(); } }
          fuegos.forEach((f) => { f.x += f.vx * dt; f.y += f.vy * dt; f.t -= dt;
            if (Math.abs(f.x + 3 - (h.x + 6)) < 8 && Math.abs(f.y + 3 - (h.y + 8)) < 10) { f.t = 0; herir(f.x); } });
          fuegos = fuegos.filter((f) => f.t > 0);
        }
      };
      const abrirReja = () => {
        if (reja.abierta) return;
        reja.abierta = true;
        for (let y = 0; y < SUELO; y++) nivel.t[y][reja.x] = null;
        ctx.sonido.salto();
      };

      /* ---------------------------------------------------------- dibujo */
      const fondo = (m) => {
        const cielo = g.createLinearGradient(0, 0, 0, VH); cielo.addColorStop(0, m.cielo[0]); cielo.addColorStop(1, m.cielo[1]);
        g.fillStyle = cielo; g.fillRect(0, 0, VW, VH);
        const lejos = camara * 0.25, medio = camara * 0.5;
        if (m === MUNDOS.pradera) {
          g.fillStyle = "#a7dca3";
          for (let i = -1; i < 6; i++) { const cx = i * 140 - lejos % 140; g.beginPath(); g.ellipse(cx + 70, SUELO * T + 10, 90, 70, 0, Math.PI, 0); g.fill(); }
          g.fillStyle = "#79c374";
          for (let i = -1; i < 6; i++) { const cx = i * 110 - medio % 110; g.beginPath(); g.ellipse(cx + 50, SUELO * T + 6, 60, 40, 0, Math.PI, 0); g.fill(); }
          g.fillStyle = "#ffffff";
          for (let i = -1; i < 5; i++) { const cx = i * 130 - (camara * 0.4 + cuadro * 0.08) % 130 + 30, cy = 18 + (i % 2) * 18;
            g.fillRect(cx, cy, 34, 8); g.fillRect(cx + 6, cy - 6, 20, 6); g.fillRect(cx + 26, cy - 3, 10, 4); }
        } else if (m === MUNDOS.cueva) {
          g.fillStyle = "#231d45";
          for (let i = -1; i < 9; i++) { const cx = i * 46 - lejos % 46; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx + 23, 30 + (i % 3) * 14); g.lineTo(cx + 46, 0); g.fill(); }
          g.fillStyle = "#2f2860";
          for (let i = -1; i < 7; i++) { const cx = i * 70 - medio % 70; g.beginPath(); g.moveTo(cx, SUELO * T); g.lineTo(cx + 35, SUELO * T - 40 - (i % 2) * 20); g.lineTo(cx + 70, SUELO * T); g.fill(); }
        } else if (m === MUNDOS.nieve) {
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
        } else if (tipo === "piedra" || tipo === "losa") {
          g.fillStyle = "#1a1a2e"; g.fillRect(x, y, T, T);
          g.fillStyle = m.piedra; g.fillRect(x + 1, y + 1, T - 2, T - 2);
          g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(x + 1, y + 1, T - 2, 2); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x + 1, y + T - 3, T - 2, 2);
        } else if (tipo === "tubo") {
          g.fillStyle = "#1f9d55"; g.fillRect(x + 1, y, T - 2, T); g.fillStyle = "#56d68d"; g.fillRect(x + 3, y, 2, T);
          if (!(nivel.t[cy - 1] && nivel.t[cy - 1][cx] === "tubo")) { g.fillStyle = "#14713c"; g.fillRect(x - 1, y, T + 2, 4); }
        } else if (tipo === "muro") {
          g.fillStyle = "#6b7280"; g.fillRect(x, y, T, T); g.fillStyle = "#4b5563"; g.fillRect(x, y + 7, T, 1);
        } else if (tipo === "sorpresa" || tipo === "usado") {
          g.fillStyle = "#1a1a2e"; g.fillRect(x, y, T, T);
          g.fillStyle = tipo === "usado" ? "#8b7355" : "#f5b400"; g.fillRect(x + 1, y + 1, T - 2, T - 2);
          if (tipo === "sorpresa") { g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(x + 1, y + 1, T - 2, 2); textoJuego(g, "?", x + 8, y + 8.5 + (Math.floor(cuadro / 20) % 2), 12, "#7c2d12", { sombra: null }); }
        } else if (tipo === "reja") {
          g.fillStyle = "#374151"; g.fillRect(x + 2, y, 3, T); g.fillRect(x + 7, y, 3, T); g.fillRect(x + 12, y, 3, T);
          g.fillStyle = "#9ca3af"; g.fillRect(x + 2, y, 1, T); g.fillRect(x + 7, y, 1, T); g.fillRect(x + 12, y, 1, T);
          if (cy % 3 === 0) { g.fillStyle = "#4b5563"; g.fillRect(x, y + 6, T, 3); }
        }
      };
      const colorOpcion = (o) => (o.estado === "bien" ? "#f5b400" : o.estado === "mal" || o.estado === "apagado" ? "#9ca3af" : ctx.colores[o.k]);
      const dibujarOpcion = (o, dx) => {
        const letra = o.estado === "bien" ? "✓" : o.estado === "mal" ? "✗" : ctx.letras[o.k];
        if (o.tipo === "bloque") {
          const x = o.x * T + dx, y = o.y * T - Math.round(Math.sin(o.salto * Math.PI) * 5);
          g.fillStyle = "#1a1a2e"; g.fillRect(x, y, T, T); g.fillStyle = colorOpcion(o); g.fillRect(x + 1, y + 1, T - 2, T - 2);
          g.fillStyle = "rgba(255,255,255,.45)"; g.fillRect(x + 1, y + 1, T - 2, 2);
          textoJuego(g, letra, x + 8, y + 8.5, 11, "#ffffff", { sombra: "rgba(0,0,0,.45)" });
        } else if (o.tipo === "gema") {
          const x = o.x + dx, y = o.y + Math.sin(cuadro / 15 + o.k) * 1.5;
          g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y - 8); g.stroke();
          if (o.estado === "bien") return;
          g.fillStyle = "#1a1a2e"; g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 9, y); g.lineTo(x, y + 9); g.lineTo(x - 9, y); g.fill();
          g.fillStyle = colorOpcion(o); g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 8, y); g.lineTo(x, y + 8); g.lineTo(x - 8, y); g.fill();
          g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 4, y - 4); g.lineTo(x, y); g.lineTo(x - 4, y - 4); g.fill();
          textoJuego(g, letra, x, y + 0.5, 9, "#ffffff", { sombra: "rgba(0,0,0,.5)" });
        } else if (o.tipo === "burbuja") {
          if (o.estado === "bien" || o.estado === "mal") { return; }
          const x = o.x + dx, y = o.y;
          g.fillStyle = colorOpcion(o); g.globalAlpha = 0.85; g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
          g.strokeStyle = "#ffffff"; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.stroke();
          g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.arc(x - 4, y - 4, 2.2, 0, Math.PI * 2); g.fill();
          textoJuego(g, letra, x, y + 0.5, 10, "#ffffff", { sombra: "rgba(0,0,0,.45)" });
        } else if (o.tipo === "boton") {
          const x = o.x * T + dx, y = 6 * T, apretado = o.estado === "bien" || o.estado === "mal";
          g.fillStyle = "#1a1a2e"; g.fillRect(x + 6, y - (apretado ? 3 : 6), 20, apretado ? 3 : 6);
          g.fillStyle = colorOpcion(o); g.fillRect(x + 7, y - (apretado ? 2 : 5), 18, apretado ? 2 : 5);
          textoJuego(g, letra, x + 16, y - 15 + Math.sin(cuadro / 12 + o.k) * 1.5, 11, colorOpcion(o));
        }
      };
      const dibujar = () => {
        fondo(mundo);
        const x0 = Math.floor(camara / T), dx = -Math.round(camara);
        for (let y = 0; y < FILAS; y++) for (let x = x0; x < x0 + VW / T + 2 && x < nivel.ancho; x++) {
          const tipo = nivel.t[y][x];
          if (tipo && tipo !== "bloque") tile(tipo, x * T + dx, y * T, x, y);
        }
        nivel.lava.forEach((x) => {
          const fx = x * T + dx; if (fx < -T || fx > VW) return;
          g.fillStyle = "#dc2626"; g.fillRect(fx, SUELO * T + 8, T, VH);
          g.fillStyle = "#f97316"; for (let i = 0; i < 4; i++) g.fillRect(fx + i * 4, SUELO * T + 6 + Math.round(Math.sin(cuadro / 8 + x * 4 + i) * 2), 4, 3);
        });
        moviles.forEach((p) => { const x = Math.round(p.x + dx);
          g.fillStyle = "#1a1a2e"; g.fillRect(x, p.y, p.w, 7); g.fillStyle = mundo.piedra; g.fillRect(x + 1, p.y + 1, p.w - 2, 5);
          g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(x + 1, p.y + 1, p.w - 2, 1); });
        if (reja.abierta && reja.sube < 1) {
          const rx = reja.x * T + dx, sube = Math.round(reja.sube * SUELO * T);
          g.save(); g.beginPath(); g.rect(rx - 2, 0, T + 4, SUELO * T); g.clip();
          for (let y = 0; y < SUELO; y++) tile("reja", rx, y * T - sube, reja.x, y);
          g.restore();
        }
        opciones.forEach((o) => dibujarOpcion(o, dx));
        // bandera
        const mx = meta.x + dx, baja = meta.tocada ? Math.min(1, meta.tocada) : 0;
        g.fillStyle = "#e5e7eb"; g.fillRect(mx + 7, 2 * T, 2, SUELO * T - 2 * T); g.fillStyle = "#f5b400"; g.fillRect(mx + 5, 2 * T - 4, 6, 5);
        g.fillStyle = reja.abierta ? "#22c55e" : "#9ca3af";
        const fy = 2 * T + 4 + Math.round(baja * (SUELO * T - 3 * T - 16));
        g.beginPath(); g.moveTo(mx + 7, fy); g.lineTo(mx - 13, fy + 7); g.lineTo(mx + 7, fy + 14); g.fill();
        g.fillStyle = "#57534e"; g.fillRect(mx + 2, SUELO * T - 6, 12, 6);
        monedas.forEach((m) => !m.tomada && g.drawImage(MONEDA, Math.round(m.x + dx), Math.round(m.y + Math.sin((cuadro + m.x) / 10) * 1.5)));
        items.forEach((it) => g.drawImage(it.clase === "corazon" ? CORAZON : ESTRELLA, Math.round(it.x + dx), Math.round(it.y)));
        particulas.forEach((p) => g.drawImage(MONEDA, Math.round(p.x + dx), Math.round(p.y)));
        bichos.forEach((b) => {
          if (!b.vivo && b.aplastado <= 0) return;
          const x = Math.round(b.x + dx), y = Math.round(b.y), f = Math.floor(cuadro / 12) % 2;
          if (b.tipo === "volador") { if (b.vivo) g.drawImage(VOLADOR[Math.floor(cuadro / 7) % 2], x, y); return; }
          if (b.tipo === "pincho") { if (b.vivo) g.drawImage(PINCHO, x, y + 3); return; }
          if (!b.vivo) { g.drawImage(mundo.caminante[1], 0, 6, 16, 6, x, y + 6, 16, 6); return; }
          g.drawImage(mundo.caminante[f], x, y);
        });
        if (jefe && jefe.estado !== "fuera") {
          const jx = Math.round(jefe.x + dx), jy = Math.round(jefe.y);
          g.save(); if (jefe.estado === "rayo" && Math.floor(cuadro / 3) % 2) g.globalAlpha = 0.4;
          g.drawImage(JEFE, jx, jy, 32, 28); g.restore();
          if (jefe.estado === "rayo") {
            g.strokeStyle = "#fde047"; g.lineWidth = 3;
            for (let r = 0; r < 3; r++) { g.beginPath(); let px = jx + 6 + r * 10, py = 0; g.moveTo(px, py);
              while (py < jy + 10) { py += 8; px += (Math.random() - 0.5) * 10; g.lineTo(px, py); } g.stroke(); }
          }
          if (jefe.estado === "huye") textoJuego(g, "¡Ja, ja!", jx + 16, jy - 8, 9, "#fde047");
          if (jefe.estado === "vivo") textoJuego(g, "Rey Bicho", jx + 16, jy - 7, 8, "#fca5a5");
        }
        fuegos.forEach((f) => g.drawImage(FUEGO, Math.round(f.x + dx), Math.round(f.y)));
        const h = heroe;
        if (!(h.invul > 0 && Math.floor(cuadro / 4) % 2)) {
          const sp = !h.suelo ? pj.sp.salto : h.vx ? (Math.floor(h.paso / 10) % 2 ? pj.sp.paso1 : pj.sp.paso2) : pj.sp.quieto;
          g.save(); g.translate(Math.round(h.x + dx) + (h.mira < 0 ? 12 : 0), Math.round(h.y) - 1); g.scale(h.mira, 1); g.drawImage(sp, 0, 0); g.restore();
          if (h.estrella > 0) { g.fillStyle = `hsla(${(cuadro * 12) % 360},90%,60%,.45)`; g.fillRect(Math.round(h.x + dx) - 1, Math.round(h.y) - 2, 14, 18); }
        }
        // textos (nítidos: el lienzo tiene la resolución de la pantalla)
        if (cartel > 0) {
          g.globalAlpha = Math.min(1, cartel);
          g.fillStyle = "rgba(10,12,40,.82)"; g.fillRect(VW / 2 - 130, 30, 260, 38);
          textoJuego(g, jefe ? "¡Jefe final!" : `Mundo ${mundo.nombre}`, VW / 2, 42, 12, "#fde047");
          textoJuego(g, jefe ? "Golpea desde abajo el bloque correcto para lanzarle un rayo" : mundo.ayuda, VW / 2, 57, 7.5, "#ffffff", { peso: 600 });
          g.globalAlpha = 1;
        }
        if (reja.abierta && !meta.tocada && Math.floor(cuadro / 30) % 2) textoJuego(g, "¡La reja se abrió! Corre a la bandera →", VW - 92, 14, 8, "#ffffff");
        if (h.estrella > 0) textoJuego(g, `★ ${Math.ceil(h.estrella)}`, 18, 12, 9, "#fde047", { alinear: "left" });
      };
      const dibujarEleccion = () => {
        const antes = camara; camara = cuadro * 0.6; fondo(MUNDOS.pradera); camara = antes;
        g.fillStyle = "rgba(10,12,40,.6)"; g.fillRect(0, 0, VW, VH);
        textoJuego(g, "Elige tu personaje", VW / 2, 20, 14, "#fde047");
        PERSONAJES.forEach((p, i) => {
          const cx = 40 + i * 80, sel = i === eleccion;
          g.fillStyle = sel ? "rgba(253,224,71,.22)" : "rgba(255,255,255,.08)"; g.fillRect(cx - 30, 36, 60, 92);
          if (sel) { g.strokeStyle = "#fde047"; g.lineWidth = 1.5; g.strokeRect(cx - 30, 36, 60, 92); }
          const sp = sel ? (Math.floor(cuadro / 10) % 2 ? p.sp.paso1 : p.sp.paso2) : p.sp.quieto;
          g.drawImage(sp, cx - 18, 48 + (sel ? -Math.abs(Math.sin(cuadro / 8)) * 4 : 0), 36, 48);
          textoJuego(g, p.nombre, cx, 116, 11, sel ? "#fde047" : "#ffffff");
        });
        textoJuego(g, "◀ ▶ para cambiar  ·  Espacio o Enter para empezar", VW / 2, 146, 8.5, "#ffffff", { peso: 600 });
        textoJuego(g, "En el celular: toca tu personaje dos veces", VW / 2, 160, 7.5, "#cbd5e1", { peso: 600 });
      };
      const empezar = () => {
        if (estado !== "elegir") return;
        pj = PERSONAJES[eleccion]; recordar("pixel.personaje", String(eleccion));
        estado = "jugando"; cartel = 2.6; ctx.reiniciarReloj(); ctx.sonido.correcto();
        teclas._saltar = false;
      };

      /* ---------------------------------------------------------- ciclo */
      const paso = (tm) => {
        if (!vivo) return;
        const dt = Math.min(0.034, (tm - ultimo) / 1000); ultimo = tm; cuadro++;
        if (estado === "elegir") { dibujarEleccion(); requestAnimationFrame(paso); return; }
        if (!ctx.pausado()) {
          t += dt;
          moverResto(dt); moverHeroe(dt);
          opciones.forEach((o) => { if (o.salto) o.salto = Math.max(0, o.salto - dt * 5); });
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
      mando.addEventListener("pointerdown", (e) => {
        if (estado !== "elegir") return;
        const b = e.target.closest("[data-tecla]"); if (!b) return;
        if (b.dataset.tecla === "izq") eleccion = (eleccion + 3) % 4; else if (b.dataset.tecla === "der") eleccion = (eleccion + 1) % 4; else empezar();
      });
      const alRedimensionar = () => { g = ajustarLienzo(lienzo, VW, VH); };
      window.addEventListener("resize", alRedimensionar);
      document.addEventListener("fullscreenchange", alRedimensionar);
      requestAnimationFrame((tm) => { ultimo = tm; paso(tm); });
      // para pruebas: estado interno e ir directo a una ronda
      JUEGOS.plataformas._estado = () => ({ heroe, nivel, estado, reja, meta, jefe, bichos, opciones, moviles, mundo, teclas });
      JUEGOS.plataformas._ronda = (r, i) => { ronda = r; if (i) info = i; crearNivel(); };

      return {
        ronda(n, i) { nOpciones = n; info = i || info; ronda++; crearNivel(); },
        trasResponder(bien) {
          if (jefe && jefe.estado === "vivo") {
            fuegos = [];
            if (bien) { jefe.estado = "rayo"; jefe.golpe = 1.0; ctx.sumar(300); ctx.sonido.golpe(); } else jefe.estado = "huye";
          } else abrirReja();
        },
        destruir() {
          vivo = false; window.removeEventListener("keydown", abajo); window.removeEventListener("keyup", arriba);
          lienzo.removeEventListener("pointerdown", tocar);
          window.removeEventListener("resize", alRedimensionar); document.removeEventListener("fullscreenchange", alRedimensionar);
        },
      };
    },
  };
})();
