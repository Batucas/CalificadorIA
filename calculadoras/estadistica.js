/* Calculadoras de Estadística. */
(function () {
  "use strict";
  var M = CALC.M, fmt = CALC.fmt, fmtN = CALC.fmtN, fmtP = CALC.fmtP;
  var A = "Estadística";

  var ALFA = { id: "alpha", tipo: "sel", etiqueta: "Nivel de significancia (α)", valor: "0.05", opciones: [["0.10", "0,10"], ["0.05", "0,05"], ["0.025", "0,025"], ["0.01", "0,01"], ["0.001", "0,001"]] };
  var CONF = { id: "conf", tipo: "sel", etiqueta: "Nivel de confianza", valor: "0.95", opciones: [["0.80", "80 %"], ["0.90", "90 %"], ["0.95", "95 %"], ["0.98", "98 %"], ["0.99", "99 %"], ["0.999", "99,9 %"]] };
  function cola(id, h1, valor) {
    return { id: id, tipo: "sel", etiqueta: "Hipótesis alternativa (H₁)", valor: valor || "bi", opciones: [["bi", h1 + " ≠ (bilateral)"], ["izq", h1 + " < (cola izquierda)"], ["der", h1 + " > (cola derecha)"]] };
  }
  function fa(a) { a = +a; return fmtN(a, 3); }

  /* Prueba genérica: valor p, valores críticos, decisión y gráfico. */
  function prueba(o) {
    var a = +o.alpha, d = o.dist, est = o.est, k = o.gl, k2 = o.gl2, sf, inv, pdf, sim = d === "z" || d === "t";
    if (d === "z") { sf = M.normSF; inv = M.zCrit; pdf = M.normPdf; }
    else if (d === "t") { sf = function (x) { return M.tSF(x, k); }; inv = function (p) { return M.tCrit(p, k); }; pdf = function (x) { return M.tPdf(x, k); }; }
    else if (d === "chi") { sf = function (x) { return M.chiSF(x, k); }; inv = function (p) { return M.chiCrit(p, k); }; pdf = function (x) { return M.chiPdf(x, k); }; }
    else { sf = function (x) { return M.fSF(x, k, k2); }; inv = function (p) { return M.fCrit(p, k, k2); }; pdf = function (x) { return M.fPdf(x, k, k2); }; }
    var p, crit, rechaza, region, colas;
    if (o.cola === "der") { p = sf(est); crit = [inv(a)]; rechaza = est >= crit[0]; region = "estadístico ≥ " + fmt(crit[0], 4); colas = [{ desde: est }]; }
    else if (o.cola === "izq") { p = 1 - sf(est); crit = [inv(1 - a)]; rechaza = est <= crit[0]; region = "estadístico ≤ " + fmt(crit[0], 4); colas = [{ hasta: est }]; }
    else {
      var cola = sf(est); p = 2 * Math.min(cola, 1 - cola); crit = [inv(1 - a / 2), inv(a / 2)]; rechaza = est <= crit[0] || est >= crit[1];
      region = "estadístico ≤ " + fmt(crit[0], 4) + " o ≥ " + fmt(crit[1], 4);
      if (sim) { var e = Math.abs(est); colas = [{ hasta: -e }, { desde: e }]; }
      else colas = cola < 0.5 ? [{ desde: est }, { hasta: inv(1 - cola) }] : [{ hasta: est }, { desde: inv(cola) }];
    }
    p = Math.min(1, Math.max(0, p));
    var xmin, xmax;
    if (sim) { var lim = Math.max(4, Math.min(Math.abs(est) * 1.15, 8)); if (d === "t" && k < 5) lim = Math.max(lim, Math.min(M.tCrit(0.005, k) * 1.1, 12)); xmin = -lim; xmax = lim; }
    else if (d === "chi") { xmin = 0; xmax = Math.max(Math.max.apply(null, crit) * 1.35, k + 4 * Math.sqrt(2 * k), 8); if (est > xmax && est < xmax * 1.6) xmax = est * 1.08; }
    else { xmin = 0; xmax = Math.max(Math.max.apply(null, crit) * 1.4, 4); if (est > xmax && est < xmax * 1.6) xmax = est * 1.08; }
    var ym = 0; for (var i = 1; i <= 200; i++) { var x = xmin + (xmax - xmin) * i / 200; if (!sim && x < xmax * 0.03) continue; var y = pdf(x); if (isFinite(y)) ym = Math.max(ym, y); }
    var g = CALC.graficoDensidad({ f: pdf, xmin: xmin, xmax: xmax, ymax: ym * 1.12, colas: colas, criticos: crit, estad: est, etEstad: o.etEstad || "estadístico", xlab: o.xlab });
    return { p: p, crit: crit, rechaza: rechaza, region: region, grafico: g, alpha: a };
  }
  function pillDe(r) { return { texto: r.rechaza ? "Se rechaza H₀" : "No se rechaza H₀", tipo: r.rechaza ? "mal" : "ok" }; }
  function conclusionDe(r, siRechaza, siNo) {
    return "Como el valor p (" + fmtP(r.p) + ") es " + (r.rechaza ? "menor o igual" : "mayor") + " que α = " + fa(r.alpha) + ", " + (r.rechaza ? "se rechaza H₀" + (siRechaza ? ": " + siRechaza : ".") : "no se rechaza H₀" + (siNo ? ": " + siNo : "."));
  }
  function pasosFinal(r, et) {
    return ["Valor p: " + fmtP(r.p) + (r.crit.length > 1 ? " (dos colas: el doble del área de la cola más pequeña)." : "."),
      "Valor crítico" + (r.crit.length > 1 ? "es" : "") + " con α = " + fa(r.alpha) + ": " + r.crit.map(function (c) { return fmt(c, 4); }).join(" y ") + ". Región de rechazo: " + r.region.replace("estadístico", et || "estadístico") + ".",
      "Decisión: " + (r.rechaza ? "se rechaza H₀" : "no se rechaza H₀") + " (p " + (r.rechaza ? "≤" : ">") + " α)."];
  }
  var signo = { bi: "≠", izq: "<", der: ">" }, contra = { bi: "=", izq: "≥", der: "≤" };

  /* ------------------------------------------------------------ 1. Valor p y valor crítico */
  CALC.registrar({
    id: "valor-p", area: A, titulo: "Valor p y valor crítico (Z, t, χ², F)", resumen: "Valor p y valor crítico desde un estadístico ya calculado.",
    palabras: "tabla normal student chi cuadrado fisher p-value region rechazo",
    descripcion: "Escriba el estadístico de prueba ya calculado y obtenga el valor p, el valor crítico y la decisión, con el área sombreada en la distribución.",
    modos: [
      { id: "z", nombre: "Normal (Z)", campos: [{ id: "z", etiqueta: "Estadístico Z", valor: "2,15" }, cola("colaS", "H₁:")] },
      { id: "t", nombre: "t de Student", campos: [{ id: "t", etiqueta: "Estadístico t", valor: "2,15" }, { id: "glt", etiqueta: "Grados de libertad (gl)", valor: "14", entero: true, min: 1 }, cola("colaS", "H₁:")] },
      { id: "chi", nombre: "Chi-cuadrado (χ²)", campos: [{ id: "chi", etiqueta: "Estadístico χ²", valor: "11,67", min: 0 }, { id: "glc", etiqueta: "Grados de libertad (gl)", valor: "1", entero: true, min: 1 }, cola("colaD", "H₁:", "der")] },
      { id: "f", nombre: "F de Fisher", campos: [{ id: "f", etiqueta: "Estadístico F", valor: "3,85", min: 0 }, { id: "gl1", etiqueta: "gl del numerador", valor: "2", entero: true, min: 1 }, { id: "gl2", etiqueta: "gl del denominador", valor: "27", entero: true, min: 1 }, cola("colaD", "H₁:", "der")] }
    ],
    campos: [ALFA],
    calcular: function (v) {
      var o = { alpha: v.alpha };
      if (v.modo === "z") { o.dist = "z"; o.est = v.z; o.cola = v.colaS; o.etEstad = "Z"; }
      else if (v.modo === "t") { o.dist = "t"; o.est = v.t; o.gl = v.glt; o.cola = v.colaS; o.etEstad = "t"; }
      else if (v.modo === "chi") { o.dist = "chi"; o.est = v.chi; o.gl = v.glc; o.cola = v.colaD; o.etEstad = "χ²"; }
      else { o.dist = "f"; o.est = v.f; o.gl = v.gl1; o.gl2 = v.gl2; o.cola = v.colaD; o.etEstad = "F"; }
      var r = prueba(o), nom = { z: "Z", t: "t(" + v.glt + ")", chi: "χ²(" + v.glc + ")", f: "F(" + v.gl1 + ", " + v.gl2 + ")" }[v.modo];
      var desc = { der: "P(" + nom + " ≥ " + fmt(o.est, 4) + ")", izq: "P(" + nom + " ≤ " + fmt(o.est, 4) + ")", bi: "2 × (área de la cola más pequeña)" }[o.cola];
      return {
        principal: { etiqueta: "Valor p", valor: fmtP(r.p) }, pill: pillDe(r),
        stats: [[o.etEstad + " calculado", fmt(o.est, 4)], ["Valor crítico", r.crit.map(function (c) { return fmt(c, 4); }).join(" ; ")], ["α", fa(r.alpha)], ["Cola", { bi: "Bilateral", izq: "Izquierda", der: "Derecha" }[o.cola]]],
        conclusion: conclusionDe(r), grafico: r.grafico,
        pasos: ["Distribución: " + nom + ".", "Valor p = " + desc + " = " + fmtP(r.p) + "."].concat(pasosFinal(r, o.etEstad).slice(1))
      };
    },
    pie: "Valores calculados con las funciones gamma y beta incompletas; coinciden con DISTR.NORM.ESTAND.N, DISTR.T, DISTR.CHICUAD.CD y DISTR.F.CD de Excel."
  });

  /* ------------------------------------------------------------ 2. Chi-cuadrado */
  CALC.registrar({
    id: "chi-cuadrado", area: A, titulo: "Prueba chi-cuadrado (χ²)", resumen: "Independencia en tablas de contingencia y bondad de ajuste.",
    palabras: "chi cuadrado contingencia independencia bondad ajuste yates frecuencias esperadas",
    descripcion: "Calcula el valor p de cola derecha, el valor crítico y la decisión de la prueba. Elija cómo ingresar los datos: el estadístico ya calculado, una tabla de contingencia o una prueba de bondad de ajuste.",
    modos: [
      { id: "tabla", nombre: "Tabla de contingencia (independencia)", campos: [
        { id: "ct", tipo: "tabla", totales: true, noNegativos: true, valor: { filas: ["Jóvenes", "Adultos"], cols: ["QR", "Efectivo"], datos: [["40", "20"], ["30", "50"]] }, ayuda: "Escriba las frecuencias observadas (conteos). Los nombres de filas y columnas se pueden editar." },
        { id: "yates", tipo: "check", etiqueta: "Aplicar corrección de Yates (solo tablas 2 × 2)" }] },
      { id: "ajuste", nombre: "Bondad de ajuste", campos: [
        { id: "tipoE", tipo: "sel", etiqueta: "Valores esperados como", valor: "uniforme", opciones: [["uniforme", "Distribución uniforme (todas iguales)"], ["prop", "Proporciones o porcentajes"], ["frec", "Frecuencias esperadas"]], ancho: true },
        { id: "ajU", tipo: "tabla", colsFijas: true, etFilas: "Número de categorías", etFila: "Categoría ", min: 2, max: 15, noNegativos: true, si: function (s) { return s.tipoE === "uniforme"; }, valor: { filas: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], cols: ["Observado"], datos: [["30"], ["25"], ["28"], ["35"], ["42"], ["50"]] } },
        { id: "ajE", tipo: "tabla", colsFijas: true, etFilas: "Número de categorías", etFila: "Categoría ", min: 2, max: 15, noNegativos: true, si: function (s) { return s.tipoE !== "uniforme"; }, valor: { filas: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], cols: ["Observado", "Esperado"], datos: [["30", "15"], ["25", "15"], ["28", "15"], ["35", "15"], ["42", "20"], ["50", "20"]] }, ayuda: "En «Esperado» escriba proporciones, porcentajes o frecuencias, según lo elegido arriba." },
        { id: "m", etiqueta: "Parámetros estimados con los datos (m)", valor: "0", entero: true, min: 0, ayuda: "Normalmente 0. Por ejemplo, 1 si estimó λ de una Poisson con la muestra." }] },
      { id: "directo", nombre: "Desde χ² y gl", campos: [
        { id: "chi", etiqueta: "Estadístico χ²", valor: "11,67", min: 0 }, { id: "gl", etiqueta: "Grados de libertad (gl)", valor: "1", entero: true, min: 1 },
        { tipo: "nota", id: "n1", texto: "Independencia: gl = (filas − 1)(columnas − 1). Bondad de ajuste: gl = categorías − 1 − parámetros estimados." }] }
    ],
    campos: [ALFA],
    calcular: function (v) {
      var res = { tablas: [], avisos: [], pasos: [] }, chi, gl, kind = v.modo, low = 0, min = Infinity, cells = 0;
      if (v.modo === "tabla") {
        var t = v.ct, r = t.filas.length, c = t.cols.length, O = t.datos, rs = O.map(function (f) { return M.suma(f); }), cs = t.cols.map(function (_, j) { return M.suma(O.map(function (f) { return f[j]; })); }), N = M.suma(rs);
        if (N === 0) throw new Error("La tabla está vacía: ingrese las frecuencias observadas.");
        rs.forEach(function (s, i) { if (s === 0) throw new Error("La fila «" + t.filas[i] + "» suma 0. Elimínela o corrija los datos."); });
        cs.forEach(function (s, j) { if (s === 0) throw new Error("La columna «" + t.cols[j] + "» suma 0. Elimínela o corrija los datos."); });
        var yates = v.yates && r === 2 && c === 2, filas = []; chi = 0;
        for (var i = 0; i < r; i++) for (var j = 0; j < c; j++) {
          var e = rs[i] * cs[j] / N, dd = Math.abs(O[i][j] - e); if (yates) dd = Math.max(0, dd - 0.5); var ct = dd * dd / e; chi += ct;
          if (e < 5) low++; min = Math.min(min, e); cells++;
          filas.push([t.filas[i] + " · " + t.cols[j], O[i][j], e, ct]);
        }
        gl = (r - 1) * (c - 1);
        res.tablas.push({ cab: ["Celda", "Observado (O)", "Esperado (E)", yates ? "(|O − E| − 0,5)² / E" : "(O − E)² / E"], filas: filas, total: ["Total", N, N, chi], dec: [0, 0, 2, 4] });
        if (v.yates && !yates) res.avisos.push("La corrección de Yates solo se aplica a tablas 2 × 2; no se usó.");
        res.pasos = ["Hipótesis. H₀: las variables son independientes. H₁: las variables están relacionadas.",
          "Frecuencias esperadas: E = (total de la fila × total de la columna) / total general. Ejemplo: celda 1 · 1 → " + fmtN(rs[0]) + " × " + fmtN(cs[0]) + " / " + fmtN(N) + " = " + fmt(rs[0] * cs[0] / N, 2) + ".",
          "Estadístico: χ² = Σ " + (yates ? "(|O − E| − 0,5)² / E (con corrección de Yates)" : "(O − E)² / E") + " = " + fmt(chi, 4) + ".",
          "Grados de libertad: gl = (filas − 1)(columnas − 1) = (" + r + " − 1)(" + c + " − 1) = " + gl + "."];
        res.r22 = r === 2 && c === 2;
      } else if (v.modo === "ajuste") {
        var tb = v.tipoE === "uniforme" ? v.ajU : v.ajE, k = tb.filas.length, Ob = tb.datos.map(function (f) { return f[0]; }), n = M.suma(Ob), E = [], raw = [];
        if (n === 0) throw new Error("Ingrese las frecuencias observadas.");
        if (v.tipoE === "uniforme") for (var u = 0; u < k; u++) E.push(n / k);
        else {
          raw = tb.datos.map(function (f, q) { if (!(f[1] > 0)) throw new Error("Revise el valor esperado de «" + tb.filas[q] + "»: debe ser mayor que 0."); return f[1]; });
          var s = M.suma(raw);
          if (v.tipoE === "prop") E = raw.map(function (x) { return n * x / s; });
          else { E = raw.slice(); if (Math.abs(s - n) > 1e-6 * Math.max(1, n)) throw new Error("Las frecuencias esperadas suman " + fmtN(s, 2) + " y las observadas " + fmtN(n) + ". Deben sumar lo mismo (o use la opción de proporciones)."); }
        }
        gl = k - 1 - v.m; if (gl < 1) throw new Error("Con " + k + " categorías y m = " + v.m + ", los grados de libertad serían " + gl + ". Se necesita gl ≥ 1.");
        chi = 0; var fil = [];
        for (var z = 0; z < k; z++) { var cz = Math.pow(Ob[z] - E[z], 2) / E[z]; chi += cz; if (E[z] < 5) low++; min = Math.min(min, E[z]); cells++; fil.push(v.tipoE === "prop" ? [tb.filas[z], Ob[z], raw[z] / M.suma(raw), E[z], cz] : [tb.filas[z], Ob[z], E[z], cz]); }
        res.tablas.push(v.tipoE === "prop" ? { cab: ["Categoría", "Observado (O)", "Proporción", "Esperado (E)", "(O − E)² / E"], filas: fil, total: ["Total", n, 1, n, chi], dec: [0, 0, 4, 2, 4] }
          : { cab: ["Categoría", "Observado (O)", "Esperado (E)", "(O − E)² / E"], filas: fil, total: ["Total", n, n, chi], dec: [0, 0, 2, 4] });
        res.pasos = ["Hipótesis. H₀: los datos siguen la distribución esperada. H₁: no la siguen.",
          v.tipoE === "uniforme" ? "Frecuencias esperadas: con distribución uniforme, E = n / k = " + fmtN(n) + " / " + k + " = " + fmt(n / k, 2) + " en cada categoría." : (v.tipoE === "prop" ? "Frecuencias esperadas: E = n × proporción esperada (n = " + fmtN(n) + ")." : "Frecuencias esperadas: las ingresadas (suman " + fmtN(n) + ")."),
          "Estadístico: χ² = Σ (O − E)² / E = " + fmt(chi, 4) + ".",
          "Grados de libertad: gl = k − 1 − m = " + k + " − 1 − " + v.m + " = " + gl + "."];
      } else { chi = v.chi; gl = v.gl; res.pasos = ["Datos: χ² = " + fmt(chi, 4) + " con gl = " + gl + "."]; }
      if (low > 0) {
        var pc = 100 * low / cells;
        res.avisos.push("Atención: " + low + " de " + cells + " celdas (" + fmt(pc, 0) + " %) tienen frecuencia esperada menor que 5 (la menor es " + fmt(min, 2) + "). " + (pc > 20 || min < 1 ? "No se cumple el requisito habitual (máximo 20 % de celdas con E < 5 y ninguna con E < 1): el valor p puede no ser confiable. Considere agrupar categorías" + (res.r22 ? " o usar la prueba exacta de Fisher." : ".") : "El requisito habitual se cumple (máximo 20 % de celdas con E < 5 y ninguna con E < 1), pero conviene mencionarlo."));
      }
      var pr = prueba({ dist: "chi", est: chi, gl: gl, cola: "der", alpha: v.alpha, etEstad: "χ²", xlab: "χ²  (gl = " + gl + ")" });
      var concl = "Como el valor p (" + fmtP(pr.p) + ") es " + (pr.rechaza ? "menor o igual" : "mayor") + " que α = " + fa(pr.alpha) + " (o, de forma equivalente, χ² = " + fmt(chi, 2) + (pr.rechaza ? " ≥ " : " < ") + fmt(pr.crit[0], 2) + "), ";
      if (kind === "tabla") concl += pr.rechaza ? "se rechaza H₀: hay evidencia de que las dos variables están relacionadas (no son independientes)." : "no se rechaza H₀: no hay evidencia suficiente de relación entre las dos variables.";
      else if (kind === "ajuste") concl += pr.rechaza ? "se rechaza H₀: los datos no se ajustan a la distribución esperada." : "no se rechaza H₀: los datos son compatibles con la distribución esperada.";
      else concl += pr.rechaza ? "se rechaza H₀." : "no se rechaza H₀.";
      res.pasos.push("Valor p (cola derecha): p = P(χ²(" + gl + ") ≥ " + fmt(chi, 4) + ") = " + fmtP(pr.p) + ".",
        "Valor crítico: χ²(" + fa(pr.alpha) + "; " + gl + ") = " + fmt(pr.crit[0], 4) + ". Región de rechazo: χ² ≥ " + fmt(pr.crit[0], 4) + ".",
        "Decisión: " + (pr.rechaza ? "se rechaza H₀" : "no se rechaza H₀") + " (p " + (pr.rechaza ? "≤" : ">") + " α).");
      res.principal = { etiqueta: "Valor p", valor: fmtP(pr.p) }; res.pill = pillDe(pr);
      res.stats = [["χ² calculado", fmt(chi, 4)], ["Grados de libertad", String(gl)], ["χ² crítico (" + fa(pr.alpha) + ")", fmt(pr.crit[0], 4)], ["α", fa(pr.alpha)]];
      res.conclusion = concl; res.grafico = pr.grafico;
      return res;
    },
    pie: "El valor p es P(χ² ≥ valor calculado) bajo H₀, obtenido con la función gamma incompleta regularizada: p = Q(gl/2, χ²/2). El valor crítico es el χ² que deja un área α a la derecha."
  });

  /* ------------------------------------------------------------ 3. Distribuciones de probabilidad */
  var TIPO_DISC = { id: "tipoD", tipo: "sel", etiqueta: "Probabilidad buscada", valor: "igual", opciones: [["igual", "P(X = k)"], ["menor", "P(X ≤ k)"], ["mayor", "P(X ≥ k)"], ["entre", "P(k₁ ≤ X ≤ k₂)"]], ancho: true };
  function discreta(v, pmf, nombre, kmax, media, varz) {
    var a, b;
    if (v.tipoD === "entre") { a = v.k1; b = v.k2; if (b < a) throw new Error("k₂ debe ser mayor o igual que k₁."); }
    else { a = v.k; b = v.k; }
    var lo = v.tipoD === "menor" ? 0 : a, hi = v.tipoD === "mayor" ? Infinity : b, p = 0, fil = [], acum = 0, cats = [], vals = [], marc = [];
    var tope = Math.min(kmax, 2000);
    for (var x = 0; x <= tope; x++) {
      var px = pmf(x); acum += px; if (x >= lo && x <= hi) p += px;
      if (px > 5e-7 || x === a || x === b) { fil.push([String(x), px, Math.min(acum, 1)]); cats.push(String(x)); vals.push(x >= lo && x <= hi ? 0 : px); marc.push(x >= lo && x <= hi ? px : 0); }
    }
    if (v.tipoD === "mayor") { p = 0; for (var y = 0; y < a; y++) p += pmf(y); p = 1 - p; }
    var et = { igual: "P(X = " + a + ")", menor: "P(X ≤ " + a + ")", mayor: "P(X ≥ " + a + ")", entre: "P(" + a + " ≤ X ≤ " + b + ")" }[v.tipoD];
    var mostrar = fil;
    return {
      principal: { etiqueta: et, valor: fmt(Math.max(0, Math.min(1, p)), 6) },
      stats: [["En porcentaje", fmt(p * 100, 4) + " %"], ["Media", fmtN(media, 4)], ["Varianza", fmtN(varz, 4)], ["Desv. estándar", fmtN(Math.sqrt(varz), 4)]],
      conclusion: "La probabilidad de que " + nombre + " cumpla " + et.replace(/^P\(|\)$/g, "") + " es " + fmt(p, 4) + " (" + fmt(p * 100, 2) + " %).",
      grafico: { tipo: "barras", cats: cats, series: [{ nombre: "Otros valores", valores: vals, color: "gris" }, { nombre: "Valores incluidos", valores: marc, color: "cola" }], apilado: true, xlab: "k", ylab: "P(X = k)" },
      tablas: [{ titulo: "Distribución", cab: ["k", "P(X = k)", "P(X ≤ k)"], filas: mostrar, dec: [0, 6, 6] }]
    };
  }
  CALC.registrar({
    id: "probabilidades", area: A, titulo: "Distribuciones de probabilidad", resumen: "Normal, binomial y Poisson: probabilidades y valores inversos.",
    palabras: "normal binomial poisson probabilidad acumulada inversa percentil campana gauss tipificar",
    descripcion: "Calcule probabilidades con la distribución normal, binomial o de Poisson, o el valor que corresponde a una probabilidad acumulada.",
    modos: [
      { id: "normal", nombre: "Normal", campos: [
        { id: "mu", etiqueta: "Media (μ)", valor: "70" }, { id: "sigma", etiqueta: "Desviación estándar (σ)", valor: "10", mayor: 0 },
        { id: "tipoN", tipo: "sel", etiqueta: "Probabilidad buscada", valor: "entre", ancho: true, opciones: [["menor", "P(X ≤ a)"], ["mayor", "P(X ≥ a)"], ["entre", "P(a ≤ X ≤ b)"], ["fuera", "P(X ≤ a o X ≥ b)"], ["inversa", "Valor x tal que P(X ≤ x) = p (inversa)"]] },
        { id: "a", etiqueta: "a", valor: "60", si: function (s) { return s.tipoN !== "inversa"; } },
        { id: "b", etiqueta: "b", valor: "85", si: function (s) { return s.tipoN === "entre" || s.tipoN === "fuera"; } },
        { id: "pinv", etiqueta: "Probabilidad acumulada p", valor: "0,95", mayor: 0, menor: 1, si: function (s) { return s.tipoN === "inversa"; } }] },
      { id: "binomial", nombre: "Binomial", campos: [
        { id: "n", etiqueta: "Ensayos (n)", valor: "10", entero: true, min: 1, max: 1000 }, { id: "p", etiqueta: "Probabilidad de éxito (p)", valor: "0,3", min: 0, max: 1 }, TIPO_DISC,
        { id: "k", etiqueta: "k", valor: "3", entero: true, min: 0, si: function (s) { return s.tipoD !== "entre"; } },
        { id: "k1", etiqueta: "k₁", valor: "2", entero: true, min: 0, si: function (s) { return s.tipoD === "entre"; } }, { id: "k2", etiqueta: "k₂", valor: "4", entero: true, min: 0, si: function (s) { return s.tipoD === "entre"; } }] },
      { id: "poisson", nombre: "Poisson", campos: [
        { id: "lambda", etiqueta: "Promedio por intervalo (λ)", valor: "4", mayor: 0 }, TIPO_DISC,
        { id: "k", etiqueta: "k", valor: "3", entero: true, min: 0, si: function (s) { return s.tipoD !== "entre"; } },
        { id: "k1", etiqueta: "k₁", valor: "2", entero: true, min: 0, si: function (s) { return s.tipoD === "entre"; } }, { id: "k2", etiqueta: "k₂", valor: "4", entero: true, min: 0, si: function (s) { return s.tipoD === "entre"; } }] }
    ],
    calcular: function (v) {
      if (v.modo === "binomial") {
        var n = v.n, p = v.p;
        if (v.tipoD !== "entre" && v.k > n) throw new Error("k no puede ser mayor que n.");
        var pmf = function (x) { if (x > n) return 0; if (p === 0) return x === 0 ? 1 : 0; if (p === 1) return x === n ? 1 : 0; return Math.exp(M.lnComb(n, x) + x * Math.log(p) + (n - x) * Math.log(1 - p)); };
        var r = discreta(v, pmf, "X (número de éxitos)", n, n * p, n * p * (1 - p));
        r.pasos = ["Fórmula: P(X = k) = C(n, k) · pᵏ · (1 − p)ⁿ⁻ᵏ, con n = " + n + " y p = " + fmtN(p) + ".",
          v.tipoD === "igual" ? "P(X = " + v.k + ") = C(" + n + ", " + v.k + ") · " + fmtN(p) + "^" + v.k + " · " + fmtN(1 - p) + "^" + (n - v.k) + " = " + fmt(pmf(v.k), 6) + "." : "Se suman las probabilidades de los valores incluidos (ver la tabla).",
          "Media = n·p = " + fmtN(n * p, 4) + "; varianza = n·p·(1 − p) = " + fmtN(n * p * (1 - p), 4) + "."];
        return r;
      }
      if (v.modo === "poisson") {
        var l = v.lambda, pm = function (x) { return Math.exp(-l + x * Math.log(l) - M.lnGamma(x + 1)); };
        var kmax = Math.ceil(l + 6 * Math.sqrt(l) + 10); kmax = Math.max(kmax, v.tipoD === "entre" ? v.k2 : v.k);
        var rp = discreta(v, pm, "X (número de ocurrencias)", kmax, l, l);
        rp.pasos = ["Fórmula: P(X = k) = e^(−λ) · λᵏ / k!, con λ = " + fmtN(l) + ".",
          v.tipoD === "igual" ? "P(X = " + v.k + ") = e^(−" + fmtN(l) + ") · " + fmtN(l) + "^" + v.k + " / " + v.k + "! = " + fmt(pm(v.k), 6) + "." : "Se suman las probabilidades de los valores incluidos (ver la tabla).",
          "En la distribución de Poisson, la media y la varianza son iguales a λ = " + fmtN(l) + "."];
        return rp;
      }
      var mu = v.mu, s = v.sigma, f = function (x) { return M.normPdf((x - mu) / s) / s; }, xmin = mu - 4 * s, xmax = mu + 4 * s, z = function (x) { return (x - mu) / s; };
      var g = { tipo: "xy", xmin: xmin, xmax: xmax, ymin: 0, ymax: f(mu) * 1.12, xlab: "X", ylab: "Densidad", series: [{ f: f, rellenos: [], n: 400 }], vlineas: [], rellenoNombre: "Área buscada", rellenoColor: "cola" };
      if (v.tipoN === "inversa") {
        var x = mu + s * M.normInv(v.pinv);
        g.series[0].rellenos.push({ hasta: x }); g.vlineas.push({ x: x, color: "cola", solida: true, texto: "x = " + fmt(x, 4) });
        return { principal: { etiqueta: "Valor x", valor: fmt(x, 4) }, stats: [["Z correspondiente", fmt(M.normInv(v.pinv), 4)], ["P(X ≤ x)", fmtN(v.pinv, 6)], ["Área a la derecha", fmtN(1 - v.pinv, 6)]],
          conclusion: "El " + fmtN(v.pinv * 100, 3) + " % de los valores es menor o igual que " + fmt(x, 4) + ".", grafico: g,
          pasos: ["Se busca z tal que P(Z ≤ z) = " + fmtN(v.pinv, 6) + ": z = " + fmt(M.normInv(v.pinv), 4) + ".", "Se destipifica: x = μ + z·σ = " + fmtN(mu) + " + " + fmt(M.normInv(v.pinv), 4) + " × " + fmtN(s) + " = " + fmt(x, 4) + "."] };
      }
      var a = v.a, b = v.b, p2, et, pasos = [];
      if ((v.tipoN === "entre" || v.tipoN === "fuera") && b < a) throw new Error("b debe ser mayor que a.");
      if (v.tipoN === "menor") { p2 = M.normCDF(z(a)); et = "P(X ≤ " + fmtN(a) + ")"; g.series[0].rellenos.push({ hasta: a }); }
      else if (v.tipoN === "mayor") { p2 = M.normSF(z(a)); et = "P(X ≥ " + fmtN(a) + ")"; g.series[0].rellenos.push({ desde: a }); }
      else if (v.tipoN === "entre") { p2 = M.normCDF(z(b)) - M.normCDF(z(a)); et = "P(" + fmtN(a) + " ≤ X ≤ " + fmtN(b) + ")"; g.series[0].rellenos.push({ desde: a, hasta: b }); }
      else { p2 = M.normCDF(z(a)) + M.normSF(z(b)); et = "P(X ≤ " + fmtN(a) + " o X ≥ " + fmtN(b) + ")"; g.series[0].rellenos.push({ hasta: a }, { desde: b }); }
      g.vlineas.push({ x: a, color: "cola", solida: true, texto: "a = " + fmtN(a) });
      if (v.tipoN === "entre" || v.tipoN === "fuera") g.vlineas.push({ x: b, color: "cola", solida: true, texto: "b = " + fmtN(b) });
      pasos.push("Se tipifica: z = (x − μ) / σ. Para a: z = (" + fmtN(a) + " − " + fmtN(mu) + ") / " + fmtN(s) + " = " + fmt(z(a), 4) + "." + (v.tipoN === "entre" || v.tipoN === "fuera" ? " Para b: z = (" + fmtN(b) + " − " + fmtN(mu) + ") / " + fmtN(s) + " = " + fmt(z(b), 4) + "." : ""));
      pasos.push({ menor: "P(X ≤ a) = Φ(" + fmt(z(a), 4) + ") = " + fmt(p2, 6) + ".", mayor: "P(X ≥ a) = 1 − Φ(" + fmt(z(a), 4) + ") = " + fmt(p2, 6) + ".", entre: "P(a ≤ X ≤ b) = Φ(" + fmt(z(b), 4) + ") − Φ(" + fmt(z(a), 4) + ") = " + fmt(M.normCDF(z(b)), 6) + " − " + fmt(M.normCDF(z(a)), 6) + " = " + fmt(p2, 6) + ".", fuera: "P = Φ(" + fmt(z(a), 4) + ") + [1 − Φ(" + fmt(z(b), 4) + ")] = " + fmt(p2, 6) + "." }[v.tipoN]);
      return { principal: { etiqueta: et, valor: fmt(p2, 6) }, stats: [["En porcentaje", fmt(p2 * 100, 4) + " %"], ["z de a", fmt(z(a), 4)]].concat(v.tipoN === "entre" || v.tipoN === "fuera" ? [["z de b", fmt(z(b), 4)]] : []),
        conclusion: "La probabilidad " + et + " es " + fmt(p2, 4) + ", es decir, " + fmt(p2 * 100, 2) + " %.", grafico: g, pasos: pasos };
    },
    pie: "Equivalencias en Excel: DISTR.NORM.N, INV.NORM, DISTR.BINOM.N y POISSON.DIST."
  });

  /* ------------------------------------------------------------ 4. Intervalos de confianza */
  CALC.registrar({
    id: "intervalo-confianza", area: A, titulo: "Intervalos de confianza", resumen: "Para la media (Z o t), la proporción y la varianza.",
    palabras: "estimacion intervalo confianza margen error media proporcion varianza desviacion t student z",
    descripcion: "Estime un parámetro con un intervalo de confianza a partir de los datos de la muestra. Muestra el margen de error y el procedimiento.",
    modos: [
      { id: "mediaZ", nombre: "Media (σ conocida)", campos: [{ id: "x", etiqueta: "Media muestral (x̄)", valor: "52,3" }, { id: "sig", etiqueta: "Desviación poblacional (σ)", valor: "6", mayor: 0 }, { id: "n", etiqueta: "Tamaño de muestra (n)", valor: "36", entero: true, min: 2 }] },
      { id: "mediaT", nombre: "Media (σ desconocida)", campos: [{ id: "x", etiqueta: "Media muestral (x̄)", valor: "52,3" }, { id: "s", etiqueta: "Desviación muestral (s)", valor: "6", mayor: 0 }, { id: "n", etiqueta: "Tamaño de muestra (n)", valor: "15", entero: true, min: 2 }] },
      { id: "datos", nombre: "Media desde datos", campos: [{ id: "datos", tipo: "lista", etiqueta: "Datos de la muestra", valor: "12,5 14,1 13,8 15,2 12,9 14,6 13,3 14,9 15,5 13,7", minimo: 2 }] },
      { id: "prop", nombre: "Proporción", campos: [{ id: "xe", etiqueta: "Éxitos en la muestra (x)", valor: "84", entero: true, min: 0 }, { id: "n", etiqueta: "Tamaño de muestra (n)", valor: "200", entero: true, min: 2 }] },
      { id: "var", nombre: "Varianza y desviación", campos: [{ id: "s", etiqueta: "Desviación muestral (s)", valor: "6", mayor: 0 }, { id: "n", etiqueta: "Tamaño de muestra (n)", valor: "15", entero: true, min: 2 }] }
    ],
    campos: [CONF],
    calcular: function (v) {
      var c = +v.conf, a = 1 - c, lo, hi, est, me, crit, pasos = [], et, nom, g, stats;
      if (v.modo === "var") {
        var gl = v.n - 1, s2 = v.s * v.s, cA = M.chiCrit(a / 2, gl), cB = M.chiCrit(1 - a / 2, gl);
        lo = gl * s2 / cA; hi = gl * s2 / cB;
        pasos = ["Estadístico: (n − 1)s² / σ² sigue una χ² con gl = n − 1 = " + gl + ".", "Valores críticos: χ²(α/2) = " + fmt(cA, 4) + " y χ²(1 − α/2) = " + fmt(cB, 4) + ".",
          "IC para σ²: [(n − 1)s² / " + fmt(cA, 4) + " ; (n − 1)s² / " + fmt(cB, 4) + "] = [" + fmt(lo, 4) + " ; " + fmt(hi, 4) + "].", "IC para σ: raíz cuadrada de los extremos = [" + fmt(Math.sqrt(lo), 4) + " ; " + fmt(Math.sqrt(hi), 4) + "]."];
        var pdf = function (x) { return M.chiPdf(x, gl); }, xm = Math.max(cA * 1.3, 8);
        g = { tipo: "xy", xmin: 0, xmax: xm, ymin: 0, xlab: "χ² (gl = " + gl + ")", ylab: "Densidad", series: [{ f: pdf, rellenos: [{ desde: cB, hasta: cA, color: "acento" }], n: 400 }], vlineas: [{ x: cB, texto: fmt(cB, 3) }, { x: cA, texto: fmt(cA, 3), nombre: "Valores críticos" }], rellenoNombre: "Nivel de confianza", rellenoColor: "acento" };
        return { principal: { etiqueta: "Intervalo para σ²", valor: "[" + fmt(lo, 3) + " ; " + fmt(hi, 3) + "]" }, stats: [["IC para σ", "[" + fmt(Math.sqrt(lo), 3) + " ; " + fmt(Math.sqrt(hi), 3) + "]"], ["s²", fmt(s2, 4)], ["gl", String(gl)], ["Confianza", fmtN(c * 100) + " %"]],
          conclusion: "Con " + fmtN(c * 100) + " % de confianza, la varianza poblacional está entre " + fmt(lo, 3) + " y " + fmt(hi, 3) + " (la desviación, entre " + fmt(Math.sqrt(lo), 3) + " y " + fmt(Math.sqrt(hi), 3) + ").", grafico: g, pasos: pasos };
      }
      var usaT = v.modo === "mediaT" || v.modo === "datos", n = v.n, se, sd;
      if (v.modo === "datos") { n = v.datos.length; est = M.media(v.datos); sd = Math.sqrt(M.varianza(v.datos)); pasos.push("De los datos: n = " + n + ", x̄ = " + fmt(est, 4) + ", s = " + fmt(sd, 4) + "."); }
      if (v.modo === "prop") { if (v.xe > n) throw new Error("Los éxitos no pueden superar a n."); est = v.xe / n; se = Math.sqrt(est * (1 - est) / n); nom = "p̂"; et = "proporción"; }
      else { if (v.modo !== "datos") { est = v.x; sd = v.modo === "mediaZ" ? v.sig : v.s; } se = sd / Math.sqrt(n); nom = "x̄"; et = "media"; }
      crit = usaT ? M.tCrit(a / 2, n - 1) : M.zCrit(a / 2);
      me = crit * se; lo = est - me; hi = est + me;
      var simb = usaT ? "t" : "z";
      pasos.push((usaT ? "Se usa t de Student con gl = n − 1 = " + (n - 1) : "Se usa la normal estándar (Z)") + ". Valor crítico: " + simb + "(α/2) = " + fmt(crit, 4) + " (α = " + fmtN(a, 4) + ").");
      pasos.push(v.modo === "prop" ? "Error estándar: √(p̂(1 − p̂)/n) = √(" + fmt(est, 4) + " × " + fmt(1 - est, 4) + " / " + n + ") = " + fmt(se, 5) + "." : "Error estándar: " + (v.modo === "mediaZ" ? "σ" : "s") + " / √n = " + fmtN(sd, 4) + " / √" + n + " = " + fmt(se, 5) + ".");
      pasos.push("Margen de error: E = " + fmt(crit, 4) + " × " + fmt(se, 5) + " = " + fmt(me, 5) + ".");
      pasos.push("Intervalo: " + nom + " ± E = " + fmt(est, 4) + " ± " + fmt(me, 4) + " → [" + fmt(lo, 4) + " ; " + fmt(hi, 4) + "].");
      var avisos = [];
      if (v.modo === "prop" && (v.xe < 5 || n - v.xe < 5)) avisos.push("Hay menos de 5 éxitos o fracasos: la aproximación normal puede no ser adecuada.");
      if (v.modo === "mediaZ" && false) avisos.push("");
      var dpdf = usaT ? function (x) { return M.tPdf(x, n - 1); } : M.normPdf, lim = Math.max(4, crit * 1.3);
      g = { tipo: "xy", xmin: -lim, xmax: lim, ymin: 0, xlab: simb, ylab: "Densidad", series: [{ f: dpdf, rellenos: [{ desde: -crit, hasta: crit, color: "acento" }], n: 300 }], vlineas: [{ x: -crit, texto: "−" + fmt(crit, 3) }, { x: crit, texto: fmt(crit, 3), nombre: "Valores críticos" }], rellenoNombre: "Nivel de confianza (" + fmtN(c * 100) + " %)", rellenoColor: "acento" };
      stats = [["Estimación puntual (" + nom + ")", fmt(est, 4)], ["Margen de error", fmt(me, 4)], ["Valor crítico " + simb, fmt(crit, 4)], ["Error estándar", fmt(se, 5)]];
      return { principal: { etiqueta: "Intervalo de confianza", valor: "[" + fmt(lo, 4) + " ; " + fmt(hi, 4) + "]" }, stats: stats, avisos: avisos,
        conclusion: "Con " + fmtN(c * 100) + " % de confianza, la " + et + " poblacional está entre " + fmt(lo, 4) + " y " + fmt(hi, 4) + (v.modo === "prop" ? " (" + fmt(lo * 100, 2) + " % y " + fmt(hi * 100, 2) + " %)." : "."), grafico: g, pasos: pasos };
    },
    pie: "Equivalencias en Excel: INTERVALO.CONFIANZA.NORM, INTERVALO.CONFIANZA.T, INV.T y INV.CHICUAD."
  });

  /* ------------------------------------------------------------ 5. Prueba de hipótesis (una muestra) */
  CALC.registrar({
    id: "prueba-una-muestra", area: A, titulo: "Prueba de hipótesis (una muestra)", resumen: "Pruebas Z y t para la media y prueba para la proporción.",
    palabras: "contraste hipotesis prueba z t student media proporcion una muestra valor p",
    descripcion: "Contraste una afirmación sobre la media o la proporción de una población. Muestra hipótesis, estadístico, valor p, región de rechazo y conclusión.",
    modos: [
      { id: "z", nombre: "Media (Z, σ conocida)", campos: [{ id: "mu0", etiqueta: "Valor de H₀ (μ₀)", valor: "50" }, { id: "x", etiqueta: "Media muestral (x̄)", valor: "52,3" }, { id: "sig", etiqueta: "Desviación poblacional (σ)", valor: "6", mayor: 0 }, { id: "n", etiqueta: "Tamaño de muestra (n)", valor: "36", entero: true, min: 2 }, cola("colaM", "H₁: μ")] },
      { id: "t", nombre: "Media (t, σ desconocida)", campos: [{ id: "mu0", etiqueta: "Valor de H₀ (μ₀)", valor: "50" }, { id: "x", etiqueta: "Media muestral (x̄)", valor: "52,3" }, { id: "s", etiqueta: "Desviación muestral (s)", valor: "6", mayor: 0 }, { id: "n", etiqueta: "Tamaño de muestra (n)", valor: "15", entero: true, min: 2 }, cola("colaM", "H₁: μ")] },
      { id: "datos", nombre: "Media desde datos (t)", campos: [{ id: "mu0", etiqueta: "Valor de H₀ (μ₀)", valor: "14" }, { id: "datos", tipo: "lista", etiqueta: "Datos de la muestra", valor: "12,5 14,1 13,8 15,2 12,9 14,6 13,3 14,9 15,5 13,7", minimo: 2 }, cola("colaM", "H₁: μ")] },
      { id: "prop", nombre: "Proporción", campos: [{ id: "p0", etiqueta: "Valor de H₀ (p₀)", valor: "0,5", mayor: 0, menor: 1 }, { id: "xe", etiqueta: "Éxitos en la muestra (x)", valor: "84", entero: true, min: 0 }, { id: "n", etiqueta: "Tamaño de muestra (n)", valor: "200", entero: true, min: 2 }, cola("colaP", "H₁: p")] }
    ],
    campos: [ALFA],
    calcular: function (v) {
      var est, gl, pasos = [], prm = "μ", h0v, se, dist = "z", cl = v.modo === "prop" ? v.colaP : v.colaM, avisos = [];
      if (v.modo === "prop") {
        if (v.xe > v.n) throw new Error("Los éxitos no pueden superar a n.");
        prm = "p"; h0v = v.p0; var ph = v.xe / v.n; se = Math.sqrt(v.p0 * (1 - v.p0) / v.n); est = (ph - v.p0) / se;
        pasos.push("p̂ = x / n = " + v.xe + " / " + v.n + " = " + fmt(ph, 4) + ".", "Error estándar bajo H₀: √(p₀(1 − p₀)/n) = " + fmt(se, 5) + ".", "Estadístico: Z = (p̂ − p₀) / EE = (" + fmt(ph, 4) + " − " + fmtN(v.p0) + ") / " + fmt(se, 5) + " = " + fmt(est, 4) + ".");
        if (v.n * v.p0 < 5 || v.n * (1 - v.p0) < 5) avisos.push("n·p₀ o n·(1 − p₀) es menor que 5: la aproximación normal puede no ser adecuada.");
      } else {
        h0v = v.mu0; var x = v.x, sd = v.modo === "z" ? v.sig : v.s, n = v.n;
        if (v.modo === "datos") { n = v.datos.length; x = M.media(v.datos); sd = Math.sqrt(M.varianza(v.datos)); pasos.push("De los datos: n = " + n + ", x̄ = " + fmt(x, 4) + ", s = " + fmt(sd, 4) + "."); }
        se = sd / Math.sqrt(n); est = (x - v.mu0) / se;
        if (v.modo !== "z") { dist = "t"; gl = n - 1; }
        pasos.push("Error estándar: " + (v.modo === "z" ? "σ" : "s") + " / √n = " + fmtN(sd, 4) + " / √" + n + " = " + fmt(se, 5) + ".",
          "Estadístico: " + (dist === "t" ? "t" : "Z") + " = (x̄ − μ₀) / EE = (" + fmt(x, 4) + " − " + fmtN(v.mu0) + ") / " + fmt(se, 5) + " = " + fmt(est, 4) + (dist === "t" ? ", con gl = n − 1 = " + gl : "") + ".");
      }
      pasos.unshift("Hipótesis. H₀: " + prm + " " + contra[cl] + " " + fmtN(h0v) + ". H₁: " + prm + " " + signo[cl] + " " + fmtN(h0v) + ".");
      var et = dist === "t" ? "t" : "Z", r = prueba({ dist: dist, est: est, gl: gl, cola: cl, alpha: v.alpha, etEstad: et, xlab: dist === "t" ? "t (gl = " + gl + ")" : "Z" });
      return {
        principal: { etiqueta: "Valor p", valor: fmtP(r.p) }, pill: pillDe(r), avisos: avisos,
        stats: [[et + " calculado", fmt(est, 4)], ["Valor crítico", r.crit.map(function (c) { return fmt(c, 4); }).join(" ; ")], ["α", fa(r.alpha)]].concat(gl ? [["gl", String(gl)]] : []),
        conclusion: conclusionDe(r, "hay evidencia para afirmar que " + prm + " " + signo[cl] + " " + fmtN(h0v) + ".", "no hay evidencia suficiente para afirmar que " + prm + " " + signo[cl] + " " + fmtN(h0v) + "."),
        grafico: r.grafico, pasos: pasos.concat(pasosFinal(r, et))
      };
    },
    pie: "Equivalencias en Excel: PRUEBA.Z, DISTR.T.2C / DISTR.T.CD y DISTR.NORM.ESTAND.N."
  });

  /* ------------------------------------------------------------ 6. Dos muestras */
  CALC.registrar({
    id: "prueba-dos-muestras", area: A, titulo: "Prueba de hipótesis (dos muestras)", resumen: "Diferencia de medias, de proporciones, muestras pareadas y varianzas (F).",
    palabras: "dos poblaciones diferencia medias welch varianzas iguales pareadas antes despues proporciones prueba f",
    descripcion: "Compare dos grupos: medias independientes (t con varianzas iguales o de Welch), muestras pareadas (antes y después), dos proporciones o dos varianzas.",
    modos: [
      { id: "medias", nombre: "Medias independientes", campos: [
        { id: "x1", etiqueta: "x̄₁", valor: "78,4" }, { id: "s1", etiqueta: "s₁", valor: "8,2", mayor: 0 }, { id: "n1", etiqueta: "n₁", valor: "25", entero: true, min: 2 },
        { id: "x2", etiqueta: "x̄₂", valor: "73,1" }, { id: "s2", etiqueta: "s₂", valor: "9,5", mayor: 0 }, { id: "n2", etiqueta: "n₂", valor: "30", entero: true, min: 2 },
        { id: "vars", tipo: "sel", etiqueta: "Varianzas", valor: "welch", opciones: [["welch", "Distintas (Welch)"], ["iguales", "Iguales (combinada)"]] }, cola("colaM", "H₁: μ₁ − μ₂")] },
      { id: "pareadas", nombre: "Muestras pareadas", campos: [
        { id: "antes", tipo: "lista", etiqueta: "Antes (o grupo 1)", valor: "72 65 80 58 77 69 74 61", minimo: 2, filas: 3 }, { id: "despues", tipo: "lista", etiqueta: "Después (o grupo 2)", valor: "75 70 81 64 79 70 80 63", minimo: 2, filas: 3 }, cola("colaM", "H₁: μ₁ − μ₂")] },
      { id: "props", nombre: "Dos proporciones", campos: [
        { id: "e1", etiqueta: "Éxitos grupo 1 (x₁)", valor: "45", entero: true, min: 0 }, { id: "m1", etiqueta: "n₁", valor: "120", entero: true, min: 1 },
        { id: "e2", etiqueta: "Éxitos grupo 2 (x₂)", valor: "30", entero: true, min: 0 }, { id: "m2", etiqueta: "n₂", valor: "110", entero: true, min: 1 }, cola("colaP", "H₁: p₁ − p₂")] },
      { id: "varianzas", nombre: "Dos varianzas (F)", campos: [
        { id: "s1", etiqueta: "s₁", valor: "8,2", mayor: 0 }, { id: "n1", etiqueta: "n₁", valor: "25", entero: true, min: 2 }, { id: "s2", etiqueta: "s₂", valor: "9,5", mayor: 0 }, { id: "n2", etiqueta: "n₂", valor: "30", entero: true, min: 2 }, cola("colaV", "H₁: σ₁² / σ₂²")] }
    ],
    campos: [ALFA],
    calcular: function (v) {
      var est, gl, gl2, dist, pasos = [], cl, h, et;
      if (v.modo === "medias") {
        cl = v.colaM; var d = v.x1 - v.x2, a1 = v.s1 * v.s1 / v.n1, a2 = v.s2 * v.s2 / v.n2, se; dist = "t";
        if (v.vars === "iguales") {
          var sp2 = ((v.n1 - 1) * v.s1 * v.s1 + (v.n2 - 1) * v.s2 * v.s2) / (v.n1 + v.n2 - 2); se = Math.sqrt(sp2 * (1 / v.n1 + 1 / v.n2)); gl = v.n1 + v.n2 - 2;
          pasos.push("Varianza combinada: s²p = [(n₁ − 1)s₁² + (n₂ − 1)s₂²] / (n₁ + n₂ − 2) = " + fmt(sp2, 4) + ".", "Error estándar: √(s²p(1/n₁ + 1/n₂)) = " + fmt(se, 5) + "; gl = n₁ + n₂ − 2 = " + gl + ".");
        } else {
          se = Math.sqrt(a1 + a2); gl = Math.pow(a1 + a2, 2) / (a1 * a1 / (v.n1 - 1) + a2 * a2 / (v.n2 - 1));
          pasos.push("Error estándar: √(s₁²/n₁ + s₂²/n₂) = " + fmt(se, 5) + ".", "Grados de libertad de Welch: gl = (s₁²/n₁ + s₂²/n₂)² / [(s₁²/n₁)²/(n₁ − 1) + (s₂²/n₂)²/(n₂ − 1)] = " + fmt(gl, 2) + ".");
        }
        est = d / se; et = "t";
        pasos.push("Estadístico: t = (x̄₁ − x̄₂) / EE = " + fmt(d, 4) + " / " + fmt(se, 5) + " = " + fmt(est, 4) + ".");
        h = "μ₁ − μ₂";
      } else if (v.modo === "pareadas") {
        cl = v.colaM; if (v.antes.length !== v.despues.length) throw new Error("Las dos listas deben tener la misma cantidad de datos (" + v.antes.length + " y " + v.despues.length + ").");
        var dif = v.antes.map(function (x, i) { return x - v.despues[i]; }), n = dif.length, dm = M.media(dif), sdd = Math.sqrt(M.varianza(dif)); dist = "t"; gl = n - 1; et = "t";
        if (sdd === 0) throw new Error("Todas las diferencias son iguales: no se puede calcular el estadístico.");
        est = dm / (sdd / Math.sqrt(n));
        pasos.push("Diferencias d = antes − después: " + dif.map(function (x) { return fmtN(x, 4); }).join("; ") + ".", "d̄ = " + fmt(dm, 4) + ", s_d = " + fmt(sdd, 4) + ", n = " + n + ".", "Estadístico: t = d̄ / (s_d / √n) = " + fmt(est, 4) + ", con gl = " + gl + ".");
        h = "μ_d";
      } else if (v.modo === "props") {
        cl = v.colaP; if (v.e1 > v.m1 || v.e2 > v.m2) throw new Error("Los éxitos no pueden superar al tamaño de cada muestra.");
        var p1 = v.e1 / v.m1, p2 = v.e2 / v.m2, pc = (v.e1 + v.e2) / (v.m1 + v.m2), sep = Math.sqrt(pc * (1 - pc) * (1 / v.m1 + 1 / v.m2)); dist = "z"; et = "Z";
        if (sep === 0) throw new Error("Con estos datos la proporción combinada es 0 o 1: no se puede calcular.");
        est = (p1 - p2) / sep;
        pasos.push("p̂₁ = " + fmt(p1, 4) + ", p̂₂ = " + fmt(p2, 4) + "; proporción combinada p̄ = (x₁ + x₂)/(n₁ + n₂) = " + fmt(pc, 4) + ".", "Error estándar: √(p̄(1 − p̄)(1/n₁ + 1/n₂)) = " + fmt(sep, 5) + ".", "Estadístico: Z = (p̂₁ − p̂₂) / EE = " + fmt(est, 4) + ".");
        h = "p₁ − p₂";
      } else {
        cl = v.colaV; dist = "f"; gl = v.n1 - 1; gl2 = v.n2 - 1; est = v.s1 * v.s1 / (v.s2 * v.s2); et = "F";
        pasos.push("Estadístico: F = s₁² / s₂² = " + fmt(v.s1 * v.s1, 4) + " / " + fmt(v.s2 * v.s2, 4) + " = " + fmt(est, 4) + ", con gl = (" + gl + ", " + gl2 + ").");
        var hv = { bi: "≠", izq: "<", der: ">" }[cl];
        pasos.unshift("Hipótesis. H₀: σ₁² = σ₂². H₁: σ₁² " + hv + " σ₂².");
      }
      if (v.modo !== "varianzas") pasos.unshift("Hipótesis. H₀: " + h + " " + contra[cl] + " 0. H₁: " + h + " " + signo[cl] + " 0.");
      var r = prueba({ dist: dist, est: est, gl: gl, gl2: gl2, cola: cl, alpha: v.alpha, etEstad: et, xlab: dist === "f" ? "F (" + gl + ", " + gl2 + ")" : dist === "t" ? "t (gl = " + fmtN(gl, 2) + ")" : "Z" });
      var hip = v.modo === "varianzas" ? "las varianzas son distintas" : v.modo === "props" ? "las proporciones difieren" : "las medias difieren";
      return {
        principal: { etiqueta: "Valor p", valor: fmtP(r.p) }, pill: pillDe(r),
        stats: [[et + " calculado", fmt(est, 4)], ["Valor crítico", r.crit.map(function (c) { return fmt(c, 4); }).join(" ; ")], ["α", fa(r.alpha)]].concat(gl ? [["gl", gl2 ? gl + " y " + gl2 : fmtN(gl, 2)]] : []),
        conclusion: conclusionDe(r, "hay evidencia de que " + hip + (cl === "bi" ? "." : " en la dirección planteada."), "no hay evidencia suficiente de que " + hip + "."),
        grafico: r.grafico, pasos: pasos.concat(pasosFinal(r, et))
      };
    },
    pie: "Equivalencias en Excel: PRUEBA.T (tipos 1, 2 y 3) y PRUEBA.F."
  });

  /* ------------------------------------------------------------ 7. ANOVA */
  CALC.registrar({
    id: "anova", area: A, titulo: "ANOVA de un factor", resumen: "Compara las medias de tres o más grupos con la prueba F.",
    palabras: "analisis varianza anova un factor grupos medias f fisher suma cuadrados",
    descripcion: "Compare las medias de varios grupos. Escriba los datos de cada grupo (pueden tener distinto tamaño) y obtenga la tabla ANOVA completa.",
    campos: [
      { id: "g", tipo: "grupos", min: 2, max: 10, valor: [{ nombre: "Método A", datos: "78\n82\n75\n80\n85\n79" }, { nombre: "Método B", datos: "72\n70\n76\n68\n74\n71" }, { nombre: "Método C", datos: "84\n88\n81\n86\n90\n83" }] },
      ALFA
    ],
    calcular: function (v) {
      var gs = v.g, k = gs.length, todos = [], fil = [];
      gs.forEach(function (g) { todos = todos.concat(g.datos); });
      var N = todos.length, mg = M.media(todos), sce = 0, scd = 0;
      gs.forEach(function (g) { var m = M.media(g.datos), s = 0; g.datos.forEach(function (x) { s += (x - m) * (x - m); }); sce += g.datos.length * (m - mg) * (m - mg); scd += s; fil.push([g.nombre, g.datos.length, m, g.datos.length > 1 ? Math.sqrt(s / (g.datos.length - 1)) : 0]); });
      var gle = k - 1, gld = N - k; if (gld < 1) throw new Error("Hay muy pocos datos: se necesita más de un dato por grupo.");
      var cme = sce / gle, cmd = scd / gld;
      if (cmd === 0) throw new Error("No hay variación dentro de los grupos: todos los datos de cada grupo son iguales.");
      var F = cme / cmd, r = prueba({ dist: "f", est: F, gl: gle, gl2: gld, cola: "der", alpha: v.alpha, etEstad: "F", xlab: "F (" + gle + ", " + gld + ")" });
      return {
        principal: { etiqueta: "Valor p", valor: fmtP(r.p) }, pill: pillDe(r),
        stats: [["F calculado", fmt(F, 4)], ["F crítico", fmt(r.crit[0], 4)], ["gl", gle + " y " + gld], ["Media general", fmt(mg, 4)]],
        conclusion: conclusionDe(r, "al menos una media de grupo es distinta de las demás.", "no hay evidencia de diferencias entre las medias de los grupos."),
        grafico: r.grafico,
        tablas: [{ titulo: "Tabla ANOVA", cab: ["Fuente de variación", "Suma de cuadrados", "gl", "Cuadrado medio", "F", "Valor p"], filas: [["Entre grupos", sce, gle, cme, F, fmtP(r.p)], ["Dentro de los grupos", scd, gld, cmd, "", ""]], total: ["Total", sce + scd, N - 1, "", "", ""], dec: [0, 4, 0, 4, 4, 0] },
          { titulo: "Resumen por grupo", cab: ["Grupo", "n", "Media", "Desv. estándar"], filas: fil, dec: [0, 0, 4, 4] }],
        pasos: ["Hipótesis. H₀: todas las medias son iguales (μ₁ = μ₂ = … = μ" + k + "). H₁: al menos una media es distinta.",
          "Media general: x̄ = " + fmt(mg, 4) + " (N = " + N + ").",
          "Suma de cuadrados entre grupos: SCE = Σ nᵢ(x̄ᵢ − x̄)² = " + fmt(sce, 4) + "; gl = k − 1 = " + gle + ".",
          "Suma de cuadrados dentro: SCD = Σ Σ (xᵢⱼ − x̄ᵢ)² = " + fmt(scd, 4) + "; gl = N − k = " + gld + ".",
          "Cuadrados medios: CME = " + fmt(sce, 4) + " / " + gle + " = " + fmt(cme, 4) + "; CMD = " + fmt(scd, 4) + " / " + gld + " = " + fmt(cmd, 4) + ".",
          "Estadístico: F = CME / CMD = " + fmt(F, 4) + "."].concat(pasosFinal(r, "F"))
      };
    },
    pie: "Equivalente a «Análisis de varianza de un factor» del complemento Análisis de datos de Excel."
  });

  /* ------------------------------------------------------------ 8. Regresión y correlación */
  CALC.registrar({
    id: "regresion", area: A, titulo: "Regresión lineal y correlación", resumen: "Recta de mínimos cuadrados, r, R² y prueba de la pendiente.",
    palabras: "regresion lineal simple correlacion pearson minimos cuadrados pendiente intercepto prediccion r2 determinacion dispersion",
    descripcion: "Ajuste la recta ŷ = a + b·x a los datos, mida la correlación y pruebe si la relación es significativa. Opcionalmente, prediga y para un valor de x.",
    campos: [
      { id: "x", tipo: "lista", etiqueta: "Valores de X", valor: "2 3 5 7 9 10 12 15", minimo: 3, filas: 3, ayuda: '<span class="hint">X e Y deben tener la misma cantidad de datos, en el mismo orden.</span>' },
      { id: "y", tipo: "lista", etiqueta: "Valores de Y", valor: "15 18 24 30 34 38 42 52", minimo: 3, filas: 3, ayuda: " " },
      { id: "x0", etiqueta: "Predecir Y para X =", valor: "11", opcional: true, ayuda: "Opcional." },
      ALFA
    ],
    calcular: function (v) {
      var x = v.x, y = v.y, n = x.length;
      if (y.length !== n) throw new Error("X tiene " + n + " datos e Y tiene " + y.length + ". Deben tener la misma cantidad.");
      var sx = M.suma(x), sy = M.suma(y), sxx = 0, syy = 0, sxy = 0, fil = [];
      for (var i = 0; i < n; i++) { sxx += x[i] * x[i]; syy += y[i] * y[i]; sxy += x[i] * y[i]; fil.push([String(i + 1), x[i], y[i], x[i] * y[i], x[i] * x[i], y[i] * y[i]]); }
      var Sxx = sxx - sx * sx / n, Syy = syy - sy * sy / n, Sxy = sxy - sx * sy / n;
      if (Sxx === 0) throw new Error("Todos los valores de X son iguales: no se puede ajustar una recta.");
      var b = Sxy / Sxx, a = sy / n - b * sx / n, r = Syy === 0 ? 0 : Sxy / Math.sqrt(Sxx * Syy), r2 = r * r;
      var sce = Syy - b * Sxy, gl = n - 2, se = gl > 0 ? Math.sqrt(Math.max(sce, 0) / gl) : NaN, seb = se / Math.sqrt(Sxx), t = seb > 0 ? b / seb : Infinity;
      var pr = gl > 0 && isFinite(t) ? prueba({ dist: "t", est: t, gl: gl, cola: "bi", alpha: v.alpha }) : null;
      var fuerza = Math.abs(r) >= 0.9 ? "muy fuerte" : Math.abs(r) >= 0.7 ? "fuerte" : Math.abs(r) >= 0.4 ? "moderada" : Math.abs(r) >= 0.2 ? "débil" : "muy débil o nula";
      var xmin = Math.min.apply(null, x), xmax = Math.max.apply(null, x), pad = (xmax - xmin) * 0.08 || 1;
      var g = { tipo: "xy", xmin: xmin - pad, xmax: xmax + pad, xlab: "X", ylab: "Y", series: [{ pts: x.map(function (xi, i) { return [xi, y[i]]; }), tipo: "puntos", color: "acento", nombre: "Datos" }, { f: function (z) { return a + b * z; }, color: "cola", nombre: "Recta de regresión", n: 2 }], puntos: [] };
      var stats = [["Pendiente (b)", fmt(b, 4)], ["Intercepto (a)", fmt(a, 4)], ["Correlación (r)", fmt(r, 4)], ["Determinación (R²)", fmt(r2, 4)]], pasos = [];
      var y0 = isFinite(v.x0) ? a + b * v.x0 : NaN;
      if (isFinite(y0)) { stats.push(["Ŷ para X = " + fmtN(v.x0), fmt(y0, 4)]); g.puntos.push({ x: v.x0, y: y0, color: "s3", texto: "ŷ = " + fmt(y0, 2), guias: true }); if (v.x0 < g.xmin) g.xmin = v.x0 - pad; if (v.x0 > g.xmax) g.xmax = v.x0 + pad; }
      if (pr) stats.push(["Valor p (pendiente)", fmtP(pr.p)]);
      pasos.push("Sumas: Σx = " + fmtN(sx, 4) + ", Σy = " + fmtN(sy, 4) + ", Σxy = " + fmtN(sxy, 4) + ", Σx² = " + fmtN(sxx, 4) + ", Σy² = " + fmtN(syy, 4) + ", n = " + n + ".",
        "Sxx = Σx² − (Σx)²/n = " + fmt(Sxx, 4) + "; Syy = " + fmt(Syy, 4) + "; Sxy = Σxy − ΣxΣy/n = " + fmt(Sxy, 4) + ".",
        "Pendiente: b = Sxy / Sxx = " + fmt(b, 4) + ". Intercepto: a = ȳ − b·x̄ = " + fmt(sy / n, 4) + " − " + fmt(b, 4) + " × " + fmt(sx / n, 4) + " = " + fmt(a, 4) + ".",
        "Correlación: r = Sxy / √(Sxx·Syy) = " + fmt(r, 4) + "; R² = " + fmt(r2, 4) + " (la recta explica el " + fmt(r2 * 100, 2) + " % de la variación de Y).");
      if (pr) pasos.push("Prueba de la pendiente. H₀: β = 0. Error estándar de la estimación: sₑ = " + fmt(se, 4) + "; EE(b) = sₑ/√Sxx = " + fmt(seb, 5) + "; t = b / EE(b) = " + fmt(t, 4) + " con gl = " + gl + "; valor p = " + fmtP(pr.p) + " → " + (pr.rechaza ? "la relación es significativa." : "la relación no es significativa."));
      if (isFinite(y0)) pasos.push("Predicción: ŷ = " + fmt(a, 4) + " + " + fmt(b, 4) + " × " + fmtN(v.x0) + " = " + fmt(y0, 4) + ".");
      return {
        principal: { etiqueta: "Recta de regresión", valor: "ŷ = " + fmt(a, 3) + (b < 0 ? " − " : " + ") + fmt(Math.abs(b), 3) + "x" },
        pill: pr ? { texto: pr.rechaza ? "Relación significativa" : "Relación no significativa", tipo: pr.rechaza ? "ok" : "aviso" } : null,
        stats: stats,
        conclusion: "La correlación es " + fuerza + " y " + (r >= 0 ? "positiva" : "negativa") + " (r = " + fmt(r, 3) + "). Por cada unidad que aumenta X, Y " + (b >= 0 ? "aumenta" : "disminuye") + " en promedio " + fmt(Math.abs(b), 4) + " unidades.",
        grafico: g, tablas: [{ titulo: "Tabla de cálculo", cab: ["i", "x", "y", "x·y", "x²", "y²"], filas: fil, total: ["Σ", sx, sy, sxy, sxx, syy], dec: [0, 4, 4, 4, 4, 4] }], pasos: pasos
      };
    },
    pie: "Equivalencias en Excel: PENDIENTE, INTERSECCION.EJE, COEF.DE.CORREL, COEFICIENTE.R2 y PRONOSTICO.LINEAL."
  });

  /* ------------------------------------------------------------ 9. Tamaño de muestra */
  CALC.registrar({
    id: "tamano-muestra", area: A, titulo: "Tamaño de muestra", resumen: "Para estimar una media o una proporción, con población finita opcional.",
    palabras: "tamaño muestra muestreo error margen poblacion finita encuesta proporcion media",
    descripcion: "Calcule cuántas observaciones necesita para estimar una media o una proporción con el margen de error y el nivel de confianza deseados.",
    modos: [
      { id: "prop", nombre: "Proporción", campos: [{ id: "p", etiqueta: "Proporción esperada (p)", valor: "0,5", mayor: 0, menor: 1, ayuda: "Use 0,5 si no tiene información previa." }, { id: "E", etiqueta: "Margen de error (%)", valor: "5", mayor: 0, menor: 100 }] },
      { id: "media", nombre: "Media", campos: [{ id: "sig", etiqueta: "Desviación estándar (σ)", valor: "12", mayor: 0, ayuda: "De un estudio previo o una prueba piloto." }, { id: "Em", etiqueta: "Margen de error (en unidades)", valor: "2", mayor: 0 }] }
    ],
    campos: [CONF, { id: "N", etiqueta: "Tamaño de la población (N)", valor: "", opcional: true, entero: true, min: 1, ayuda: "Opcional. Déjelo vacío si la población es muy grande." }],
    calcular: function (v) {
      var c = +v.conf, z = M.zCrit((1 - c) / 2), n0, pasos = [];
      if (v.modo === "prop") { var E = v.E / 100; n0 = z * z * v.p * (1 - v.p) / (E * E); pasos.push("Fórmula (población infinita): n₀ = z² · p(1 − p) / E² = " + fmt(z, 4) + "² × " + fmtN(v.p) + " × " + fmtN(1 - v.p) + " / " + fmtN(E) + "² = " + fmt(n0, 2) + "."); }
      else { n0 = Math.pow(z * v.sig / v.Em, 2); pasos.push("Fórmula (población infinita): n₀ = (z · σ / E)² = (" + fmt(z, 4) + " × " + fmtN(v.sig) + " / " + fmtN(v.Em) + ")² = " + fmt(n0, 2) + "."); }
      pasos.unshift("Valor z para " + fmtN(c * 100) + " % de confianza: z = " + fmt(z, 4) + ".");
      var n = n0, finita = isFinite(v.N);
      if (finita) { n = n0 / (1 + (n0 - 1) / v.N); pasos.push("Corrección por población finita: n = n₀ / [1 + (n₀ − 1)/N] = " + fmt(n0, 2) + " / [1 + (" + fmt(n0, 2) + " − 1)/" + fmtN(v.N) + "] = " + fmt(n, 2) + "."); }
      var nf = Math.ceil(n - 1e-9);
      pasos.push("Se redondea siempre hacia arriba: n = " + nf + ".");
      return { principal: { etiqueta: "Tamaño de muestra necesario", valor: fmtN(nf) }, stats: [["z", fmt(z, 4)], ["n sin redondear", fmt(n, 2)], ["n₀ (población infinita)", fmt(n0, 2)]].concat(finita ? [["Fracción de la población", fmt(nf / v.N * 100, 1) + " %"]] : []),
        conclusion: "Se necesitan al menos " + fmtN(nf) + " observaciones para estimar la " + (v.modo === "prop" ? "proporción" : "media") + " con " + fmtN(c * 100) + " % de confianza y un margen de error de " + (v.modo === "prop" ? fmtN(v.E) + " %" : fmtN(v.Em) + " unidades") + ".", pasos: pasos };
    }
  });

  /* ------------------------------------------------------------ 10. Estadística descriptiva */
  function cuantil(ord, p) { var h = (ord.length - 1) * p, lo = Math.floor(h); return ord[lo] + (h - lo) * ((ord[lo + 1] === undefined ? ord[lo] : ord[lo + 1]) - ord[lo]); }
  CALC.registrar({
    id: "descriptiva", area: A, titulo: "Estadística descriptiva", resumen: "Media, mediana, moda, dispersión, cuartiles y tabla de frecuencias.",
    palabras: "descriptiva media mediana moda varianza desviacion estandar cuartiles percentil coeficiente variacion asimetria curtosis histograma frecuencias sturges",
    descripcion: "Pegue los datos y obtenga las medidas de tendencia central, de dispersión y de forma, con la tabla de frecuencias y el histograma.",
    campos: [
      { id: "d", tipo: "lista", etiqueta: "Datos", valor: "23 29 20 32 27 25 31 28 22 26 30 24 27 29 33 21 28 26 25 27", minimo: 2, filas: 5 },
      { id: "tipo", tipo: "sel", etiqueta: "Los datos son", valor: "muestra", opciones: [["muestra", "Una muestra (divide entre n − 1)"], ["poblacion", "La población (divide entre N)"]] }
    ],
    calcular: function (v) {
      var d = v.d, n = d.length, ord = d.slice().sort(function (a, b) { return a - b; }), m = M.media(d), mu = v.tipo === "muestra";
      var s2 = M.varianza(d, mu), s = Math.sqrt(s2), med = cuantil(ord, 0.5), q1 = cuantil(ord, 0.25), q3 = cuantil(ord, 0.75);
      var cuenta = {}, mx = 0; d.forEach(function (x) { cuenta[x] = (cuenta[x] || 0) + 1; mx = Math.max(mx, cuenta[x]); });
      var modas = mx > 1 ? Object.keys(cuenta).filter(function (k) { return cuenta[k] === mx; }).map(Number).sort(function (a, b) { return a - b; }) : [];
      var m3 = 0, m4 = 0; d.forEach(function (x) { m3 += Math.pow(x - m, 3); m4 += Math.pow(x - m, 4); });
      var ss = Math.sqrt(M.varianza(d)), asim = n > 2 && ss > 0 ? n / ((n - 1) * (n - 2)) * m3 / Math.pow(ss, 3) : NaN;
      var curt = n > 3 && ss > 0 ? n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) * m4 / Math.pow(ss, 4) - 3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3)) : NaN;
      // tabla de frecuencias (Sturges)
      var k = Math.max(3, Math.ceil(1 + 3.322 * Math.log10(n))), min = ord[0], max = ord[n - 1], rango = max - min, fil = [], cats = [], fr = [];
      if (rango > 0) {
        var dec = Math.max(0, ...d.map(function (x) { var t = String(x).split(".")[1]; return t ? t.length : 0; })), u = Math.pow(10, -dec);
        var amp = Math.ceil((rango / k) / u - 1e-9) * u; if (amp * k <= rango) amp += u;
        var acum = 0;
        for (var i = 0; i < k; i++) {
          var li = min + i * amp, ls = li + amp, f = d.filter(function (x) { return x >= li - 1e-12 && (i === k - 1 ? x <= ls + 1e-12 : x < ls - 1e-12); }).length; acum += f;
          fil.push(["[" + fmtN(li, dec) + " ; " + fmtN(ls, dec) + (i === k - 1 ? "]" : ")"), (li + ls) / 2, f, f / n, acum, acum / n]); cats.push(fmtN((li + ls) / 2, dec + 1)); fr.push(f);
        }
      }
      var etD = mu ? "s" : "σ";
      return {
        principal: { etiqueta: "Media", valor: fmt(m, 4) },
        stats: [["n", String(n)], ["Mediana", fmt(med, 4)], ["Moda", modas.length ? (modas.length > 4 ? modas.length + " modas" : modas.map(function (x) { return fmtN(x, 4); }).join(" ; ")) : "No hay"], ["Desv. estándar (" + etD + ")", fmt(s, 4)], ["Varianza (" + etD + "²)", fmt(s2, 4)], ["Coef. de variación", fmt(s / m * 100, 2) + " %"],
          ["Mínimo", fmtN(min, 4)], ["Máximo", fmtN(max, 4)], ["Rango", fmtN(rango, 4)], ["Q1", fmt(q1, 4)], ["Q3", fmt(q3, 4)], ["Rango intercuartil", fmt(q3 - q1, 4)], ["Asimetría", fmt(asim, 4)], ["Curtosis (exceso)", fmt(curt, 4)], ["Suma", fmtN(M.suma(d), 4)]],
        conclusion: "Los datos tienen una media de " + fmt(m, 2) + " y una desviación de " + fmt(s, 2) + " (coeficiente de variación " + fmt(s / m * 100, 1) + " %). " + (isFinite(asim) ? (Math.abs(asim) < 0.5 ? "La distribución es aproximadamente simétrica." : asim > 0 ? "La distribución tiene asimetría positiva (cola a la derecha)." : "La distribución tiene asimetría negativa (cola a la izquierda).") : ""),
        grafico: fr.length ? { tipo: "barras", cats: cats, series: [{ nombre: "Frecuencia", valores: fr, color: "acento" }], xlab: "Marca de clase", ylab: "Frecuencia" } : null,
        tablas: fil.length ? [{ titulo: "Tabla de frecuencias (" + k + " clases, regla de Sturges)", cab: ["Clase", "Marca de clase", "f", "fr", "F", "Fr"], filas: fil, total: ["Total", "", n, 1, "", ""], dec: [0, 4, 0, 4, 0, 4] }] : [],
        pasos: ["Media: x̄ = Σx / n = " + fmtN(M.suma(d), 4) + " / " + n + " = " + fmt(m, 4) + ".",
          "Mediana: valor central de los datos ordenados = " + fmt(med, 4) + ".",
          "Varianza: " + etD + "² = Σ(x − x̄)² / " + (mu ? "(n − 1)" : "N") + " = " + fmt(s2 * (mu ? n - 1 : n), 4) + " / " + (mu ? n - 1 : n) + " = " + fmt(s2, 4) + "; desviación = √" + fmt(s2, 4) + " = " + fmt(s, 4) + ".",
          "Coeficiente de variación: " + etD + " / x̄ × 100 = " + fmt(s / m * 100, 2) + " %.",
          "Cuartiles (método de Excel CUARTIL.INC): Q1 = " + fmt(q1, 4) + ", Q3 = " + fmt(q3, 4) + ".",
          fil.length ? "Tabla de frecuencias: k = 1 + 3,322·log(n) ≈ " + k + " clases; amplitud ≈ rango / k = " + fmtN(rango, 4) + " / " + k + ", redondeada hacia arriba." : "Todos los datos son iguales: no se arma tabla de frecuencias."]
      };
    },
    pie: "Equivalencias en Excel: PROMEDIO, MEDIANA, MODA.VARIOS, DESVEST.M / DESVEST.P, CUARTIL.INC, COEFICIENTE.ASIMETRIA y CURTOSIS."
  });
})();
