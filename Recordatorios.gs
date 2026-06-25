/**
 * Recordatorios.gs
 * FUNCIÓN 5 — enviarRecordatorios()
 * Trigger: automático, cada 48 horas (time-driven trigger).
 * Envía correo a cada director con Estado_Form vacío, con copia al asesor UATP.
 */
function enviarRecordatorios() {
  const maestro = SpreadsheetApp.openById(MAESTRO_ID);
  const hojaEE = maestro.getSheetByName(HOJA_MAESTRO_EE);
  const hojaAsesores = maestro.getSheetByName('ASESORES');

  const colRBD = colPorEncabezado(hojaEE, 'RBD');
  const colNombreEE = colPorEncabezado(hojaEE, 'Nombre_EE');
  const colCorreoDirector = colPorEncabezado(hojaEE, 'Correo_Director');
  const colAsesor = colPorEncabezado(hojaEE, 'Asesor_UATP');
  const colLinkSheets = colPorEncabezado(hojaEE, 'Link_Sheets_EE');
  const colEstadoForm = colPorEncabezado(hojaEE, 'Estado_Form');

  const mapaCorreoAsesor = construirMapaCorreoAsesor_(hojaAsesores);

  const FORM_URL = 'PEGAR_AQUI_URL_PUBLICA_DEL_FORM';

  const datos = hojaEE.getRange(2, 1, Math.max(hojaEE.getLastRow() - 1, 0), hojaEE.getLastColumn()).getValues();

  datos.forEach((fila, idx) => {
    const rbd = fila[colRBD];
    if (!rbd) return;
    if (fila[colEstadoForm]) return; // ya tiene Estado_Form, no está pendiente

    const correoDirector = fila[colCorreoDirector];
    const nombreEE = fila[colNombreEE];
    const nombreAsesor = fila[colAsesor];
    const correoAsesor = mapaCorreoAsesor[nombreAsesor] || null;
    const linkSheets = fila[colLinkSheets];

    if (!correoDirector) {
      console.warn('RBD ' + rbd + ' sin Correo_Director, no se puede enviar recordatorio.');
      return;
    }

    const asunto = 'Recordatorio — Diagnóstico UATP 2026 pendiente (' + nombreEE + ')';
    const cuerpo = 'Estimado/a director/a,\n\n' +
      'Le recordamos que el levantamiento "Diagnóstico UATP 2026" de su establecimiento (RBD ' + rbd + ') ' +
      'se encuentra pendiente de envío.\n\n' +
      'Formulario: ' + FORM_URL + '\n' +
      (linkSheets ? ('Sheets de dotación de su establecimiento: ' + linkSheets + '\n') : '') +
      '\nSu asesor/a UATP asignado/a es ' + (nombreAsesor || 'no informado') +
      (correoAsesor ? (' (' + correoAsesor + ')') : '') + ', a quien puede contactar ante cualquier duda.\n\n' +
      'Saludos cordiales,\nEquipo UATP — SLEP Valdivia';

    const opciones = correoAsesor ? { cc: correoAsesor } : {};
    MailApp.sendEmail(correoDirector, asunto, cuerpo, opciones);

    registrarLog(rbd, 'RECORDATORIO_ENVIADO', correoDirector, 'CC: ' + (correoAsesor || 'sin asesor'));
  });
}

function construirMapaCorreoAsesor_(hojaAsesores) {
  const mapa = {};
  if (!hojaAsesores) return mapa;
  const colNombre = colPorEncabezado(hojaAsesores, 'Nombre_Asesor');
  const colCorreo = colPorEncabezado(hojaAsesores, 'Correo_Asesor');
  const datos = hojaAsesores.getRange(2, 1, Math.max(hojaAsesores.getLastRow() - 1, 0), hojaAsesores.getLastColumn()).getValues();
  datos.forEach(f => { if (f[colNombre]) mapa[f[colNombre]] = f[colCorreo]; });
  return mapa;
}
