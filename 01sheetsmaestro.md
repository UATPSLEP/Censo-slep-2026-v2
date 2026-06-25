# PASO 1 — Estructura del Sheets Maestro (lado SLEP)

Archivo: `MAESTRO_SLEP_2026` (único, propiedad de SLEP Valdivia, NUNCA compartido con establecimientos).

## Pestaña `MAESTRO_EE`

Una fila por establecimiento (179 filas + encabezado). Es la columna vertebral: todo se ancla a `RBD`.

| Columna | Tipo de dato | Notas |
|---|---|---|
| RBD | Número (texto si tiene letra, ej. "6762") | Clave única. Validación de datos: sin duplicados (fórmula `COUNTIF` o regla personalizada). |
| Nombre_EE | Texto | |
| Director | Texto | |
| RUT_Director | Texto (formato `XX.XXX.XXX-X`) | Validado por `validarRutChileno()`. |
| Correo_Director | Texto (email) | Validación de datos: "es un correo electrónico válido". |
| Asesor_UATP | Texto | Debe coincidir con lista de asesores (validación con lista desplegable alimentada desde una pestaña auxiliar `ASESORES`). |
| Comuna | Lista desplegable | Valdivia, Corral, Lanco, Los Lagos, Máfil, Mariquina, Paillaco, Panguipulli. |
| Estado_Form | Lista desplegable | "" (vacío) / Recibido / Rechazado |
| Fecha_Form | Fecha-hora | Llenado automático por `onFormSubmit`. |
| Link_Sheets_EE | URL (texto) | Llenado automático por `generarSheetsEstablecimientos()`. |
| Estado_Sheets | Lista desplegable | Pendiente / Iniciado / Completo |
| Alertas | Texto | Llenado automático por `validarRespuestaForm()`, lista separada por `;`. |
| Completitud | Número (%) | Calculado en `consolidarDatos()`. |
| Estado_Final | Lista desplegable | Rojo / Amarillo / Verde |

### Formato condicional recomendado
- `Estado_Final` = "Rojo" → fila completa fondo `#f4cccc`.
- `Estado_Final` = "Amarillo" → fondo `#fff2cc`.
- `Estado_Final` = "Verde" → fondo `#d9ead3`.
- `Estado_Form` vacío y han pasado > 5 días desde inicio del levantamiento → fondo `#f4cccc` en columna `Estado_Form` (regla con fórmula personalizada usando `TODAY()`).

### Pestaña auxiliar `ASESORES` (no listada originalmente, recomendada)
`Nombre_Asesor | Correo_Asesor | Comunas_Asignadas` — fuente de las listas desplegables de `Asesor_UATP` y de los correos en CC de `enviarRecordatorios()`.

## Pestaña `RESPUESTAS_FORM`

Destino automático de Google Forms ("Vincular respuestas" → esta hoja). **No modificar estructura ni reordenar columnas**: el script identifica columnas por encabezado (texto), no por índice, para tolerar reordenamientos accidentales del editor de Forms.

Protección: proteger toda la hoja excepto el rango donde Forms escribe (Forms necesita poder seguir agregando filas — en la práctica se deja sin protección de edición pero se le agrega "protección de advertencia" para que cualquier edición manual muestre alerta).

## Pestaña `CONSOLIDADO`

Una fila por establecimiento, regenerada por `consolidarDatos()` (se limpia y reescribe completa en cada corrida, no se acumula).

| Columna | Tipo |
|---|---|
| RBD | Número |
| Nombre_EE | Texto |
| Comuna | Texto |
| Asesor_UATP | Texto |
| Total_Docentes | Número |
| Total_Horas_Lectivas_Sum | Número |
| Total_Asistentes | Número |
| N_Alertas_Horarias | Número |
| N_Reemplazos_Sin_Obs | Número |
| PME_Link | URL |
| Estado | Rojo/Amarillo/Verde |

Formato condicional idéntico al de `Estado_Final` en `MAESTRO_EE`.

## Pestaña `SEGUIMIENTO_UATP`

Vista de trabajo para el equipo SLEP, editable manualmente por ellos (columna `Obs_UATP`).

| Columna | Tipo | Editable |
|---|---|---|
| RBD | Número | No (fórmula `=MAESTRO_EE` por RBD) |
| EE | Texto | No |
| Asesor | Texto | No |
| Fecha_Form | Fecha | No |
| Estado_Form | Texto | No |
| Fecha_Sheets | Fecha | No |
| Estado_Sheets | Texto | No |
| Pendiente | Booleano (checkbox) | No, calculado |
| Obs_UATP | Texto libre | **Sí**, único campo libre del equipo SLEP |

Se recomienda generarla con fórmulas `QUERY`/`FILTER` sobre `MAESTRO_EE` en lugar de copiar valores, para que se autoactualice sin necesidad de script. Solo `Obs_UATP` requiere persistencia manual, por lo que esa columna sí debe protegerse de sobrescritura por fórmula (se deja como columna de valores, no de fórmula).

## Pestaña `LOG_AUDITORIA`

Append-only. Nunca se borran filas (cumplimiento Ley 19.628 — trazabilidad de accesos y cambios).

| Columna | Tipo |
|---|---|
| Timestamp | Fecha-hora (`new Date()`) |
| RBD | Número |
| Accion | Texto (ej. "CREACION_SHEETS", "FORM_RECIBIDO", "RECORDATORIO_ENVIADO", "CONSOLIDACION") |
| Usuario_Correo | Texto (correo del director/script) |
| Detalle | Texto libre |

Protección: hoja completa protegida, solo editable por el script (ejecutado como cuenta de servicio/propietario) y por administradores SLEP.
