/**
 * ValidarRespuesta.gs
 * FUNCIÓN 3 — validarRespuestaForm(rbd, datos)
 * Ejecuta las validaciones V1-V3 sobre un envío de Form recién recibido.
 * V4 (consistencia de totales) requiere el Sheets protegido y se ejecuta
 * en consolidarDatos(), no aquí, porque al momento del envío del Form
 * el establecimiento puede no haber terminado de llenar su Sheets.
 *
 * @param {string|number} rbd
 * @param {{rutDirector:string, linkPme:string, linkSheets:string}} datos
 * @return {{alertas: string[]}}
 */
function validarRespuestaForm(rbd, datos) {
  const alertas = [];

  // V1 — RUT del director: algoritmo módulo 11 chileno.
  if (!datos.rutDirector || !validarRutChileno(datos.rutDirector)) {
    alertas.push('RUT del director/a inválido o vacío: "' + datos.rutDirector + '"');
  }

  // V2 — URL del PME no vacía.
  if (!datos.linkPme || String(datos.linkPme).trim() === '') {
    alertas.push('No se adjuntó link al PME vigente.');
  }

  // V3 — URL del Sheets de dotación no vacía.
  if (!datos.linkSheets || String(datos.linkSheets).trim() === '') {
    alertas.push('No se adjuntó link al Sheets de dotación.');
  } else if (!/^https:\/\/docs\.google\.com\/spreadsheets\//.test(String(datos.linkSheets).trim())) {
    alertas.push('El link de Sheets de dotación no parece una URL válida de Google Sheets.');
  }

  return { alertas: alertas };
}
