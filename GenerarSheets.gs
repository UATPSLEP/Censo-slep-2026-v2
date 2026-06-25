/**
 * GenerarSheets.gs
 * FUNCIÓN 1 — generarSheetsEstablecimientos()
 * Trigger: manual, ejecutado una vez al inicio del levantamiento.
 * Crea, pre-llena, protege y comparte un Sheets de dotación por cada
 * establecimiento listado en MAESTRO_EE.
 */
function generarSheetsEstablecimientos() {
  const maestro = SpreadsheetApp.openById(MAESTRO_ID);
  const hojaEE = maestro.getSheetByName(HOJA_MAESTRO_EE);
  const carpeta = DriveApp.getFolderById(CARPETA_DOTACION_ID);

  const colRBD = colPorEncabezado(hojaEE, 'RBD');
  const colNombreEE = colPorEncabezado(hojaEE, 'Nombre_EE');
  const colDirector = colPorEncabezado(hojaEE, 'Director');
  const colCorreoDirector = colPorEncabezado(hojaEE, 'Correo_Director');
  const colAsesor = colPorEncabezado(hojaEE, 'Asesor_UATP');
  const colComuna = colPorEncabezado(hojaEE, 'Comuna');
  const colLinkSheets = colPorEncabezado(hojaEE, 'Link_Sheets_EE');
  const colEstadoSheets = colPorEncabezado(hojaEE, 'Estado_Sheets');

  const ultimaFila = hojaEE.getLastRow();
  const datos = hojaEE.getRange(2, 1, ultimaFila - 1, hojaEE.getLastColumn()).getValues();

  for (let i = 0; i < datos.length; i++) {
    const fila = datos[i];
    const rbd = fila[colRBD];
    if (!rbd) continue;

    // Evita regenerar archivos ya creados (permite re-ejecutar la función sin duplicar).
    if (fila[colLinkSheets]) {
      console.log('RBD ' + rbd + ' ya tiene Sheets generado, se omite.');
      continue;
    }

    try {
      const nombreEE = fila[colNombreEE];
      const director = fila[colDirector];
      const correoDirector = fila[colCorreoDirector];
      const asesor = fila[colAsesor];
      const comuna = fila[colComuna];

      const nombreArchivo = 'Dotación_' + rbd + '_' + nombreEE;
      const copia = DriveApp.getFileById(TEMPLATE_DOTACION_ID).makeCopy(nombreArchivo, carpeta);
      const sheetEE = SpreadsheetApp.openById(copia.getId());

      prellenarCabecera_(sheetEE, rbd, nombreEE, director, asesor, comuna);
      protegerRangosEE_(sheetEE);
      compartirSheetsEE_(copia, correoDirector, asesor);

      const filaReal = i + 2;
      hojaEE.getRange(filaReal, colLinkSheets + 1).setValue(copia.getUrl());
      hojaEE.getRange(filaReal, colEstadoSheets + 1).setValue('Pendiente');

      registrarLog(rbd, 'CREACION_SHEETS', Session.getActiveUser().getEmail(), 'Archivo: ' + nombreArchivo);
    } catch (err) {
      console.error('Error generando Sheets para RBD ' + rbd + ': ' + err);
      registrarLog(rbd, 'ERROR_CREACION_SHEETS', Session.getActiveUser().getEmail(), String(err));
    }
  }
}

function prellenarCabecera_(sheetEE, rbd, nombreEE, director, asesor, comuna) {
  const hojaCab = sheetEE.getSheetByName(HOJA_EE_CABECERA);
  hojaCab.getRange(2, 1, 1, 6).setValues([[rbd, nombreEE, director, asesor, comuna, new Date()]]);

  // Pre-llena también el contacto de asesor en README (rango fijo definido en el template).
  const hojaReadme = sheetEE.getSheetByName(HOJA_EE_README);
  const celdaAsesor = hojaReadme.getRange('B2'); // celda reservada en el template para "Contacto Asesor UATP"
  celdaAsesor.setValue(asesor);
}

function protegerRangosEE_(sheetEE) {
  const propietario = Session.getEffectiveUser();

  // CABECERA: hoja completa protegida.
  const hojaCab = sheetEE.getSheetByName(HOJA_EE_CABECERA);
  aplicarProteccionDura_(hojaCab.protect().setDescription('CABECERA - solo lectura'), propietario);

  // README: hoja completa protegida.
  const hojaReadme = sheetEE.getSheetByName(HOJA_EE_README);
  aplicarProteccionDura_(hojaReadme.protect().setDescription('README - solo lectura'), propietario);

  // DOCENTES: solo fila de encabezado protegida (deja libres las filas de datos).
  const hojaDoc = sheetEE.getSheetByName(HOJA_EE_DOCENTES);
  const rangoEncabezadoDoc = hojaDoc.getRange(1, 1, 1, hojaDoc.getLastColumn());
  aplicarProteccionDura_(rangoEncabezadoDoc.protect().setDescription('Encabezados DOCENTES'), propietario);

  // ASISTENTES: solo fila de encabezado protegida.
  const hojaAsis = sheetEE.getSheetByName(HOJA_EE_ASISTENTES);
  const rangoEncabezadoAsis = hojaAsis.getRange(1, 1, 1, hojaAsis.getLastColumn());
  aplicarProteccionDura_(rangoEncabezadoAsis.protect().setDescription('Encabezados ASISTENTES'), propietario);
}

/**
 * Deja la protección como "dura" (no solo advertencia) y remueve todos los
 * editores salvo el propietario del script, para que ni siquiera un usuario
 * con rol Editor del archivo pueda modificar el rango.
 */
function aplicarProteccionDura_(proteccion, propietario) {
  proteccion.setWarningOnly(false);
  const editores = proteccion.getEditors();
  if (editores.length > 0) {
    proteccion.removeEditors(editores);
  }
  if (proteccion.canDomainEdit()) {
    proteccion.setDomainEdit(false);
  }
}

function compartirSheetsEE_(archivoDrive, correoDirector, correoAsesor) {
  if (correoDirector) {
    archivoDrive.addEditor(correoDirector);
  }
  if (correoAsesor) {
    archivoDrive.addViewer(correoAsesor);
  }
}
