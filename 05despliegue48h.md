# PASO 5 — Despliegue en 48 horas (paso a paso)

Pensado para ejecutarse sin conocimientos técnicos avanzados, en orden estricto. Tiempos estimados entre paréntesis.

## DÍA 1 — Mañana (preparación, ~3 h)

1. **Crear carpeta en Drive** "Diagnóstico UATP 2026" y dentro otra carpeta "Sheets_Dotación_EE". Anotar el ID de esta segunda carpeta (está en la URL, después de `/folders/`).
2. **Crear el Sheets maestro**: nuevo Google Sheets, nombrarlo `MAESTRO_SLEP_2026`. Crear las pestañas: `MAESTRO_EE`, `RESPUESTAS_FORM` (se vinculará después, dejar vacía por ahora), `CONSOLIDADO`, `SEGUIMIENTO_UATP`, `LOG_AUDITORIA`, `ASESORES`. Copiar los encabezados exactos de cada pestaña según el documento `01-sheets-maestro.md`.
3. **Llenar `MAESTRO_EE`** con los 179 establecimientos (RBD, Nombre_EE, Director, RUT_Director, Correo_Director, Asesor_UATP, Comuna) — exportar desde el "Directorio EE 2026" existente y pegar como valores.
4. **Llenar `ASESORES`** con nombre y correo de cada asesor UATP.
5. **Crear el archivo template** `TEMPLATE_DOTACION_EE`: nuevo Google Sheets con pestañas `CABECERA`, `DOCENTES`, `ASISTENTES`, `README`, con los encabezados y validaciones de datos descritos en `02-sheets-protegido.md` (listas desplegables, formato condicional). Anotar su ID.

## DÍA 1 — Tarde (código, ~3 h)

6. En `MAESTRO_SLEP_2026`: Extensiones → Apps Script. Crear los archivos `.gs` de la carpeta `apps-script/` de este repositorio (`Config.gs`, `Utilidades.gs`, `GenerarSheets.gs`, `OnFormSubmit.gs`, `ValidarRespuesta.gs`, `Consolidar.gs`, `Recordatorios.gs`) copiando y pegando el contenido de cada uno.
7. En `Config.gs`, reemplazar los 3 IDs de marcador (`MAESTRO_ID`, `TEMPLATE_DOTACION_ID`, `CARPETA_DOTACION_ID`) por los IDs reales obtenidos en los pasos 1, 2 y 5.
8. En `TEMPLATE_DOTACION_EE`: Extensiones → Apps Script. Crear ahí el archivo `OnEditSheetsEE.gs` (y copiar también `Utilidades.gs` y `Config.gs`, ya que `onEdit` depende de `validarRutChileno`). Esto asegura que cada copia generada herede automáticamente la validación en tiempo real.
9. Guardar todo. Ejecutar manualmente `validarRutChileno("12.345.678-5")` desde el editor (botón ▶) para confirmar que no hay errores de sintaxis — debería autorizar permisos la primera vez (aceptar el flujo de autorización OAuth de Google).

## DÍA 1 — Noche / Día 2 — Madrugada (generación masiva, ~1 h + tiempo de ejecución)

10. Ejecutar `generarSheetsEstablecimientos()` desde el editor de Apps Script. **Atención**: con 179 establecimientos esto puede superar el límite de 6 minutos de ejecución de un script simple; si ocurre, volver a ejecutar la misma función — está diseñada para omitir los RBD que ya tengan `Link_Sheets_EE` lleno, por lo que se puede correr en varias tandas sin duplicar archivos.
11. Verificar en `MAESTRO_EE` que la columna `Link_Sheets_EE` se llenó y que `Estado_Sheets` quedó en "Pendiente" para todos.
12. Revisar al azar 5 archivos generados: confirmar que CABECERA está pre-llenada, que README está protegido, y que un usuario sin permisos de administrador no puede editar encabezados de DOCENTES/ASISTENTES (probar con una cuenta de prueba si es posible).

## DÍA 2 — Mañana (formulario, ~2 h)

13. Crear el Google Form siguiendo `03-google-form.md`, sección por sección.
14. Form → Respuestas → ícono de Sheets → vincular a `MAESTRO_SLEP_2026`. Esto crea automáticamente la pestaña de respuestas: **renombrarla a `RESPUESTAS_FORM`** (el nombre que Forms asigna por defecto no calza con el código).
15. Confirmar que los nombres de las preguntas en el Form coinciden EXACTAMENTE (mismo texto) con los strings usados en `colPorEncabezado()` dentro de `OnFormSubmit.gs` y `Consolidar.gs` (`RBD`, `Correo de contacto del establecimiento`, `RUT del director/a`, `Link al PME vigente en Google Drive`, `Link al Google Sheets de dotación completado`, `N° total de docentes del establecimiento`, `N° total de asistentes de la educación`). Si se cambia el texto de alguna pregunta en Forms, hay que actualizar el `.gs` correspondiente.

## DÍA 2 — Mediodía (triggers, ~30 min)

16. En el editor de Apps Script de `MAESTRO_SLEP_2026`: ícono de reloj (Triggers) → "Agregar activador":
    - Función `onFormSubmit` → Evento: "Al enviar el formulario" → fuente: hoja de cálculo del proyecto actual.
    - Función `enviarRecordatorios` → Tipo de activador: "Basado en tiempo" → "Temporizador por horas" → cada 48 horas (configurar como "cada 6 horas" si Apps Script no ofrece exactamente 48h, y dejar la lógica interna decidir; alternativamente usar "días" y seleccionar cada 2 días).
    - Función `consolidarDatos` → Tipo de activador: "Basado en tiempo" → diario, en horario de baja actividad (ej. 03:00 AM).
17. En `Recordatorios.gs`, reemplazar `FORM_URL` por la URL pública real del formulario (Form → Enviar → ícono de enlace).

## DÍA 2 — Tarde (prueba piloto y envío, ~2 h)

18. Hacer una prueba end-to-end con 1 establecimiento real (o ficticio): llenar su Sheets de dotación con 2-3 filas, completar el Form completo, enviar, y verificar:
    - `MAESTRO_EE` actualiza `Estado_Form` y `Fecha_Form`.
    - Llega correo de acuse de recibo.
    - Ejecutar manualmente `consolidarDatos()` y verificar que `CONSOLIDADO` y `SEGUIMIENTO_UATP` se llenan correctamente con el semáforo esperado.
    - Probar a propósito un RUT inválido en el Sheets EE y confirmar que la celda se pinta roja con nota, sin borrar el dato.
19. Si todo funciona: enviar el correo masivo inicial a los 179 directores con el link del Form + link de su Sheets de dotación (se puede usar `enviarRecordatorios()` tal cual, ya que envía a todos los que tengan `Estado_Form` vacío — es decir, todos al inicio).
20. Compartir `SEGUIMIENTO_UATP` (vista, no edición de fórmulas) con el equipo de asesores UATP para que monitoreen el avance desde el día 1.

## Checklist final antes de declarar el sistema "en producción"
- [ ] 179 archivos Sheets generados y enlazados en `MAESTRO_EE`.
- [ ] Form probado end-to-end con datos reales.
- [ ] Triggers `onFormSubmit`, `enviarRecordatorios`, `consolidarDatos` instalados y visibles en la lista de activadores.
- [ ] Correo masivo inicial enviado.
- [ ] `LOG_AUDITORIA` registrando eventos correctamente.
- [ ] Acceso a `MAESTRO_SLEP_2026` restringido solo al equipo SLEP (Compartir → revisar que no hay "cualquier persona con el enlace").
