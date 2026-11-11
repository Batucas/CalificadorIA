/* Calificador IA — Juego «Laberinto del saber»: recorre el laberinto, come puntos y llega a la esquina con la
   respuesta correcta esquivando a los bichos. Gráficos y personajes propios (pixel art). Diseñado por Lic. Salvador Ortega Pardo. */
"use strict";

(() => {
  const T = 16;
  const MAPA = [
    "#####################",
    "#A........#........B#",
    "#.###.###.#.###.###.#",
    "#...................#",
    "#.###.#.#####.#.###.#",
    "#.....#...#...#.....#",
    "#.#.#...GG.GG...#.#.#",
    "#.....#.......#.....#",
    "#.###.#.#####.#.###.#",
    "#.........P.........#",
    "#.###.###.#.###.###.#",
    "#C........#........D#",
    "#####################",
  ];
  const W = MAPA[0].length, H = MAPA.length;
  const DIRS = { izq: [-1, 0], der: [1, 0], arr: [0, -1], aba: [0, 1] };
  const OPUESTA = { izq: "der", der: "izq", arr: "aba", aba: "arr" };
  const COLORES_BICHO = ["#ff5d73", "#ff9f1c", "#b15dff", "#21c7c7"];

  const pared = (x, y) => x < 0 || y < 0 || x >= W || y >= H || MAPA[y][x] === "#";
  const buscar = (ch) => { const out = []; MAPA.forEach((f, y) => [...f].forEach((c, x) => c === ch && out.push([x, y]))); return out; };
  const ZONAS = ["A", "B", "C", "D"].map((l) => buscar(l)[0]);
  const INICIO = buscar("P")[0], NIDO = buscar("G");

  const JUGADOR = spritePixel([
    "....bbbbb.....", "..bbbbbbbbb...", ".....bbb..b...", "...yyyyyyy.b..", "..yyyyyyyyy...", "..ywkyyywky...",
    "..yyyyyyyyy...", "..yyykkkyyy...", "...yyyyyyy....", "...rrrrrrr....", "..rrrrrrrrr...", "..r.rrrrr.r...",
  ], { b: "#1d2c73", y: "#ffcf6b", w: "#ffffff", k: "#111827", r: "#e5484d" });
  const bicho = (color, f) => spritePixel([
    "..k......k..", "...k....k...", "...cccccc...", "..cccccccc..", ".ccwwccwwcc.", ".ccwkccwkcc.",
    ".cccccccccc.", ".cckkkkkkcc.", "..cccccccc..", f ? ".c..c..c..c." : "..c.c..c.c..", f ? "c..........c" : ".c........c.",
  ], { c: color, w: "#ffffff", k: "#111827" });

  JUEGOS.laberinto = {
    nombre: "Laberinto del saber", icono: "🧭",
    descripcion: "Recorre el laberinto y llega a la esquina con la respuesta correcta sin que te atrapen los bichos.",
    crear(ctx) {
      const teclas = {};
      const lienzo = ctx.canvas;
      let g = ajustarLienzo(lienzo, W * T, H * T);
      const spritesBicho = COLORES_BICHO.map((c) => [bicho(c, 0), bicho(c, 1)]);
      let puntos = new Set(), nOpciones = 4, ronda = 0, cuadro = 0, ultimo = performance.now(), vivo = true, invulnerable = 0, respondida = false;
      const j = { x: 0, y: 0, dir: null, quiere: null, avance: 0 };
      let bichos = [];

      const llenarPuntos = () => { puntos = new Set(); MAPA.forEach((f, y) => [...f].forEach((c, x) => c === "." && puntos.add(`${x},${y}`))); };
      const colocar = () => {
        Object.assign(j, { x: INICIO[0], y: INICIO[1], dir: null, quiere: null, avance: 0 });
        bichos = NIDO.slice(0, Math.min(4, 2 + Math.floor(ronda / 3))).map(([x, y], k) => ({ x, y, dir: "arr", avance: 0, k, sale: 1.2 + k * 1.4 }));
        invulnerable = 1.0; respondida = false;
      };
      const libre = (x, y, d) => !pared(x + DIRS[d][0], y + DIRS[d][1]);

      const moverJugador = (dt) => {
        const vel = 5.2;
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
          if (puntos.delete(clave)) { ctx.sumar(1); if (cuadro % 3 === 0) ctx.sonido.punto(); if (!puntos.size) llenarPuntos(); }
          const z = ZONAS.findIndex(([zx, zy]) => zx === j.x && zy === j.y);
          if (z >= 0 && z < nOpciones && !respondida) { respondida = true; j.dir = null; ctx.responder(z); }
        }
      };
      const moverBicho = (b, dt) => {
        if (b.sale > 0) { b.sale -= dt; return; }
        const vel = Math.min(4.6, 3.1 + ronda * 0.12);
        if (b.avance === 0) {
          const opciones = Object.keys(DIRS).filter((d) => libre(b.x, b.y, d) && d !== OPUESTA[b.dir]);
          const cand = opciones.length ? opciones : Object.keys(DIRS).filter((d) => libre(b.x, b.y, d));
          // dos persiguen, los otros cortan el paso o deambulan
          const [px, py] = b.k % 2 === 0 ? [j.x, j.y] : [j.x + (DIRS[j.dir || "der"][0] * 4), j.y + (DIRS[j.dir || "der"][1] * 4)];
          b.dir = Math.random() < 0.22 ? cand[Math.floor(Math.random() * cand.length)]
            : cand.reduce((m, d) => { const dd = (b.x + DIRS[d][0] - px) ** 2 + (b.y + DIRS[d][1] - py) ** 2; return dd < m[1] ? [d, dd] : m; }, [cand[0], Infinity])[0];
        }
        b.avance += vel * dt;
        if (b.avance >= 1) { b.x += DIRS[b.dir][0]; b.y += DIRS[b.dir][1]; b.avance = 0; }
      };
      const pos = (e) => [(e.x + (e.dir ? DIRS[e.dir][0] * e.avance : 0)) * T, (e.y + (e.dir ? DIRS[e.dir][1] * e.avance : 0)) * T];

      const dibujar = () => {
        g.fillStyle = "#0b1030"; g.fillRect(0, 0, W * T, H * T);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (!pared(x, y)) continue;
          g.fillStyle = "#1f3fbf"; g.fillRect(x * T, y * T, T, T);
          g.fillStyle = "#3a63ff"; g.fillRect(x * T + 1, y * T + 1, T - 2, 2); g.fillRect(x * T + 1, y * T + 1, 2, T - 2);
          g.fillStyle = "#14287e"; g.fillRect(x * T + 1, y * T + T - 3, T - 2, 2);
        }
        g.fillStyle = "#ffd27f";
        puntos.forEach((k) => { const [x, y] = k.split(",").map(Number); g.fillRect(x * T + 7, y * T + 7, 2, 2); });
        const late = 0.5 + 0.5 * Math.sin(cuadro / 8);
        ZONAS.forEach(([x, y], k) => {
          if (k >= nOpciones) return;
          g.fillStyle = ctx.colores[k]; g.globalAlpha = 0.75 + 0.25 * late; g.fillRect(x * T, y * T, T, T); g.globalAlpha = 1;
          g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(x * T, y * T, T, 2);
          letraPixel(g, ctx.letras[k], x * T + 3, y * T + 1, "#ffffff", 2);
        });
        const [jx, jy] = pos(j);
        if (!(invulnerable > 0 && Math.floor(cuadro / 4) % 2)) g.drawImage(JUGADOR, Math.round(jx + 1), Math.round(jy + 2));
        bichos.forEach((b) => { const [bx, by] = pos(b); g.drawImage(spritesBicho[b.k][Math.floor(cuadro / 10) % 2], Math.round(bx + 2), Math.round(by + 3)); });
      };

      const paso = (t) => {
        if (!vivo) return;
        const dt = Math.min(0.05, (t - ultimo) / 1000); ultimo = t; cuadro++;
        if (!ctx.pausado()) {
          for (const d of Object.keys(DIRS)) if (teclas[d]) j.quiere = d;
          moverJugador(dt);
          bichos.forEach((b) => moverBicho(b, dt));
          invulnerable = Math.max(0, invulnerable - dt);
          const [jx, jy] = pos(j);
          if (invulnerable <= 0 && bichos.some((b) => { const [bx, by] = pos(b); return Math.abs(bx - jx) < 10 && Math.abs(by - jy) < 10; })) {
            ctx.perderVida(); colocar(); invulnerable = 1.6;
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
      lienzo.addEventListener("pointerdown", (e) => (toque = [e.clientX, e.clientY]));
      lienzo.addEventListener("pointerup", (e) => {
        if (!toque) return; const dx = e.clientX - toque[0], dy = e.clientY - toque[1]; toque = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) j.quiere = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "der" : "izq") : (dy > 0 ? "aba" : "arr");
      });
      const alRedimensionar = () => { g = ajustarLienzo(lienzo, W * T, H * T); };
      window.addEventListener("resize", alRedimensionar);
      document.addEventListener("fullscreenchange", alRedimensionar);
      llenarPuntos();
      requestAnimationFrame((t) => { ultimo = t; paso(t); });

      return {
        ronda(n) { nOpciones = n; ronda++; colocar(); },
        reiniciarJugador() { colocar(); invulnerable = 1.6; },
        destruir() {
          vivo = false; window.removeEventListener("keydown", abajo); window.removeEventListener("keyup", arriba);
          window.removeEventListener("resize", alRedimensionar); document.removeEventListener("fullscreenchange", alRedimensionar);
        },
      };
    },
  };
})();
