/* Conversores y cálculos de uso diario. */
(function () {
  "use strict";
  var fmt = CALC.fmt, fmtN = CALC.fmtN, pct = CALC.pct;
  var A = "Conversores";

  /* ------------------------------------------------------------ 1. Monedas */
  function monedas(s) { return [["Bs", "Bolivianos (Bs)"]].concat((s.tc && s.tc.filas || []).map(function (f, i) { return [String(i), f]; })); }
  CALC.registrar({
    id: "monedas", area: A, titulo: "Conversor de monedas", resumen: "Con el tipo de cambio que usted escriba.",
    palabras: "moneda divisa tipo cambio dolar euro boliviano bs usd conversion real sol peso",
    descripcion: "Convierta montos entre bolivianos y otras monedas con el tipo de cambio que usted indique (oficial, paralelo, de compra o de venta).",
    campos: [
      { id: "monto", etiqueta: "Monto", valor: "1000" },
      { id: "de", tipo: "sel", etiqueta: "De", valor: "0", opciones: monedas },
      { id: "a", tipo: "sel", etiqueta: "A", valor: "Bs", opciones: monedas },
      { id: "tc", tipo: "tabla", colsFijas: true, etFilas: "Número de monedas", etFila: "Moneda ", min: 1, max: 12, valor: { filas: ["Dólar (USD)", "Euro (EUR)", "Real (BRL)", "Sol (PEN)"], cols: ["Bs por 1 unidad"], datos: [["6,96"], ["7,60"], ["1,25"], ["1,90"]] },
        ayuda: "Los tipos de cambio son de ejemplo: escriba los del día. Puede cambiar el nombre de cada moneda y agregar más." }
    ],
    calcular: function (v) {
      var tc = v.tc, tasa = function (k) { if (k === "Bs") return 1; var x = tc.datos[+k][0]; if (!(x > 0)) throw new Error("El tipo de cambio de «" + tc.filas[+k] + "» debe ser mayor que 0."); return x; };
      var nombre = function (k) { return k === "Bs" ? "Bs" : tc.filas[+k]; };
      var enBs = v.monto * tasa(v.de), res = enBs / tasa(v.a);
      var fil = [["Bolivianos (Bs)", 1, enBs]].concat(tc.filas.map(function (f, i) { return [f, tc.datos[i][0], enBs / tasa(String(i))]; }));
      return {
        principal: { etiqueta: "En " + nombre(v.a), valor: fmt(res, 2) },
        stats: [["Equivalente en bolivianos", fmt(enBs, 2) + " Bs"], ["Tipo de cambio aplicado", "1 " + nombre(v.de) + " = " + fmtN(tasa(v.de) / tasa(v.a), 6) + " " + nombre(v.a)]],
        conclusion: fmtN(v.monto, 2) + " " + nombre(v.de) + " equivalen a " + fmt(res, 2) + " " + nombre(v.a) + ".",
        tablas: [{ titulo: "El monto en todas las monedas", cab: ["Moneda", "Bs por 1 unidad", "Monto equivalente"], filas: fil, dec: [0, 4, 2] }],
        pasos: ["Se pasa primero a bolivianos: " + fmtN(v.monto, 2) + " × " + fmtN(tasa(v.de), 6) + " = " + fmt(enBs, 2) + " Bs.", "Luego a la moneda de destino: " + fmt(enBs, 2) + " / " + fmtN(tasa(v.a), 6) + " = " + fmt(res, 2) + " " + nombre(v.a) + "."]
      };
    }
  });

  /* ------------------------------------------------------------ 2. Unidades */
  var U = {
    longitud: { nombre: "Longitud", u: [["km", "Kilómetro (km)", 1000], ["m", "Metro (m)", 1], ["cm", "Centímetro (cm)", 0.01], ["mm", "Milímetro (mm)", 0.001], ["mi", "Milla (mi)", 1609.344], ["nmi", "Milla náutica", 1852], ["yd", "Yarda (yd)", 0.9144], ["ft", "Pie (ft)", 0.3048], ["in", "Pulgada (in)", 0.0254]] },
    masa: { nombre: "Masa", u: [["t", "Tonelada (t)", 1000], ["qq", "Quintal (46 kg)", 46], ["@", "Arroba (11,5 kg)", 11.5], ["kg", "Kilogramo (kg)", 1], ["g", "Gramo (g)", 0.001], ["mg", "Miligramo (mg)", 1e-6], ["lb", "Libra (lb)", 0.45359237], ["oz", "Onza (oz)", 0.028349523125]] },
    area: { nombre: "Superficie", u: [["km2", "Kilómetro cuadrado (km²)", 1e6], ["ha", "Hectárea (ha)", 1e4], ["m2", "Metro cuadrado (m²)", 1], ["cm2", "Centímetro cuadrado (cm²)", 1e-4], ["acre", "Acre", 4046.8564224], ["ft2", "Pie cuadrado (ft²)", 0.09290304]] },
    volumen: { nombre: "Volumen", u: [["m3", "Metro cúbico (m³)", 1000], ["l", "Litro (L)", 1], ["ml", "Mililitro (mL)", 0.001], ["gal", "Galón EE. UU.", 3.785411784], ["bbl", "Barril de petróleo", 158.987294928], ["ft3", "Pie cúbico (ft³)", 28.316846592]] },
    tiempo: { nombre: "Tiempo", u: [["anio", "Año (365 días)", 31536000], ["mes", "Mes (30 días)", 2592000], ["sem", "Semana", 604800], ["dia", "Día", 86400], ["h", "Hora", 3600], ["min", "Minuto", 60], ["s", "Segundo", 1]] },
    velocidad: { nombre: "Velocidad", u: [["kmh", "Kilómetros por hora", 1 / 3.6], ["ms", "Metros por segundo", 1], ["mph", "Millas por hora", 0.44704], ["kn", "Nudo", 1852 / 3600]] },
    datos: { nombre: "Datos digitales", u: [["bit", "Bit", 0.125], ["B", "Byte (B)", 1], ["KB", "Kilobyte (KB)", 1e3], ["MB", "Megabyte (MB)", 1e6], ["GB", "Gigabyte (GB)", 1e9], ["TB", "Terabyte (TB)", 1e12], ["KiB", "Kibibyte (KiB)", 1024], ["MiB", "Mebibyte (MiB)", 1048576], ["GiB", "Gibibyte (GiB)", 1073741824]] },
    temperatura: { nombre: "Temperatura", u: [["C", "Grados Celsius (°C)"], ["F", "Grados Fahrenheit (°F)"], ["K", "Kelvin (K)"]] }
  };
  function aKelvin(x, u) { return u === "C" ? x + 273.15 : u === "F" ? (x - 32) * 5 / 9 + 273.15 : x; }
  function deKelvin(k, u) { return u === "C" ? k - 273.15 : u === "F" ? (k - 273.15) * 9 / 5 + 32 : k; }
  function opcionesU(s) { return U[s.mag || "longitud"].u.map(function (x) { return [x[0], x[1]]; }); }
  CALC.registrar({
    id: "unidades", area: A, titulo: "Conversor de unidades", resumen: "Longitud, masa, superficie, volumen, tiempo, velocidad, temperatura y datos.",
    palabras: "unidades medida conversion metro kilometro milla libra kilo quintal arroba hectarea litro galon barril temperatura celsius fahrenheit byte",
    descripcion: "Convierta medidas entre unidades del sistema métrico, del sistema inglés y unidades de uso local como el quintal y la arroba.",
    campos: [
      { id: "mag", tipo: "sel", etiqueta: "Magnitud", valor: "masa", ancho: true, opciones: Object.keys(U).map(function (k) { return [k, U[k].nombre]; }) },
      { id: "x", etiqueta: "Valor", valor: "3" },
      { id: "de", tipo: "sel", etiqueta: "De", valor: "qq", opciones: opcionesU },
      { id: "a", tipo: "sel", etiqueta: "A", valor: "kg", indice: 1, opciones: opcionesU }
    ],
    calcular: function (v) {
      var mg = U[v.mag], nom = function (k) { return mg.u.filter(function (x) { return x[0] === k; })[0][1]; }, res, fil;
      if (v.mag === "temperatura") {
        var k = aKelvin(v.x, v.de); if (k < 0) throw new Error("Esa temperatura está por debajo del cero absoluto.");
        res = deKelvin(k, v.a); fil = mg.u.map(function (u) { return [u[1], deKelvin(k, u[0])]; });
        return { principal: { etiqueta: nom(v.a), valor: fmtN(res, 4) }, conclusion: fmtN(v.x, 4) + " " + nom(v.de) + " = " + fmtN(res, 4) + " " + nom(v.a) + ".", tablas: [{ titulo: "Equivalencias", cab: ["Unidad", "Valor"], filas: fil, dec: [0, 4] }],
          pasos: ["°F = °C × 9/5 + 32;  K = °C + 273,15;  °C = (°F − 32) × 5/9."] };
      }
      var f = function (k) { return mg.u.filter(function (x) { return x[0] === k; })[0][2]; }, base = v.x * f(v.de);
      res = base / f(v.a); fil = mg.u.map(function (u) { return [u[1], base / u[2]]; });
      var dec = function (x) { var a = Math.abs(x); return a === 0 || a >= 1 ? 6 : Math.min(12, 4 + Math.ceil(-Math.log10(a))); };
      return { principal: { etiqueta: nom(v.a), valor: fmtN(res, dec(res)) }, stats: [["Factor", "1 " + nom(v.de) + " = " + fmtN(f(v.de) / f(v.a), 8) + " " + nom(v.a)]],
        conclusion: fmtN(v.x, 6) + " " + nom(v.de) + " = " + fmtN(res, dec(res)) + " " + nom(v.a) + ".",
        tablas: [{ titulo: "Equivalencias", cab: ["Unidad", "Valor"], filas: fil.map(function (r) { return [r[0], fmtN(r[1], dec(r[1]))]; }) }],
        pasos: ["Se multiplica por el factor de conversión: " + fmtN(v.x, 6) + " × " + fmtN(f(v.de) / f(v.a), 8) + " = " + fmtN(res, dec(res)) + "."] };
    }
  });

  /* ------------------------------------------------------------ 3. Fechas */
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  function fecha(s) { var p = String(s).split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function txtF(d) { return DIAS[d.getUTCDay()] + " " + d.getUTCDate() + "/" + String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + d.getUTCFullYear(); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function hoy(mas) { var d = new Date(); d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + (mas || 0))); return iso(d); }
  function habiles(a, b) { var n = 0, d = new Date(a); while (d < b) { d.setUTCDate(d.getUTCDate() + 1); var w = d.getUTCDay(); if (w !== 0 && w !== 6) n++; } return n; }
  CALC.registrar({
    id: "fechas", area: A, titulo: "Calculadora de fechas y plazos", resumen: "Días entre fechas (reales y comerciales), sumar días o meses, días hábiles.",
    palabras: "fecha dias plazo vencimiento calendario año comercial 360 365 dias habiles sumar meses edad semana",
    descripcion: "Calcule los días entre dos fechas (año real o comercial de 360 días), la fecha de vencimiento de un plazo o los días hábiles.",
    modos: [
      { id: "entre", nombre: "Días entre dos fechas", campos: [{ id: "f1", tipo: "fecha", etiqueta: "Fecha inicial", valor: hoy(0) }, { id: "f2", tipo: "fecha", etiqueta: "Fecha final", valor: hoy(90) }] },
      { id: "sumar", nombre: "Fecha de vencimiento", campos: [{ id: "f1", tipo: "fecha", etiqueta: "Fecha inicial", valor: hoy(0) }, { id: "cant", etiqueta: "Cantidad", valor: "90", entero: true }, { id: "uni", tipo: "sel", etiqueta: "Unidad", valor: "dias", opciones: [["dias", "Días calendario"], ["habiles", "Días hábiles (lunes a viernes)"], ["semanas", "Semanas"], ["meses", "Meses"], ["anios", "Años"]] }] }
    ],
    calcular: function (v) {
      var a = fecha(v.f1);
      if (v.modo === "entre") {
        var b = fecha(v.f2), neg = b < a; if (neg) { var t = a; a = b; b = t; }
        var dias = Math.round((b - a) / 864e5), d360 = (b.getUTCFullYear() - a.getUTCFullYear()) * 360 + (b.getUTCMonth() - a.getUTCMonth()) * 30 + (Math.min(b.getUTCDate(), 30) - Math.min(a.getUTCDate(), 30));
        var y = b.getUTCFullYear() - a.getUTCFullYear(), m = b.getUTCMonth() - a.getUTCMonth(), d = b.getUTCDate() - a.getUTCDate();
        if (d < 0) { m--; d += new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), 0)).getUTCDate(); } if (m < 0) { y--; m += 12; }
        return { principal: { etiqueta: "Días calendario", valor: fmtN(dias) }, stats: [["Días comerciales (30/360)", fmtN(d360)], ["Días hábiles (lun.–vie.)", fmtN(habiles(a, b))], ["Semanas", fmtN(dias / 7, 2)], ["Años, meses y días", y + " a, " + m + " m, " + d + " d"], ["Fracción de año (365)", fmtN(dias / 365, 6)], ["Fracción de año (360)", fmtN(d360 / 360, 6)]],
          conclusion: "Del " + txtF(a) + " al " + txtF(b) + " hay " + fmtN(dias) + " días calendario (" + fmtN(d360) + " días en año comercial)." + (neg ? " Las fechas estaban invertidas; se tomaron en orden." : ""),
          pasos: ["Días calendario: diferencia exacta entre las fechas (no se cuenta el día inicial).", "Días comerciales (método europeo 30/360): cada mes cuenta 30 días → (años × 360) + (meses × 30) + (días, máximo 30) = " + fmtN(d360) + ".", "Los días hábiles no descuentan feriados."] };
      }
      var r = new Date(a), n = v.cant;
      if (v.uni === "dias") r.setUTCDate(r.getUTCDate() + n);
      else if (v.uni === "semanas") r.setUTCDate(r.getUTCDate() + 7 * n);
      else if (v.uni === "habiles") { var paso = n >= 0 ? 1 : -1, k = Math.abs(n); while (k > 0) { r.setUTCDate(r.getUTCDate() + paso); var w = r.getUTCDay(); if (w !== 0 && w !== 6) k--; } }
      else { var mm = v.uni === "meses" ? n : 12 * n, dia = r.getUTCDate(); r = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + mm, 1)); var ult = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate(); r.setUTCDate(Math.min(dia, ult)); }
      var w2 = r.getUTCDay();
      return { principal: { etiqueta: "Fecha resultante", valor: r.getUTCDate() + "/" + String(r.getUTCMonth() + 1).padStart(2, "0") + "/" + r.getUTCFullYear() }, pill: { texto: DIAS[w2].charAt(0).toUpperCase() + DIAS[w2].slice(1), tipo: w2 === 0 || w2 === 6 ? "aviso" : "info" },
        stats: [["Días calendario transcurridos", fmtN(Math.round((r - a) / 864e5))]],
        conclusion: "Partiendo del " + txtF(a) + " y " + (n >= 0 ? "sumando " : "restando ") + fmtN(Math.abs(n)) + " " + { dias: "días", habiles: "días hábiles", semanas: "semanas", meses: "meses", anios: "años" }[v.uni] + ", se llega al " + txtF(r) + "." + (w2 === 0 || w2 === 6 ? " Cae en fin de semana." : ""),
        pasos: [v.uni === "meses" || v.uni === "anios" ? "Al sumar meses se conserva el día del mes; si ese día no existe (por ejemplo, 31 de febrero), se toma el último día del mes." : v.uni === "habiles" ? "Se avanza día por día saltando sábados y domingos (no se descuentan feriados)." : "Se suman días calendario."] };
    }
  });

  /* ------------------------------------------------------------ 4. Porcentajes */
  CALC.registrar({
    id: "porcentajes", area: A, titulo: "Porcentajes, IVA y regla de tres", resumen: "Porcentaje de un número, variación, descuentos, IVA incluido y regla de tres.",
    palabras: "porcentaje variacion aumento descuento incremento iva impuesto 13 factura precio neto regla tres directa inversa proporcion",
    descripcion: "Resuelva los cálculos de porcentajes más comunes, separe el IVA incluido en un precio y aplique la regla de tres directa o inversa.",
    modos: [
      { id: "de", nombre: "X % de Y", campos: [{ id: "p", etiqueta: "Porcentaje (%)", valor: "15" }, { id: "y", etiqueta: "Del número", valor: "2400" }] },
      { id: "que", nombre: "¿Qué % es?", campos: [{ id: "x", etiqueta: "Parte", valor: "360" }, { id: "y", etiqueta: "Del total", valor: "2400" }] },
      { id: "var", nombre: "Variación %", campos: [{ id: "x", etiqueta: "Valor inicial", valor: "2400" }, { id: "y", etiqueta: "Valor final", valor: "2760" }] },
      { id: "aum", nombre: "Aumento o descuento", campos: [{ id: "y", etiqueta: "Valor original", valor: "2400" }, { id: "p", etiqueta: "Porcentaje (%)", valor: "15" }, { id: "dir", tipo: "sel", etiqueta: "Operación", valor: "desc", opciones: [["desc", "Descuento"], ["aum", "Aumento"]] }, { id: "inv", tipo: "check", etiqueta: "Conozco el valor final y quiero el original" }] },
      { id: "iva", nombre: "IVA incluido", campos: [{ id: "y", etiqueta: "Monto", valor: "1130" }, { id: "p", etiqueta: "Tasa del impuesto (%)", valor: "13", min: 0, ayuda: "En Bolivia, el IVA es 13 % y está incluido en el precio facturado." }, { id: "incl", tipo: "sel", etiqueta: "El monto", valor: "incluye", opciones: [["incluye", "Ya incluye el impuesto"], ["sin", "No incluye el impuesto"]] }] },
      { id: "tres", nombre: "Regla de tres", campos: [{ id: "a", etiqueta: "Si A", valor: "5" }, { id: "b", etiqueta: "corresponde a B", valor: "120" }, { id: "c", etiqueta: "entonces C", valor: "8" }, { id: "tipo", tipo: "sel", etiqueta: "Proporción", valor: "directa", opciones: [["directa", "Directa (más → más)"], ["inversa", "Inversa (más → menos)"]] }] }
    ],
    calcular: function (v) {
      var r;
      if (v.modo === "de") { r = v.p / 100 * v.y; return { principal: { etiqueta: fmtN(v.p) + " % de " + fmtN(v.y), valor: fmtN(r, 4) }, pasos: [fmtN(v.p) + " / 100 × " + fmtN(v.y) + " = " + fmtN(r, 4) + "."] }; }
      if (v.modo === "que") { if (v.y === 0) throw new Error("El total no puede ser cero."); r = v.x / v.y; return { principal: { etiqueta: "Porcentaje", valor: pct(r, 4) }, conclusion: fmtN(v.x) + " es el " + pct(r, 2) + " de " + fmtN(v.y) + ".", pasos: [fmtN(v.x) + " / " + fmtN(v.y) + " × 100 = " + pct(r, 4) + "."] }; }
      if (v.modo === "var") { if (v.x === 0) throw new Error("El valor inicial no puede ser cero."); r = (v.y - v.x) / Math.abs(v.x); return { principal: { etiqueta: "Variación porcentual", valor: (r > 0 ? "+" : "") + pct(r, 2) }, pill: { texto: r > 0 ? "Aumento" : r < 0 ? "Disminución" : "Sin cambio", tipo: r > 0 ? "ok" : r < 0 ? "mal" : "info" }, stats: [["Variación absoluta", fmtN(v.y - v.x, 4)], ["Factor", fmtN(v.y / v.x, 6)]], pasos: ["(Final − inicial) / inicial × 100 = (" + fmtN(v.y) + " − " + fmtN(v.x) + ") / " + fmtN(v.x) + " × 100 = " + pct(r, 4) + "."] }; }
      if (v.modo === "aum") {
        var f = v.dir === "desc" ? 1 - v.p / 100 : 1 + v.p / 100;
        if (v.inv) { if (f === 0) throw new Error("Con un descuento del 100 % no se puede recuperar el valor original."); r = v.y / f; return { principal: { etiqueta: "Valor original", valor: fmt(r, 2) }, stats: [["Diferencia", fmt(Math.abs(v.y - r), 2)]], conclusion: "Antes del " + (v.dir === "desc" ? "descuento" : "aumento") + " de " + fmtN(v.p) + " %, el valor era " + fmt(r, 2) + ".", pasos: ["Valor original = valor final / " + fmtN(f, 6) + " = " + fmt(r, 2) + ". (Ojo: no es lo mismo que " + (v.dir === "desc" ? "sumar" : "restar") + " " + fmtN(v.p) + " %.)"] }; }
        r = v.y * f; return { principal: { etiqueta: "Valor final", valor: fmt(r, 2) }, stats: [[v.dir === "desc" ? "Descuento" : "Aumento", fmt(Math.abs(r - v.y), 2)]], pasos: ["Valor final = " + fmtN(v.y) + " × (1 " + (v.dir === "desc" ? "−" : "+") + " " + fmtN(v.p / 100) + ") = " + fmt(r, 2) + "."] };
      }
      if (v.modo === "iva") {
        var t = v.p / 100, neto, imp, total;
        if (v.incl === "incluye") { total = v.y; imp = total * t; neto = total - imp; }
        else { neto = v.y; total = neto / (1 - t); imp = total - neto; }
        return { principal: { etiqueta: "Impuesto", valor: fmt(imp, 2) }, stats: [["Precio total facturado", fmt(total, 2)], ["Monto neto (sin impuesto)", fmt(neto, 2)], ["Tasa efectiva sobre el neto", pct(imp / neto, 2)]],
          conclusion: "De un total de " + fmt(total, 2) + ", el impuesto es " + fmt(imp, 2) + " y el monto neto " + fmt(neto, 2) + ".",
          pasos: v.incl === "incluye" ? ["El IVA boliviano se calcula sobre el precio que ya lo incluye: impuesto = total × " + fmtN(v.p) + " % = " + fmt(imp, 2) + ".", "Neto = total − impuesto = " + fmt(neto, 2) + ". Sobre el neto, la tasa efectiva es " + pct(imp / neto, 2) + "."] : ["Precio a facturar = neto / (1 − " + fmtN(t) + ") = " + fmt(total, 2) + ", para que el impuesto incluido (" + fmtN(v.p) + " % del total) sea " + fmt(imp, 2) + "."] };
      }
      if (v.a === 0 || (v.tipo === "inversa" && v.c === 0)) throw new Error("A (y C en la inversa) no pueden ser cero.");
      r = v.tipo === "directa" ? v.b * v.c / v.a : v.a * v.b / v.c;
      return { principal: { etiqueta: "Resultado (X)", valor: fmtN(r, 4) }, conclusion: "Si " + fmtN(v.a) + " corresponde a " + fmtN(v.b) + ", entonces " + fmtN(v.c) + " corresponde a " + fmtN(r, 4) + " (proporción " + v.tipo + ").",
        pasos: [v.tipo === "directa" ? "Directa: X = B × C / A = " + fmtN(v.b) + " × " + fmtN(v.c) + " / " + fmtN(v.a) + " = " + fmtN(r, 4) + "." : "Inversa: X = A × B / C = " + fmtN(v.a) + " × " + fmtN(v.b) + " / " + fmtN(v.c) + " = " + fmtN(r, 4) + "."] };
    }
  });
})();
