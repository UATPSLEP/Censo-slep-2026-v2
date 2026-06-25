/**
 * Consolidar.gs
 * FUNCIÓN 4 — consolidarDatos()
 * Trigger: manual o programado (diario, ver instrucciones de despliegue).
 * Recorre cada EE con Estado_Form = "Recibido", abre su Sheets protegido,
 * calcula métricas y semáforo, y reescribe CONSOLIDADO + SEGUIMIENTO_UATP.
 */
function consolidarDatos() {
  const maestro = SpreadsheetApp.openById(MAESTRO_ID);
  const hojaEE = maestro.getSheetByName(HOJA_MAESTRO_EE);
  const hojaConsolidado = maestro.getSheetByName(HOJA_CONSOLIDADO);

  const colRBD = colPorEncabezado(hojaEE, 'RBD');
  const colNombreEE = colPorEncabezado(hojaEE, 'Nombre_EE');
  const colComuna = colPorEncabezado(hojaEE, 'Comuna');
  const colAsesor = colPorEncabezado(hojaEE, 'Asesor_UATP');
  const colEstadoForm = colPorEncabezado(hojaEE, 'Estado_Form');
  const colLinkSheets = colPorEncabezado(hojaEE, 'Link_Sheets_EE');
  const colAlertas = colPorEncabezado(hojaEE, 'Alertas');
  const colCompletitud = colPorEncabezado(hojaEE, 'Completitud');
  const colEstadoFinal = colPorEncabezado(hojaEE, 'Estado_Final');
  const colEstadoSheets = colPorEncabezado(hojaEE, 'Estado_Sheets');

  const ultimaFila = hojaEE.getLastRow();
  const datos = hojaEE.getRange(2, 1, ultimaFila - 1, hojaEE.getLastColumn()).getValues();

  // CONSOLIDADO se reescribe completo en cada corrida (no se acumula).
  if (hojaConsolidado.getLastRow() > 1) {
    hojaConsolidado.getRange(2, 1, hojaConsolidado.getLastRow() - 1, hojaConsolidado.getLastColumn()).clearContent();
  }

  const filasConsolidado = [];

  for (let i = 0; i < datos.length; i++) {
    const fila = datos[i];
    const rbd = fila[colRBD];
    if (!rbd) continue;
    if (fila[colEstadoForm] !== 'Recibido') continue;

    const linkSheetsEE = fila[colLinkSheets];
    const filaMaestro = i + 2;

    let metrica;
    try {
      metrica = leerMetricasSheetsEE_(linkSheetsEE);
    } catch (err) {
      console.error('Error leyendo Sheets de RBD ' + rbd + ': ' + err);
      registrarLog(rbd, 'ERROR_CONSOLIDACION', Session.getActiveUser().getEmail(), String(err));
      hojaEE.getRange(filaMaestro, colEstadoFinal + 1).setValue('Rojo');
      continue;
    }

    const alertasPrevias = String(fila[colAlertas] || '').split(';').map(s => s.trim()).filter(Boolean);
    const alertasConsolidacion = [];

    // V4 — Consistencia de totales declarados en el Form vs. conteo real del Sheets.
    // (Los totales declarados se leen directamente de RESPUESTAS_FORM por RBD.)
    const totalesDeclarados = obtenerTotalesDeclarados_(maestro, rbd);
    if (totalesDeclarados.totalDocentes !== null && totalesDeclarados.totalDocentes !== metrica.totalDocentes) {
      alertasConsolidacion.push('Total docentes declarado (' + totalesDeclarados.totalDocentes +
        ') no coincide con filas reales en Sheets (' + metrica.totalDocentes + ')');
    }
    if (totalesDeclarados.totalAsistentes !== null && totalesDeclarados.totalAsistentes !== metrica.totalAsistentes) {
      alertasConsolidacion.push('Total asistentes declarado (' + totalesDeclarados.totalAsistentes +
        ') no coincide con filas reales en Sheets (' + metrica.totalAsistentes + ')');
    }

    const todasLasAlertas = alertasPrevias.concat(alertasConsolidacion);
    const hayAlertaCritica = todasLasAlertas.some(a =>
      a.indexOf('RUT del director/a inválido') !== -1 ||
      a.indexOf('no coincide') !== -1 ||
      a.indexOf('No se adjuntó') !== -1
    );
    const hayAlertaMenor = metrica.nAlertasHorarias > 0 || metrica.nReemplazosSinObs > 0;

    let estado;
    if (hayAlertaCritica) estado = 'Rojo';
    else if (hayAlertaMenor) estado = 'Amarillo';
    else estado = 'Verde';

    const completitud = Math.round(
      ((metrica.totalDocentes > 0 ? 1 : 0) + (metrica.totalAsistentes > 0 ? 1 : 0)) / 2 * 100
    );

    hojaEE.getRange(filaMaestro, colCompletitud + 1).setValue(completitud);
    hojaEE.getRange(filaMaestro, colEstadoFinal + 1).setValue(estado);
    hojaEE.getRange(filaMaestro, colEstadoSheets + 1).setValue(completitud === 100 ? 'Completo' : 'Iniciado');
    if (alertasConsolidacion.length > 0) {
      hojaEE.getRange(filaMaestro, colAlertas + 1).setValue(todasLasAlertas.join('; '));
    }

    filasConsolidado.push([
      rbd,
      fila[colNombreEE],
      fila[colComuna],
      fila[colAsesor],
      metrica.totalDocentes,
      metrica.sumaHorasLectivas,
      metrica.totalAsistentes,
      metrica.nAlertasHorarias,
      metrica.nReemplazosSinObs,
      metrica.linkPme || '',
      estado
    ]);

    registrarLog(rbd, 'CONSOLIDACION', Session.getActiveUser().getEmail(), 'Estado: ' + estado);
  }

  if (filasConsolidado.length > 0) {
    hojaConsolidado.getRange(2, 1, filasConsolidado.length, filasConsolidado[0].length).setValues(filasConsolidado);
  }

  actualizarSeguimientoUATP_(maestro);
}

