# Sistema de Levantamiento de Dotación — Diagnóstico UATP 2026

Arquitectura de dos componentes (Google Form + Google Sheets protegido por establecimiento) para el levantamiento censal de los 179 establecimientos de SLEP Valdivia.

- `01-sheets-maestro.md` — estructura del Sheets maestro SLEP (MAESTRO_EE, RESPUESTAS_FORM, CONSOLIDADO, SEGUIMIENTO_UATP, LOG_AUDITORIA).
- `02-sheets-protegido.md` — estructura y protección técnica del Sheets de dotación por establecimiento.
- `03-google-form.md` — configuración completa del Google Form.
- `apps-script/` — código Apps Script de las 5 funciones del sistema + `validarRutChileno()`.
- `05-despliegue-48h.md` — guía paso a paso para desplegar en 48 horas.
