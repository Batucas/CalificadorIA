/* Calculadoras de Finanzas. */
(function () {
  "use strict";
  var M = CALC.M, fmt = CALC.fmt, fmtN = CALC.fmtN, pct = CALC.pct;
  var A = "Finanzas";
  var FREC = [["12", "Mensual (12 por año)"], ["4", "Trimestral (4 por año)"], ["2", "Semestral (2 por año)"], ["1", "Anual (1 por año)"], ["6", "Bimestral (6 por año)"], ["3", "Cuatrimestral (3 por año)"], ["24", "Quincenal (24 por año)"], ["52", "Semanal (52 por año)"]];
  var NOMF = { "1": "año", "2": "semestre", "3": "cuatrimestre", "4": "trimestre", "6": "bimestre", "12": "mes", "24": "quincena", "52": "semana", "360": "día", "365": "día" };
  function bs(v) { return fmt(v, 2); }

  /* ------------------------------------------------------------ 1. Interés simple y compuesto */
  CALC.registrar({
    id: "valor-dinero", area: A, titulo: "Interés simple y compuesto", resumen: "Valor futuro, valor presente, tasa o plazo.",
    palabras: "interes simple compuesto valor presente futuro capital monto capitalizacion continua tasa plazo vp vf",
    descripcion: "Calcule el valor futuro, el valor presente, la tasa o el plazo con interés simple o compuesto (con cualquier capitalización, incluida la continua).",
    campos: [
      { id: "reg", tipo: "sel", etiqueta: "Tipo de interés", valor: "compuesto", opciones: [["compuesto", "Compuesto"], ["simple", "Simple"]] },
      { id: "inc", tipo: "sel", etiqueta: "¿Qué desea calcular?", valor: "vf", opciones: [["vf", "Valor futuro (VF)"], ["vp", "Valor presente (VP)"], ["tasa", "Tasa de interés"], ["plazo", "Plazo"]] },
      { id: "vp", etiqueta: "Valor presente (VP)", valor: "10000", mayor: 0, si: function (s) { return s.inc !== "vp"; } },
      { id: "vf", etiqueta: "Valor futuro (VF)", valor: "15000", mayor: 0, si: function (s) { return s.inc !== "vf"; } },
      { id: "tasa", etiqueta: "Tasa de interés anual (%)", valor: "12", mayor: 0, si: function (s) { return s.inc !== "tasa"; } },
      { id: "cap", tipo: "sel", etiqueta: "Capitalización", valor: "12", si: function (s) { return s.reg === "compuesto"; }, opciones: [["1", "Anual"], ["2", "Semestral"], ["4", "Trimestral"], ["12", "Mensual"], ["360", "Diaria (360)"], ["365", "Diaria (365)"], ["cont", "Continua"]] },
      { id: "plazo", etiqueta: "Plazo", valor: "3", mayor: 0, si: function (s) { return s.inc !== "plazo"; } },
      { id: "unidad", tipo: "sel", etiqueta: "Plazo expresado en", valor: "anios", opciones: [["anios", "Años"], ["meses", "Meses"], ["dias360", "Días (año de 360)"], ["dias365", "Días (año de 365)"]] }
    ],
    calcular: function (v) {
      var div = { anios: 1, meses: 12, dias360: 360, dias365: 365 }[v.unidad], uni = { anios: "años", meses: "meses", dias360: "días", dias365: "días" }[v.unidad];
      var simple = v.reg === "simple", cont = v.cap === "cont", m = cont ? 0 : +v.cap, t = v.plazo / div, i = v.tasa / 100;
      var factor = function (i, t) { return simple ? 1 + i * t : cont ? Math.exp(i * t) : Math.pow(1 + i / m, m * t); };
      var formula = simple ? "VF = VP · (1 + i · t)" : cont ? "VF = VP · e^(i · t)" : "VF = VP · (1 + i/m)^(m · t)";
      var vp = v.vp, vf = v.vf, pasos = ["Fórmula: " + formula + (simple || cont ? "" : ", con m = " + m + " capitalizaciones por año") + "."], res, et;
      if (v.inc === "vf") { vf = vp * factor(i, t); res = bs(vf); et = "Valor futuro"; pasos.push("t = " + fmtN(v.plazo) + " " + uni + " = " + fmtN(t, 6) + " años.", "VF = " + bs(vp) + " × " + fmtN(factor(i, t), 6) + " = " + bs(vf) + "."); }
      else if (v.inc === "vp") { vp = vf / factor(i, t); res = bs(vp); et = "Valor presente"; pasos.push("t = " + fmtN(t, 6) + " años.", "Despejando: VP = VF / " + (simple ? "(1 + i·t)" : cont ? "e^(i·t)" : "(1 + i/m)^(m·t)") + " = " + bs(vf) + " / " + fmtN(factor(i, t), 6) + " = " + bs(vp) + "."); }
      else if (v.inc === "tasa") {
        if (vf <= vp) throw new Error("El valor futuro debe ser mayor que el presente para calcular una tasa positiva.");
        i = simple ? (vf / vp - 1) / t : cont ? Math.log(vf / vp) / t : m * (Math.pow(vf / vp, 1 / (m * t)) - 1); res = pct(i, 4); et = "Tasa anual";
        pasos.push("Despejando i: " + (simple ? "i = (VF/VP − 1) / t" : cont ? "i = ln(VF/VP) / t" : "i = m · [(VF/VP)^(1/(m·t)) − 1]") + " = " + pct(i, 4) + " anual.");
      } else {
        if (vf <= vp) throw new Error("El valor futuro debe ser mayor que el presente para calcular el plazo.");
        t = simple ? (vf / vp - 1) / i : cont ? Math.log(vf / vp) / i : Math.log(vf / vp) / (m * Math.log(1 + i / m)); res = fmtN(t * div, 2) + " " + uni; et = "Plazo";
        pasos.push("Despejando t: " + (simple ? "t = (VF/VP − 1) / i" : cont ? "t = ln(VF/VP) / i" : "t = ln(VF/VP) / [m · ln(1 + i/m)]") + " = " + fmtN(t, 4) + " años = " + fmtN(t * div, 2) + " " + uni + ".");
      }
      var tea = simple ? NaN : cont ? Math.exp(i) - 1 : Math.pow(1 + i / m, m) - 1, interes = vf - vp;
      var pts = [], pts2 = [], N = 60;
      for (var k = 0; k <= N; k++) { var tt = t * k / N; pts.push([tt * div, vp * factor(i, tt)]); pts2.push([tt * div, vp * (1 + i * tt)]); }
      return {
        principal: { etiqueta: et, valor: res },
        stats: [["Valor presente", bs(vp)], ["Valor futuro", bs(vf)], ["Interés ganado", bs(interes)], ["Tasa anual", pct(i, 4)]].concat(isFinite(tea) ? [["Tasa efectiva anual", pct(tea, 4)]] : []).concat([["Plazo", fmtN(t * div, 2) + " " + uni]]),
        conclusion: "Un capital de " + bs(vp) + " se convierte en " + bs(vf) + " en " + fmtN(t * div, 2) + " " + uni + " a una tasa de " + pct(i, 2) + " anual (" + (simple ? "interés simple" : "interés compuesto") + "); el interés es " + bs(interes) + ".",
        grafico: { tipo: "xy", xmin: 0, xmax: t * div, xlab: "Tiempo (" + uni + ")", ylab: "Monto", series: [{ pts: pts, color: "acento", nombre: simple ? "Interés simple" : "Interés compuesto" }].concat(simple ? [] : [{ pts: pts2, color: "gris", guion: true, ancho: 1.5, nombre: "Interés simple (comparación)" }]) },
        pasos: pasos
      };
    },
    pie: "Equivalencias en Excel: VF, VA, TASA y NPER (con pagos en 0)."
  });

  /* ------------------------------------------------------------ 2. Anualidades */
  CALC.registrar({
    id: "anualidades", area: A, titulo: "Anualidades (rentas)", resumen: "Cuota, valor presente, valor futuro o número de pagos.",
    palabras: "anualidad renta cuota pago periodico vencida anticipada valor presente futuro ahorro numero pagos",
    descripcion: "Pagos iguales y periódicos: calcule la cuota, el valor presente, el valor futuro o el número de pagos, en anualidad vencida o anticipada.",
    campos: [
      { id: "inc", tipo: "sel", etiqueta: "¿Qué desea calcular?", valor: "cuotaVP", ancho: true, opciones: [["cuotaVP", "Cuota a partir del valor presente (préstamo)"], ["cuotaVF", "Cuota a partir del valor futuro (ahorro)"], ["vp", "Valor presente de las cuotas"], ["vf", "Valor futuro de las cuotas"], ["n", "Número de pagos (a partir del VP)"]] },
      { id: "tipo", tipo: "sel", etiqueta: "Tipo", valor: "vencida", opciones: [["vencida", "Vencida (pago al final)"], ["anticipada", "Anticipada (pago al inicio)"]] },
      { id: "vp", etiqueta: "Valor presente (VP)", valor: "50000", mayor: 0, si: function (s) { return s.inc === "cuotaVP" || s.inc === "n"; } },
      { id: "vf", etiqueta: "Valor futuro (VF)", valor: "50000", mayor: 0, si: function (s) { return s.inc === "cuotaVF"; } },
      { id: "c", etiqueta: "Cuota (C)", valor: "1500", mayor: 0, si: function (s) { return s.inc === "vp" || s.inc === "vf" || s.inc === "n"; } },
      { id: "tasa", etiqueta: "Tasa nominal anual (%)", valor: "12", min: 0 },
      { id: "m", tipo: "sel", etiqueta: "Pagos por año", valor: "12", opciones: FREC },
      { id: "n", etiqueta: "Número de pagos (n)", valor: "36", entero: true, min: 1, si: function (s) { return s.inc !== "n"; } }
    ],
    calcular: function (v) {
      var i = v.tasa / 100 / +v.m, a = v.tipo === "anticipada" ? 1 + i : 1, n = v.n, per = NOMF[v.m];
      var fVP = function (n) { return i === 0 ? n : (1 - Math.pow(1 + i, -n)) / i; }, fVF = function (n) { return i === 0 ? n : (Math.pow(1 + i, n) - 1) / i; };
      var c = v.c, vp, vf, res, et, pasos = ["Tasa por periodo: i = " + fmtN(v.tasa) + " % / " + v.m + " = " + fmtN(i * 100, 6) + " % por " + per + "." + (a > 1 ? " En la anticipada cada fórmula se multiplica por (1 + i)." : "")];
      if (v.inc === "cuotaVP") { c = v.vp / (fVP(n) * a); vp = v.vp; vf = c * fVF(n) * a; et = "Cuota"; res = bs(c); pasos.push("C = VP · i / [1 − (1 + i)^(−n)]" + (a > 1 ? " / (1 + i)" : "") + " = " + bs(v.vp) + " / " + fmtN(fVP(n) * a, 6) + " = " + bs(c) + "."); }
      else if (v.inc === "cuotaVF") { c = v.vf / (fVF(n) * a); vf = v.vf; vp = c * fVP(n) * a; et = "Cuota"; res = bs(c); pasos.push("C = VF · i / [(1 + i)^n − 1]" + (a > 1 ? " / (1 + i)" : "") + " = " + bs(v.vf) + " / " + fmtN(fVF(n) * a, 6) + " = " + bs(c) + "."); }
      else if (v.inc === "vp") { vp = c * fVP(n) * a; vf = c * fVF(n) * a; et = "Valor presente"; res = bs(vp); pasos.push("VP = C · [1 − (1 + i)^(−n)] / i" + (a > 1 ? " · (1 + i)" : "") + " = " + bs(c) + " × " + fmtN(fVP(n) * a, 6) + " = " + bs(vp) + "."); }
      else if (v.inc === "vf") { vp = c * fVP(n) * a; vf = c * fVF(n) * a; et = "Valor futuro"; res = bs(vf); pasos.push("VF = C · [(1 + i)^n − 1] / i" + (a > 1 ? " · (1 + i)" : "") + " = " + bs(c) + " × " + fmtN(fVF(n) * a, 6) + " = " + bs(vf) + "."); }
      else {
        vp = v.vp; var x = 1 - vp * i / (c * a);
        if (i === 0) n = vp / c; else { if (x <= 0) throw new Error("Con esa cuota nunca se termina de pagar: la cuota no alcanza a cubrir los intereses (" + bs(vp * i) + " por " + per + ")."); n = -Math.log(x) / Math.log(1 + i); }
        vf = c * fVF(n) * a; et = "Número de pagos"; res = fmtN(n, 2);
        pasos.push("n = −ln(1 − VP·i / C" + (a > 1 ? "(1 + i)" : "") + ") / ln(1 + i) = " + fmtN(n, 4) + " pagos." + (Math.abs(n - Math.round(n)) > 1e-6 ? " Se necesitan " + Math.ceil(n) + " pagos (el último, menor)." : ""));
      }
      var nn = Math.max(1, Math.round(n)), total = c * n;
      var cats = [], aporte = [], inter = [], saldo = 0, acumC = 0;
      for (var k = 1; k <= Math.min(nn, 240); k++) { saldo = (saldo + (a > 1 ? c : 0)) * (1 + i) + (a > 1 ? 0 : c); acumC += c; cats.push(String(k)); aporte.push(acumC); inter.push(saldo - acumC); }
      return {
        principal: { etiqueta: et, valor: res },
        stats: [["Cuota", bs(c)], ["Valor presente", bs(vp)], ["Valor futuro", bs(vf)], ["Total pagado", bs(total)], ["Tasa por " + per, fmtN(i * 100, 4) + " %"], ["Número de pagos", fmtN(n, 2)]],
        conclusion: (v.inc === "cuotaVF" || v.inc === "vf" ? "Depositando " + bs(c) + " cada " + per + " durante " + fmtN(n, 2) + " periodos se reúne " + bs(vf) + "; los intereses aportan " + bs(vf - total) + "." : "Una deuda de " + bs(vp) + " se paga con " + fmtN(n, 2) + " cuotas de " + bs(c) + " por " + per + "; en total se pagan " + bs(total) + ", de los cuales " + bs(total - vp) + " son intereses."),
        grafico: { tipo: "barras", apilado: true, cats: cats, xlab: "Periodo", ylab: "Saldo acumulado", series: [{ nombre: "Cuotas depositadas", valores: aporte, color: "acento" }, { nombre: "Intereses ganados", valores: inter, color: "cola" }] },
        pasos: pasos
      };
    },
    pie: "Equivalencias en Excel: PAGO, VA, VF y NPER (tipo 0 = vencida, 1 = anticipada)."
  });

  /* ------------------------------------------------------------ 3. Amortización */
  CALC.registrar({
    id: "amortizacion", area: A, titulo: "Tabla de amortización", resumen: "Sistemas francés, alemán y americano, con periodo de gracia.",
    palabras: "amortizacion prestamo credito cuota francesa alemana americana tabla saldo capital interes gracia",
    descripcion: "Arme la tabla de amortización de un préstamo con el sistema francés (cuota fija), alemán (amortización fija) o americano (capital al final). Puede copiarla a Excel.",
    campos: [
      { id: "sis", tipo: "sel", etiqueta: "Sistema", valor: "frances", opciones: [["frances", "Francés (cuota fija)"], ["aleman", "Alemán (amortización fija)"], ["americano", "Americano (capital al final)"]] },
      { id: "monto", etiqueta: "Monto del préstamo", valor: "100000", mayor: 0 },
      { id: "tasa", etiqueta: "Tasa de interés anual (%)", valor: "12", min: 0 },
      { id: "tipoT", tipo: "sel", etiqueta: "La tasa es", valor: "nominal", opciones: [["nominal", "Nominal anual"], ["efectiva", "Efectiva anual (TEA)"]] },
      { id: "m", tipo: "sel", etiqueta: "Frecuencia de pago", valor: "12", opciones: FREC },
      { id: "n", etiqueta: "Número de cuotas", valor: "24", entero: true, min: 1, max: 1200 },
      { id: "gracia", etiqueta: "Cuotas de gracia (solo interés)", valor: "0", entero: true, min: 0, ayuda: "Al inicio se paga solo el interés; están incluidas en el número de cuotas." }
    ],
    calcular: function (v) {
      var m = +v.m, i = v.tipoT === "nominal" ? v.tasa / 100 / m : Math.pow(1 + v.tasa / 100, 1 / m) - 1, n = v.n, g = v.gracia, P = v.monto, per = NOMF[v.m];
      if (g >= n) throw new Error("Las cuotas de gracia deben ser menos que el número de cuotas.");
      var na = n - g, saldo = P, fil = [], ti = 0, ta = 0, tc = 0, cats = [], si = [], sa = [], cuotaF = i === 0 ? P / na : P * i / (1 - Math.pow(1 + i, -na));
      for (var k = 1; k <= n; k++) {
        var interes = saldo * i, amort;
        if (k <= g) amort = 0;
        else if (v.sis === "frances") amort = cuotaF - interes;
        else if (v.sis === "aleman") amort = P / na;
        else amort = k === n ? saldo : 0;
        if (k === n) amort = saldo;
        var cuota = interes + amort; saldo = Math.max(0, saldo - amort); if (Math.abs(saldo) < 1e-7) saldo = 0;
        ti += interes; ta += amort; tc += cuota; fil.push([String(k), cuota, interes, amort, saldo]); cats.push(String(k)); si.push(interes); sa.push(amort);
      }
      var pasos = [v.tipoT === "nominal" ? "Tasa por " + per + ": i = " + fmtN(v.tasa) + " % / " + m + " = " + fmtN(i * 100, 6) + " %." : "Tasa por " + per + " equivalente a la TEA: i = (1 + " + fmtN(v.tasa / 100) + ")^(1/" + m + ") − 1 = " + fmtN(i * 100, 6) + " %."];
      if (g) pasos.push("En las " + g + " cuotas de gracia solo se paga el interés: " + bs(P) + " × " + fmtN(i, 6) + " = " + bs(P * i) + ".");
      if (v.sis === "frances") pasos.push("Cuota fija: C = P · i / [1 − (1 + i)^(−" + na + ")] = " + bs(P) + " × " + fmtN(i, 6) + " / [1 − (1 + " + fmtN(i, 6) + ")^(−" + na + ")] = " + bs(cuotaF) + ".", "Cada periodo: interés = saldo anterior × i; amortización = cuota − interés; nuevo saldo = saldo anterior − amortización.");
      else if (v.sis === "aleman") pasos.push("Amortización fija: P / " + na + " = " + bs(P / na) + ". La cuota baja cada periodo porque el interés se calcula sobre un saldo menor.", "Primera cuota: " + bs(fil[g][1]) + "; última: " + bs(fil[n - 1][1]) + ".");
      else pasos.push("Se pagan solo intereses (" + bs(P * i) + ") y el capital completo en la última cuota: " + bs(fil[n - 1][1]) + ".");
      var princ = v.sis === "frances" ? ["Cuota fija", bs(cuotaF)] : v.sis === "aleman" ? ["Primera cuota", bs(fil[g][1])] : ["Cuota de interés", bs(P * i)];
      var tea = Math.pow(1 + i, m) - 1;
      return {
        principal: { etiqueta: princ[0], valor: princ[1] },
        stats: [["Total de intereses", bs(ti)], ["Total pagado", bs(tc)], ["Tasa por " + per, fmtN(i * 100, 4) + " %"], ["Tasa efectiva anual", pct(tea, 2)], ["Número de cuotas", String(n)]],
        conclusion: "Por un préstamo de " + bs(P) + " se pagan " + bs(tc) + " en " + n + " cuotas; los intereses suman " + bs(ti) + " (" + fmt(ti / P * 100, 1) + " % del monto).",
        grafico: { tipo: "barras", apilado: true, cats: cats, xlab: "Cuota", ylab: "Monto de la cuota", series: [{ nombre: "Amortización (capital)", valores: sa, color: "acento" }, { nombre: "Interés", valores: si, color: "cola" }] },
        tablas: [{ titulo: "Tabla de amortización", cab: ["N.º", "Cuota", "Interés", "Amortización", "Saldo"], filas: fil, total: ["Total", tc, ti, ta, ""], dec: [0, 2, 2, 2, 2] }],
        pasos: pasos
      };
    },
    pie: "Equivalencias en Excel: PAGO (cuota francesa), PAGOINT y PAGOPRIN."
  });

  /* ------------------------------------------------------------ 4. VAN y TIR */
  function van(fl, r) { var s = 0; for (var t = 0; t < fl.length; t++) s += fl[t] / Math.pow(1 + r, t); return s; }
  function tirs(fl) {
    var out = [], prev = van(fl, -0.99), xp = -0.99;
    for (var k = 1; k <= 4000; k++) { var x = -0.99 + k * 0.0025 * (1 + k / 400); var y = van(fl, x); if (isFinite(prev) && isFinite(y) && (y === 0 || (y > 0) !== (prev > 0))) out.push(M.raiz(function (r) { return van(fl, r); }, xp, x)); prev = y; xp = x; if (x > 100) break; }
    return out;
  }
  function recupero(acum, fl) { for (var t = 1; t < acum.length; t++) if (acum[t] >= 0 && acum[t - 1] < 0) return t - 1 + (-acum[t - 1]) / fl[t]; return NaN; }
  CALC.registrar({
    id: "van-tir", area: A, titulo: "VAN, TIR y periodo de recuperación", resumen: "Evaluación de proyectos con flujos de caja.",
    palabras: "van vpn valor actual neto tir tasa interna retorno payback recuperacion indice rentabilidad proyecto flujos caja inversion",
    descripcion: "Escriba los flujos de caja del proyecto (el primero es la inversión, en negativo) y la tasa de descuento. Obtenga VAN, TIR, índice de rentabilidad y periodo de recuperación.",
    campos: [
      { id: "fl", tipo: "lista", etiqueta: "Flujos de caja (periodo 0, 1, 2, …)", valor: "-50000\n12000\n15000\n18000\n20000\n22000", minimo: 2, filas: 6, ayuda: '<span class="hint">Uno por línea, empezando por el periodo 0 (inversión con signo negativo). Puede pegar una columna de Excel.</span>' },
      { id: "r", etiqueta: "Tasa de descuento por periodo (%)", valor: "12", min: -99 }
    ],
    calcular: function (v) {
      var fl = v.fl, r = v.r / 100, V = van(fl, r), ts = tirs(fl), fil = [], ac = [], acd = [], s = 0, sd = 0;
      fl.forEach(function (f, t) { var fd = f / Math.pow(1 + r, t); s += f; sd += fd; ac.push(s); acd.push(sd); fil.push([String(t), f, 1 / Math.pow(1 + r, t), fd, s, sd]); });
      var inv = -Math.min(0, fl[0]), vpPos = V + inv, ir = inv > 0 ? vpPos / inv : NaN, pb = recupero(ac, fl), pbd = recupero(acd, fl.map(function (f, t) { return f / Math.pow(1 + r, t); }));
      var cambios = 0; for (var k = 1; k < fl.length; k++) if (fl[k] !== 0 && fl[k - 1] !== 0 && (fl[k] > 0) !== (fl[k - 1] > 0)) cambios++;
      var avisos = []; if (ts.length > 1) avisos.push("Los flujos cambian de signo varias veces y hay " + ts.length + " TIR posibles (" + ts.map(function (x) { return pct(x, 2); }).join("; ") + "). En ese caso conviene decidir con el VAN.");
      if (!ts.length) avisos.push("No existe una TIR: el VAN no se hace cero para ninguna tasa.");
      var tir = ts.length ? ts[0] : NaN, xmax = Math.max(0.3, isFinite(tir) ? tir * 1.6 : 0, r * 2), xmin = Math.min(0, r);
      return {
        principal: { etiqueta: "VAN", valor: bs(V) }, pill: { texto: V > 0 ? "Proyecto conveniente (VAN > 0)" : V < 0 ? "No conviene (VAN < 0)" : "Indiferente (VAN = 0)", tipo: V > 0 ? "ok" : V < 0 ? "mal" : "aviso" },
        stats: [["TIR", isFinite(tir) ? pct(tir, 2) : "No existe"], ["Tasa de descuento", pct(r, 2)], ["Índice de rentabilidad", isFinite(ir) ? fmtN(ir, 4) : "—"], ["Recuperación simple", isFinite(pb) ? fmtN(pb, 2) + " periodos" : "No se recupera"], ["Recuperación descontada", isFinite(pbd) ? fmtN(pbd, 2) + " periodos" : "No se recupera"]],
        avisos: avisos,
        conclusion: (V > 0 ? "El proyecto genera " + bs(V) + " más de lo que exige la tasa de " + pct(r, 2) + ": conviene realizarlo." : V < 0 ? "El proyecto no alcanza a cubrir la tasa exigida de " + pct(r, 2) + " (le faltan " + bs(-V) + "): no conviene." : "El proyecto rinde exactamente la tasa exigida.") + (isFinite(tir) ? " Su rentabilidad propia (TIR) es " + pct(tir, 2) + (tir > r ? ", mayor" : ", menor") + " que la tasa de descuento." : ""),
        grafico: { tipo: "xy", xmin: xmin * 100, xmax: xmax * 100, xlab: "Tasa de descuento (%)", ylab: "VAN", series: [{ f: function (x) { return van(fl, x / 100); }, color: "acento", nombre: "Perfil del VAN" }], hlineas: [{ y: 0, color: "gris" }], puntos: [{ x: r * 100, y: V, color: "cola", texto: "VAN = " + bs(V) }].concat(isFinite(tir) && tir * 100 <= xmax * 100 ? [{ x: tir * 100, y: 0, color: "s3", texto: "TIR = " + pct(tir, 2) }] : []) },
        tablas: [{ titulo: "Flujos descontados", cab: ["Periodo", "Flujo", "Factor 1/(1+r)^t", "Flujo descontado", "Acumulado", "Acumulado descontado"], filas: fil, total: ["Total", s, "", V, "", ""], dec: [0, 2, 6, 2, 2, 2] }],
        pasos: ["VAN = Σ Fₜ / (1 + r)ᵗ = " + fl.map(function (f, t) { return t === 0 ? bs(f) : bs(f) + "/" + fmtN(1 + r, 4) + "^" + t; }).slice(0, 4).join(" + ") + (fl.length > 4 ? " + …" : "") + " = " + bs(V) + ".",
          "TIR: tasa que hace VAN = 0" + (isFinite(tir) ? " → " + pct(tir, 4) + " (se encuentra por aproximaciones sucesivas)." : ": no existe."),
          "Índice de rentabilidad = VP de los flujos futuros / inversión = " + bs(vpPos) + " / " + bs(inv) + " = " + fmtN(ir, 4) + ".",
          "Periodo de recuperación: momento en que el flujo acumulado llega a cero" + (isFinite(pb) ? " → " + fmtN(pb, 2) + " periodos (descontado: " + (isFinite(pbd) ? fmtN(pbd, 2) : "no se recupera") + ")." : ": no se recupera la inversión.")]
      };
    },
    pie: "En Excel: VAN = flujo₀ + VNA(tasa; flujo₁:flujoₙ) (VNA descuenta desde el periodo 1) y TIR(flujo₀:flujoₙ)."
  });

  /* ------------------------------------------------------------ 5. Tasas equivalentes */
  CALC.registrar({
    id: "tasas", area: A, titulo: "Tasas equivalentes", resumen: "Nominal ↔ efectiva, de un periodo a otro.",
    palabras: "tasa nominal efectiva equivalente conversion tea tna periodica capitalizacion mensual anual continua",
    descripcion: "Convierta una tasa nominal o efectiva a sus equivalentes en cualquier periodo: anual, semestral, trimestral, mensual, diaria y continua.",
    campos: [
      { id: "t", etiqueta: "Tasa (%)", valor: "18", mayor: -100 },
      { id: "tipo", tipo: "sel", etiqueta: "La tasa es", valor: "nominal", opciones: [["nominal", "Nominal anual"], ["efectiva", "Efectiva anual (TEA)"], ["periodica", "Efectiva de un periodo"]] },
      { id: "m", tipo: "sel", etiqueta: "Capitalización / periodo", valor: "12", si: function (s) { return s.tipo !== "efectiva"; }, opciones: [["12", "Mensual"], ["4", "Trimestral"], ["2", "Semestral"], ["6", "Bimestral"], ["3", "Cuatrimestral"], ["24", "Quincenal"], ["52", "Semanal"], ["360", "Diaria (360)"], ["365", "Diaria (365)"]] }
    ],
    calcular: function (v) {
      var x = v.t / 100, m = +v.m, tea, paso;
      if (v.tipo === "nominal") { tea = Math.pow(1 + x / m, m) - 1; paso = "TEA = (1 + j/m)^m − 1 = (1 + " + fmtN(x, 6) + "/" + m + ")^" + m + " − 1 = " + pct(tea, 4) + "."; }
      else if (v.tipo === "efectiva") { tea = x; paso = "La tasa ya es efectiva anual: TEA = " + pct(tea, 4) + "."; }
      else { tea = Math.pow(1 + x, m) - 1; paso = "TEA = (1 + i_periodo)^m − 1 = (1 + " + fmtN(x, 6) + ")^" + m + " − 1 = " + pct(tea, 4) + "."; }
      var per = [[1, "Anual"], [2, "Semestral"], [3, "Cuatrimestral"], [4, "Trimestral"], [6, "Bimestral"], [12, "Mensual"], [24, "Quincenal"], [52, "Semanal"], [360, "Diaria (360)"], [365, "Diaria (365)"]];
      var fil = per.map(function (p) { var ip = Math.pow(1 + tea, 1 / p[0]) - 1; return [p[1], ip * 100, ip * p[0] * 100]; });
      var cont = Math.log(1 + tea);
      return {
        principal: { etiqueta: "Tasa efectiva anual (TEA)", valor: pct(tea, 4) },
        stats: [["Mensual efectiva", pct(Math.pow(1 + tea, 1 / 12) - 1, 4)], ["Nominal anual cap. mensual", pct((Math.pow(1 + tea, 1 / 12) - 1) * 12, 4)], ["Trimestral efectiva", pct(Math.pow(1 + tea, 1 / 4) - 1, 4)], ["Tasa continua equivalente", pct(cont, 4)]],
        conclusion: "Todas las tasas de la tabla son equivalentes: producen el mismo monto al cabo de un año (" + pct(tea, 2) + " efectivo).",
        tablas: [{ titulo: "Tasas equivalentes", cab: ["Periodo", "Efectiva del periodo (%)", "Nominal anual equivalente (%)"], filas: fil, dec: [0, 6, 4] }],
        pasos: [paso, "Efectiva de un periodo con m periodos por año: i = (1 + TEA)^(1/m) − 1.", "Nominal anual equivalente: j = i × m.", "Tasa continua equivalente: δ = ln(1 + TEA) = " + pct(cont, 4) + "."]
      };
    },
    pie: "Equivalencias en Excel: INT.EFECTIVO y TASA.NOMINAL."
  });

  /* ------------------------------------------------------------ 6. CAPM y WACC */
  CALC.registrar({
    id: "capm-wacc", area: A, titulo: "CAPM y costo de capital (WACC)", resumen: "Rendimiento exigido con CAPM y costo promedio ponderado.",
    palabras: "capm beta prima riesgo mercado costo capital propio wacc cppc costo promedio ponderado deuda impuestos",
    descripcion: "Calcule el rendimiento exigido por los accionistas con el modelo CAPM y el costo promedio ponderado de capital (WACC) de la empresa.",
    modos: [
      { id: "capm", nombre: "CAPM", campos: [{ id: "rf", etiqueta: "Tasa libre de riesgo (%)", valor: "4,5" }, { id: "beta", etiqueta: "Beta (β)", valor: "1,2" }, { id: "rm", etiqueta: "Rendimiento del mercado (%)", valor: "11" }, { id: "prp", etiqueta: "Prima por riesgo país (%)", valor: "0", ayuda: "Opcional; se suma al resultado." }] },
      { id: "wacc", nombre: "WACC", campos: [{ id: "E", etiqueta: "Patrimonio (E)", valor: "600000", min: 0 }, { id: "D", etiqueta: "Deuda (D)", valor: "400000", min: 0 }, { id: "ke", etiqueta: "Costo del patrimonio Ke (%)", valor: "14" }, { id: "kd", etiqueta: "Costo de la deuda Kd (%)", valor: "9" }, { id: "T", etiqueta: "Tasa de impuesto (%)", valor: "25", min: 0, max: 100, ayuda: "En Bolivia, el IUE es 25 %." }] }
    ],
    calcular: function (v) {
      if (v.modo === "capm") {
        var pr = v.rm - v.rf, ke = v.rf + v.beta * pr + v.prp;
        var xm = Math.max(2, v.beta * 1.4);
        return {
          principal: { etiqueta: "Rendimiento exigido (Ke)", valor: fmtN(ke, 4) + " %" },
          stats: [["Prima de mercado (Rm − Rf)", fmtN(pr, 4) + " %"], ["Prima del activo β(Rm − Rf)", fmtN(v.beta * pr, 4) + " %"], ["Beta", fmtN(v.beta, 4)]],
          conclusion: "Con una beta de " + fmtN(v.beta) + ", el activo es " + (v.beta > 1 ? "más riesgoso" : v.beta < 1 ? "menos riesgoso" : "tan riesgoso como") + " que el mercado; el accionista exige " + fmtN(ke, 2) + " % anual.",
          grafico: { tipo: "xy", xmin: 0, xmax: xm, xlab: "Beta (β)", ylab: "Rendimiento (%)", series: [{ f: function (b) { return v.rf + b * pr + v.prp; }, color: "acento", nombre: "Línea del mercado de valores (LMV)", n: 2 }], puntos: [{ x: v.beta, y: ke, color: "cola", texto: "Ke = " + fmtN(ke, 2) + " %", guias: true }, { x: 1, y: v.rm + v.prp, color: "gris", texto: "Mercado" }] },
          pasos: ["Fórmula: Ke = Rf + β·(Rm − Rf)" + (v.prp ? " + riesgo país" : "") + ".", "Ke = " + fmtN(v.rf) + " % + " + fmtN(v.beta) + " × (" + fmtN(v.rm) + " % − " + fmtN(v.rf) + " %)" + (v.prp ? " + " + fmtN(v.prp) + " %" : "") + " = " + fmtN(ke, 4) + " %."]
        };
      }
      var V = v.E + v.D; if (V <= 0) throw new Error("El patrimonio y la deuda no pueden ser ambos cero.");
      var we = v.E / V, wd = v.D / V, kdn = v.kd * (1 - v.T / 100), w = we * v.ke + wd * kdn;
      return {
        principal: { etiqueta: "WACC", valor: fmtN(w, 4) + " %" },
        stats: [["Peso del patrimonio", pct(we, 2)], ["Peso de la deuda", pct(wd, 2)], ["Kd después de impuestos", fmtN(kdn, 4) + " %"], ["Valor total (E + D)", bs(V)]],
        conclusion: "La empresa debe rendir al menos " + fmtN(w, 2) + " % anual sobre sus inversiones para satisfacer a accionistas y acreedores. Es la tasa adecuada para descontar sus proyectos.",
        grafico: { tipo: "barras", cats: ["Patrimonio", "Deuda"], series: [{ nombre: "Aporte al WACC (%)", valores: [we * v.ke, wd * kdn], color: "acento" }], ylab: "Puntos porcentuales" },
        pasos: ["Pesos: E/V = " + bs(v.E) + " / " + bs(V) + " = " + fmtN(we, 4) + "; D/V = " + fmtN(wd, 4) + ".", "Costo de la deuda después de impuestos: Kd(1 − T) = " + fmtN(v.kd) + " % × (1 − " + fmtN(v.T / 100) + ") = " + fmtN(kdn, 4) + " %.", "WACC = (E/V)·Ke + (D/V)·Kd(1 − T) = " + fmtN(we, 4) + " × " + fmtN(v.ke) + " % + " + fmtN(wd, 4) + " × " + fmtN(kdn, 4) + " % = " + fmtN(w, 4) + " %."]
      };
    }
  });

  /* ------------------------------------------------------------ 7. Punto de equilibrio */
  CALC.registrar({
    id: "punto-equilibrio", area: A, titulo: "Punto de equilibrio", resumen: "Unidades y ventas para no ganar ni perder; utilidad objetivo.",
    palabras: "punto equilibrio costo fijo variable margen contribucion utilidad deseada margen seguridad apalancamiento",
    descripcion: "Calcule cuántas unidades debe vender para cubrir sus costos, las ventas para alcanzar una utilidad objetivo y el margen de seguridad.",
    campos: [
      { id: "cf", etiqueta: "Costos fijos totales", valor: "24000", min: 0 },
      { id: "p", etiqueta: "Precio de venta por unidad", valor: "50", mayor: 0 },
      { id: "cv", etiqueta: "Costo variable por unidad", valor: "30", min: 0 },
      { id: "u", etiqueta: "Utilidad deseada", valor: "10000", opcional: true, ayuda: "Opcional." },
      { id: "q", etiqueta: "Ventas actuales o previstas (unidades)", valor: "1500", opcional: true, min: 0, ayuda: "Opcional, para el margen de seguridad." }
    ],
    calcular: function (v) {
      var mc = v.p - v.cv; if (mc <= 0) throw new Error("El precio debe ser mayor que el costo variable unitario; si no, nunca se alcanza el equilibrio.");
      var rmc = mc / v.p, qe = v.cf / mc, ve = qe * v.p, stats = [["Ventas de equilibrio", bs(ve)], ["Margen de contribución unitario", bs(mc)], ["Razón de contribución", pct(rmc, 2)]], pasos = [];
      pasos.push("Margen de contribución unitario: MC = P − CVu = " + bs(v.p) + " − " + bs(v.cv) + " = " + bs(mc) + ".", "Punto de equilibrio en unidades: Qe = CF / MC = " + bs(v.cf) + " / " + bs(mc) + " = " + fmtN(qe, 2) + " unidades.", "En dinero: Ve = Qe × P = " + bs(ve) + " (o CF / razón de contribución = " + bs(v.cf) + " / " + fmtN(rmc, 4) + ").");
      var qu = NaN; if (isFinite(v.u)) { qu = (v.cf + v.u) / mc; stats.push(["Unidades para la utilidad deseada", fmtN(Math.ceil(qu - 1e-9))]); pasos.push("Para ganar " + bs(v.u) + ": Q = (CF + U) / MC = (" + bs(v.cf) + " + " + bs(v.u) + ") / " + bs(mc) + " = " + fmtN(qu, 2) + " unidades."); }
      var ms = NaN; if (isFinite(v.q) && v.q > 0) { ms = (v.q - qe) / v.q; var ut = v.q * mc - v.cf, gao = ut !== 0 ? v.q * mc / ut : NaN; stats.push(["Margen de seguridad", pct(ms, 2)], ["Utilidad con las ventas actuales", bs(ut)]); if (isFinite(gao)) stats.push(["Apalancamiento operativo", fmtN(gao, 2)]); pasos.push("Margen de seguridad = (Q actual − Qe) / Q actual = (" + fmtN(v.q) + " − " + fmtN(qe, 2) + ") / " + fmtN(v.q) + " = " + pct(ms, 2) + ".", "Utilidad = Q × MC − CF = " + bs(ut) + (isFinite(gao) ? "; grado de apalancamiento operativo = MC total / utilidad = " + fmtN(gao, 2) + "." : ".")); }
      var xm = Math.max(qe * 2, isFinite(qu) ? qu * 1.2 : 0, isFinite(v.q) ? v.q * 1.2 : 0);
      return {
        principal: { etiqueta: "Punto de equilibrio", valor: fmtN(qe, 2) + " u." }, stats: stats,
        conclusion: "Debe vender " + fmtN(Math.ceil(qe - 1e-9)) + " unidades (" + bs(ve) + ") para no ganar ni perder." + (isFinite(ms) ? (ms >= 0 ? " Con las ventas previstas está " + pct(ms, 1) + " por encima del equilibrio." : " Con las ventas previstas está por debajo del equilibrio: hay pérdida.") : ""),
        grafico: { tipo: "xy", xmin: 0, xmax: xm, xlab: "Unidades", ylab: "Monto", series: [{ f: function (q) { return q * v.p; }, color: "acento", nombre: "Ingresos totales", n: 2 }, { f: function (q) { return v.cf + q * v.cv; }, color: "cola", nombre: "Costos totales", n: 2 }, { f: function () { return v.cf; }, color: "gris", guion: true, ancho: 1.5, nombre: "Costos fijos", n: 2 }], puntos: [{ x: qe, y: ve, color: "s3", texto: "Equilibrio: " + fmtN(qe, 0) + " u.", guias: true }] },
        pasos: pasos
      };
    }
  });

  /* ------------------------------------------------------------ 8. Depreciación */
  CALC.registrar({
    id: "depreciacion", area: A, titulo: "Depreciación de activos", resumen: "Línea recta, suma de dígitos, saldo decreciente y unidades producidas.",
    palabras: "depreciacion activo fijo linea recta suma digitos saldo decreciente doble unidades produccion valor libros residual vida util",
    descripcion: "Arme la tabla de depreciación de un activo fijo con el método que elija y vea cómo baja su valor en libros.",
    campos: [
      { id: "met", tipo: "sel", etiqueta: "Método", valor: "recta", ancho: true, opciones: [["recta", "Línea recta"], ["digitos", "Suma de los dígitos de los años"], ["ddb", "Saldo doblemente decreciente"], ["unidades", "Unidades producidas"]] },
      { id: "costo", etiqueta: "Costo del activo", valor: "120000", mayor: 0 },
      { id: "res", etiqueta: "Valor residual", valor: "12000", min: 0 },
      { id: "vida", etiqueta: "Vida útil (años)", valor: "5", entero: true, min: 1, max: 100, si: function (s) { return s.met !== "unidades"; } },
      { id: "uds", tipo: "lista", etiqueta: "Unidades producidas cada año", valor: "8000 12000 10000 6000 4000", si: function (s) { return s.met === "unidades"; }, filas: 3, ayuda: '<span class="hint">Una cantidad por año; la suma se toma como la capacidad total del activo.</span>' }
    ],
    calcular: function (v) {
      if (v.res >= v.costo) throw new Error("El valor residual debe ser menor que el costo.");
      var base = v.costo - v.res, n = v.met === "unidades" ? v.uds.length : v.vida, deps = [], libro = v.costo, pasos = ["Base depreciable = costo − valor residual = " + bs(v.costo) + " − " + bs(v.res) + " = " + bs(base) + "."];
      if (v.met === "recta") { for (var k = 0; k < n; k++) deps.push(base / n); pasos.push("Depreciación anual = base / vida útil = " + bs(base) + " / " + n + " = " + bs(base / n) + "."); }
      else if (v.met === "digitos") { var S = n * (n + 1) / 2; for (var j = 0; j < n; j++) deps.push(base * (n - j) / S); pasos.push("Suma de dígitos: " + n + "(" + n + " + 1)/2 = " + S + ".", "Año k: base × (años restantes) / " + S + ". Año 1: " + bs(base) + " × " + n + "/" + S + " = " + bs(deps[0]) + "."); }
      else if (v.met === "ddb") {
        var tasa = 2 / n, b = v.costo;
        for (var q = 0; q < n; q++) { var d = q === n - 1 ? b - v.res : Math.min(b * tasa, b - v.res); d = Math.max(0, d); deps.push(d); b -= d; }
        pasos.push("Tasa = 2 / vida útil = " + pct(tasa, 2) + " sobre el valor en libros al inicio de cada año (sin bajar del valor residual).", "En el último año se deprecia lo necesario para llegar exactamente al valor residual.");
      } else {
        var tot = M.suma(v.uds); if (tot <= 0) throw new Error("La suma de unidades debe ser mayor que cero.");
        v.uds.forEach(function (u) { deps.push(base * u / tot); }); pasos.push("Depreciación por unidad = base / unidades totales = " + bs(base) + " / " + fmtN(tot) + " = " + fmtN(base / tot, 4) + ".", "Cada año: unidades del año × " + fmtN(base / tot, 4) + ".");
      }
      var fil = [], acum = 0, cats = [], vals = [];
      deps.forEach(function (d, k) { acum += d; libro = v.costo - acum; fil.push([String(k + 1), d, acum, libro]); cats.push(String(k + 1)); vals.push(libro); });
      return {
        principal: { etiqueta: "Depreciación del año 1", valor: bs(deps[0]) },
        stats: [["Base depreciable", bs(base)], ["Depreciación total", bs(acum)], ["Valor en libros final", bs(libro)], ["Años", String(n)]],
        conclusion: "El activo pierde " + bs(acum) + " de valor en " + n + " años y termina con un valor en libros de " + bs(libro) + ".",
        grafico: { tipo: "barras", cats: cats, xlab: "Año", ylab: "Valor en libros", series: [{ nombre: "Valor en libros al final del año", valores: vals, color: "acento" }] },
        tablas: [{ titulo: "Tabla de depreciación", cab: ["Año", "Depreciación", "Depreciación acumulada", "Valor en libros"], filas: [["0", "", "", v.costo]].concat(fil), total: ["Total", acum, "", ""], dec: [0, 2, 2, 2] }],
        pasos: pasos
      };
    },
    pie: "Equivalencias en Excel: SLN, SYD y DDB."
  });

  /* ------------------------------------------------------------ 9. Bonos */
  function precioBono(VN, c, y, n, m) { var i = y / m, cup = VN * c / m, N = Math.round(n * m), s = 0; for (var t = 1; t <= N; t++) s += cup / Math.pow(1 + i, t); return s + VN / Math.pow(1 + i, N); }
  CALC.registrar({
    id: "bonos", area: A, titulo: "Precio y rendimiento de bonos", resumen: "Precio, rendimiento al vencimiento y duración.",
    palabras: "bono obligacion precio rendimiento vencimiento ytm cupon duracion macaulay modificada prima descuento renta fija",
    descripcion: "Valore un bono con cupones fijos: su precio a partir del rendimiento de mercado, o el rendimiento al vencimiento a partir del precio. Incluye la duración.",
    campos: [
      { id: "inc", tipo: "sel", etiqueta: "¿Qué desea calcular?", valor: "precio", opciones: [["precio", "Precio del bono"], ["ytm", "Rendimiento al vencimiento"]] },
      { id: "vn", etiqueta: "Valor nominal", valor: "1000", mayor: 0 },
      { id: "c", etiqueta: "Tasa de cupón anual (%)", valor: "8", min: 0 },
      { id: "y", etiqueta: "Rendimiento de mercado anual (%)", valor: "10", mayor: -100, si: function (s) { return s.inc === "precio"; } },
      { id: "pr", etiqueta: "Precio de mercado", valor: "922,78", mayor: 0, si: function (s) { return s.inc === "ytm"; } },
      { id: "n", etiqueta: "Años al vencimiento", valor: "5", mayor: 0 },
      { id: "m", tipo: "sel", etiqueta: "Pagos de cupón por año", valor: "2", opciones: [["1", "Anual"], ["2", "Semestral"], ["4", "Trimestral"], ["12", "Mensual"]] }
    ],
    calcular: function (v) {
      var m = +v.m, c = v.c / 100, y, P;
      if (Math.abs(v.n * m - Math.round(v.n * m)) > 1e-9) throw new Error("Los años al vencimiento deben corresponder a un número entero de cupones.");
      if (v.inc === "precio") { y = v.y / 100; P = precioBono(v.vn, c, y, v.n, m); }
      else { P = v.pr; y = M.raiz(function (r) { return precioBono(v.vn, c, r, v.n, m) - P; }, -0.99 * m, 5); }
      var i = y / m, N = Math.round(v.n * m), cup = v.vn * c / m, dur = 0, fil = [];
      for (var t = 1; t <= N; t++) { var f = cup + (t === N ? v.vn : 0), pv = f / Math.pow(1 + i, t); dur += t * pv; if (N <= 60) fil.push([String(t), fmtN(t / m, 2), f, pv]); }
      var mac = dur / P / m, mod = mac / (1 + i), tipo = P > v.vn + 1e-6 ? "Se vende con prima" : P < v.vn - 1e-6 ? "Se vende con descuento" : "Se vende a la par";
      var lo = Math.max(0.001, y - 0.08), hi = y + 0.08;
      return {
        principal: v.inc === "precio" ? { etiqueta: "Precio del bono", valor: bs(P) } : { etiqueta: "Rendimiento al vencimiento", valor: pct(y, 4) },
        pill: { texto: tipo, tipo: "info" },
        stats: [["Precio (% del nominal)", fmt(P / v.vn * 100, 3) + " %"], ["Cupón por periodo", bs(cup)], ["Rendimiento anual", pct(y, 4)], ["Duración de Macaulay", fmtN(mac, 4) + " años"], ["Duración modificada", fmtN(mod, 4)], ["Rendimiento corriente", pct(v.vn * c / P, 4)]],
        conclusion: tipo + " porque la tasa de cupón (" + pct(c, 2) + ") es " + (c > y ? "mayor" : c < y ? "menor" : "igual") + " que el rendimiento exigido (" + pct(y, 2) + "). Si el rendimiento sube 1 punto, el precio bajaría aproximadamente " + fmt(mod, 2) + " %.",
        grafico: { tipo: "xy", xmin: lo * 100, xmax: hi * 100, xlab: "Rendimiento anual (%)", ylab: "Precio", series: [{ f: function (r) { return precioBono(v.vn, c, r / 100, v.n, m); }, color: "acento", nombre: "Precio según rendimiento", n: 120 }], hlineas: [{ y: v.vn, color: "gris", texto: "Valor nominal" }], puntos: [{ x: y * 100, y: P, color: "cola", texto: bs(P), guias: true }] },
        tablas: fil.length ? [{ titulo: "Flujos del bono", cab: ["Periodo", "Años", "Flujo", "Valor presente"], filas: fil, total: ["Total", "", cup * N + v.vn, P], dec: [0, 0, 2, 2] }] : [],
        pasos: ["Cupón por periodo = VN × cupón / m = " + bs(v.vn) + " × " + fmtN(c) + " / " + m + " = " + bs(cup) + "; periodos N = " + N + "; tasa por periodo = " + pct(i, 4) + ".",
          "Precio = Σ cupón/(1 + i)ᵗ + VN/(1 + i)ᴺ = " + bs(P) + (v.inc === "ytm" ? " → el rendimiento que iguala este precio se halla por aproximaciones: " + pct(y, 4) + " anual." : "."),
          "Duración de Macaulay = Σ t·VP(flujoₜ) / precio = " + fmtN(mac, 4) + " años; duración modificada = " + fmtN(mac, 4) + " / (1 + " + fmtN(i, 6) + ") = " + fmtN(mod, 4) + "."]
      };
    },
    pie: "Equivalencias en Excel: PRECIO, RENDTO, DURACION y DURACION.MODIF."
  });
})();