/**
 * Abre el Sheets protegido de un EE y calcula sus métricas de DOCENTES y ASISTENTES.
 * @param {string} urlSheetsEE
 * @return {object}
 */
function leerMetricasSheetsEE_(urlSheetsEE) {
  const id = extraerIdDesdeUrl(urlSheetsEE);
  if (!id) throw new Error('No se pudo extraer el ID desde la URL: ' + urlSheetsEE);

  const sheetEE = SpreadsheetApp.openById(id);
  const hojaDoc = sheetEE.getSheetByName(HOJA_EE_DOCENTES);
  const hojaAsis = sheetEE.getSheetByName(HOJA_EE_ASISTENTES);

  const colSituacion = colPorEncabezado(hojaDoc, 'Situacion_Aula');
  const colObs = colPorEncabezado(hojaDoc, 'Observacion_Contingencia');
  const colHLectivas = colPorEncabezado(hojaDoc, 'H_Lectivas_Semanales');
  const colHNoLectivas = colPorEncabezado(hojaDoc, 'H_No_Lectivas_Semanales');
  const colNombreDoc = colPorEncabezado(hojaDoc, 'Nombre_Completo');

  const filasDoc = hojaDoc.getLastRow() > 1
    ? hojaDoc.getRange(2, 1, hojaDoc.getLastRow() - 1, hojaDoc.getLastColumn()).getValues()
    : [];
  const docentesValidos = filasDoc.filter(f => String(f[colNombreDoc] || '').trim() !== '');

  let sumaHorasLectivas = 0;
  let nAlertasHorarias = 0;
  let nReemplazosSinObs = 0;

  docentesValidos.forEach(f => {
    const hLectivas = Number(f[colHLectivas]) || 0;
    const hNoLectivas = Number(f[colHNoLectivas]) || 0;
    sumaHorasLectivas += hLectivas;
    if (hLectivas + hNoLectivas > MAX_HORAS_DOCENTE) nAlertasHorarias++;
    if (f[colSituacion] === 'Reemplazando' && String(f[colObs] || '').trim() === '') nReemplazosSinObs++;
  });

  const colNombreAsis = colPorEncabezado(hojaAsis, 'Nombre_Completo');
  const filasAsis = hojaAsis.getLastRow() > 1
    ? hojaAsis.getRange(2, 1, hojaAsis.getLastRow() - 1, hojaAsis.getLastColumn()).getValues()
    : [];
  const asistentesValidos = filasAsis.filter(f => String(f[colNombreAsis] || '').trim() !== '');

  return {
    totalDocentes: docentesValidos.length,
    totalAsistentes: asistentesValidos.length,
    sumaHorasLectivas: sumaHorasLectivas,
    nAlertasHorarias: nAlertasHorarias,
    nReemplazosSinObs: nReemplazosSinObs,
    linkPme: null // se completa desde RESPUESTAS_FORM en obtenerTotalesDeclarados_, no desde el Sheets EE
  };
}

