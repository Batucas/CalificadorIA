/* Calculadoras de Economía. */
(function () {
  "use strict";
  var M = CALC.M, fmt = CALC.fmt, fmtN = CALC.fmtN, pct = CALC.pct;
  var A = "Economía";

  /* ------------------------------------------------------------ 1. IS-LM */
  CALC.registrar({
    id: "is-lm", area: A, titulo: "Modelo IS-LM", resumen: "Equilibrio del mercado de bienes y de dinero; efecto de políticas.",
    palabras: "is lm hicks equilibrio renta tasa interes politica fiscal monetaria multiplicador desplazamiento crowding out efecto expulsion",
    descripcion: "Encuentre el equilibrio de la economía cerrada (ingreso Y y tasa de interés r) y vea cómo lo mueven la política fiscal (ΔG, ΔT) y la monetaria (ΔM).",
    campos: [
      { id: "nota1", tipo: "nota", texto: "<b>Mercado de bienes:</b> C = a + c·(Y − T) · I = e − b·r · G y T dados." },
      { id: "a", etiqueta: "Consumo autónomo (a)", valor: "100" },
      { id: "c", etiqueta: "Propensión marginal a consumir (c)", valor: "0,8", mayor: 0, menor: 1 },
      { id: "e", etiqueta: "Inversión autónoma (e)", valor: "300" },
      { id: "b", etiqueta: "Sensibilidad de I a r (b)", valor: "20", mayor: 0 },
      { id: "G", etiqueta: "Gasto público (G)", valor: "200" },
      { id: "T", etiqueta: "Impuestos (T)", valor: "200" },
      { id: "nota2", tipo: "nota", texto: "<b>Mercado de dinero:</b> L = k·Y − h·r = M/P." },
      { id: "k", etiqueta: "Sensibilidad de L a Y (k)", valor: "0,25", mayor: 0 },
      { id: "h", etiqueta: "Sensibilidad de L a r (h)", valor: "25", mayor: 0 },
      { id: "MP", etiqueta: "Oferta real de dinero (M/P)", valor: "400", mayor: 0 },
      { id: "nota3", tipo: "nota", texto: "<b>Política económica</b> (opcional): escriba los cambios para comparar el nuevo equilibrio." },
      { id: "dG", etiqueta: "Cambio en G (ΔG)", valor: "50" },
      { id: "dT", etiqueta: "Cambio en T (ΔT)", valor: "0" },
      { id: "dM", etiqueta: "Cambio en M/P (ΔM)", valor: "0" }
    ],
    calcular: function (v) {
      function eq(G, T, MP) {
        var Aut = v.a - v.c * T + v.e + G, den = v.h * (1 - v.c) + v.b * v.k, Y = (v.h * Aut + v.b * MP) / den, r = (v.k * Y - MP) / v.h;
        return { A: Aut, Y: Y, r: r, C: v.a + v.c * (Y - T), I: v.e - v.b * r };
      }
      var e0 = eq(v.G, v.T, v.MP), hay = v.dG !== 0 || v.dT !== 0 || v.dM !== 0, e1 = hay ? eq(v.G + v.dG, v.T + v.dT, v.MP + v.dM) : null;
      var den = v.h * (1 - v.c) + v.b * v.k, mf = v.h / den, mm = v.b / den, mk = 1 / (1 - v.c);
      var is = function (Aut) { return function (Y) { return (Aut - (1 - v.c) * Y) / v.b; }; }, lm = function (MP) { return function (Y) { return (v.k * Y - MP) / v.h; }; };
      var Ys = [e0.Y].concat(e1 ? [e1.Y] : []), Yc = (Math.min.apply(null, Ys) + Math.max.apply(null, Ys)) / 2, ancho = Math.max(Math.abs(Ys[0] - (Ys[1] || Ys[0])) * 1.5, Yc * 0.35, 1);
      var rs = [e0.r].concat(e1 ? [e1.r] : []), rmin = Math.min.apply(null, rs), rmax = Math.max.apply(null, rs), rpad = Math.max((rmax - rmin) * 1.2, Math.abs(e0.r) * 0.8, 2);
      var series = [{ f: is(e0.A), color: "acento", nombre: "IS", n: 2 }, { f: lm(v.MP), color: "cola", nombre: "LM", n: 2 }];
      if (e1 && (v.dG || v.dT)) series.push({ f: is(e1.A), color: "acento", guion: true, nombre: "IS' (después)", n: 2 });
      if (e1 && v.dM) series.push({ f: lm(v.MP + v.dM), color: "cola", guion: true, nombre: "LM' (después)", n: 2 });
      var puntos = [{ x: e0.Y, y: e0.r, color: "tinta", texto: "E₀", guias: true }]; if (e1) puntos.push({ x: e1.Y, y: e1.r, color: "s3", texto: "E₁", guias: true });
      var stats = [["Tasa de interés (r*)", fmt(e0.r, 4) + " %"], ["Consumo (C)", fmt(e0.C, 2)], ["Inversión (I)", fmt(e0.I, 2)], ["Multiplicador fiscal", fmt(mf, 4)], ["Multiplicador monetario", fmt(mm, 4)]];
      var concl = "En el equilibrio inicial Y = " + fmt(e0.Y, 2) + " y r = " + fmt(e0.r, 2) + " %.";
      var pasos = [
        "Curva IS (equilibrio en bienes): Y = C + I + G → Y = [a − c·T + e + G − b·r] / (1 − c). Gasto autónomo A = " + fmtN(v.a) + " − " + fmtN(v.c) + "×" + fmtN(v.T) + " + " + fmtN(v.e) + " + " + fmtN(v.G) + " = " + fmt(e0.A, 2) + ". Entonces r = (" + fmt(e0.A, 2) + " − " + fmtN(1 - v.c, 4) + "·Y) / " + fmtN(v.b) + ".",
        "Curva LM (equilibrio en dinero): k·Y − h·r = M/P → r = (" + fmtN(v.k) + "·Y − " + fmtN(v.MP) + ") / " + fmtN(v.h) + ".",
        "Igualando ambas: Y* = [h·A + b·(M/P)] / [h(1 − c) + b·k] = [" + fmtN(v.h) + "×" + fmt(e0.A, 2) + " + " + fmtN(v.b) + "×" + fmtN(v.MP) + "] / " + fmt(den, 4) + " = " + fmt(e0.Y, 4) + ".",
        "Tasa de equilibrio: r* = (k·Y* − M/P) / h = " + fmt(e0.r, 4) + " %. Con ella: C = " + fmt(e0.C, 2) + ", I = " + fmt(e0.I, 2) + ".",
        "Multiplicador fiscal en IS-LM: h / [h(1 − c) + b·k] = " + fmt(mf, 4) + " (el keynesiano simple, 1/(1 − c), sería " + fmt(mk, 4) + "). Multiplicador monetario: b / [h(1 − c) + b·k] = " + fmt(mm, 4) + "."];
      if (e1) {
        stats.unshift(["Nuevo ingreso (Y₁)", fmt(e1.Y, 2)], ["Nueva tasa (r₁)", fmt(e1.r, 4) + " %"]);
        concl += " Después de la política, Y pasa a " + fmt(e1.Y, 2) + " (" + (e1.Y >= e0.Y ? "+" : "") + fmt(e1.Y - e0.Y, 2) + ") y r a " + fmt(e1.r, 2) + " %.";
        pasos.push("Nuevo equilibrio: Y₁ = " + fmt(e1.Y, 4) + ", r₁ = " + fmt(e1.r, 4) + " %, I₁ = " + fmt(e1.I, 2) + ".");
        if (v.dG) { var sinR = mk * v.dG; pasos.push("Efecto expulsión (crowding out): con r constante, ΔG = " + fmtN(v.dG) + " subiría Y en " + fmt(sinR, 2) + "; como r sube, la inversión cae " + fmt(e0.I - e1.I, 2) + " y Y solo aumenta " + fmt(e1.Y - e0.Y, 2) + "."); concl += " Parte del impulso fiscal se pierde por el alza de la tasa (efecto expulsión)."; }
      }
      return {
        principal: { etiqueta: "Ingreso de equilibrio (Y*)", valor: fmt(e0.Y, 2) }, stats: stats, conclusion: concl,
        grafico: { tipo: "xy", xmin: Math.max(0, Yc - ancho), xmax: Yc + ancho, ymin: rmin - rpad, ymax: rmax + rpad, xlab: "Ingreso (Y)", ylab: "Tasa de interés r (%)", series: series, puntos: puntos },
        pasos: pasos
      };
    },
    pie: "La tasa de interés r se expresa en puntos porcentuales (por ejemplo, 3 = 3 %), de acuerdo con las sensibilidades b y h."
  });

  /* ------------------------------------------------------------ 2. Oferta y demanda */
  function integrar(f, a, b) { var N = 2000, s = 0, h = (b - a) / N; for (var i = 0; i < N; i++) s += f(a + (i + 0.5) * h); return s * h; }
  CALC.registrar({
    id: "oferta-demanda", area: A, titulo: "Oferta, demanda y equilibrio", resumen: "Equilibrio, excedentes, impuestos, subsidios y precios máximos o mínimos.",
    palabras: "oferta demanda equilibrio mercado excedente consumidor productor impuesto subsidio precio maximo minimo escasez perdida irrecuperable",
    descripcion: "Con funciones lineales Qd = a − b·P y Qs = c + d·P, calcule el equilibrio del mercado, los excedentes y el efecto de un impuesto, un subsidio o un control de precios.",
    campos: [
      { id: "a", etiqueta: "Demanda: a (en Qd = a − b·P)", valor: "1000" }, { id: "b", etiqueta: "Demanda: b", valor: "20", mayor: 0 },
      { id: "c", etiqueta: "Oferta: c (en Qs = c + d·P)", valor: "100" }, { id: "d", etiqueta: "Oferta: d", valor: "25", mayor: 0 },
      { id: "int", tipo: "sel", etiqueta: "Intervención del gobierno", valor: "ninguna", ancho: true, opciones: [["ninguna", "Ninguna"], ["impuesto", "Impuesto por unidad (a los vendedores)"], ["subsidio", "Subsidio por unidad (a los vendedores)"], ["maximo", "Precio máximo"], ["minimo", "Precio mínimo"]] },
      { id: "t", etiqueta: "Monto por unidad", valor: "4,5", mayor: 0, si: function (s) { return s.int === "impuesto" || s.int === "subsidio"; } },
      { id: "pc", etiqueta: "Precio fijado", valor: "15", mayor: 0, si: function (s) { return s.int === "maximo" || s.int === "minimo"; } }
    ],
    calcular: function (v) {
      var Pe = (v.a - v.c) / (v.b + v.d), Qe = v.a - v.b * Pe;
      if (Qe <= 0) throw new Error("Con estos datos la cantidad de equilibrio no es positiva; revise los parámetros.");
      var Pd = function (q) { return (v.a - q) / v.b; }, Ps = function (q) { return Math.max(0, (q - v.c) / v.d); };
      var EC = integrar(function (q) { return Pd(q) - Pe; }, 0, Qe), EP = integrar(function (q) { return Pe - Ps(q); }, 0, Qe);
      var stats = [["Precio de equilibrio", fmt(Pe, 4)], ["Cantidad de equilibrio", fmt(Qe, 2)], ["Excedente del consumidor", fmt(EC, 2)], ["Excedente del productor", fmt(EP, 2)]];
      var pasos = ["Equilibrio: Qd = Qs → " + fmtN(v.a) + " − " + fmtN(v.b) + "P = " + fmtN(v.c) + " + " + fmtN(v.d) + "P → P* = (a − c)/(b + d) = " + fmt(Pe, 4) + "; Q* = " + fmt(Qe, 2) + ".",
        "Excedente del consumidor: área entre la demanda y el precio = " + fmt(EC, 2) + ". Excedente del productor: área entre el precio y la oferta = " + fmt(EP, 2) + "."];
      var series = [{ f: Pd, color: "acento", nombre: "Demanda", n: 2, desde: 0, hasta: v.a }, { f: function (q) { return (q - v.c) / v.d; }, color: "cola", nombre: "Oferta", n: 2, desde: Math.max(0, v.c) }];
      var puntos = [{ x: Qe, y: Pe, color: "tinta", texto: "E (" + fmt(Qe, 0) + " ; " + fmt(Pe, 2) + ")", guias: true }], hl = [], principal = { etiqueta: "Precio de equilibrio", valor: fmt(Pe, 4) }, concl = "El mercado se equilibra en P = " + fmt(Pe, 2) + " con Q = " + fmt(Qe, 2) + ".", pill = null;
      if (v.int === "impuesto" || v.int === "subsidio") {
        var t = v.int === "impuesto" ? v.t : -v.t, Pc = (v.a - v.c + v.d * t) / (v.b + v.d), Pv = Pc - t, Q1 = v.a - v.b * Pc;
        if (Q1 <= 0) throw new Error("Con ese " + v.int + " el mercado desaparece (la cantidad sería cero o negativa).");
        var rec = Math.abs(t) * Q1, pei = Math.abs(0.5 * t * (Qe - Q1));
        series.push({ f: function (q) { return (q - v.c) / v.d + t; }, color: "cola", guion: true, nombre: "Oferta con " + v.int, n: 2, desde: Math.max(0, v.c) });
        puntos.push({ x: Q1, y: Pc, color: "s3", texto: "Comprador paga " + fmt(Pc, 2), guias: true });
        hl.push({ y: Pv, color: "s4", texto: "Vendedor recibe " + fmt(Pv, 2) });
        stats = [["Precio que paga el comprador", fmt(Pc, 4)], ["Precio que recibe el vendedor", fmt(Pv, 4)], ["Nueva cantidad", fmt(Q1, 2)], [v.int === "impuesto" ? "Recaudación" : "Costo del subsidio", fmt(rec, 2)], ["Pérdida irrecuperable", fmt(pei, 2)], ["Carga sobre el comprador", pct(Math.abs(Pc - Pe) / Math.abs(t), 1)]].concat(stats.slice(0, 2));
        principal = { etiqueta: "Nueva cantidad", valor: fmt(Q1, 2) };
        pasos.push("Con " + (v.int === "impuesto" ? "un impuesto" : "un subsidio") + " de " + fmtN(v.t) + " por unidad, la oferta pasa a Qs = c + d·(P − t), con t = " + fmtN(t) + ".", "Nuevo equilibrio: P comprador = (a − c + d·t)/(b + d) = " + fmt(Pc, 4) + "; P vendedor = " + fmt(Pv, 4) + "; Q = " + fmt(Q1, 2) + ".", (v.int === "impuesto" ? "Recaudación" : "Costo fiscal") + " = |t| × Q = " + fmt(rec, 2) + "; pérdida irrecuperable = ½ × |t| × (Q* − Q) = " + fmt(pei, 2) + ".", "Reparto de la carga: comprador " + pct(Math.abs(Pc - Pe) / Math.abs(t), 1) + ", vendedor " + pct(Math.abs(Pe - Pv) / Math.abs(t), 1) + ". Lo soporta más el lado menos elástico.");
        concl = "El " + v.int + " lleva la cantidad de " + fmt(Qe, 2) + " a " + fmt(Q1, 2) + ". El comprador paga " + fmt(Pc, 2) + " y el vendedor recibe " + fmt(Pv, 2) + ".";
      } else if (v.int === "maximo" || v.int === "minimo") {
        var Pp = v.pc, qd = v.a - v.b * Pp, qs = v.c + v.d * Pp, efectivo = v.int === "maximo" ? Pp < Pe : Pp > Pe;
        hl.push({ y: Pp, color: "s3", texto: (v.int === "maximo" ? "Precio máximo " : "Precio mínimo ") + fmtN(Pp) });
        if (!efectivo) { pill = { texto: "No tiene efecto", tipo: "aviso" }; concl = "El precio " + (v.int === "maximo" ? "máximo" : "mínimo") + " de " + fmtN(Pp) + " está " + (v.int === "maximo" ? "por encima" : "por debajo") + " del equilibrio (" + fmt(Pe, 2) + "): no cambia nada."; }
        else {
          var falta = qd - qs; pill = { texto: falta > 0 ? "Escasez de " + fmt(falta, 2) : "Excedente de " + fmt(-falta, 2), tipo: "mal" };
          stats = [["Cantidad demandada", fmt(Math.max(0, qd), 2)], ["Cantidad ofrecida", fmt(Math.max(0, qs), 2)], [falta > 0 ? "Escasez" : "Excedente", fmt(Math.abs(falta), 2)], ["Cantidad transada", fmt(Math.max(0, Math.min(qd, qs)), 2)]].concat(stats.slice(0, 2));
          principal = { etiqueta: falta > 0 ? "Escasez" : "Excedente", valor: fmt(Math.abs(falta), 2) };
          concl = "Al fijar el precio en " + fmtN(Pp) + ", los consumidores quieren " + fmt(qd, 2) + " y los productores ofrecen " + fmt(qs, 2) + ": hay " + (falta > 0 ? "escasez" : "excedente") + " de " + fmt(Math.abs(falta), 2) + " unidades.";
          pasos.push("Con P = " + fmtN(Pp) + ": Qd = " + fmtN(v.a) + " − " + fmtN(v.b) + "×" + fmtN(Pp) + " = " + fmt(qd, 2) + "; Qs = " + fmtN(v.c) + " + " + fmtN(v.d) + "×" + fmtN(Pp) + " = " + fmt(qs, 2) + ".", (falta > 0 ? "Escasez" : "Excedente") + " = |Qd − Qs| = " + fmt(Math.abs(falta), 2) + ".");
        }
      }
      var xmax = Math.max(Qe * 1.8, v.a > 0 ? Math.min(v.a, Qe * 2.2) : Qe * 2), ymax = Math.max(Pd(0) > 0 ? Math.min(Pd(0) * 1.05, Pe * 2.4) : Pe * 2, Pe * 1.6);
      return { principal: principal, pill: pill, stats: stats, conclusion: concl, pasos: pasos,
        grafico: { tipo: "xy", xmin: 0, xmax: xmax, ymin: 0, ymax: ymax, xlab: "Cantidad (Q)", ylab: "Precio (P)", series: series, puntos: puntos, hlineas: hl } };
    }
  });

  /* ------------------------------------------------------------ 3. Elasticidades */
  function clasif(e, tipo) {
    var a = Math.abs(e);
    if (tipo === "precio") return a === 0 ? "perfectamente inelástica" : a < 1 ? "inelástica" : a === 1 ? "unitaria" : !isFinite(a) ? "perfectamente elástica" : "elástica";
    if (tipo === "ingreso") return e < 0 ? "bien inferior" : e < 1 ? "bien normal de primera necesidad" : "bien normal de lujo";
    return e > 0 ? "bienes sustitutos" : e < 0 ? "bienes complementarios" : "bienes independientes";
  }
  CALC.registrar({
    id: "elasticidad", area: A, titulo: "Elasticidades", resumen: "Precio, ingreso y cruzada, por punto medio o simple.",
    palabras: "elasticidad precio demanda ingreso renta cruzada arco punto medio elastica inelastica sustitutos complementarios lujo inferior",
    descripcion: "Mida qué tan sensible es la cantidad demandada a un cambio en el precio, en el ingreso o en el precio de otro bien, y clasifique el resultado.",
    modos: [
      { id: "precio", nombre: "Precio de la demanda", campos: [{ id: "x1", etiqueta: "Precio inicial (P₁)", valor: "20" }, { id: "q1", etiqueta: "Cantidad inicial (Q₁)", valor: "500" }, { id: "x2", etiqueta: "Precio final (P₂)", valor: "25" }, { id: "q2", etiqueta: "Cantidad final (Q₂)", valor: "420" }] },
      { id: "ingreso", nombre: "Ingreso", campos: [{ id: "x1", etiqueta: "Ingreso inicial (I₁)", valor: "3000" }, { id: "q1", etiqueta: "Cantidad inicial (Q₁)", valor: "10" }, { id: "x2", etiqueta: "Ingreso final (I₂)", valor: "3600" }, { id: "q2", etiqueta: "Cantidad final (Q₂)", valor: "13" }] },
      { id: "cruzada", nombre: "Cruzada", campos: [{ id: "x1", etiqueta: "Precio inicial del bien Y", valor: "8" }, { id: "q1", etiqueta: "Cantidad inicial del bien X", valor: "200" }, { id: "x2", etiqueta: "Precio final del bien Y", valor: "10" }, { id: "q2", etiqueta: "Cantidad final del bien X", valor: "240" }] }
    ],
    campos: [{ id: "met", tipo: "sel", etiqueta: "Método", valor: "medio", opciones: [["medio", "Punto medio (arco)"], ["simple", "Variación simple (desde el punto inicial)"]] }],
    calcular: function (v) {
      if (v.x1 === v.x2) throw new Error("El valor inicial y el final de " + (v.modo === "precio" ? "el precio" : v.modo === "ingreso" ? "el ingreso" : "el precio de Y") + " deben ser distintos.");
      var medio = v.met === "medio", bq = medio ? (v.q1 + v.q2) / 2 : v.q1, bx = medio ? (v.x1 + v.x2) / 2 : v.x1;
      if (bq === 0 || bx === 0) throw new Error("Los valores base no pueden ser cero.");
      var vq = (v.q2 - v.q1) / bq, vx = (v.x2 - v.x1) / bx, e = vq / vx, cl = clasif(e, v.modo);
      var pasos = ["%ΔQ = (Q₂ − Q₁) / " + (medio ? "[(Q₁ + Q₂)/2]" : "Q₁") + " = " + fmtN(v.q2 - v.q1, 4) + " / " + fmtN(bq, 4) + " = " + pct(vq, 3) + ".",
        "%Δ" + (v.modo === "ingreso" ? "I" : "P") + " = " + fmtN(v.x2 - v.x1, 4) + " / " + fmtN(bx, 4) + " = " + pct(vx, 3) + ".", "Elasticidad = %ΔQ / %Δ" + (v.modo === "ingreso" ? "I" : "P") + " = " + fmt(e, 4) + " → " + cl + "."];
      var stats = [["Variación de la cantidad", pct(vq, 2)], ["Variación del " + (v.modo === "ingreso" ? "ingreso" : "precio"), pct(vx, 2)], ["Valor absoluto", fmt(Math.abs(e), 4)]];
      var concl = "Si " + (v.modo === "precio" ? "el precio" : v.modo === "ingreso" ? "el ingreso" : "el precio de Y") + " sube 1 %, la cantidad " + (e >= 0 ? "aumenta" : "disminuye") + " " + fmt(Math.abs(e), 2) + " %: " + cl + ".";
      if (v.modo === "precio") { var it1 = v.x1 * v.q1, it2 = v.x2 * v.q2; stats.push(["Ingreso total inicial", fmt(it1, 2)], ["Ingreso total final", fmt(it2, 2)]); pasos.push("Ingreso total: " + fmt(it1, 2) + " → " + fmt(it2, 2) + ". " + (Math.abs(e) > 1 ? "Con demanda elástica, subir el precio reduce el ingreso total." : Math.abs(e) < 1 ? "Con demanda inelástica, subir el precio aumenta el ingreso total." : "Con elasticidad unitaria, el ingreso total no cambia.")); }
      return { principal: { etiqueta: "Elasticidad", valor: fmt(e, 4) }, pill: { texto: cl.charAt(0).toUpperCase() + cl.slice(1), tipo: "info" }, stats: stats, conclusion: concl, pasos: pasos };
    }
  });

  /* ------------------------------------------------------------ 4. Multiplicador keynesiano */
  CALC.registrar({
    id: "multiplicador", area: A, titulo: "Multiplicador keynesiano", resumen: "Efecto de cambios en gasto, inversión, impuestos o transferencias sobre el ingreso.",
    palabras: "multiplicador keynesiano gasto publico inversion impuestos transferencias propension marginal consumir ahorrar importar presupuesto equilibrado",
    descripcion: "Calcule cuánto cambia el ingreso de equilibrio ante un cambio en el gasto público, la inversión, los impuestos o las transferencias.",
    campos: [
      { id: "c", etiqueta: "Propensión marginal a consumir (c)", valor: "0,8", mayor: 0, menor: 1 },
      { id: "t", etiqueta: "Tasa impositiva sobre el ingreso (%)", valor: "0", min: 0, max: 100, ayuda: "0 si los impuestos son fijos." },
      { id: "m", etiqueta: "Propensión marginal a importar (m)", valor: "0", min: 0, max: 1, ayuda: "0 en economía cerrada." },
      { id: "tipo", tipo: "sel", etiqueta: "¿Qué cambia?", valor: "G", opciones: [["G", "Gasto público (ΔG)"], ["I", "Inversión (ΔI)"], ["X", "Exportaciones (ΔX)"], ["T", "Impuestos fijos (ΔT)"], ["TR", "Transferencias (ΔTR)"], ["PE", "Presupuesto equilibrado (ΔG = ΔT)"]] },
      { id: "d", etiqueta: "Monto del cambio", valor: "100" }
    ],
    calcular: function (v) {
      var t = v.t / 100, cd = v.c * (1 - t), k = 1 / (1 - cd + v.m), kt = -v.c * k, mult, nom;
      if (v.tipo === "T") { mult = kt; nom = "Multiplicador de los impuestos"; }
      else if (v.tipo === "TR") { mult = -kt; nom = "Multiplicador de las transferencias"; }
      else if (v.tipo === "PE") { mult = k + kt; nom = "Multiplicador del presupuesto equilibrado"; }
      else { mult = k; nom = "Multiplicador del gasto autónomo"; }
      var dY = mult * v.d, rondas = [], gasto = v.d * (v.tipo === "T" ? -v.c : v.tipo === "TR" ? v.c : 1), acum = 0, cats = [];
      if (v.tipo !== "PE") for (var r = 1; r <= 12; r++) { acum += gasto; rondas.push(acum); cats.push(String(r)); gasto *= (cd - v.m); }
      return {
        principal: { etiqueta: "Cambio en el ingreso (ΔY)", valor: fmt(dY, 2) },
        stats: [[nom, fmt(mult, 4)], ["Multiplicador del gasto", fmt(k, 4)], ["Propensión efectiva c(1 − t)", fmt(cd, 4)], ["Fuga por ronda (s + t·c + m)", fmt(1 - cd + v.m, 4)]],
        conclusion: "Un cambio de " + fmtN(v.d) + " en " + { G: "el gasto público", I: "la inversión", X: "las exportaciones", T: "los impuestos", TR: "las transferencias", PE: "el gasto y los impuestos a la vez" }[v.tipo] + " hace que el ingreso " + (dY >= 0 ? "aumente" : "disminuya") + " en " + fmt(Math.abs(dY), 2) + ".",
        grafico: rondas.length ? { tipo: "barras", cats: cats, xlab: "Ronda de gasto", ylab: "ΔY acumulado", series: [{ nombre: "Efecto acumulado en el ingreso", valores: rondas, color: "acento" }] } : null,
        pasos: ["Multiplicador del gasto: k = 1 / [1 − c(1 − t) + m] = 1 / [1 − " + fmtN(v.c) + "×(1 − " + fmtN(t) + ") + " + fmtN(v.m) + "] = " + fmt(k, 4) + ".",
          v.tipo === "T" || v.tipo === "TR" || v.tipo === "PE" ? "Multiplicador de impuestos: −c·k = " + fmt(kt, 4) + " (las transferencias tienen el mismo valor con signo positivo)." : "El cambio en " + v.tipo + " entra completo al gasto en la primera ronda.",
          v.tipo === "PE" ? "Presupuesto equilibrado: k − c·k = " + fmt(mult, 4) + (t === 0 && v.m === 0 ? " (igual a 1 en el modelo simple)." : ".") : "ΔY = multiplicador × cambio = " + fmt(mult, 4) + " × " + fmtN(v.d) + " = " + fmt(dY, 2) + ".",
          v.tipo !== "PE" ? "El gráfico muestra cómo el efecto se acumula ronda tras ronda: cada ronda gasta una fracción " + fmt(cd - v.m, 4) + " de la anterior." : "ΔY = " + fmt(mult, 4) + " × " + fmtN(v.d) + " = " + fmt(dY, 2) + "."]
      };
    }
  });

  /* ------------------------------------------------------------ 5. Inflación y valores reales */
  CALC.registrar({
    id: "inflacion", area: A, titulo: "Inflación, IPC y valores reales", resumen: "Tasa de inflación, actualización de montos, tasa real y deflactor del PIB.",
    palabras: "inflacion ipc indice precios consumidor deflactar actualizar valor real nominal poder adquisitivo fisher tasa real pib deflactor crecimiento",
    descripcion: "Calcule la inflación entre dos índices, actualice montos de un año a otro, obtenga la tasa de interés real (ecuación de Fisher) o el deflactor del PIB.",
    modos: [
      { id: "ipc", nombre: "Inflación entre dos índices", campos: [{ id: "i1", etiqueta: "Índice inicial", valor: "112,4", mayor: 0 }, { id: "i2", etiqueta: "Índice final", valor: "118,9", mayor: 0 }, { id: "anios", etiqueta: "Años entre ambos (opcional)", valor: "", opcional: true, mayor: 0, ayuda: "Para obtener la inflación promedio anual." }] },
      { id: "actualizar", nombre: "Actualizar un monto", campos: [{ id: "monto", etiqueta: "Monto", valor: "5000" }, { id: "io", etiqueta: "Índice del periodo del monto", valor: "100", mayor: 0 }, { id: "id", etiqueta: "Índice del periodo de destino", valor: "118,9", mayor: 0 }] },
      { id: "fisher", nombre: "Tasa real (Fisher)", campos: [{ id: "in", etiqueta: "Tasa de interés nominal (%)", valor: "8" }, { id: "pi", etiqueta: "Inflación (%)", valor: "3", mayor: -100 }] },
      { id: "pib", nombre: "PIB nominal, real y deflactor", campos: [{ id: "n1", etiqueta: "PIB nominal año 1", valor: "45000", mayor: 0 }, { id: "r1", etiqueta: "PIB real año 1", valor: "42000", mayor: 0 }, { id: "n2", etiqueta: "PIB nominal año 2", valor: "49500", mayor: 0 }, { id: "r2", etiqueta: "PIB real año 2", valor: "43500", mayor: 0 }] }
    ],
    calcular: function (v) {
      if (v.modo === "ipc") {
        var inf = v.i2 / v.i1 - 1, st = [["Variación del índice", fmtN(v.i2 - v.i1, 4) + " puntos"], ["Pérdida de poder adquisitivo", pct(1 - v.i1 / v.i2, 2)]], pasos = ["Inflación = (índice final / índice inicial − 1) × 100 = (" + fmtN(v.i2) + " / " + fmtN(v.i1) + " − 1) × 100 = " + pct(inf, 4) + "."];
        if (isFinite(v.anios)) { var anual = Math.pow(1 + inf, 1 / v.anios) - 1; st.push(["Promedio anual", pct(anual, 4)]); pasos.push("Promedio anual (compuesto): (1 + " + fmtN(inf, 6) + ")^(1/" + fmtN(v.anios) + ") − 1 = " + pct(anual, 4) + "."); }
        pasos.push("Poder adquisitivo: con el mismo dinero se compra " + pct(v.i1 / v.i2, 2) + " de lo que se compraba antes.");
        return { principal: { etiqueta: "Inflación del periodo", valor: pct(inf, 2) }, stats: st, conclusion: "Los precios " + (inf >= 0 ? "subieron" : "bajaron") + " " + pct(Math.abs(inf), 2) + " entre ambos periodos.", pasos: pasos };
      }
      if (v.modo === "actualizar") {
        var act = v.monto * v.id / v.io;
        return { principal: { etiqueta: "Monto equivalente", valor: fmt(act, 2) }, stats: [["Factor de actualización", fmtN(v.id / v.io, 6)], ["Inflación acumulada", pct(v.id / v.io - 1, 2)]],
          conclusion: fmt(v.monto, 2) + " del periodo de origen equivalen a " + fmt(act, 2) + " del periodo de destino (mismo poder de compra).",
          pasos: ["Monto equivalente = monto × (índice destino / índice origen) = " + fmt(v.monto, 2) + " × " + fmtN(v.id) + " / " + fmtN(v.io) + " = " + fmt(act, 2) + ".", "Para deflactar (pasar a valores de un año base), use el índice del año base como destino."] };
      }
      if (v.modo === "fisher") {
        var real = (1 + v.in / 100) / (1 + v.pi / 100) - 1, aprox = (v.in - v.pi) / 100;
        return { principal: { etiqueta: "Tasa de interés real", valor: pct(real, 4) }, pill: { texto: real >= 0 ? "Rendimiento real positivo" : "Rendimiento real negativo", tipo: real >= 0 ? "ok" : "mal" }, stats: [["Aproximación (i − π)", pct(aprox, 2)], ["Diferencia", pct(aprox - real, 4)]],
          conclusion: "Con una tasa nominal de " + fmtN(v.in) + " % y una inflación de " + fmtN(v.pi) + " %, el poder de compra del dinero invertido " + (real >= 0 ? "crece" : "cae") + " " + pct(Math.abs(real), 2) + " al año.",
          pasos: ["Ecuación de Fisher exacta: (1 + i) = (1 + r)(1 + π) → r = (1 + i)/(1 + π) − 1 = " + fmtN(1 + v.in / 100, 4) + " / " + fmtN(1 + v.pi / 100, 4) + " − 1 = " + pct(real, 4) + ".", "Aproximación habitual: r ≈ i − π = " + pct(aprox, 2) + " (válida con tasas bajas)."] };
      }
      var d1 = v.n1 / v.r1 * 100, d2 = v.n2 / v.r2 * 100, infl = d2 / d1 - 1, crec = v.r2 / v.r1 - 1, cn = v.n2 / v.n1 - 1;
      return { principal: { etiqueta: "Inflación (deflactor)", valor: pct(infl, 2) }, stats: [["Deflactor año 1", fmt(d1, 2)], ["Deflactor año 2", fmt(d2, 2)], ["Crecimiento real", pct(crec, 2)], ["Crecimiento nominal", pct(cn, 2)]],
        conclusion: "La economía creció " + pct(crec, 2) + " en términos reales; el aumento de precios medido por el deflactor fue " + pct(infl, 2) + ".",
        grafico: { tipo: "barras", cats: ["Año 1", "Año 2"], series: [{ nombre: "PIB nominal", valores: [v.n1, v.n2], color: "acento" }, { nombre: "PIB real", valores: [v.r1, v.r2], color: "cola" }] },
        pasos: ["Deflactor = PIB nominal / PIB real × 100. Año 1: " + fmt(d1, 4) + "; año 2: " + fmt(d2, 4) + ".", "Inflación = deflactor₂ / deflactor₁ − 1 = " + pct(infl, 4) + ".", "Crecimiento real = PIB real₂ / PIB real₁ − 1 = " + pct(crec, 4) + ". Comprobación: (1 + nominal) = (1 + real)(1 + inflación) → " + fmtN(1 + cn, 6) + " ≈ " + fmtN((1 + crec) * (1 + infl), 6) + "."] };
    }
  });
})();
