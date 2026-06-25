/**
 * OnFormSubmit.gs
 * FUNCIÓN 2 — onFormSubmit(e)
 * Trigger: automático, instalado como trigger "On form submit" sobre el
 * Spreadsheet vinculado al Form (MAESTRO_SLEP_2026), no sobre el Form
 * directamente, para tener acceso simple a la fila completa de RESPUESTAS_FORM.
 */
function onFormSubmit(e) {
  const maestro = SpreadsheetApp.openById(MAESTRO_ID);
  const hojaEE = maestro.getSheetByName(HOJA_MAESTRO_EE);
  const hojaResp = maestro.getSheetByName(HOJA_RESPUESTAS_FORM);

  const filaRespuesta = e.range.getRow();
  const valores = hojaResp.getRange(filaRespuesta, 1, 1, hojaResp.getLastColumn()).getValues()[0];

  const colRBDResp = colPorEncabezado(hojaResp, 'RBD');
  const colCorreoResp = colPorEncabezado(hojaResp, 'Correo de contacto del establecimiento');
  const colRutDirResp = colPorEncabezado(hojaResp, 'RUT del director/a');
  const colPmeResp = colPorEncabezado(hojaResp, 'Link al PME vigente en Google Drive');
  const colSheetsResp = colPorEncabezado(hojaResp, 'Link al Google Sheets de dotación completado');

  const rbd = valores[colRBDResp];
  const correoContacto = valores[colCorreoResp];

  const filaMaestro = buscarFilaPorRBD(hojaEE, rbd);

  if (filaMaestro === -1) {
    // RBD no existe en el directorio maestro: no se puede confiar en este envío.
    notificarRbdNoEncontrado_(rbd, correoContacto);
    registrarLog(rbd, 'FORM_RBD_NO_ENCONTRADO', correoContacto, 'Envío detenido, alerta enviada a equipo UATP.');
    return;
  }

  const colEstadoForm = colPorEncabezado(hojaEE, 'Estado_Form');
  const colFechaForm = colPorEncabezado(hojaEE, 'Fecha_Form');
  const colAlertas = colPorEncabezado(hojaEE, 'Alertas');

  hojaEE.getRange(filaMaestro, colEstadoForm + 1).setValue('Recibido');
  hojaEE.getRange(filaMaestro, colFechaForm + 1).setValue(new Date());

  const datosValidacion = {
    rbd: rbd,
    rutDirector: valores[colRutDirResp],
    linkPme: valores[colPmeResp],
    linkSheets: valores[colSheetsResp]
  };

  const resultado = validarRespuestaForm(rbd, datosValidacion);
  hojaEE.getRange(filaMaestro, colAlertas + 1).setValue(resultado.alertas.join('; '));

  enviarAcuseRecibo_(correoContacto, rbd, resultado);

  registrarLog(rbd, 'FORM_RECIBIDO', correoContacto, resultado.alertas.length
    ? ('Con alertas: ' + resultado.alertas.join('; '))
    : 'Sin alertas iniciales.');
}

function notificarRbdNoEncontrado_(rbd, correoContacto) {
  const asunto = '⚠️ Alerta: envío de Form con RBD no encontrado (' + rbd + ')';
  const cuerpo = 'Se recibió un envío del Formulario de Diagnóstico UATP 2026 con el RBD "' + rbd +
    '", que no se encuentra en el Directorio Maestro de establecimientos.\n\n' +
    'Correo declarado por quien completó el formulario: ' + correoContacto + '\n\n' +
    'Revisar manualmente en RESPUESTAS_FORM y corregir el RBD si corresponde a un error de tipeo.';
  MailApp.sendEmail(CORREO_EQUIPO_UATP, asunto, cuerpo);
}

function enviarAcuseRecibo_(correoContacto, rbd, resultadoValidacion) {
  if (!correoContacto) return;
  const asunto = 'Confirmación de recepción — Diagnóstico UATP 2026 (RBD ' + rbd + ')';
  let cuerpo = 'Hemos recibido la respuesta del Formulario de Diagnóstico UATP 2026 para el establecimiento RBD ' + rbd + '.\n\n';
  if (resultadoValidacion.alertas.length > 0) {
    cuerpo += 'Se detectaron las siguientes observaciones que su equipo UATP revisará con usted:\n- ' +
      resultadoValidacion.alertas.join('\n- ') + '\n\n';
  } else {
    cuerpo += 'No se detectaron observaciones iniciales. Gracias por completar el levantamiento.\n\n';
  }
  cuerpo += 'Este es un correo automático, no responder directamente.';
  MailApp.sendEmail(correoContacto, asunto, cuerpo);
}
