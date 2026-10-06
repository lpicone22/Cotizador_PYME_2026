/* ==========================================================================
   COTIZADOR OMINT — lógica
   Depende de: js/logo.js (LOGO_SRC) y js/data.js (CONFIG, PLANES)
   ========================================================================== */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const CFG = window.CONFIG;
  const PLANES = window.PLANES;
  const STORAGE_KEY = "cotizadorOmint.asesor";
  const ASESOR_IDS = ["asesor", "mail", "celular", "instagram"];

  const money = (n) => "$ " + Math.round(Math.max(0, n)).toLocaleString("es-AR");
  const cleanPlan = (n) => n.replace("Plan ", "").replace("_", " ");
  const num = (id, def) => {
    const v = parseFloat($(id).value);
    return Number.isNaN(v) ? def : v;
  };

  /* ---------------- Logo (se carga una sola vez) ---------------- */
  const logoImg = new Image();
  const logoReady = new Promise((resolve) => {
    logoImg.onload = () => resolve(true);
    logoImg.onerror = () => resolve(false);
  });
  logoImg.src = window.LOGO_SRC;

  /* ---------------- Cálculo ---------------- */
  function priceForAge(p, age) {
    if (age >= 60) return p["60_plus"];
    if (age >= 55) return p["55_59"];
    if (age >= 36) return p["36_54"];
    if (age >= 26) return p["26_35"];
    return p["18_25"];
  }

  function baseForPlan(p, ages, kids) {
    let total = 0;
    ages.forEach((a) => { total += Number(priceForAge(p, a) || 0); });
    if (kids > 0) total += Number(p.child1 || 0);
    if (kids > 1) total += (kids - 1) * Number(p.child2plus || 0);
    return total;
  }

  function leerEdades() {
    return ($("edades").value || "")
      .split(/[,;\s]+/)
      .map((x) => parseInt(x.trim(), 10))
      .filter((x) => !Number.isNaN(x));
  }

  function calcularAporte() {
    const recibo = num("aporteRecibo", 0);
    const pctRecibo = num("aporteReciboPct", CFG.aporteReciboPct) || 1;
    const pctEmpleador = num("aporteEmpleadorPct", CFG.aporteEmpleadorPct);
    if (recibo <= 0 || $("usarAporte").value !== "si") return 0;
    return recibo * ((pctRecibo + pctEmpleador) / pctRecibo);
  }

  function seleccionados() {
    return [...document.querySelectorAll(".plan:checked")].map((x) => x.value);
  }

  /* ---------------- Render de checkboxes ---------------- */
  function renderPlanes() {
    const cont = { sin: $("planes-sin"), con: $("planes-con"), otros: $("planes-otros") };
    Object.keys(PLANES).forEach((key) => {
      const p = PLANES[key];
      const lbl = document.createElement("label");
      lbl.className = "plancheck";
      const extra = p.grupo === "con" ? ' <span class="copay">Con copagos</span>' : "";
      lbl.innerHTML = `<input type="checkbox" class="plan" value="${key}">${cleanPlan(key)}${extra}`;
      (cont[p.grupo] || cont.otros).appendChild(lbl);
    });
    if (!$("planes-otros").children.length) $("bloque-otros").hidden = true;
  }

  /* ---------------- Asesor: guardar / cargar ---------------- */
  function cargarAsesor() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (data) ASESOR_IDS.forEach((id) => { $(id).value = data[id] || ""; });
    } catch (e) { /* sin storage disponible */ }
  }
  function guardarAsesor() {
    try {
      if ($("recordarAsesor").checked) {
        const data = {};
        ASESOR_IDS.forEach((id) => { data[id] = $(id).value.trim(); });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) { /* sin storage disponible */ }
  }

  /* ---------------- Canvas helpers ---------------- */
  function wrapLines(ctx, text, maxWidth) {
    const out = [];
    text.split("\n").forEach((par) => {
      if (!par.trim()) { out.push(""); return; }
      let line = "";
      par.split(" ").forEach((word) => {
        const test = line ? line + " " + word : word;
        if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = word; }
        else line = test;
      });
      out.push(line);
    });
    return out;
  }

  /* ---------------- Dibujo ---------------- */
  async function generar() {
    await logoReady;
    const c = $("canvas");
    const ctx = c.getContext("2d");
    c.width = 1418; c.height = 1600;
    const W = c.width;

    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, c.height);
    ctx.fillStyle = "#43a9d8"; ctx.fillRect(0, 0, W, 8);

    // Título
    ctx.fillStyle = "#36a6d8"; ctx.font = "bold 52px Arial";
    ctx.fillText("Cotización", 70, 95);
    const wTit = ctx.measureText("Cotización ").width;
    ctx.font = "52px Arial";
    ctx.fillText("de", 70 + wTit, 95);
    ctx.fillText("plan de salud", 70, 155);
    if (logoImg.complete && logoImg.naturalWidth) ctx.drawImage(logoImg, 1080, 55, 230, 91);

    // Fecha
    const f = $("fecha").value
      ? new Date($("fecha").value + "T12:00:00").toLocaleDateString("es-AR")
      : new Date().toLocaleDateString("es-AR");
    ctx.fillStyle = "#333"; ctx.font = "18px Arial";
    ctx.fillText("Fecha: " + f, 1080, 175);

    // Cliente
    const cliente = [
      "Nombre y apellido: " + ($("nombre").value.trim() || "—").toUpperCase(),
      "Tipo de documento: " + $("tipo").value,
      "Número: " + ($("documento").value.trim() || "—"),
      "Cantidad de integrantes: " + ($("integrantes").value || "—"),
      "Edades: " + ($("edades").value.trim() || "—"),
      "Cantidad de hijos/as: " + ($("hijos").value || "0"),
    ];
    cliente.forEach((t, i) => ctx.fillText(t, 70, 255 + i * 30));

    // Planes
    const ages = leerEdades();
    const kids = Math.max(0, parseInt($("hijos").value || "0", 10) || 0);
    const disc = num("descuento", CFG.descuento) / 100;
    const iva = num("iva", CFG.iva) / 100;
    const aporteTotal = calcularAporte();

    const shown = seleccionados().slice(0, CFG.maxPlanes);
    const xs = shown.length === 1 ? [500] : shown.length === 2 ? [275, 745] : [50, 485, 920];

    if (!shown.length) {
      ctx.fillStyle = "#98a2b3"; ctx.font = "italic 22px Arial";
      ctx.fillText("Seleccioná al menos un plan para ver la cotización.", 70, 560);
    }

    shown.forEach((key, k) => {
      const p = PLANES[key], x = xs[k], y = 460, w = 410;
      const base = baseForPlan(p, ages, kids);
      const discount = base * disc;
      const withDisc = base - discount;
      const ivaAmt = withDisc * iva;
      const final = Math.max(0, withDisc + ivaAmt - aporteTotal);
      const copagos = p.copagos === true ? "Sí" : p.copagos === false ? "No" : "Consultar";

      ctx.fillStyle = "#42a8d6"; ctx.fillRect(x, y, w, 42);
      ctx.fillStyle = "#fff"; ctx.font = "bold 24px Arial";
      ctx.fillText("Plan: " + cleanPlan(key), x + 18, y + 29);

      const rows = [
        ["Copagos:", copagos],
        ["Aporte estimado:", money(aporteTotal)],
        ["Cuota sin descuento:", money(base)],
        ["IVA:", money(ivaAmt)],
        ["Descuento aplicado:", money(discount)],
      ];
      rows.forEach((r, j) => {
        const yy = y + 78 + j * 52;
        ctx.strokeStyle = "#d5dde6"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, yy + 18); ctx.lineTo(x + w, yy + 18); ctx.stroke();
        ctx.fillStyle = "#222";
        ctx.font = "18px Arial"; ctx.fillText(r[0], x + 18, yy);
        ctx.font = "bold 18px Arial"; ctx.fillText(r[1], x + 220, yy);
      });

      ctx.fillStyle = "#fff1a8"; ctx.fillRect(x, y + 318, w, 87);
      ctx.fillStyle = "#173d7a"; ctx.font = "bold 19px Arial";
      ctx.fillText("Total a pagar estimado:", x + 18, y + 345);
      ctx.font = "bold 32px Arial";
      ctx.fillText(money(final), x + 80, y + 384);
    });

    // Asesor (solo se imprimen los campos completados)
    let yA = 930;
    const nombreAsesor = $("asesor").value.trim();
    ctx.fillStyle = "#222"; ctx.font = "bold 19px Arial";
    ctx.fillText("Asesor comercial:" + (nombreAsesor ? " " + nombreAsesor : ""), 70, yA);
    ctx.font = "18px Arial";
    [
      ["Mail de contacto: ", $("mail").value.trim()],
      ["Celular de contacto: ", $("celular").value.trim()],
      ["Instagram del asesor: ", $("instagram").value.trim()],
    ].forEach(([lbl, val]) => {
      if (!val) return;
      yA += 35;
      ctx.fillText(lbl + val, 70, yA);
    });

    // Observaciones (con ajuste de línea)
    const obsTxt = $("obs").value || "";
    const yLegal = 1360;
    if (obsTxt.trim()) {
      let yO = yA + 55;
      ctx.font = "bold 19px Arial"; ctx.fillText("Observaciones:", 70, yO);
      ctx.font = "17px Arial";
      const lines = wrapLines(ctx, obsTxt, W - 140);
      const maxLines = Math.floor((yLegal - 25 - (yO + 35)) / 28) + 1;
      lines.slice(0, maxLines).forEach((line, i) => ctx.fillText(line, 70, yO + 35 + i * 28));
    }

    ctx.fillStyle = "#666"; ctx.font = "12px Arial";
    ctx.fillText("La cotización es estimada y queda sujeta a las modificaciones y ajustes que correspondan.", 70, yLegal);

    // Pie
    ctx.fillStyle = "#2469b5"; ctx.fillRect(0, 1390, W, 210);
    ctx.fillStyle = "#fff"; ctx.font = "bold 34px Arial";
    ctx.fillText("¡Sumate", 70, 1480);
    const wS = ctx.measureText("¡Sumate ").width;
    ctx.font = "34px Arial";
    ctx.fillText("y accedé", 70 + wS, 1480);
    ctx.fillText("a planes con todos estos beneficios!", 70, 1525);
    if (logoImg.complete && logoImg.naturalWidth) ctx.drawImage(logoImg, 1080, 1450, 190, 75);
  }

  /* ---------------- Acciones ---------------- */
  function nombreArchivo() {
    const n = ($("nombre").value.trim() || "cliente").replace(/[^\wáéíóúñÁÉÍÓÚÑ-]+/g, "_");
    return "Cotizacion_" + n + ".png";
  }

  async function descargar() {
    await generar();
    guardarAsesor();
    const a = document.createElement("a");
    a.download = nombreArchivo();
    a.href = $("canvas").toDataURL("image/png");
    document.body.appendChild(a); a.click(); a.remove();
  }

  async function compartir() {
    await generar();
    guardarAsesor();
    $("canvas").toBlob(async (blob) => {
      const file = new File([blob], nombreArchivo(), { type: "image/png" });
      try { await navigator.share({ files: [file], title: "Cotización Omint" }); }
      catch (e) { /* el usuario canceló */ }
    }, "image/png");
  }

  function limpiar() {
    ["nombre", "documento", "edades", "aporteRecibo"].forEach((id) => { $(id).value = ""; });
    $("tipo").value = "DNI";
    $("integrantes").value = 1;
    $("hijos").value = 0;
    $("usarAporte").value = "si";
    aplicarDefaults();
    document.querySelectorAll(".plan").forEach((x) => { x.checked = false; });
    $("fecha").value = hoyISO();
    generar();
    // Los datos del asesor NO se borran: quedan para la próxima cotización.
  }

  function aplicarDefaults() {
    $("descuento").value = CFG.descuento;
    $("iva").value = CFG.iva;
    $("aporteReciboPct").value = CFG.aporteReciboPct;
    $("aporteEmpleadorPct").value = CFG.aporteEmpleadorPct;
    $("obs").value = CFG.observaciones;
  }

  function hoyISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
  }

  let debounce;
  const regenerar = () => { clearTimeout(debounce); debounce = setTimeout(generar, 250); };

  /* ---------------- Init ---------------- */
  function init() {
    $("vigencia").textContent = CFG.vigencia;
    renderPlanes();
    aplicarDefaults();
    cargarAsesor();
    $("fecha").value = hoyISO();

    CFG.planesPorDefecto.forEach((k) => {
      const el = document.querySelector(`.plan[value="${k}"]`);
      if (el) el.checked = true;
    });

    // Máximo de planes
    document.querySelectorAll(".plan").forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.checked && seleccionados().length > CFG.maxPlanes) {
          cb.checked = false;
          toast(`Podés mostrar hasta ${CFG.maxPlanes} planes por cotización.`);
        }
      });
    });

    // Actualización automática al escribir
    document.querySelectorAll("input, select, textarea").forEach((el) => {
      el.addEventListener("input", regenerar);
      el.addEventListener("change", regenerar);
    });
    document.querySelectorAll(".asesor-field").forEach((el) => el.addEventListener("change", guardarAsesor));
    $("recordarAsesor").addEventListener("change", guardarAsesor);

    $("btnGenerar").addEventListener("click", generar);
    $("btnDescargar").addEventListener("click", descargar);
    $("btnLimpiar").addEventListener("click", limpiar);

    if (navigator.canShare && navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] })) {
      $("btnCompartir").hidden = false;
      $("btnCompartir").addEventListener("click", compartir);
    }

    generar();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