/**
 * Lee de RESPUESTAS_FORM (la fila más reciente de ese RBD) los totales
 * declarados y el link al PME, para comparación V4 y para CONSOLIDADO.
 */
function obtenerTotalesDeclarados_(maestro, rbd) {
  const hojaResp = maestro.getSheetByName(HOJA_RESPUESTAS_FORM);
  const colRBDResp = colPorEncabezado(hojaResp, 'RBD');
  const colTotalDoc = colPorEncabezado(hojaResp, 'N° total de docentes del establecimiento');
  const colTotalAsis = colPorEncabezado(hojaResp, 'N° total de asistentes de la educación');
  const colPme = colPorEncabezado(hojaResp, 'Link al PME vigente en Google Drive');

  const datos = hojaResp.getRange(2, 1, Math.max(hojaResp.getLastRow() - 1, 0), hojaResp.getLastColumn()).getValues();
  let resultado = { totalDocentes: null, totalAsistentes: null, linkPme: null };

  for (let i = datos.length - 1; i >= 0; i--) {
    if (String(datos[i][colRBDResp]).trim() === String(rbd).trim()) {
      resultado.totalDocentes = Number(datos[i][colTotalDoc]);
      resultado.totalAsistentes = Number(datos[i][colTotalAsis]);
      resultado.linkPme = datos[i][colPme];
      break;
    }
  }
  return resultado;
}

/**
 * Regenera SEGUIMIENTO_UATP preservando la columna Obs_UATP (única editable
 * manualmente por el equipo SLEP).
 */
function actualizarSeguimientoUATP_(maestro) {
  const hojaEE = maestro.getSheetByName(HOJA_MAESTRO_EE);
  const hojaSeg = maestro.getSheetByName(HOJA_SEGUIMIENTO);

  const colRBD = colPorEncabezado(hojaEE, 'RBD');
  const colNombreEE = colPorEncabezado(hojaEE, 'Nombre_EE');
  const colAsesor = colPorEncabezado(hojaEE, 'Asesor_UATP');
  const colFechaForm = colPorEncabezado(hojaEE, 'Fecha_Form');
  const colEstadoForm = colPorEncabezado(hojaEE, 'Estado_Form');
  const colEstadoSheets = colPorEncabezado(hojaEE, 'Estado_Sheets');

  // Preserva Obs_UATP existentes indexadas por RBD antes de reescribir.
  const obsExistentes = {};
  if (hojaSeg.getLastRow() > 1) {
    const colRBDSeg = colPorEncabezado(hojaSeg, 'RBD');
    const colObs = colPorEncabezado(hojaSeg, 'Obs_UATP');
    const datosSeg = hojaSeg.getRange(2, 1, hojaSeg.getLastRow() - 1, hojaSeg.getLastColumn()).getValues();
    datosSeg.forEach(f => { obsExistentes[String(f[colRBDSeg]).trim()] = f[colObs]; });
    hojaSeg.getRange(2, 1, hojaSeg.getLastRow() - 1, hojaSeg.getLastColumn()).clearContent();
  }

  const datosEE = hojaEE.getRange(2, 1, Math.max(hojaEE.getLastRow() - 1, 0), hojaEE.getLastColumn()).getValues();
  const filasSeg = datosEE.filter(f => f[colRBD]).map(f => {
    const rbd = String(f[colRBD]).trim();
    return [
      f[colRBD],
      f[colNombreEE],
      f[colAsesor],
      f[colFechaForm] || '',
      f[colEstadoForm] || '',
      '', // Fecha_Sheets (queda para futura iteración si se versiona el Sheets EE)
      f[colEstadoSheets] || '',
      f[colEstadoForm] !== 'Recibido', // Pendiente
      obsExistentes[rbd] || ''
    ];
  });

  if (filasSeg.length > 0) {
    hojaSeg.getRange(2, 1, filasSeg.length, filasSeg[0].length).setValues(filasSeg);
  }
}
