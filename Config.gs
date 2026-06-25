/**
 * Config.gs
 * Constantes globales del sistema. Ajustar IDs antes del despliegue.
 */

// ID del Sheets maestro SLEP (Herramientas > Configuración del proyecto, o desde la URL del archivo).
const MAESTRO_ID = 'PEGAR_AQUI_ID_DEL_SHEETS_MAESTRO';

// ID del Sheets template usado para clonar el archivo de cada establecimiento.
const TEMPLATE_DOTACION_ID = 'PEGAR_AQUI_ID_DEL_TEMPLATE_DOTACION_EE';

// ID de la carpeta de Drive donde se guardarán los 179 archivos generados.
const CARPETA_DOTACION_ID = 'PEGAR_AQUI_ID_DE_LA_CARPETA_DRIVE';

// Nombres de pestañas (constantes para evitar errores de tipeo en el código).
const HOJA_MAESTRO_EE = 'MAESTRO_EE';
const HOJA_RESPUESTAS_FORM = 'RESPUESTAS_FORM';
const HOJA_CONSOLIDADO = 'CONSOLIDADO';
const HOJA_SEGUIMIENTO = 'SEGUIMIENTO_UATP';
const HOJA_LOG = 'LOG_AUDITORIA';

const HOJA_EE_CABECERA = 'CABECERA';
const HOJA_EE_DOCENTES = 'DOCENTES';
const HOJA_EE_ASISTENTES = 'ASISTENTES';
const HOJA_EE_README = 'README';

// Límites de horas (Sección "DOTACIÓN" del Sheets protegido por EE).
const MAX_HORAS_DOCENTE = 45;
const MAX_HORAS_ASISTENTE = 44;

// Correo del equipo UATP que recibe alertas de RBD no encontrado, etc.
const CORREO_EQUIPO_UATP = 'uatp.valdivia@slepvaldivia.cl';
