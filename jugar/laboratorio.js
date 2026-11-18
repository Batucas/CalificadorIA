/* Calificador IA — Laboratorios en vivo (portal «jugar»).
   El docente abre una sala con un laboratorio de la biblioteca. Aquí cada equipo entra (con su nombre de la lista del
   curso, y su equipo sale solo, o eligiendo su equipo si no hay lista) y el laboratorio se abre dentro de un marco
   aislado (sandbox sin «allow-same-origin»): no puede leer el token del equipo ni nada de esta página. Solo habla con el
   portal por mensajes, a través de window.CalificadorLab:
     CalificadorLab.vivo          → {rol: "equipo", equipo, nombre_equipo, nombre, codigo}
     CalificadorLab.enviarOrden(datos) → Promise: se cumple cuando el servidor la aceptó (si no hay red, se reintenta
                                    sola) y se rechaza si el periodo ya se cerró o la orden no es válida.
     CalificadorLab.escuchar(fn)  → fn(estado) cada vez que llega algo nuevo (cada 3 s). Devuelve una función para parar.
        estado = {fase, periodo, eventos: [{periodo, datos}], ordenes: [{n, periodo, cid, datos}] (las del equipo),
                  pendientes: [{cid, periodo, datos}], rechazadas: [{cid, periodo, datos, motivo}], conectado, equipos}
   Usa las funciones nube(), leer(), guardar(), esc(), aviso() y las variables codigo y sala de index.html. */
"use strict";

function elegirLab() {
  const previo = leer(`vivo.${codigo}`);
  const caja = $("#caja"), conLista = sala.alumnos.length > 0;
  caja.innerHTML = `<div class="marca">🧪 Laboratorio en vivo</div>
    <h1>${esc(sala.titulo)}</h1>
    <p>${conLista ? "Busca tu nombre: entras directo a tu equipo." : "Elige tu equipo. Pueden entrar varios integrantes con su propio celular o laptop."}
      Las noticias del docente llegan solas a tu pantalla.</p>
    ${previo ? `<p>Ya entraste como <b>${esc(previo.nombre)}</b>${previo.nombre_equipo && previo.nombre_equipo !== previo.nombre ? ` (equipo ${esc(previo.nombre_equipo)})` : ""}.</p>
      <button class="grande" id="seguir">▶ Seguir</button>
      <p class="nota">¿No eres tú? <a href="#" id="otro" style="color:#a5b4fc">Entrar de nuevo</a></p>` : conLista ? `
      <label for="filtro">Busca tu nombre</label><input id="filtro" placeholder="Escribe tu apellido o nombre" autocomplete="off">
      <div class="lista" id="lista"></div>
      <button class="grande" id="unirme" disabled>Soy yo, ¡a trabajar!</button>` : `
      <label>Tu equipo</label><div class="lista" id="lista">${sala.equipos.map((e, k) => `<button data-k="${k}">${esc(e)}</button>`).join("")}</div>
      <button class="grande" id="unirme" disabled>¡Entrar con mi equipo!</button>`}
    <div id="msg"></div>`;
  if (previo) {
    $("#seguir").onclick = () => abrirLab(previo);
    $("#otro").onclick = (e) => { e.preventDefault(); guardar(`vivo.${codigo}`, null); elegirLab(); };
    return;
  }
  let elegido = "";
  const sinTilde = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const pintar = () => {
    if (!conLista) { document.querySelectorAll("#lista button").forEach((b) => b.classList.toggle("sel", b.dataset.k === elegido)); return; }
    const f = sinTilde($("#filtro").value || "");
    $("#lista").innerHTML = sala.alumnos.filter((a) => sinTilde(a.nombre).includes(f))
      .map((a) => `<button data-id="${esc(a.id)}" class="${a.id === elegido ? "sel" : ""}" ${a.ocupado ? "disabled" : ""}>${esc(a.nombre)}${a.ocupado ? " <small>(ya entró)</small>" : ""}</button>`).join("")
      || `<p style="padding:10px 14px;margin:0">No encuentro ese nombre. Pregunta a tu docente.</p>`;
  };
  pintar();
  if (conLista) $("#filtro").oninput = pintar;
  $("#lista").onclick = (e) => {
    const b = e.target.closest("button"); if (!b || b.disabled) return;
    elegido = conLista ? b.dataset.id : b.dataset.k; pintar(); $("#unirme").disabled = false;
  };
  $("#unirme").onclick = async () => {
    $("#unirme").disabled = true; aviso("");
    try {
      const r = await nube("/vivo/unirse", conLista ? { codigo, alumno: elegido } : { codigo, equipo: Number(elegido) });
      const yo = { token: r.token, nombre: r.nombre, equipo: r.equipo, nombre_equipo: r.nombre_equipo, lab: true };
      guardar(`vivo.${codigo}`, yo); abrirLab(yo);
    } catch (e) {
      aviso(e.message); $("#unirme").disabled = false;
      if (conLista) { try { sala = await nube(`/vivo/sala?codigo=${codigo}`); pintar(); } catch (x) {} }
    }
  };
}

