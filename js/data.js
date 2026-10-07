/* ==========================================================================
   PRECIOS Y CONFIGURACIÓN
   --------------------------------------------------------------------------
   Este es el ÚNICO archivo que hay que tocar cuando cambian los precios.
   Valores = cuota mensual sin descuento ni IVA (tomados del Excel).
   ========================================================================== */

window.CONFIG = {
  vigencia: "Octubre 2026",

  // Valores por defecto del formulario
  descuento: 30,          // % descuento inicial
  iva: 10.5,              // % IVA
  aporteReciboPct: 3,     // % aporte que figura en el recibo
  aporteEmpleadorPct: 4.5,// % aporte del empleador
  maxPlanes: 3,           // planes que entran en la imagen

  // Planes tildados al abrir el cotizador
  planesPorDefecto: ["Plan 4021_22", "Plan 4500_23", "Plan 6500_21"],

  observaciones:
`El plan cuenta con un descuento escalonado durante 13 meses, que se aplica automáticamente en la factura mensual, según el siguiente detalle:

Meses 1 a 3: 30% de descuento (ya incluido en este presupuesto)
Meses 4 y 5: 25% de descuento
Meses 6 y 7: 20% de descuento
Meses 8 y 9: 15% de descuento
Meses 10 y 11: 10% de descuento
Meses 12 y 13: 5% de descuento`
};

/* grupo: "sin" = sin copagos | "con" = con copagos | "otros"
   copagos: true / false / null (null = se muestra "Consultar")            */
window.PLANES = {
  "Plan 2500_24":      { grupo: "sin",   copagos: false, "18_25": 122675, "26_35": 157565, "36_54": 207359, "55_59": 351532, "60_plus": 606839,  child1: 106841, child2plus: 92159 },
  "Plan 4021_22":      { grupo: "sin",   copagos: false, "18_25": 123210, "26_35": 169399, "36_54": 209322, "55_59": 361209, "60_plus": 608717,  child1: 107120, child2plus: 92523 },
  "Plan 4500_23":      { grupo: "sin",   copagos: false, "18_25": 138598, "26_35": 169743, "36_54": 235865, "55_59": 406564, "60_plus": 685392,  child1: 120380, child2plus: 104361 },
  "Plan 6500_21":      { grupo: "sin",   copagos: false, "18_25": 195636, "26_35": 279720, "36_54": 327638, "55_59": 549043, "60_plus": 817529,  child1: 170657, child2plus: 148439 },
  "Plan 8500_21":      { grupo: "sin",   copagos: false, "18_25": 336386, "26_35": 448079, "36_54": 589747, "55_59": 821997, "60_plus": 1120161, child1: 294749, child2plus: 257241 },

  "Plan 2500_20":      { grupo: "con",   copagos: true,  "18_25": 87972,  "26_35": 120450, "36_54": 157433, "55_59": 297566, "60_plus": 434135,  child1: 83626,  child2plus: 75262 },
  "Plan 4021_20":      { grupo: "con",   copagos: true,  "18_25": 89622,  "26_35": 121640, "36_54": 157385, "55_59": 300016, "60_plus": 442194,  child1: 83225,  child2plus: 77677 },
  "Plan 4500_20":      { grupo: "con",   copagos: true,  "18_25": 102861, "26_35": 137695, "36_54": 181709, "55_59": 348095, "60_plus": 510584,  child1: 97301,  child2plus: 91140 },
  "Plan 6500_20":      { grupo: "con",   copagos: true,  "18_25": 125362, "26_35": 176225, "36_54": 216434, "55_59": 419079, "60_plus": 597468,  child1: 116893, child2plus: 109494 },

  "Plan COMUNIDAD_SC": { grupo: "otros", copagos: null,  "18_25": 104271, "26_35": 133927, "36_54": 176254, "55_59": 298803, "60_plus": 515811,  child1: 90818,  child2plus: 78335 }
};
