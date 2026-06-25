# PASO 2 — Estructura del Sheets protegido por establecimiento

Un archivo por RBD, generado desde un **template** (`TEMPLATE_DOTACION_EE`) por `generarSheetsEstablecimientos()`. Nombre final: `Dotación_[RBD]_[Nombre_EE]`.

Principio de diseño: el establecimiento solo puede **agregar filas** dentro de rangos de datos específicos. Todo lo demás (encabezados, formato, columnas, otras hojas) está protegido a nivel de Apps Script con `Protection` y `setWarningOnly(false)` + lista de editores restringida al propio script/SLEP.

## Pestaña `CABECERA` (protegida 100%, solo lectura para el EE)

| Columna | Valor |
|---|---|
| RBD | Pre-llenado |
| Nombre_EE | Pre-llenado |
| Director | Pre-llenado |
| Asesor_UATP | Pre-llenado |
| Comuna | Pre-llenado |
| Fecha_Creacion | Pre-llenado (timestamp de creación) |

Protección técnica: `range.protect()` sobre `A1:F2`, `removeEditors()` de todos salvo el ejecutor del script. El director/UTP tiene rol **Editor del archivo** (necesario para poder escribir en otras hojas), pero la protección de rango bloquea esta hoja específica incluso para editores del archivo (`protection.setDomainEdit(false)` + lista blanca vacía salvo el dueño).

## Pestaña `DOCENTES`

Fila 1 = encabezados protegidos. Filas 2+ = zona editable.

| Columna | Validación de datos | Formato condicional |
|---|---|---|
| RUT | Regla personalizada: fórmula que llama a una validación de RUT (ver nota abajo) | — |
| Nombre_Completo | Texto, longitud > 0 | — |
| Titulo_Pedagogico | Texto libre | — |
| Tipo_Contrato | Lista: Titular, Contrata, Reemplazo, Honorario, SEP, PIE, Otro | — |
| Situacion_Aula | Lista: Titular de curso, Reemplazando, Sin curso asignado, Licencia/Ausente | — |
| Nivel | Lista: Parvularia, 1°Básico...8°Básico, 1°Medio...4°Medio, TP Módulo, EPJA | — |
| Asignatura_Principal | Texto libre | — |
| H_Lectivas_Semanales | Número entero, 0–45 | — |
| H_No_Lectivas_Semanales | Número entero, 0–45 | — |
| Observacion_Contingencia | Texto libre | — |

Formato condicional (aplicado sobre el rango de datos completo, ej. `A2:J500`):
1. **Rojo** (`#f4cccc`) si `H_Lectivas_Semanales + H_No_Lectivas_Semanales > 45` → fórmula personalizada: `=($H2+$I2)>45` aplicada a toda la fila.
2. **Amarillo** (`#fff2cc`) si `Situacion_Aula = "Reemplazando"` Y `Observacion_Contingencia` está vacía → `=AND($E2="Reemplazando", $J2="")`.

> Nota sobre validación de RUT en la hoja: Google Sheets `Data Validation` no ejecuta Apps Script en tiempo real al tipear. Se implementan dos capas:
> - **Capa 1 (hoja)**: fórmula personalizada simple que verifica formato (regex con `REGEXMATCH`) — atrapa errores de tipeo grueso al instante.
> - **Capa 2 (script)**: `onEdit(e)` instalable en el Sheets protegido que, al editar la columna RUT, llama a `validarRutChileno()` (módulo 11 real) y si es inválido pinta la celda roja y agrega una nota (`setNote`) explicando el error, **sin bloquear ni borrar lo escrito** (cumple el requisito de "nunca bloqueo silencioso").

## Pestaña `ASISTENTES`

Misma lógica que `DOCENTES`.

| Columna | Validación |
|---|---|
| RUT | Igual a DOCENTES (regex + onEdit) |
| Nombre_Completo | Texto |
| Funcion_Principal | Lista: UTP, Inspector/a, Apoyo pedagógico PIE, Asistente de aula, Biblioteca, Laboratorio, Paradocente, Administrativo, Otro |
| H_Contratadas_Semanales | Número entero, 0–44 |
| Observaciones | Texto libre |

## Pestaña `README` (protegida, solo lectura)

Contenido sugerido:
1. Qué es este archivo y para qué se usa.
2. Cómo agregar una fila (clic derecho sobre la última fila de datos → "Insertar fila debajo", **nunca** insertar arriba del encabezado).
3. Ejemplos de RUT correcto: `12.345.678-5`, `9876543-2`. Errores comunes: usar puntos en el dígito verificador, usar "K" en minúscula (ambas se aceptan, pero se normaliza), dejar espacios.
4. Qué hacer si la celda se pone roja (no es un error fatal, es una alerta — revisar y corregir o dejar nota si es intencional).
5. Contacto del Asesor UATP de su comuna (se pre-llena automáticamente con el campo `Asesor_UATP` de `MAESTRO_EE`, igual que `CABECERA`).
6. Plazo de entrega y a qué correo escribir en caso de dudas técnicas.

## Rangos protegidos — resumen técnico (implementado en `generarSheetsEstablecimientos()`)

```
CABECERA      → protect() rango completo A1:F2
DOCENTES      → protect() fila 1 (encabezados) A1:J1
ASISTENTES    → protect() fila 1 (encabezados) A1:E1
README        → protect() hoja completa
```

Adicionalmente: `sheet.protect()` a nivel de **hoja completa** para `CABECERA` y `README` (no hay zona editable), y protección de **rango de encabezado únicamente** para `DOCENTES`/`ASISTENTES`, dejando libres las filas de datos. Se usa `protection.setWarningOnly(false)` y `protection.removeEditors(protection.getEditors())` para que la restricción sea dura (no solo advertencia), de modo que un usuario sin permisos de administrador no pueda "saltarla" aceptando un cuadro de diálogo.

El director recibe rol **Editor del archivo completo**, pero la combinación de protección de rango + `setDomainEdit(false)` impide que pueda tocar las zonas protegidas aunque tenga rol Editor — esto es lo que hace "técnicamente imposible de romper sin permisos de administrador" (administrador = el dueño/script, que sí puede levantar la protección).
