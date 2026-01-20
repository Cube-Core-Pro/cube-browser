/**
 * Email Marketing Tour Steps - Contacts
 * Fase 3: Gestión de contactos
 */

import { TourSection, TourStep } from '../types';

// ============================================================================
// SECTION 3: CONTACTS MANAGEMENT
// ============================================================================

export const contactSteps: TourStep[] = [
  {
    id: 'contacts-intro',
    title: 'Gestión de Contactos - Tu Audiencia',
    content: 'Los contactos son la base de tus campañas. Aquí puedes agregar, importar, organizar y segmentar tu audiencia para enviar mensajes más relevantes.',
    category: 'contacts',
    position: 'center',
    highlightType: 'none',
    tips: [
      'La calidad de tu lista importa más que la cantidad',
      'Mantén tus contactos actualizados para mejor deliverability',
      'Nunca compres listas de emails, daña tu reputación'
    ],
    competitiveAdvantage: 'CUBE incluye validación automática de emails y limpieza de bounces sin costo adicional. Mailchimp cobra extra por esto.'
  },
  {
    id: 'contacts-overview',
    title: 'Panel de Estadísticas de Contactos',
    content: 'Aquí ves el total de contactos, suscritos activos, no suscritos y bounceados. Las estadísticas te ayudan a entender la salud de tu lista.',
    category: 'contacts',
    targetSelector: '.contact-stats-grid',
    position: 'bottom',
    highlightType: 'spotlight',
    tips: [
      'Contactos activos: Pueden recibir tus emails',
      'No suscritos: Pidieron no recibir más emails',
      'Bounced: Emails inválidos que rebotaron'
    ],
    competitiveAdvantage: 'Detección proactiva de emails problemáticos antes de que afecten tu reputación de sender.'
  },
  {
    id: 'contacts-add-single',
    title: 'Agregar Contacto Individual',
    content: 'Haz clic en "Add Contact" para agregar contactos uno por uno. Perfecto para leads que llegan de formularios o conversaciones directas.',
    category: 'contacts',
    targetSelector: '[data-tour="add-contact"]',
    position: 'bottom',
    highlightType: 'pulse',
    action: {
      type: 'click',
      label: 'Agregar contacto',
    },
    tips: [
      'Campos requeridos: Solo email',
      'Campos opcionales: Nombre, empresa, teléfono',
      'Puedes agregar etiquetas para organizar'
    ]
  },
  {
    id: 'contacts-form-email',
    title: 'Email del Contacto',
    content: 'El email es el único campo obligatorio. CUBE valida automáticamente que sea un email real y no esté duplicado.',
    category: 'contacts',
    targetSelector: '[data-tour="contact-email"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Se detectan emails temporales automáticamente',
      'Los duplicados se fusionan inteligentemente',
      'Formato: ejemplo@dominio.com'
    ],
    competitiveAdvantage: 'Validación en tiempo real con verificación MX del dominio. Otros servicios solo validan formato.'
  },
  {
    id: 'contacts-form-details',
    title: 'Información Adicional',
    content: 'Agrega nombre, apellido, empresa y teléfono. Esta información te ayuda a personalizar tus campañas con variables como {nombre}.',
    category: 'contacts',
    targetSelector: '[data-tour="contact-details"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Los campos vacíos no afectan el envío',
      'Usa capitalización correcta para nombres',
      'La empresa ayuda en segmentación B2B'
    ]
  },
  {
    id: 'contacts-tags',
    title: 'Etiquetas (Tags)',
    content: 'Las etiquetas te permiten categorizar contactos: "cliente", "lead", "VIP", "evento2024". Úsalas para segmentar y enviar campañas específicas.',
    category: 'contacts',
    targetSelector: '[data-tour="contact-tags"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'Un contacto puede tener múltiples etiquetas',
      'Usa etiquetas descriptivas y consistentes',
      'Las etiquetas permiten filtrar en campañas'
    ],
    competitiveAdvantage: 'Sistema de tags ilimitados. Competidores limitan tags en planes básicos.'
  },
  {
    id: 'contacts-import',
    title: 'Importar Contactos en Masa',
    content: 'Haz clic en "Import" para subir contactos desde un archivo CSV o Excel. Perfecto para migrar desde otras plataformas o agregar listas existentes.',
    category: 'contacts',
    targetSelector: '[data-tour="import-contacts"]',
    position: 'bottom',
    highlightType: 'pulse',
    action: {
      type: 'click',
      label: 'Importar contactos',
    },
    tips: [
      'Formatos soportados: CSV, XLSX, TXT',
      'Máximo 100,000 contactos por importación',
      'CUBE detecta columnas automáticamente'
    ],
    competitiveAdvantage: 'Importación inteligente que mapea columnas automáticamente. Sin configuración manual.'
  },
  {
    id: 'contacts-import-mapping',
    title: 'Mapeo de Columnas',
    content: 'CUBE detecta automáticamente qué columna es email, nombre, etc. Puedes ajustar el mapeo si es necesario.',
    category: 'contacts',
    targetSelector: '[data-tour="column-mapping"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'Email es obligatorio, sin él el contacto se ignora',
      'Columnas no mapeadas se importan como campos custom',
      'Revisa la previsualización antes de confirmar'
    ]
  },
  {
    id: 'contacts-import-options',
    title: 'Opciones de Importación',
    content: 'Decide qué hacer con duplicados: actualizar, ignorar o crear nuevo. También puedes agregar etiquetas automáticas a todos los importados.',
    category: 'contacts',
    targetSelector: '[data-tour="import-options"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      '"Actualizar" sobrescribe datos existentes',
      '"Ignorar" salta duplicados sin cambios',
      'Etiqueta común ejemplo: "import_dic2024"'
    ]
  },
  {
    id: 'contacts-export',
    title: 'Exportar Contactos',
    content: 'Descarga tu lista completa o filtrada en CSV. Útil para backups, análisis en Excel, o migración a otras plataformas.',
    category: 'contacts',
    targetSelector: '[data-tour="export-contacts"]',
    position: 'bottom',
    highlightType: 'border',
    tips: [
      'Exporta solo lo que necesitas con filtros',
      'Incluye métricas de engagement opcionalmente',
      'Formato UTF-8 compatible con Excel'
    ],
    competitiveAdvantage: 'Tus datos son tuyos. Export completo sin restricciones, algunos competidores limitan esto.'
  },
  {
    id: 'contacts-lists',
    title: 'Listas de Contactos',
    content: 'Las listas agrupan contactos por criterio: "Newsletter", "Clientes Premium", "Leads Fríos". Un contacto puede estar en múltiples listas.',
    category: 'contacts',
    targetSelector: '[data-tour="contact-lists"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'Crea listas para diferentes propósitos de comunicación',
      'Las listas facilitan campañas segmentadas',
      'Puedes mover contactos entre listas fácilmente'
    ],
    competitiveAdvantage: 'Listas dinámicas que se actualizan automáticamente según reglas. Otros cobran extra por esto.'
  },
  {
    id: 'contacts-create-list',
    title: 'Crear Nueva Lista',
    content: 'Haz clic en "Nueva Lista" y dale un nombre descriptivo. Puedes agregar contactos existentes o dejarla vacía para llenar después.',
    category: 'contacts',
    targetSelector: '[data-tour="create-list"]',
    position: 'right',
    highlightType: 'pulse',
    action: {
      type: 'click',
      label: 'Crear lista',
    },
    tips: [
      'Nombres claros: "Clientes_Activos_2024"',
      'Evita nombres genéricos como "Lista1"',
      'Puedes agregar descripción para recordar el propósito'
    ]
  },
  {
    id: 'contacts-bulk-actions',
    title: 'Acciones en Lote',
    content: 'Selecciona múltiples contactos y aplica acciones: agregar a lista, agregar tags, eliminar, o cambiar estado de suscripción.',
    category: 'contacts',
    targetSelector: '[data-tour="bulk-actions"]',
    position: 'top',
    highlightType: 'border',
    tips: [
      'Selecciona todos con el checkbox del header',
      'Los filtros afectan la selección masiva',
      'Las acciones de eliminación piden confirmación'
    ]
  },
  {
    id: 'contacts-search-filter',
    title: 'Búsqueda y Filtros',
    content: 'Busca contactos por email, nombre o etiqueta. Los filtros te permiten ver solo activos, por fecha de registro, o por engagement.',
    category: 'contacts',
    targetSelector: '[data-tour="contact-search"]',
    position: 'bottom',
    highlightType: 'spotlight',
    tips: [
      'Busca parcialmente: "john" encuentra "john@example.com"',
      'Filtra por engagement para re-engagement campaigns',
      'Guarda filtros frecuentes como vistas'
    ],
    competitiveAdvantage: 'Búsqueda instantánea en millones de contactos. Sin esperas.'
  },
  {
    id: 'contacts-engagement',
    title: 'Métricas de Engagement',
    content: 'Cada contacto tiene score de engagement: aperturas, clics, última actividad. Úsalo para identificar contactos activos e inactivos.',
    category: 'contacts',
    targetSelector: '[data-tour="engagement-score"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'Alto engagement: Candidatos a ofertas especiales',
      'Bajo engagement: Necesitan re-engagement o limpieza',
      'El score se actualiza con cada campaña'
    ],
    competitiveAdvantage: 'Scoring automático de engagement sin configuración. Otros requieren integraciones complejas.'
  },
  {
    id: 'contacts-gdpr',
    title: 'Cumplimiento GDPR/Privacy',
    content: 'CUBE rastrea automáticamente el consentimiento y te ayuda a cumplir regulaciones de privacidad con historial de opt-in/opt-out.',
    category: 'contacts',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Guarda evidencia de consentimiento automáticamente',
      'Link de "unsubscribe" obligatorio en cada email',
      'Exporta datos de un contacto para solicitudes GDPR'
    ],
    competitiveAdvantage: 'Cumplimiento GDPR integrado sin módulos adicionales. Competidores lo venden como add-on costoso.'
  },
  {
    id: 'contacts-complete',
    title: '¡Contactos Listos! 📋',
    content: 'Ya sabes cómo gestionar tu audiencia. Con contactos organizados, puedes crear campañas segmentadas que realmente convierten.',
    category: 'contacts',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Revisa y limpia tu lista regularmente',
      'Segmenta para mejores resultados',
      'La personalización aumenta conversiones 26%'
    ]
  }
];

export const contactsSection: TourSection = {
  id: 'contacts',
  title: 'Gestión de Contactos',
  description: 'Aprende a importar, organizar y segmentar tu audiencia',
  icon: '👥',
  category: 'contacts',
  steps: contactSteps,
  estimatedTime: 12,
  difficulty: 'beginner'
};