/* Lo que corre DENTRO del marco: el puente CalificadorLab (habla con el portal solo por mensajes). */
const PUENTE_LAB = `<script>
(function () {
  var CFG = __CFG__, oyentes = [], ultimo = null, n = 0, pend = {};
  var L = window.CalificadorLab = { vivo: CFG, reportar: function () {} };
  function decir(m) { m.calificadorLab = true; parent.postMessage(m, "*"); }
  window.addEventListener("message", function (ev) {
    var m = ev.data || {};
    if (ev.source !== parent || !m.calificadorLab) return;
    if (m.tipo === "estado") { ultimo = m.estado; oyentes.slice().forEach(function (fn) { try { fn(ultimo); } catch (e) { console.error(e); } }); }
    if (m.tipo === "respuesta" && pend[m.id]) { var p = pend[m.id]; delete pend[m.id]; if (m.ok) p[0](m.resultado); else p[1](new Error(m.error)); }
  });
  L.enviarOrden = function (datos) { return new Promise(function (ok, mal) { var id = ++n; pend[id] = [ok, mal]; decir({ tipo: "orden", id: id, datos: datos }); }); };
  L.escuchar = function (fn) {
    oyentes.push(fn);
    if (ultimo) { try { fn(ultimo); } catch (e) { console.error(e); } }
    decir({ tipo: "listo" });
    return function () { oyentes = oyentes.filter(function (x) { return x !== fn; }); };
  };
})();
<\/script>`;

