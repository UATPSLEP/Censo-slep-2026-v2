/**
 * OnEditSheetsEE.gs
 * Este archivo se instala DENTRO de cada Sheets protegido de establecimiento
 * (o, preferentemente, en el template TEMPLATE_DOTACION_EE para que se copie
 * automáticamente al clonar — `makeCopy` copia también los scripts vinculados
 * al contenedor).
 *
 * Valida en tiempo real la columna RUT de DOCENTES y ASISTENTES. Nunca borra
 * ni bloquea lo escrito: solo marca visualmente y deja una nota explicativa,
 * cumpliendo el requisito de "nunca bloqueo silencioso".
 */
function onEdit(e) {
  const hoja = e.range.getSheet();
  const nombreHoja = hoja.getName();
  if (nombreHoja !== HOJA_EE_DOCENTES && nombreHoja !== HOJA_EE_ASISTENTES) return;
  if (e.range.getRow() === 1) return; // no validar el encabezado

  const colRut = colPorEncabezado(hoja, 'RUT');
  if (e.range.getColumn() !== colRut + 1) return;

  const celda = e.range;
  const valor = celda.getValue();

  if (!valor) {
    celda.setBackground(null);
    celda.clearNote();
    return;
  }

  if (validarRutChileno(valor)) {
    celda.setBackground(null);
    celda.clearNote();
    celda.setValue(normalizarRut(valor));
  } else {
    celda.setBackground('#f4cccc');
    celda.setNote('RUT inválido según dígito verificador (módulo 11). Verifique: formato esperado "12.345.678-5". No se bloqueó el dato, revíselo antes de enviar.');
  }
}
