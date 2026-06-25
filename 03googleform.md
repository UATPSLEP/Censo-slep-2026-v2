# PASO 3 — Configuración de Google Forms

Formulario único: **"Diagnóstico UATP 2026 — Levantamiento por Establecimiento"**. Optimizado para escritorio (no usar secciones de Forms en modo "tema móvil"; usar diseño por defecto de columna ancha).

## Configuración general
- Recolectar dirección de correo: **No** (no requiere cuenta institucional restringida; la trazabilidad va por RBD, no por correo de sesión).
- "Limitar a 1 respuesta": **desactivado** (si se activa, exige login y rompe el requisito de "no cuenta institucional restringida"). El control de unicidad por establecimiento se hace en `onFormSubmit` (RBD ya recibido → marcar como actualización/sobrescritura, no duplicar fila).
- Vincular respuestas a `MAESTRO_SLEP_2026` → pestaña `RESPUESTAS_FORM`.

## SECCIÓN 0 — Identificación
| Pregunta | Tipo | Obligatorio |
|---|---|---|
| RBD | Respuesta corta, validación: número | Sí |
| Nombre del establecimiento | Respuesta corta | Sí |
| Nombre de quien completa | Respuesta corta | Sí |
| Rol de quien completa | Opción múltiple: Director/a, UTP, Secretaria/o, Otro | Sí |
| Nombre del director/a que valida | Respuesta corta | Sí |
| RUT del director/a | Respuesta corta, validación regex `^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$` | Sí |
| Correo de contacto del establecimiento | Respuesta corta, validación de email | Sí |

## SECCIÓN 1 — Niveles y matrícula
- Pregunta de salto de sección: **"Niveles que imparte"** (Casillas de verificación: Parvularia, Básica, Media HC, Media TP, EPJA). Forms no permite branching nativo desde checkboxes hacia múltiples secciones condicionadas a cada opción simultáneamente — la implementación recomendada es:
  - Una sección fija por nivel (5 secciones: 1A Parvularia, 1B Básica, 1C Media HC, 1D Media TP, 1E EPJA), cada una con la instrucción **"Complete esta sección solo si marcó este nivel arriba; si no, presione Siguiente sin llenar"**.
  - Cada subsección contiene: N° de cursos (número), N° de estudiantes matriculados (número), Jornada predominante (opción múltiple: Completa, Mañana, Tarde, Mixta) — ninguna marcada como obligatoria a nivel de Forms (la obligatoriedad condicional se valida en `validarRespuestaForm`, ya que Forms no soporta "obligatorio si X").
- Observaciones de matrícula: párrafo, opcional.

## SECCIÓN 2 — Dotación (referencia al Sheets protegido)
- Texto informativo (elemento "Texto" sin pregunta): el bloque indicado en el requerimiento.
- N° total de docentes del establecimiento: número, obligatorio.
- N° total de asistentes de la educación: número, obligatorio.

## SECCIÓN 3 — Infraestructura
| Pregunta | Tipo |
|---|---|
| N° de salas de clases disponibles | Número |
| ¿Tiene laboratorio de computación activo? | Sí/No |
| ¿Tiene biblioteca CRA activa? | Sí/No |
| ¿Tiene sala de recursos PIE? | Sí/No |
| Observaciones de infraestructura | Párrafo, opcional |

## SECCIÓN 4 — Contingencias
- ¿Existe contingencia relevante actualmente? Sí/No → **salto de sección nativo**: si "Sí", ir a sub-sección con "Descripción de la contingencia" (párrafo, obligatorio en esa rama); si "No", saltar directo a Observaciones generales (párrafo, opcional).

## SECCIÓN 5 — Cierre y envío
| Pregunta | Tipo | Obligatorio |
|---|---|---|
| Link al PME vigente en Google Drive | Respuesta corta, validación regex `^https://` | Sí |
| Link al Google Sheets de dotación completado | Respuesta corta, validación regex `^https://docs\.google\.com/spreadsheets/` | Sí |
| Declaración de veracidad | Casilla de verificación (única opción), obligatoria | Sí |

## Notas de implementación
- Las validaciones regex de Forms reducen errores de tipeo en origen, pero **no sustituyen** las validaciones de `validarRespuestaForm()` en el backend (defensa en profundidad).
- El formulario se construye manualmente en la UI de Forms (Apps Script no puede generar Forms "secciones condicionales con lógica de checkbox" complejas con buena UX); el código de este proyecto se enfoca en el procesamiento de respuestas (`onFormSubmit`), no en la generación del Form. Si se desea generar el Form por script como punto de partida, ver `apps-script/CrearForm.gs` (genera estructura base sin lógica de salto; los saltos condicionales de Sección 4 se terminan de configurar manualmente en la UI, ya que `FormApp` soporta `setGoToPage` pero es más rápido y confiable revisarlo visualmente).
