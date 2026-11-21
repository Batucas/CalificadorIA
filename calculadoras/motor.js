/* Calculadoras del Calificador IA — motor común: matemática, formato, campos, resultado, gráficos y catálogo.
   Cada calculadora se registra con CALC.registrar({...}) en estadistica.js, finanzas.js, economia.js o conversores.js. */
var CALC = (function () {
  "use strict";
  var lista = [];
  var AREAS = ["Estadística", "Finanzas", "Economía", "Conversores"];

  /* =========================================================== matemática */
  function lnGamma(z) {
    var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
    z -= 1; var x = c[0]; for (var i = 1; i < g + 2; i++) x += c[i] / (z + i);
    var t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function gammaPSeries(a, x) {
    var sum = 1 / a, del = sum, ap = a;
    for (var n = 0; n < 2000; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-16) break; }
    return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  }
  function gammaQCF(a, x) {
    var FPMIN = 1e-300, b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
    for (var i = 1; i < 2000; i++) {
      var an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break;
    }
    return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
  }
  function gammaQ(a, x) { if (x <= 0) return 1; if (x < a + 1) return 1 - gammaPSeries(a, x); return gammaQCF(a, x); }
  function gammaP(a, x) { if (x <= 0) return 0; if (x < a + 1) return gammaPSeries(a, x); return 1 - gammaQCF(a, x); }
  function betacf(a, b, x) {
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; var h = d;
    for (var m = 1; m < 3000; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break;
    }
    return h;
  }
  /* beta incompleta regularizada I_x(a,b) */
  function betai(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  /* Funciones de supervivencia (área a la derecha) y densidades */
  function normSF(z) { var q = 0.5 * gammaQ(0.5, z * z / 2); return z >= 0 ? q : 1 - q; }
  function normCDF(z) { return normSF(-z); }
  function normPdf(z) { return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }
  function normInv(p) { // cuantil: P(Z <= z) = p
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    var a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239],
      b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572],
      c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783],
      d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416], q, r, x;
    if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else { q = p - 0.5; r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    for (var i = 0; i < 2; i++) { var e = normCDF(x) - p; x = x - e / normPdf(x); }
    return x;
  }
  function tSF(t, k) { var x = k / (k + t * t), tail = 0.5 * betai(k / 2, 0.5, x); return t >= 0 ? tail : 1 - tail; }
  function tPdf(t, k) { return Math.exp(lnGamma((k + 1) / 2) - lnGamma(k / 2) - 0.5 * Math.log(k * Math.PI) - (k + 1) / 2 * Math.log(1 + t * t / k)); }
  function chiSF(x, k) { return gammaQ(k / 2, x / 2); }
  function chiPdf(x, k) { if (x <= 0) return k === 2 ? 0.5 : (k < 2 ? Infinity : 0); return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lnGamma(k / 2)); }
  function fSF(f, d1, d2) { if (f <= 0) return 1; return betai(d2 / 2, d1 / 2, d2 / (d2 + d1 * f)); }
  function fPdf(f, d1, d2) { if (f <= 0) return d1 < 2 ? Infinity : (d1 === 2 ? 1 : 0); return Math.exp(0.5 * d1 * Math.log(d1 / d2) + (d1 / 2 - 1) * Math.log(f) - (d1 + d2) / 2 * Math.log(1 + d1 * f / d2) - (lnGamma(d1 / 2) + lnGamma(d2 / 2) - lnGamma((d1 + d2) / 2))); }
  /* inversa de una función de supervivencia decreciente: x tal que sf(x) = p */
  function invSF(sf, p, lo, hi) {
    while (sf(hi) > p) { hi = hi > 0 ? hi * 2 : hi + 10; if (hi > 1e12) break; }
    while (sf(lo) < p) { lo = lo < 0 ? lo * 2 : lo - 10; if (lo < -1e12) break; }
    for (var i = 0; i < 300; i++) { var m = (lo + hi) / 2; if (sf(m) > p) lo = m; else hi = m; if (hi - lo < 1e-13 * Math.max(1, Math.abs(m))) break; }
    return (lo + hi) / 2;
  }
  function zCrit(p) { return -normInv(p); }                                       // z con área p a la derecha
  function tCrit(p, k) { return invSF(function (x) { return tSF(x, k); }, p, -10, 10); }
  function chiCrit(p, k) { return invSF(function (x) { return chiSF(x, k); }, p, 0, Math.max(10, k * 4 + 40)); }
  function fCrit(p, d1, d2) { return invSF(function (x) { return fSF(x, d1, d2); }, p, 0, 20); }
  function lnComb(n, k) { return lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1); }
  function suma(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function media(a) { return suma(a) / a.length; }
  function varianza(a, muestral) { var m = media(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return s / (a.length - (muestral === false ? 0 : 1)); }
  /* raíz de f en [a,b] (bisección; f(a) y f(b) con signos opuestos) */
  function raiz(f, a, b) {
    var fa = f(a); for (var i = 0; i < 300; i++) { var m = (a + b) / 2, fm = f(m); if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m; if (Math.abs(b - a) < 1e-14) break; }
    return (a + b) / 2;
  }

  /* =========================================================== formato */
  function fmt(v, d) {
    if (typeof v !== "number" || !isFinite(v)) return "—";
    if (d == null) d = 2;
    if (Math.abs(v) < 0.5 * Math.pow(10, -d)) v = 0; // evita «-0,00»
    return v.toLocaleString("es-BO", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function fmtN(v, max) { // sin ceros de relleno: 0,05 / 1.250 / 3,1416
    if (typeof v !== "number" || !isFinite(v)) return "—";
    return v.toLocaleString("es-BO", { maximumFractionDigits: max == null ? 4 : max });
  }
  function sup(n) { var m = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" }; return String(n).split("").map(function (c) { return m[c] || c; }).join(""); }
  function fmtP(p) {
    if (!isFinite(p)) return "—";
    if (p >= 0.0001) return fmt(p, 4);
    if (p <= 0) return "< 1 × 10⁻³⁰⁰";
    var e = Math.floor(Math.log10(p)), m = p / Math.pow(10, e);
    return fmt(m, 2) + " × 10" + sup(e);
  }
  function pct(v, d) { return fmt(v * 100, d == null ? 2 : d) + " %"; }
  function num(s) {
    if (s == null) return NaN; if (typeof s === "number") return s;
    s = String(s).trim().replace(/\s/g, "").replace(/%$/, ""); if (s === "") return NaN;
    if (s.indexOf(",") >= 0 && s.indexOf(".") >= 0) { s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, ""); }
    else if ((s.match(/,/g) || []).length === 1) s = s.replace(",", ".");
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s) ? Number(s) : NaN;
  }
  /* lista de números: separados por saltos de línea, tabulaciones, punto y coma o espacios (la coma es decimal);
     si no hay ninguno de esos separadores, la coma separa los valores. */
  function numeros(texto) {
    texto = String(texto || "").trim(); if (!texto) return [];
    var partes = /[\n\t; ]/.test(texto) ? texto.split(/[\n\t; ]+/) : texto.split(",");
    var out = [];
    partes.forEach(function (p) { if (p.trim() === "") return; var v = num(p); if (!isFinite(v)) throw new Error("«" + p.trim() + "» no es un número. Separe los valores con saltos de línea, espacios o punto y coma."); out.push(v); });
    return out;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function $(id) { return document.getElementById(id); }

  /* =========================================================== registro */
  function registrar(def) { lista.push(def); }
  function buscar(id) { for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; return null; }

  /* =========================================================== página de una calculadora */
  var C = null, modo = null, estado = {}, ultimo = null, temporizador = null;

  function camposDe() {
    var m = (C.modos || []).filter(function (x) { return x.id === modo; })[0];
    var cs = (m && m.campos ? m.campos : []).concat(C.campos || []);
    return cs.filter(function (f) { return !f.si || f.si(leerCrudo()); });
  }
  function todosLosCampos() { // para conservar valores entre modos
    var cs = (C.campos || []).slice(); (C.modos || []).forEach(function (m) { cs = cs.concat(m.campos || []); }); return cs;
  }
  function valorInicial(f) {
    if (f.tipo === "tabla") return JSON.parse(JSON.stringify(f.valor));
    if (f.tipo === "grupos") return JSON.parse(JSON.stringify(f.valor));
    if (f.tipo === "check") return !!f.valor;
    return f.valor == null ? "" : String(f.valor);
  }
  /* cada pestaña (modo) guarda sus propios valores, así los ejemplos de una no se mezclan con los de otra */
  var estados = {};
  function reiniciar() {
    estados = {};
    ((C.modos && C.modos.length) ? C.modos : [{ id: null, campos: [] }]).forEach(function (m) {
      var e = estados[m.id] = {};
      (m.campos || []).concat(C.campos || []).forEach(function (f) { if (f.id && !(f.id in e)) e[f.id] = valorInicial(f); });
    });
    estado = estados[modo];
  }
  function leerCrudo() { return estado; }

  function htmlCampo(f) {
    var id = "f-" + f.id, v = estado[f.id], ayuda = f.ayuda ? '<span class="hint">' + f.ayuda + "</span>" : "";
    var ancho = f.ancho || ["lista", "tabla", "grupos", "nota"].indexOf(f.tipo) >= 0 ? " ancho" : "";
    if (f.tipo === "nota") return '<p class="hint field ancho" style="margin:0">' + f.texto + "</p>";
    if (f.tipo === "sel") {
      var ops = typeof f.opciones === "function" ? f.opciones(estado) : f.opciones;
      if (!ops.some(function (o) { return String(o[0]) === String(v); })) { v = estado[f.id] = String(ops[Math.min(f.indice || 0, ops.length - 1)][0]); }
      return '<div class="field' + ancho + '"><label for="' + id + '">' + f.etiqueta + '</label><select id="' + id + '" data-campo="' + f.id + '">' +
        ops.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>" + ayuda + "</div>";
    }
    if (f.tipo === "check") return '<div class="field' + ancho + '" style="align-content:end"><label class="check"><input type="checkbox" id="' + id + '" data-campo="' + f.id + '"' + (v ? " checked" : "") + "> " + f.etiqueta + "</label>" + ayuda + "</div>";
    if (f.tipo === "lista") return '<div class="field ancho"><label for="' + id + '">' + f.etiqueta + '</label><textarea id="' + id + '" data-campo="' + f.id + '" spellcheck="false" rows="' + (f.filas || 4) + '">' + esc(v) + "</textarea>" + (ayuda || '<span class="hint">Pegue desde Excel o separe con saltos de línea, espacios o punto y coma. La coma es decimal.</span>') + "</div>";
    if (f.tipo === "fecha") return '<div class="field' + ancho + '"><label for="' + id + '">' + f.etiqueta + '</label><input type="date" id="' + id + '" data-campo="' + f.id + '" value="' + esc(v) + '">' + ayuda + "</div>";
    if (f.tipo === "tabla") return '<div class="field ancho" id="' + id + '">' + htmlTabla(f, v) + ayuda + "</div>";
    if (f.tipo === "grupos") return '<div class="field ancho" id="' + id + '">' + htmlGrupos(f, v) + ayuda + "</div>";
    return '<div class="field' + ancho + '"><label for="' + id + '">' + f.etiqueta + '</label><input type="text" id="' + id + '" data-campo="' + f.id + '" inputmode="decimal" autocomplete="off" value="' + esc(v) + '">' + ayuda + "</div>";
  }
  function opcionesNum(a, b, v) { var h = ""; for (var i = a; i <= b; i++) h += '<option value="' + i + '"' + (i === v ? " selected" : "") + ">" + i + "</option>"; return h; }
  function htmlTabla(f, t) {
    var r = t.filas.length, c = t.cols.length, h = '<div class="campos" style="grid-template-columns:repeat(2,minmax(0,160px))">' +
      '<div class="field"><label>' + (f.etFilas || "Filas") + '</label><select data-tam="filas" data-campo="' + f.id + '">' + opcionesNum(f.min || 2, f.max || 8, r) + "</select></div>" +
      (f.colsFijas ? "" : '<div class="field"><label>' + (f.etCols || "Columnas") + '</label><select data-tam="cols" data-campo="' + f.id + '">' + opcionesNum(f.minC || 2, f.maxC || 8, c) + "</select></div>") + "</div>";
    h += '<div class="tablewrap"><table class="ct"><thead><tr><th></th>';
    for (var j = 0; j < c; j++) h += "<th>" + (f.colsFijas ? esc(t.cols[j]) : '<input type="text" class="lab" data-campo="' + f.id + '" data-col="' + j + '" aria-label="Nombre de la columna ' + (j + 1) + '" value="' + esc(t.cols[j]) + '">') + "</th>";
    h += (f.totales ? "<th>Total</th>" : "") + "</tr></thead><tbody>";
    for (var i = 0; i < r; i++) {
      h += '<tr><th><input type="text" class="lab" data-campo="' + f.id + '" data-fila="' + i + '" aria-label="Nombre de la fila ' + (i + 1) + '" value="' + esc(t.filas[i]) + '"></th>';
      for (var k = 0; k < c; k++) h += '<td><input type="text" inputmode="decimal" data-campo="' + f.id + '" data-celda="' + i + "," + k + '" aria-label="Fila ' + (i + 1) + " columna " + (k + 1) + '" value="' + esc(t.datos[i][k]) + '"></td>';
      h += (f.totales ? '<td class="tot" data-tot="f' + i + '"></td>' : "") + "</tr>";
    }
    if (f.totales) { h += "<tr><th>Total</th>"; for (var q = 0; q < c; q++) h += '<td class="tot" data-tot="c' + q + '"></td>'; h += '<td class="tot" data-tot="g"></td></tr>'; }
    return h + "</tbody></table></div>";
  }
  function totalesTabla(f) {
    if (!f.totales) return; var t = estado[f.id], cont = $("f-" + f.id); if (!cont) return;
    var cs = t.cols.map(function () { return 0; }), g = 0;
    t.datos.forEach(function (fila, i) { var s = 0; fila.forEach(function (x, j) { var v = num(x); if (isFinite(v)) { s += v; cs[j] += v; } }); g += s; var el = cont.querySelector('[data-tot="f' + i + '"]'); if (el) el.textContent = fmtN(s); });
    cs.forEach(function (s, j) { var el = cont.querySelector('[data-tot="c' + j + '"]'); if (el) el.textContent = fmtN(s); });
    var el = cont.querySelector('[data-tot="g"]'); if (el) el.textContent = fmtN(g);
  }
  function htmlGrupos(f, gs) {
    var h = '<div class="campos" style="grid-template-columns:minmax(0,200px)"><div class="field"><label>' + (f.etiqueta || "Número de grupos") + '</label><select data-tam="grupos" data-campo="' + f.id + '">' + opcionesNum(f.min || 2, f.max || 8, gs.length) + "</select></div></div><div class=\"grupos\">";
    gs.forEach(function (g, i) {
      h += '<div class="grupo"><input type="text" data-campo="' + f.id + '" data-gnombre="' + i + '" aria-label="Nombre del grupo ' + (i + 1) + '" value="' + esc(g.nombre) + '">' +
        '<textarea data-campo="' + f.id + '" data-gdatos="' + i + '" spellcheck="false" aria-label="Datos del grupo ' + (i + 1) + '">' + esc(g.datos) + "</textarea></div>";
    });
    return h + '</div><span class="hint">Un valor por línea (o separados por espacios o punto y coma). Puede pegar una columna de Excel en cada grupo.</span>';
  }
  function pintarCampos() {
    $("campos").innerHTML = camposDe().map(htmlCampo).join("");
    camposDe().forEach(function (f) { if (f.tipo === "tabla") totalesTabla(f); });
  }
  function alEditar(e) {
    var el = e.target, id = el.getAttribute("data-campo"); if (!id) return;
    var f = camposDe().filter(function (x) { return x.id === id; })[0]; if (!f) return;
    var repintar = false;
    if (f.tipo === "tabla") {
      var t = estado[id];
      if (el.hasAttribute("data-tam")) {
        var n = +el.value, cual = el.getAttribute("data-tam");
        if (cual === "filas") { while (t.filas.length < n) { t.filas.push((f.etFila || "Fila ") + (t.filas.length + 1)); t.datos.push(t.cols.map(function () { return ""; })); } t.filas.length = n; t.datos.length = n; }
        else { while (t.cols.length < n) t.cols.push("Col. " + (t.cols.length + 1)); t.cols.length = n; t.datos.forEach(function (fila) { while (fila.length < n) fila.push(""); fila.length = n; }); }
        repintar = true;
      } else if (el.hasAttribute("data-fila")) t.filas[+el.getAttribute("data-fila")] = el.value;
      else if (el.hasAttribute("data-col")) t.cols[+el.getAttribute("data-col")] = el.value;
      else if (el.hasAttribute("data-celda")) { var rc = el.getAttribute("data-celda").split(","); t.datos[+rc[0]][+rc[1]] = el.value; totalesTabla(f); }
    } else if (f.tipo === "grupos") {
      var gs = estado[id];
      if (el.hasAttribute("data-tam")) { var m = +el.value; while (gs.length < m) gs.push({ nombre: "Grupo " + (gs.length + 1), datos: "" }); gs.length = m; repintar = true; }
      else if (el.hasAttribute("data-gnombre")) gs[+el.getAttribute("data-gnombre")].nombre = el.value;
      else if (el.hasAttribute("data-gdatos")) gs[+el.getAttribute("data-gdatos")].datos = el.value;
    } else if (f.tipo === "check") { estado[id] = el.checked; repintar = !!f.repinta; }
    else { estado[id] = el.value; if (f.tipo === "sel") repintar = true; }
    if (repintar) { pintarCampos(); var nuevo = document.querySelector('[data-campo="' + id + '"]' + (el.hasAttribute("data-tam") ? '[data-tam="' + el.getAttribute("data-tam") + '"]' : "")); if (nuevo) nuevo.focus(); }
    clearTimeout(temporizador);
    temporizador = setTimeout(calcular, e.type === "change" ? 0 : 350);
  }

  /* lee y valida los valores de los campos visibles */
  function valores() {
    var v = { modo: modo };
    camposDe().forEach(function (f) {
      var crudo = estado[f.id], et = "«" + String(f.etiqueta || f.id).replace(/<[^>]+>/g, "") + "»";
      if (f.tipo === "nota") return;
      if (f.tipo === "sel" || f.tipo === "fecha") { v[f.id] = crudo; if (f.tipo === "fecha" && !crudo && !f.opcional) throw new Error("Elija la fecha en " + et + "."); return; }
      if (f.tipo === "check") { v[f.id] = !!crudo; return; }
      if (f.tipo === "lista") { var a = numeros(crudo); if (a.length < (f.minimo || 1)) throw new Error("Escriba al menos " + (f.minimo || 1) + " valores en " + et + "."); v[f.id] = a; return; }
      if (f.tipo === "tabla") {
        var t = crudo, dat = t.datos.map(function (fila, i) {
          return fila.map(function (x, j) {
            var n = num(x); if (!isFinite(n)) throw new Error("Revise la celda de la fila «" + t.filas[i] + "», columna «" + t.cols[j] + "»: debe ser un número.");
            if (f.noNegativos && n < 0) throw new Error("La celda de la fila «" + t.filas[i] + "», columna «" + t.cols[j] + "» no puede ser negativa."); return n;
          });
        });
        v[f.id] = { filas: t.filas.slice(), cols: t.cols.slice(), datos: dat }; return;
      }
      if (f.tipo === "grupos") { v[f.id] = crudo.map(function (g) { var d = numeros(g.datos); if (d.length < 2) throw new Error("El grupo «" + g.nombre + "» necesita al menos 2 datos."); return { nombre: g.nombre, datos: d }; }); return; }
      var n = num(crudo);
      if (!isFinite(n)) { if (f.opcional && String(crudo).trim() === "") { v[f.id] = NaN; return; } throw new Error("Escriba un número en " + et + "."); }
      if (f.entero && Math.floor(n) !== n) throw new Error(et + " debe ser un número entero.");
      if (f.min != null && n < f.min) throw new Error(et + " debe ser mayor o igual a " + fmtN(f.min) + ".");
      if (f.max != null && n > f.max) throw new Error(et + " debe ser menor o igual a " + fmtN(f.max) + ".");
      if (f.mayor != null && n <= f.mayor) throw new Error(et + " debe ser mayor que " + fmtN(f.mayor) + ".");
      if (f.menor != null && n >= f.menor) throw new Error(et + " debe ser menor que " + fmtN(f.menor) + ".");
      v[f.id] = f.porcentaje ? n / 100 : n;
    });
    return v;
  }

  function calcular() {
    var msg = $("msg"); msg.className = "hidden";
    var r;
    try { r = C.calcular(valores()); }
    catch (e) { msg.className = "err"; msg.textContent = e.message; return; }
    ultimo = r; pintarResultado(r);
  }

  function pintarResultado(r) {
    var p = r.principal || {};
    $("r-plabel").textContent = p.etiqueta || "Resultado";
    $("r-pval").textContent = p.valor != null ? p.valor : "—";
    var pill = $("r-pill");
    if (r.pill) { pill.className = "pill " + (r.pill.tipo || "info"); pill.textContent = r.pill.texto; } else { pill.className = "hidden"; }
    $("r-stats").innerHTML = (r.stats || []).map(function (s) { return '<div class="stat"><div class="k">' + esc(s[0]) + '</div><div class="v">' + esc(s[1]) + "</div></div>"; }).join("");
    $("r-concl").textContent = r.conclusion || "";
    $("r-concl").classList.toggle("hidden", !r.conclusion);
    var g = r.grafico; $("r-graf").classList.toggle("hidden", !g);
    if (g) { dibujar(g); $("r-leyenda").innerHTML = leyenda(g); }
    var extra = "";
    (r.avisos || []).forEach(function (a) { extra += '<div class="warn">' + esc(a) + "</div>"; });
    (r.tablas || []).forEach(function (t, i) { extra += htmlTablaSalida(t, i); });
    $("r-extra").innerHTML = extra;
    $("r-pasos").innerHTML = (r.pasos || []).map(function (t) { return "<li>" + (typeof t === "object" && t.html ? t.html : esc(t)) + "</li>"; }).join("");
    $("desarrollo").classList.toggle("hidden", !extra && !(r.pasos || []).length);
  }
  function celda(x, dec) { return typeof x === "number" ? fmt(x, dec == null ? 2 : dec) : esc(x == null ? "" : x); }
  function htmlTablaSalida(t, i) {
    var dec = t.dec, filas = t.filas.map(function (f) { return "<tr>" + f.map(function (x, j) { return "<td>" + celda(x, Array.isArray(dec) ? dec[j] : dec) + "</td>"; }).join("") + "</tr>"; }).join("");
    if (t.total) filas += '<tr class="total">' + t.total.map(function (x, j) { return "<td>" + celda(x, Array.isArray(dec) ? dec[j] : dec) + "</td>"; }).join("") + "</tr>";
    return '<div class="tbl"><div class="tbl-cab">' + (t.titulo ? "<h3>" + esc(t.titulo) + "</h3>" : "<span></span>") +
      '<button class="b chico" type="button" data-copiar-tabla="' + i + '">Copiar tabla para Excel</button></div>' +
      '<div class="tablewrap' + (t.filas.length > 14 ? " scroll" : "") + '"><table class="out"><thead><tr>' + t.cab.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" + filas + "</tbody></table></div></div>";
  }
  function tsv(t) {
    var celdaTxt = function (x) { return typeof x === "number" ? String(Math.round(x * 1e8) / 1e8).replace(".", ",") : String(x == null ? "" : x); };
    var lineas = [t.cab.join("\t")].concat(t.filas.map(function (f) { return f.map(celdaTxt).join("\t"); }));
    if (t.total) lineas.push(t.total.map(celdaTxt).join("\t"));
    return lineas.join("\n");
  }
  function copiar(texto, aviso) {
    var ok = function () { aviso.textContent = "Copiado"; aviso.classList.remove("hidden"); setTimeout(function () { aviso.classList.add("hidden"); }, 1800); };
    var respaldo = function () {
      var ta = document.createElement("textarea"); ta.value = texto; ta.style.cssText = "position:fixed;left:-9999px"; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); ok(); } catch (e) { aviso.textContent = "No se pudo copiar"; aviso.classList.remove("hidden"); } ta.remove();
    };
    try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(ok, respaldo); else respaldo(); } catch (e) { respaldo(); }
  }
  function textoResultado(r) {
    if (r.copiar) return r.copiar;
    var l = [C.titulo];
    if (r.principal) l.push(r.principal.etiqueta + ": " + r.principal.valor);
    (r.stats || []).forEach(function (s) { l.push(s[0] + ": " + s[1]); });
    if (r.pill) l.push(r.pill.texto);
    if (r.conclusion) l.push(r.conclusion);
    return l.join("\n");
  }

  /* =========================================================== gráficos (canvas) */
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  var COLOR = { tinta: "--ink", acento: "--accent", cola: "--tail", ok: "--ok", mal: "--bad", aviso: "--warn", s3: "--s3", s4: "--s4", gris: "--muted" };
  var SUAVE = { cola: "--tail-soft", acento: "--accent-soft", s3: "--s3-soft", ok: "--ok-soft" };
  function col(n) { return css(COLOR[n] || COLOR.tinta); }
  function niceTicks(a, b, n) {
    var span = b - a; if (!(span > 0)) return [a];
    var step = Math.pow(10, Math.floor(Math.log10(span / n))), err = n / span * step;
    if (err <= 0.15) step *= 10; else if (err <= 0.35) step *= 5; else if (err <= 0.75) step *= 2;
    var t = []; for (var v = Math.ceil(a / step) * step; v <= b + 1e-9 * span; v += step) t.push(Math.round(v / step) * step); return t;
  }
  function etiquetaEje(v, paso) { var d = paso >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(paso))); return Math.abs(v) >= 1e6 ? fmtN(v / 1e6, 2) + " M" : fmt(v, d); }
  function leyenda(g) {
    var it = [];
    (g.series || []).forEach(function (s) { if (s.nombre) it.push('<span><span class="sw" style="background:' + col(s.color || "tinta") + '"></span>' + esc(s.nombre) + "</span>"); });
    (g.vlineas || []).forEach(function (s) { if (s.nombre) it.push('<span><span class="sw" style="background:' + col(s.color || "acento") + '"></span>' + esc(s.nombre) + "</span>"); });
    if (g.rellenoNombre) it.push('<span><span class="sw" style="background:' + css(SUAVE[g.rellenoColor || "cola"]) + ";border:1px solid " + col(g.rellenoColor || "cola") + '"></span>' + esc(g.rellenoNombre) + "</span>");
    return it.join("");
  }
  function dibujar(g) {
    var cv = $("r-canvas"), dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
    if (!W) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.font = "12px " + css("--font-body");
    if (g.tipo === "barras") return barras(ctx, g, W, H);
    return xy(ctx, g, W, H);
  }
  function muestrear(s, xmin, xmax) {
    if (s.pts) return s.pts;
    var a = s.desde != null ? Math.max(s.desde, xmin) : xmin, b = s.hasta != null ? Math.min(s.hasta, xmax) : xmax, N = s.n || 300, pts = [];
    for (var i = 0; i <= N; i++) { var x = a + (b - a) * i / N, y = s.f(x); if (isFinite(y)) pts.push([x, y]); }
    return pts;
  }
  function xy(ctx, g, W, H) {
    var muted = css("--muted"), line = css("--line");
    var mL = 58, mR = 16, mT = 16, mB = 36, pw = W - mL - mR, ph = H - mT - mB;
    var xmin = g.xmin, xmax = g.xmax, series = (g.series || []).map(function (s) { return { s: s, pts: muestrear(s, xmin, xmax) }; });
    var ymin = g.ymin, ymax = g.ymax;
    if (ymin == null || ymax == null) {
      var lo = Infinity, hi = -Infinity;
      series.forEach(function (o) { o.pts.forEach(function (p) { if (p[0] >= xmin && p[0] <= xmax) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); } }); });
      (g.puntos || []).forEach(function (p) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); });
      (g.hlineas || []).forEach(function (h) { lo = Math.min(lo, h.y); hi = Math.max(hi, h.y); });
      if (!isFinite(lo)) { lo = 0; hi = 1; } if (hi === lo) { hi += 1; lo -= 1; }
      var pad = (hi - lo) * 0.08;
      if (ymin == null) ymin = lo >= 0 && lo - pad < 0 ? 0 : lo - pad;
      if (ymax == null) ymax = hi + pad;
    }
    function X(v) { return mL + pw * (v - xmin) / (xmax - xmin); }
    var rg = ymax - ymin;
    function Y(v) { return mT + ph * (1 - (Math.max(Math.min(v, ymax + 20 * rg), ymin - 20 * rg) - ymin) / rg); } // lo que sale del área lo recorta el clip
    ctx.strokeStyle = line; ctx.fillStyle = muted; ctx.lineWidth = 1;
    var tx = niceTicks(xmin, xmax, W < 420 ? 4 : 6), ty = niceTicks(ymin, ymax, 5);
    var px = tx.length > 1 ? tx[1] - tx[0] : 1, py = ty.length > 1 ? ty[1] - ty[0] : 1;
    tx.forEach(function (t) { var x = X(t); ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(x, mT); ctx.lineTo(x, mT + ph); ctx.stroke(); ctx.globalAlpha = 1; ctx.textAlign = "center"; ctx.fillText(g.fmtX ? g.fmtX(t) : etiquetaEje(t, px), x, H - mB + 16); });
    ty.forEach(function (t) { var y = Y(t); ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(mL, y); ctx.lineTo(mL + pw, y); ctx.stroke(); ctx.globalAlpha = 1; ctx.textAlign = "right"; ctx.fillText(g.fmtY ? g.fmtY(t) : etiquetaEje(t, py), mL - 6, y + 4); });
    ctx.beginPath(); ctx.moveTo(mL, mT + ph); ctx.lineTo(mL + pw, mT + ph); ctx.moveTo(mL, mT); ctx.lineTo(mL, mT + ph); ctx.stroke();
    if (g.xlab) { ctx.textAlign = "right"; ctx.fillText(g.xlab, mL + pw, H - 3); }
    if (g.ylab) { ctx.save(); ctx.translate(12, mT + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.fillText(g.ylab, 0, 0); ctx.restore(); }
    ctx.save(); ctx.beginPath(); ctx.rect(mL, mT - 2, pw, ph + 4); ctx.clip();
    // rellenos bajo curvas
    series.forEach(function (o) {
      (o.s.rellenos || []).forEach(function (rr) {
        var a = Math.max(rr.desde == null ? xmin : rr.desde, xmin), b = Math.min(rr.hasta == null ? xmax : rr.hasta, xmax); if (!(b > a)) return;
        ctx.beginPath(); ctx.moveTo(X(a), Y(Math.max(0, ymin)));
        var N = 200; for (var i = 0; i <= N; i++) { var x = a + (b - a) * i / N; ctx.lineTo(X(x), Y(o.s.f(x))); }
        ctx.lineTo(X(b), Y(Math.max(0, ymin))); ctx.closePath(); ctx.fillStyle = css(SUAVE[rr.color || "cola"]); ctx.fill();
      });
    });
    // series
    series.forEach(function (o) {
      var s = o.s, c = col(s.color || "tinta");
      if (s.tipo === "puntos") { ctx.fillStyle = c; o.pts.forEach(function (p) { ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 3.5, 0, 7); ctx.fill(); }); return; }
      ctx.strokeStyle = c; ctx.lineWidth = s.ancho || 2; ctx.setLineDash(s.guion ? [6, 4] : []);
      ctx.beginPath(); var empezado = false;
      o.pts.forEach(function (p) { var x = X(p[0]), y = Y(p[1]); if (!empezado) { ctx.moveTo(x, y); empezado = true; } else ctx.lineTo(x, y); });
      ctx.stroke(); ctx.setLineDash([]);
    });
    ctx.restore();
    // líneas de referencia
    (g.hlineas || []).forEach(function (h) {
      ctx.strokeStyle = col(h.color || "gris"); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(mL, Y(h.y)); ctx.lineTo(mL + pw, Y(h.y)); ctx.stroke(); ctx.setLineDash([]);
      if (h.texto) { ctx.fillStyle = col(h.color || "gris"); ctx.textAlign = "right"; ctx.fillText(h.texto, mL + pw - 4, Y(h.y) - 5); }
    });
    var nivel = 0;
    (g.vlineas || []).forEach(function (v) {
      if (v.x < xmin || v.x > xmax) { if (v.texto) { ctx.fillStyle = col(v.color || "acento"); ctx.textAlign = v.x > xmax ? "right" : "left"; ctx.fillText(v.x > xmax ? v.texto + " (fuera del gráfico) →" : "← " + v.texto + " (fuera del gráfico)", v.x > xmax ? mL + pw : mL + 4, mT + 12 + 14 * nivel++); } return; }
      var x = X(v.x); ctx.strokeStyle = col(v.color || "acento"); ctx.lineWidth = v.ancho || 1.5; ctx.setLineDash(v.solida ? [] : [5, 4]);
      ctx.beginPath(); ctx.moveTo(x, mT); ctx.lineTo(x, mT + ph); ctx.stroke(); ctx.setLineDash([]);
      if (v.texto) { ctx.fillStyle = col(v.color || "acento"); ctx.textAlign = x > mL + pw * 0.7 ? "right" : "left"; ctx.fillText(" " + v.texto + " ", x, mT + 12 + 14 * nivel++); }
    });
    (g.puntos || []).forEach(function (p) {
      var x = X(p.x), y = Y(p.y); ctx.fillStyle = col(p.color || "tinta"); ctx.beginPath(); ctx.arc(x, y, p.r || 5, 0, 7); ctx.fill();
      if (p.guias) { ctx.strokeStyle = col(p.color || "tinta"); ctx.globalAlpha = .55; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, mT + ph); ctx.moveTo(x, y); ctx.lineTo(mL, y); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
      if (p.texto) { ctx.fillStyle = col(p.color || "tinta"); ctx.textAlign = x > mL + pw * 0.75 ? "right" : "left"; ctx.fillText(p.texto, x + (x > mL + pw * 0.75 ? -8 : 8), y - 8); }
    });
    (g.etiquetas || []).forEach(function (e) { var x = X(e.x), y = Y(e.y); ctx.fillStyle = col(e.color || "tinta"); ctx.textAlign = e.alinear || "left"; ctx.font = "600 12px " + css("--font-body"); ctx.fillText(e.texto, x, y); ctx.font = "12px " + css("--font-body"); });
  }
  function barras(ctx, g, W, H) {
    var muted = css("--muted"), line = css("--line"), mL = 62, mR = 12, mT = 14, mB = 34, pw = W - mL - mR, ph = H - mT - mB;
    var n = g.cats.length, ymax = 0, ymin = 0;
    for (var i = 0; i < n; i++) {
      if (g.apilado) { var s = 0, neg = 0; g.series.forEach(function (se) { var v = se.valores[i] || 0; if (v >= 0) s += v; else neg += v; }); ymax = Math.max(ymax, s); ymin = Math.min(ymin, neg); }
      else g.series.forEach(function (se) { ymax = Math.max(ymax, se.valores[i] || 0); ymin = Math.min(ymin, se.valores[i] || 0); });
    }
    if (ymax === ymin) ymax = ymin + 1; ymax *= 1.06; if (ymin < 0) ymin *= 1.06;
    function Y(v) { return mT + ph * (1 - (v - ymin) / (ymax - ymin)); }
    var ty = niceTicks(ymin, ymax, 5), py = ty.length > 1 ? ty[1] - ty[0] : 1;
    ctx.strokeStyle = line; ctx.fillStyle = muted; ctx.lineWidth = 1;
    ty.forEach(function (t) { var y = Y(t); ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(mL, y); ctx.lineTo(mL + pw, y); ctx.stroke(); ctx.globalAlpha = 1; ctx.textAlign = "right"; ctx.fillText(etiquetaEje(t, py), mL - 6, y + 4); });
    ctx.beginPath(); ctx.moveTo(mL, Y(0)); ctx.lineTo(mL + pw, Y(0)); ctx.stroke();
    var paso = pw / n, ancho = Math.max(2, Math.min(46, paso * 0.72)), cada = Math.ceil(n / Math.max(1, Math.floor(pw / 44)));
    for (var k = 0; k < n; k++) {
      var cx = mL + paso * (k + 0.5), base = 0, baseN = 0;
      g.series.forEach(function (se, j) {
        var v = se.valores[k] || 0; ctx.fillStyle = col(se.color || ["acento", "cola", "s3", "s4"][j % 4]);
        if (g.apilado) { var y0 = v >= 0 ? base : baseN, y1 = y0 + v; ctx.fillRect(cx - ancho / 2, Math.min(Y(y0), Y(y1)), ancho, Math.abs(Y(y1) - Y(y0))); if (v >= 0) base = y1; else baseN = y1; }
        else { var w = ancho / g.series.length, x0 = cx - ancho / 2 + j * w; ctx.fillRect(x0, Math.min(Y(0), Y(v)), w - 1, Math.abs(Y(v) - Y(0))); }
      });
      if (k % cada === 0) { ctx.fillStyle = muted; ctx.textAlign = "center"; ctx.fillText(g.cats[k], cx, H - mB + 16); }
    }
    if (g.xlab) { ctx.fillStyle = muted; ctx.textAlign = "right"; ctx.fillText(g.xlab, mL + pw, H - 3); }
    if (g.ylab) { ctx.save(); ctx.fillStyle = muted; ctx.translate(12, mT + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.fillText(g.ylab, 0, 0); ctx.restore(); }
  }
  /* Ayuda para pruebas: gráfico de una densidad con las colas sombreadas */
  function graficoDensidad(o) {
    // o: {f, xmin, xmax, colas:[{desde,hasta}], estad, criticos:[x], etEstad, ymax}
    var rell = (o.colas || []).map(function (c) { return { desde: c.desde, hasta: c.hasta, color: "cola" }; });
    var v = [];
    (o.criticos || []).forEach(function (c, i) { v.push({ x: c, color: "acento", texto: "crítico = " + fmt(c, 3), nombre: i === 0 ? "Valor crítico" : null }); });
    if (o.estad != null && isFinite(o.estad)) v.push({ x: o.estad, color: "cola", solida: true, ancho: 2, texto: (o.etEstad || "estadístico") + " = " + fmt(o.estad, 3), nombre: (o.etEstad || "Estadístico") + " calculado" });
    return { tipo: "xy", xmin: o.xmin, xmax: o.xmax, ymin: 0, ymax: o.ymax, xlab: o.xlab, ylab: "Densidad", series: [{ f: o.f, color: "tinta", rellenos: rell, n: 400 }], vlineas: v, rellenoNombre: o.rellenoNombre || "Área del valor p", rellenoColor: "cola" };
  }

  /* =========================================================== armado de páginas */
  function paginaCalculadora(def) {
    C = def; document.title = def.titulo + " · Calculadoras";
    modo = def.modos && def.modos.length ? def.modos[0].id : null;
    var q = new URLSearchParams(location.search); if (q.get("modo") && (def.modos || []).some(function (m) { return m.id === q.get("modo"); })) modo = q.get("modo");
    reiniciar();
    var tabs = def.modos && def.modos.length > 1 ? '<div class="tabs" role="tablist" aria-label="Modo de cálculo">' + def.modos.map(function (m) { return '<button class="tab" role="tab" data-modo="' + m.id + '" aria-selected="' + (m.id === modo) + '">' + esc(m.nombre) + "</button>"; }).join("") + "</div>" : "";
    var enApp = !!q.get("app"); // dentro del Calificador el título y el regreso ya están arriba
    document.body.innerHTML = '<div class="wrap">' +
      (enApp ? "" : '<nav class="migas"><a href="./' + (q.get("embed") ? "?embed=1" : "") + '">← Todas las calculadoras</a><span>·</span><span>' + esc(def.area) + "</span></nav>") +
      "<header>" + (enApp ? "" : "<h1>" + esc(def.titulo) + "</h1>") + '<p class="sub">' + def.descripcion + "</p></header>" + tabs +
      '<div class="grid"><section class="card" aria-labelledby="h-datos"><h2 id="h-datos">Datos</h2><div class="campos" id="campos"></div>' +
      '<div class="btns"><button class="b primary" id="btn-calc" type="button">Calcular</button><button class="b" id="btn-ej" type="button">Cargar ejemplo</button></div>' +
      '<div id="msg" class="hidden" role="alert"></div></section>' +
      '<section class="card result" aria-labelledby="h-res" aria-live="polite"><h2 id="h-res">Resultado</h2>' +
      '<div class="pbox"><div><div class="plabel" id="r-plabel">Resultado</div><div class="pval" id="r-pval">—</div></div><span class="hidden" id="r-pill"></span></div>' +
      '<div class="stats" id="r-stats"></div><p class="concl" id="r-concl"></p>' +
      '<div id="r-graf" class="hidden" style="display:grid;gap:8px"><canvas id="r-canvas" role="img" aria-label="Gráfico del resultado"></canvas><div class="legend" id="r-leyenda"></div></div>' +
      '<div class="btns"><button class="b" id="btn-copy" type="button">Copiar resultado</button><button class="b" id="btn-print" type="button">Imprimir</button><span class="copied hidden" id="copied">Copiado</span></div></section></div>' +
      '<section class="card steps" id="desarrollo" aria-labelledby="h-steps"><h2 id="h-steps">Desarrollo</h2><div id="r-extra" style="display:grid;gap:12px"></div><ol id="r-pasos"></ol></section>' +
      (def.pie ? "<footer>" + def.pie + "</footer>" : "") + "</div>";
    pintarCampos();
    var cont = $("campos");
    cont.addEventListener("input", alEditar); cont.addEventListener("change", function (e) { if (e.target.tagName === "SELECT" || e.target.type === "checkbox" || e.target.type === "date") alEditar(e); });
    cont.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") { clearTimeout(temporizador); calcular(); } });
    document.querySelectorAll(".tab").forEach(function (t) { t.addEventListener("click", function () { modo = t.getAttribute("data-modo"); estado = estados[modo]; document.querySelectorAll(".tab").forEach(function (x) { x.setAttribute("aria-selected", x === t); }); pintarCampos(); calcular(); }); });
    $("btn-calc").onclick = calcular;
    $("btn-ej").onclick = function () { reiniciar(); pintarCampos(); calcular(); };
    $("btn-copy").onclick = function () { if (ultimo) copiar(textoResultado(ultimo), $("copied")); };
    $("btn-print").onclick = function () { window.print(); };
    $("r-extra").addEventListener("click", function (e) { var b = e.target.closest("[data-copiar-tabla]"); if (b && ultimo) copiar(tsv(ultimo.tablas[+b.getAttribute("data-copiar-tabla")]), $("copied")); });
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { if (ultimo && ultimo.grafico) dibujar(ultimo.grafico); }, 120); });
    if (window.matchMedia) { var mq = window.matchMedia("(prefers-color-scheme: dark)"); if (mq.addEventListener) mq.addEventListener("change", function () { if (ultimo && ultimo.grafico) dibujar(ultimo.grafico); }); }
    calcular();
  }

  function sinTildes(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function paginaCatalogo() {
    document.title = "Calculadoras · Calificador IA";
    var q = new URLSearchParams(location.search), embed = q.get("embed") ? "&embed=1" : "", area = "Todas";
    document.body.innerHTML = '<div class="wrap"><header><h1>Calculadoras</h1><p class="sub">Estadística, finanzas, economía y conversores, con el resultado, el gráfico y el desarrollo paso a paso. Elija una calculadora o búsquela por nombre.</p></header>' +
      '<div class="buscador"><input type="text" id="buscar" placeholder="Buscar: chi-cuadrado, amortización, IS-LM…" aria-label="Buscar calculadora"><div class="chips" id="chips"></div></div><div id="cat" style="display:grid;gap:22px"></div>' +
      "<footer>Calculadoras del Calificador IA · Lic. Salvador Ortega Pardo</footer></div>";
    function pintar() {
      var texto = sinTildes($("buscar").value.trim());
      $("chips").innerHTML = ["Todas"].concat(AREAS).map(function (a) { return '<button class="chip" type="button" aria-pressed="' + (a === area) + '" data-area="' + a + '">' + a + "</button>"; }).join("");
      var h = "";
      AREAS.forEach(function (a) {
        if (area !== "Todas" && area !== a) return;
        var cs = lista.filter(function (c) { return c.area === a && (!texto || sinTildes(c.titulo + " " + c.resumen + " " + (c.palabras || "")).indexOf(texto) >= 0); });
        if (!cs.length) return;
        h += '<section class="area"><h2>' + a + '</h2><div class="tarjetas">' + cs.map(function (c) { return '<a class="tarjeta" href="?c=' + c.id + embed + '"><b>' + esc(c.titulo) + "</b><span>" + esc(c.resumen) + "</span></a>"; }).join("") + "</div></section>";
      });
      $("cat").innerHTML = h || '<p class="sub">No hay calculadoras con ese nombre. Pruebe con otra palabra.</p>';
    }
    $("buscar").addEventListener("input", pintar);
    $("chips").addEventListener("click", function (e) { var b = e.target.closest("[data-area]"); if (b) { area = b.getAttribute("data-area"); pintar(); } });
    pintar();
  }

  function iniciar() {
    var id = new URLSearchParams(location.search).get("c"), def = id ? buscar(id) : null;
    if (def) paginaCalculadora(def); else paginaCatalogo();
  }

  return {
    registrar: registrar, lista: lista, iniciar: iniciar, AREAS: AREAS,
    M: { lnGamma: lnGamma, gammaP: gammaP, gammaQ: gammaQ, betai: betai, normSF: normSF, normCDF: normCDF, normPdf: normPdf, normInv: normInv, tSF: tSF, tPdf: tPdf, chiSF: chiSF, chiPdf: chiPdf, fSF: fSF, fPdf: fPdf, zCrit: zCrit, tCrit: tCrit, chiCrit: chiCrit, fCrit: fCrit, lnComb: lnComb, suma: suma, media: media, varianza: varianza, raiz: raiz, invSF: invSF },
    fmt: fmt, fmtN: fmtN, fmtP: fmtP, pct: pct, num: num, numeros: numeros, esc: esc, graficoDensidad: graficoDensidad
  };
})();
