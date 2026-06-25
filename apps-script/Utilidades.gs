/**
 * Utilidades.gs
 * Funciones auxiliares reutilizadas por todo el sistema.
 */

/**
 * Valida un RUT chileno con algoritmo módulo 11.
 * Acepta formatos "XX.XXX.XXX-X" y "XXXXXXXX-X" (con o sin puntos, con o sin guión opcional).
 * @param {string} rut
 * @return {boolean}
 */
function validarRutChileno(rut) {
  if (!rut) return false;
  let limpio = String(rut).trim().toUpperCase().replace(/\./g, '').replace(/-/g, '');
  if (limpio.length < 2) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  if (!/^[0-9K]$/.test(dv)) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  let dvEsperado;
  if (resto === 11) dvEsperado = '0';
  else if (resto === 10) dvEsperado = 'K';
  else dvEsperado = String(resto);

  return dv === dvEsperado;
}

/**
 * Normaliza un RUT al formato "XX.XXX.XXX-X" para escritura consistente.
 * @param {string} rut
 * @return {string}
 */
function normalizarRut(rut) {
  let limpio = String(rut).trim().toUpperCase().replace(/\./g, '').replace(/-/g, '');
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  let cuerpoFormateado = '';
  for (let i = 0; i < cuerpo.length; i++) {
    const posDesdeFinal = cuerpo.length - i;
    cuerpoFormateado += cuerpo.charAt(i);
    if (posDesdeFinal > 1 && (posDesdeFinal - 1) % 3 === 0) cuerpoFormateado += '.';
  }
  return cuerpoFormateado + '-' + dv;
}

/**
 * Obtiene el índice de columna (0-based) buscando por nombre de encabezado en la fila 1.
 * Permite que el código tolere reordenamiento de columnas en Forms/Sheets.
 * @param {Sheet} sheet
 * @param {string} nombreColumna
 * @return {number} índice 0-based, o -1 si no se encuentra.
 */
function colPorEncabezado(sheet, nombreColumna) {
  const encabezados = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return encabezados.indexOf(nombreColumna);
}

/**
 * Busca la fila (1-based) de un RBD dentro de MAESTRO_EE. Retorna -1 si no existe.
 * @param {Sheet} hojaMaestroEE
 * @param {string|number} rbd
 * @return {number}
 */
function buscarFilaPorRBD(hojaMaestroEE, rbd) {
  const colRBD = colPorEncabezado(hojaMaestroEE, 'RBD');
  const datos = hojaMaestroEE.getRange(2, colRBD + 1, hojaMaestroEE.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < datos.length; i++) {
    if (String(datos[i][0]).trim() === String(rbd).trim()) {
      return i + 2; // +2 porque getValues empieza en fila 2 y es 0-based
    }
  }
  return -1;
}

/**
 * Registra una línea en LOG_AUDITORIA. Nunca lanza excepción hacia arriba
 * (un fallo de logging no debe detener el flujo principal).
 * @param {string|number} rbd
 * @param {string} accion
 * @param {string} usuarioCorreo
 * @param {string} detalle
 */
function registrarLog(rbd, accion, usuarioCorreo, detalle) {
  try {
    const maestro = SpreadsheetApp.openById(MAESTRO_ID);
    const hojaLog = maestro.getSheetByName(HOJA_LOG);
    hojaLog.appendRow([new Date(), rbd, accion, usuarioCorreo || Session.getActiveUser().getEmail(), detalle || '']);
  } catch (err) {
    console.error('No se pudo escribir en LOG_AUDITORIA: ' + err);
  }
}

/**
 * Extrae el ID de un Spreadsheet a partir de su URL completa.
 * @param {string} url
 * @return {string|null}
 */
function extraerIdDesdeUrl(url) {
  if (!url) return null;
  const match = String(url).match(/[-\w]{25,}/);
  return match ? match[0] : null;
}
