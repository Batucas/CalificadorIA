/* Calificador IA — Juego «Laberinto del saber»: recorre el laberinto y llega a la esquina con la respuesta correcta
   esquivando a los bichos. Tres mapas que se turnan, las letras cambian de esquina en cada pregunta y las estrellas
   asustan a los bichos (se pueden atrapar). Cada error cuesta una vida. Gráficos propios (pixel art).
   Diseñado por Lic. Salvador Ortega Pardo. */
"use strict";

(() => {
  const T = 16;
  // # pared · . punto · o estrella · A-D esquinas de respuesta · G nido de bichos · P salida del jugador
  const MAPAS = [
    ["#####################", "#A........#........B#", "#.###.###.#.###.###.#", "#o.................o#", "#.###.#.#####.#.###.#",
     "#.....#...#...#.....#", "#.#.#...GG.GG...#.#.#", "#.....#.......#.....#", "#.###.#.#####.#.###.#", "#.........P.........#",
     "#.###.###.#.###.###.#", "#C........#........D#", "#####################"],
    ["#####################", "#A.......###.......B#", "#.##.###.###.###.##.#", "#.#o.............o#.#", "#.#.##.#######.##.#.#",
     "#......#.GGG.#......#", "####.#.#.....#.#.####", "#......###.###......#", "#.##.#....P....#.##.#", "#o.................o#",
     "#.##.###.###.###.##.#", "#C.......###.......D#", "#####################"],
    ["#####################", "#A..#.....#.....#..B#", "#.#.#.###.#.###.#.#.#", "#.#...#.......#...#.#", "#.###.#.##.##.#.###.#",
     "#o....#..GGG..#....o#", "###.#.#.......#.#.###", "#...#...##P##...#...#", "#.#.###.......###.#.#", "#.#.....#.#.#.....#.#",
     "#.###.#.#.#.#.#.###.#", "#C....#.......#....D#", "#####################"],
  ];
  const W = 21, H = 13;
  const PALETAS = [["#1f3fbf", "#3a63ff", "#14287e"], ["#0f766e", "#2dd4bf", "#134e4a"], ["#7c2d92", "#c084fc", "#4a1d5c"]];
  const DIRS = { izq: [-1, 0], der: [1, 0], arr: [0, -1], aba: [0, 1] };
  const OPUESTA = { izq: "der", der: "izq", arr: "aba", aba: "arr" };
  const COLORES_BICHO = ["#ff5d73", "#ff9f1c", "#b15dff", "#21c7c7"];
  const ASUSTADO = 6;                                         // segundos que dura la estrella

  const JUGADOR = spritePixel([
    "....bbbbb.....", "..bbbbbbbbb...", ".....bbb..b...", "...yyyyyyy.b..", "..yyyyyyyyy...", "..ywkyyywky...",
    "..yyyyyyyyy...", "..yyykkkyyy...", "...yyyyyyy....", "...rrrrrrr....", "..rrrrrrrrr...", "..r.rrrrr.r...",
  ], { b: "#1d2c73", y: "#ffcf6b", w: "#ffffff", k: "#111827", r: "#e5484d" });
  const bicho = (color, f) => spritePixel([
    "..k......k..", "...k....k...", "...cccccc...", "..cccccccc..", ".ccwwccwwcc.", ".ccwkccwkcc.",
    ".cccccccccc.", ".cckkkkkkcc.", "..cccccccc..", f ? ".c..c..c..c." : "..c.c..c.c..", f ? "c..........c" : ".c........c.",
  ], { c: color, w: "#ffffff", k: "#111827" });
  const ESTRELLA = spritePixel(["...yy...", "..yyyy..", "yyyyyyyy", ".yyyyyy.", "..yyyy..", ".yy..yy.", "yy....yy"], { y: "#fde047" });

  JUEGOS.laberinto = {
    nombre: "Laberinto del saber", icono: "🧭", tiempo: 40, categoria: "Arcade",
    descripcion: "Recorre el laberinto y llega a la esquina con la respuesta correcta sin que te atrapen los bichos. Las letras cambian de esquina en cada pregunta.",
    crear(ctx) {
      const teclas = {};
      const lienzo = ctx.canvas;
      let g = ajustarLienzo(lienzo, W * T, H * T);
      const spritesBicho = COLORES_BICHO.map((c) => [bicho(c, 0), bicho(c, 1)]);
      const spriteAsustado = [bicho("#3b5bdb", 0), bicho("#3b5bdb", 1)], spriteParpadeo = [bicho("#e5e7eb", 0), bicho("#e5e7eb", 1)];
      let mapa = MAPAS[0], puntos = new Set(), estrellas = new Set(), nOpciones = 4, ronda = 0, cuadro = 0, ultimo = performance.now(), vivo = true;
      let invulnerable = 0, respondida = false, asustados = 0, zonas = [], inicio = [0, 0], nido = [], cartel = 0;
      const j = { x: 0, y: 0, dir: null, quiere: null, avance: 0 };
      let bichos = [];

      const pared = (x, y) => x < 0 || y < 0 || x >= W || y >= H || mapa[y][x] === "#";
      const buscar = (ch) => { const out = []; mapa.forEach((f, y) => [...f].forEach((c, x) => c === ch && out.push([x, y]))); return out; };
      const llenar = () => {
        puntos = new Set(); estrellas = new Set();
        mapa.forEach((f, y) => [...f].forEach((c, x) => { if (c === ".") puntos.add(`${x},${y}`); if (c === "o") estrellas.add(`${x},${y}`); }));
      };
      const colocarJugador = () => { Object.assign(j, { x: inicio[0], y: inicio[1], dir: null, quiere: null, avance: 0 }); invulnerable = 1.6; };
      const colocarBichos = () => {
        const n = Math.min(4, 2 + Math.floor((ronda - 1) / 2));
        bichos = Array.from({ length: n }, (_, k) => ({ x: nido[k % nido.length][0], y: nido[k % nido.length][1], dir: "arr", avance: 0, k, sale: 1.5 + k * 1.6, comido: false }));
      };
      const nuevaRonda = () => {
        mapa = MAPAS[(ronda - 1) % MAPAS.length];
        inicio = buscar("P")[0]; nido = buscar("G");
        // las cuatro esquinas se reparten al azar entre las letras: hay que leer el mapa en cada pregunta
        const esquinas = ["A", "B", "C", "D"].map((l) => buscar(l)[0]);
        zonas = barajar(esquinas);
        llenar(); colocarJugador(); colocarBichos();
        respondida = false; asustados = 0; cartel = 2;
      };
      const libre = (x, y, d) => !pared(x + DIRS[d][0], y + DIRS[d][1]);

      const moverJugador = (dt) => {
        const vel = 5.4;
        if (j.avance === 0) {
          if (j.quiere && libre(j.x, j.y, j.quiere)) j.dir = j.quiere;
          else if (j.dir && !libre(j.x, j.y, j.dir)) j.dir = null;
        } else if (j.quiere === OPUESTA[j.dir]) {                       // dar la vuelta en medio del pasillo
          j.x += DIRS[j.dir][0]; j.y += DIRS[j.dir][1]; j.avance = 1 - j.avance; j.dir = j.quiere;
        }
        if (!j.dir) return;
        j.avance += vel * dt;
        if (j.avance >= 1) {
          j.x += DIRS[j.dir][0]; j.y += DIRS[j.dir][1]; j.avance = 0;
          const clave = `${j.x},${j.y}`;
          if (puntos.delete(clave)) { ctx.sumar(1); if (cuadro % 3 === 0) ctx.sonido.punto(); }
          if (estrellas.delete(clave)) { asustados = ASUSTADO; ctx.sumar(20); ctx.sonido.moneda(); bichos.forEach((b) => { if (b.avance === 0 && b.dir) b.dir = OPUESTA[b.dir]; }); }
          const z = zonas.findIndex(([zx, zy]) => zx === j.x && zy === j.y);
          if (z >= 0 && z < nOpciones && !respondida) { respondida = true; j.dir = null; ctx.responder(z); }
        }
      };
      const moverBicho = (b, dt) => {
        if (b.sale > 0) { b.sale -= dt; return; }
        const miedo = asustados > 0 && !b.comido;
        const vel = b.comido ? 7 : miedo ? 2.4 : Math.min(4.8, 3.2 + ronda * 0.15);
        if (b.avance === 0) {
          if (b.comido && nido.some(([nx, ny]) => nx === b.x && ny === b.y)) { b.comido = false; b.sale = 1.2; return; }
          const opciones = Object.keys(DIRS).filter((d) => libre(b.x, b.y, d) && d !== OPUESTA[b.dir]);
          const cand = opciones.length ? opciones : Object.keys(DIRS).filter((d) => libre(b.x, b.y, d));
          let [px, py] = b.k % 2 === 0 ? [j.x, j.y] : [j.x + (DIRS[j.dir || "der"][0] * 4), j.y + (DIRS[j.dir || "der"][1] * 4)];
          if (b.comido) [px, py] = nido[0];
          const lejos = miedo;                                       // asustados: huyen del jugador
          b.dir = !b.comido && Math.random() < (miedo ? 0.5 : 0.2) ? cand[Math.floor(Math.random() * cand.length)]
            : cand.reduce((m, d) => { const dd = (b.x + DIRS[d][0] - px) ** 2 + (b.y + DIRS[d][1] - py) ** 2; return (lejos ? dd > m[1] : dd < m[1]) ? [d, dd] : m; },
                          [cand[0], lejos ? -1 : Infinity])[0];
        }
        b.avance += vel * dt;
        if (b.avance >= 1) { b.x += DIRS[b.dir][0]; b.y += DIRS[b.dir][1]; b.avance = 0; }
      };
      const pos = (e) => [(e.x + (e.dir ? DIRS[e.dir][0] * e.avance : 0)) * T, (e.y + (e.dir ? DIRS[e.dir][1] * e.avance : 0)) * T];

      const dibujar = () => {
        const [c1, c2, c3] = PALETAS[(ronda - 1 + PALETAS.length) % PALETAS.length];
        g.fillStyle = "#0b1030"; g.fillRect(0, 0, W * T, H * T);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (!pared(x, y)) continue;
          g.fillStyle = c1; g.fillRect(x * T, y * T, T, T);
          g.fillStyle = c2; g.fillRect(x * T + 1, y * T + 1, T - 2, 2); g.fillRect(x * T + 1, y * T + 1, 2, T - 2);
          g.fillStyle = c3; g.fillRect(x * T + 1, y * T + T - 3, T - 2, 2);
        }
        g.fillStyle = "#ffd27f";
        puntos.forEach((k) => { const [x, y] = k.split(",").map(Number); g.fillRect(x * T + 7, y * T + 7, 2, 2); });
        estrellas.forEach((k) => { const [x, y] = k.split(",").map(Number); const s = 1 + 0.15 * Math.sin(cuadro / 6);
          g.drawImage(ESTRELLA, x * T + 8 - 4 * s, y * T + 8 - 3.5 * s, 8 * s, 7 * s); });
        const late = 0.5 + 0.5 * Math.sin(cuadro / 8);
        zonas.forEach(([x, y], k) => {
          if (k >= nOpciones) return;
          g.fillStyle = ctx.colores[k]; g.globalAlpha = 0.75 + 0.25 * late; g.fillRect(x * T, y * T, T, T); g.globalAlpha = 1;
          g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(x * T, y * T, T, 2);
          textoJuego(g, ctx.letras[k], x * T + 8, y * T + 8.5, 12, "#ffffff", { sombra: "rgba(0,0,0,.45)" });
        });
        const [jx, jy] = pos(j);
        if (!(invulnerable > 0 && Math.floor(cuadro / 4) % 2)) g.drawImage(JUGADOR, Math.round(jx + 1), Math.round(jy + 2));
        bichos.forEach((b) => {
          const [bx, by] = pos(b), f = Math.floor(cuadro / 10) % 2;
          if (b.comido) { g.fillStyle = "#ffffff"; g.fillRect(bx + 4, by + 7, 3, 3); g.fillRect(bx + 9, by + 7, 3, 3); return; }
          const sp = asustados > 0 ? (asustados < 1.5 && Math.floor(cuadro / 6) % 2 ? spriteParpadeo : spriteAsustado) : spritesBicho[b.k];
          g.drawImage(sp[f], Math.round(bx + 2), Math.round(by + 3));
        });
        if (cartel > 0) {
          g.globalAlpha = Math.min(1, cartel);
          g.fillStyle = "rgba(10,12,40,.82)"; g.fillRect(W * T / 2 - 120, H * T / 2 - 20, 240, 40);
          textoJuego(g, "¡Las letras cambiaron de esquina!", W * T / 2, H * T / 2 - 6, 11, "#fde047");
          textoJuego(g, "Llega a la esquina con la respuesta correcta", W * T / 2, H * T / 2 + 9, 8.5, "#ffffff", { peso: 600 });
          g.globalAlpha = 1;
        }
        if (asustados > 0) textoJuego(g, `★ ¡Atrapa a los bichos! ${Math.ceil(asustados)}`, W * T / 2, 8, 8.5, "#fde047");
      };

      const paso = (t) => {
        if (!vivo) return;
        const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t; cuadro++;
        if (!ctx.pausado()) {
          for (const d of Object.keys(DIRS)) if (teclas[d]) j.quiere = d;
          moverJugador(dt);
          bichos.forEach((b) => moverBicho(b, dt));
          invulnerable = Math.max(0, invulnerable - dt); asustados = Math.max(0, asustados - dt); cartel = Math.max(0, cartel - dt);
          const [jx, jy] = pos(j);
          for (const b of bichos) {
            if (b.comido || b.sale > 0) continue;
            const [bx, by] = pos(b);
            if (Math.abs(bx - jx) >= 10 || Math.abs(by - jy) >= 10) continue;
            if (asustados > 0) { b.comido = true; ctx.sumar(50); ctx.sonido.pisar(); }
            else if (invulnerable <= 0) { ctx.perderVida(); colocarJugador(); colocarBichos(); break; }
          }
        }
        dibujar();
        requestAnimationFrame(paso);
      };

      const MAPEO = { ArrowLeft: "izq", a: "izq", A: "izq", ArrowRight: "der", d: "der", D: "der", ArrowUp: "arr", w: "arr", W: "arr", ArrowDown: "aba", s: "aba", S: "aba" };
      const abajo = (e) => { const d = MAPEO[e.key]; if (d) { e.preventDefault(); Object.keys(DIRS).forEach((k) => (teclas[k] = false)); teclas[d] = true; j.quiere = d; } };
      const arriba = (e) => { const d = MAPEO[e.key]; if (d) teclas[d] = false; };
      window.addEventListener("keydown", abajo); window.addEventListener("keyup", arriba);
      mandoTactil(lienzo.parentElement.querySelector(".juego-mando"), [["arr", "▲", "m-arr"], ["izq", "◀", "m-izq"], ["der", "▶", "m-der"], ["aba", "▼", "m-aba"]], teclas);
      let toque = null;                                      // deslizar el dedo sobre el laberinto
      const tocar = (e) => (toque = [e.clientX, e.clientY]);
      const soltar = (e) => {
        if (!toque) return; const dx = e.clientX - toque[0], dy = e.clientY - toque[1]; toque = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) j.quiere = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "der" : "izq") : (dy > 0 ? "aba" : "arr");
      };
      lienzo.addEventListener("pointerdown", tocar); lienzo.addEventListener("pointerup", soltar);
      const alRedimensionar = () => { g = ajustarLienzo(lienzo, W * T, H * T); };
      window.addEventListener("resize", alRedimensionar);
      document.addEventListener("fullscreenchange", alRedimensionar);
      requestAnimationFrame((t) => { ultimo = t; paso(t); });
      JUEGOS.laberinto._estado = () => ({ j, bichos, zonas, mapa, asustados });   // para pruebas

      return {
        ronda(n) { nOpciones = n; ronda++; nuevaRonda(); },
        destruir() {
          vivo = false; window.removeEventListener("keydown", abajo); window.removeEventListener("keyup", arriba);
          lienzo.removeEventListener("pointerdown", tocar); lienzo.removeEventListener("pointerup", soltar);
          window.removeEventListener("resize", alRedimensionar); document.removeEventListener("fullscreenchange", alRedimensionar);
        },
      };
    },
  };
})();