async function abrirLab(yo) {
  const caja = $("#caja");
  caja.innerHTML = `<div class="marca">🧪 Laboratorio en vivo</div><h1>Abriendo el laboratorio…</h1><div id="msg"></div>`;
  const llavePend = `lab.${codigo}.${yo.token.slice(0, 8)}.pendientes`, llaveRech = `lab.${codigo}.${yo.token.slice(0, 8)}.rechazadas`;
  let estado = null, conectado = true, reloj = null, enCurso = false, otraVez = false;
  const salir =(titulo, texto, reentrar) => {
    document.querySelector(".portada").style.display = "";
    document.getElementById("labMarco")?.remove(); document.getElementById("labBarra")?.remove();
    clearTimeout(reloj);
    if (reentrar) guardar(`vivo.${codigo}`, null);
    caja.innerHTML = `<div class="marca">🧪 Laboratorio en vivo</div><h1>${esc(titulo)}</h1><p>${esc(texto)}</p>
      ${reentrar ? `<button class="grande" onclick="location.reload()">Volver a entrar</button>` : ""}`;
  };
  let html;
  try {
    const r = await fetch(`${NUBE}/vivo/lab/html?token=${encodeURIComponent(yo.token)}`);
    if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error(j.mensaje || "No se pudo abrir el laboratorio."); e.codigo = j.error; throw e; }
    html = await r.text();
  } catch (e) {
    return salir(e.codigo === "cerrada" ? "El laboratorio terminó" : "No se pudo abrir el laboratorio",
      e.codigo ? e.message : "No hay conexión con el servidor. Revisa tu internet y vuelve a intentarlo.", e.codigo === "sin_jugador");
  }
  const cfg = { rol: "equipo", equipo: yo.equipo, nombre_equipo: yo.nombre_equipo, nombre: yo.nombre, codigo };
  const puente = PUENTE_LAB.replace("__CFG__", JSON.stringify(cfg).replace(/</g, "\\u003c"));
  const h = html.search(/<head[^>]*>/i);
  html = h >= 0 ? html.replace(/<head[^>]*>/i, (m) => m + puente) : puente + html;

  document.querySelector(".portada").style.display = "none";
  const barra = document.createElement("div");
  barra.id = "labBarra";
  barra.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:10;padding:6px 12px;font:600 14px system-ui;text-align:center;display:none";
  const marco = document.createElement("iframe");
  marco.id = "labMarco";
  marco.setAttribute("sandbox", "allow-scripts allow-forms allow-modals allow-downloads allow-popups");
  marco.setAttribute("title", sala.titulo);
  marco.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;background:#fff";
  marco.srcdoc = html;
  document.body.append(marco, barra);

  let pendientes = leer(llavePend) || [], rechazadas = leer(llaveRech) || [];
  const respuestas = new Map();                     // cid → [id del pedido del marco] para avisarle cuando se resuelva
  const decir = (m) => marco.contentWindow && marco.contentWindow.postMessage({ ...m, calificadorLab: true }, "*");
  const responder = (cid, ok, resultado, error) => { (respuestas.get(cid) || []).forEach((id) => decir({ tipo: "respuesta", id, ok, resultado, error })); respuestas.delete(cid); };
  const pintarBarra = () => {
    const texto = !conectado ? `Sin conexión: reintentando…${pendientes.length ? ` (${pendientes.length} orden${pendientes.length === 1 ? "" : "es"} por enviar)` : ""}`
      : pendientes.length ? `Enviando ${pendientes.length} orden${pendientes.length === 1 ? "" : "es"}…` : "";
    barra.textContent = texto; barra.style.display = texto ? "block" : "none";
    barra.style.background = conectado ? "#fde047" : "#ef4444"; barra.style.color = conectado ? "#1b1f5e" : "#fff";
  };
  const publicar = () => {
    if (!estado) return;
    decir({ tipo: "estado", estado: { ...estado, pendientes: pendientes.map(({ cid, periodo, datos }) => ({ cid, periodo, datos })), rechazadas, conectado } });
    pintarBarra();
  };
  const cid = () => { const b = new Uint8Array(12); crypto.getRandomValues(b); return Array.from(b, (x) => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join(""); };

  async function pedir(ruta, datos) {
    const r = await fetch(NUBE + ruta, datos ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) } : {});
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.mensaje || `Error ${r.status}`); e.codigo = j.error || "red"; e.status = r.status; throw e; }
    return j;
  }
  async function enviarPendientes() {
    for (const p of [...pendientes]) {
      try {
        const r = await pedir("/vivo/lab/orden", { token: yo.token, periodo: p.periodo, cid: p.cid, datos: p.datos });
        pendientes = pendientes.filter((x) => x.cid !== p.cid); guardar(llavePend, pendientes);
        responder(p.cid, true, r.orden || { cid: p.cid, periodo: p.periodo, datos: p.datos });
      } catch (e) {
        if (e.status && e.status < 500 && e.codigo !== "espera") {     // rechazada por el servidor: no se reintenta
          pendientes = pendientes.filter((x) => x.cid !== p.cid); guardar(llavePend, pendientes);
          rechazadas = [...rechazadas, { cid: p.cid, periodo: p.periodo, datos: p.datos, motivo: e.message }].slice(-30); guardar(llaveRech, rechazadas);
          responder(p.cid, false, null, e.message);
          if (e.codigo === "sin_jugador" || e.codigo === "cerrada") throw e;
        } else { conectado = false; return; }                           // sin red: queda en cola para el próximo intento
      }
    }
  }
  async function consultar() {
    if (enCurso) { otraVez = true; return; }
    enCurso = true; otraVez = false; clearTimeout(reloj);
    try {
      await enviarPendientes();
      const e = await pedir(`/vivo/lab/estado?token=${encodeURIComponent(yo.token)}`);
      conectado = true;
      estado = { fase: e.fase, periodo: e.periodo, eventos: e.eventos, ordenes: e.ordenes, equipos: e.equipos, equipo: e.equipo, nombre: e.nombre, titulo: e.titulo };
      // lo que ya llegó al servidor deja de estar pendiente (por si la respuesta se perdió en el camino)
      const llegadas = new Set(e.ordenes.map((o) => o.cid));
      pendientes.filter((p) => llegadas.has(p.cid)).forEach((p) => responder(p.cid, true, e.ordenes.find((o) => o.cid === p.cid)));
      pendientes = pendientes.filter((p) => !llegadas.has(p.cid)); guardar(llavePend, pendientes);
    } catch (err) {
      enCurso = false;
      if (err.codigo === "cerrada") return salir("El laboratorio terminó", err.message, false);
      if (err.codigo === "sin_jugador") return salir("Tu sesión se cerró", err.message, true);
      conectado = false;
    }
    enCurso = false;
    publicar();
    reloj = setTimeout(consultar, otraVez ? 50 : conectado ? 3000 : 4000);
  }

  window.addEventListener("message", (ev) => {
    const m = ev.data || {};
    if (ev.source !== marco.contentWindow || !m.calificadorLab) return;       // solo el marco del laboratorio
    if (m.tipo === "listo") publicar();
    if (m.tipo === "orden") {
      if (!estado) return decir({ tipo: "respuesta", id: m.id, ok: false, error: "Todavía no hay conexión con la sala. Espera unos segundos." });
      let datos;
      try { datos = JSON.parse(JSON.stringify(m.datos ?? null)); } catch (e) { return decir({ tipo: "respuesta", id: m.id, ok: false, error: "Orden no válida." }); }
      const p = { cid: cid(), periodo: estado.periodo, datos };
      pendientes.push(p); guardar(llavePend, pendientes);
      respuestas.set(p.cid, [m.id]);
      publicar();
      consultar();
    }
  });
  consultar();
}
