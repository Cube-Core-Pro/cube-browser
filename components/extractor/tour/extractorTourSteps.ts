/**
 * Data Extractor Tour Steps
 * Tour completo para enseñar la herramienta de web scraping visual
 */

import { TourSection, TourStep } from '../../tour/types';

// ============================================================================
// SECTION 1: WELCOME & OVERVIEW
// ============================================================================

export const welcomeSteps: TourStep[] = [
  {
    id: 'extractor-welcome',
    title: '¡Bienvenido a Data Extractor! 🕷️',
    content: 'La herramienta de web scraping más poderosa del mercado. Extrae datos de cualquier sitio web sin escribir código, point-and-click.',
    category: 'welcome',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Point-and-click para seleccionar datos',
      'AI detecta patrones automáticamente',
      'Exporta a JSON, CSV, Excel, API'
    ],
    competitiveAdvantage: 'Octoparse cobra $89/mes. CUBE incluye extracción ilimitada gratis.'
  },
  {
    id: 'extractor-interface',
    title: 'Vista General de la Interfaz',
    content: 'Tres paneles: Schemas (izquierda), Selector Visual (centro), Preview de datos (derecha). Todo lo necesario para extraer datos.',
    category: 'welcome',
    targetSelector: '[data-tour="extractor-container"]',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Schemas: Tus proyectos de extracción',
      'Selector: Donde seleccionas elementos',
      'Preview: Ve los datos en tiempo real'
    ]
  },
  {
    id: 'extractor-use-cases',
    title: '📊 Casos de Uso Comunes',
    content: 'Precios de competencia, leads de directorios, reviews de productos, listados inmobiliarios, ofertas de empleo, inventarios, y más.',
    category: 'welcome',
    position: 'center',
    highlightType: 'none',
    tips: [
      'E-commerce: Precios y disponibilidad',
      'Lead generation: Contactos de empresas',
      'Research: Artículos y publicaciones'
    ],
    competitiveAdvantage: 'Sin límites de páginas ni datos. Competidores limitan por plan.'
  }
];

export const welcomeSection: TourSection = {
  id: 'extractor-welcome',
  title: 'Bienvenida',
  description: 'Introducción al Data Extractor',
  icon: '👋',
  category: 'welcome',
  steps: welcomeSteps,
  estimatedTime: 3,
  difficulty: 'beginner'
};

// ============================================================================
// SECTION 2: SCHEMA MANAGEMENT
// ============================================================================

export const schemaSteps: TourStep[] = [
  {
    id: 'extractor-schema-list',
    title: '📋 Lista de Schemas',
    content: 'Un schema es un proyecto de extracción: define qué datos extraer y de dónde. Crea múltiples schemas para diferentes sitios o propósitos.',
    category: 'settings',
    targetSelector: '[data-tour="schema-list"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'Un schema por sitio/tipo de datos',
      'Reutiliza schemas en múltiples URLs',
      'Organiza por carpetas'
    ]
  },
  {
    id: 'extractor-create-schema',
    title: '➕ Crear Nuevo Schema',
    content: 'Click "New Schema" para empezar un nuevo proyecto de extracción. Dale un nombre descriptivo y la URL objetivo.',
    category: 'settings',
    targetSelector: '[data-tour="new-schema-btn"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'Nombres descriptivos: "Amazon Products"',
      'URL puede ser cualquier página pública',
      'CUBE maneja JavaScript y páginas dinámicas'
    ],
    competitiveAdvantage: 'Soporte nativo para SPAs y páginas JavaScript. Otros fallan con React/Vue.'
  },
  {
    id: 'extractor-schema-settings',
    title: '⚙️ Configuración del Schema',
    content: 'Cada schema tiene configuración: frecuencia de extracción, paginación, autenticación, proxies, y más.',
    category: 'settings',
    targetSelector: '[data-tour="schema-settings"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Schedule: Extrae automáticamente',
      'Pagination: Navega múltiples páginas',
      'Auth: Para sitios con login'
    ]
  },
  {
    id: 'extractor-url-patterns',
    title: '🔗 Patrones de URL',
    content: 'Define patrones de URL para extraer de múltiples páginas. Usa {page}, {id}, o rangos como [1-100].',
    category: 'settings',
    targetSelector: '[data-tour="url-patterns"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'site.com/products?page={1-50}',
      'site.com/item/{id} con lista de IDs',
      'Wildcards: site.com/category/*'
    ],
    competitiveAdvantage: 'Patrones de URL ilimitados incluidos.'
  }
];

export const schemaSection: TourSection = {
  id: 'extractor-schemas',
  title: 'Gestión de Schemas',
  description: 'Organiza tus proyectos de extracción',
  icon: '📋',
  category: 'settings',
  steps: schemaSteps,
  estimatedTime: 5,
  difficulty: 'beginner'
};

// ============================================================================
// SECTION 3: VISUAL SELECTOR
// ============================================================================

export const selectorSteps: TourStep[] = [
  {
    id: 'extractor-browser-view',
    title: '🌐 Vista del Navegador',
    content: 'CUBE carga la página web en un navegador integrado. Navega normalmente y selecciona los datos que quieres extraer.',
    category: 'contacts',
    targetSelector: '[data-tour="browser-view"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'Navegación completa incluida',
      'Maneja popups y modales',
      'JavaScript se ejecuta normalmente'
    ]
  },
  {
    id: 'extractor-select-mode',
    title: '🎯 Modo Selección',
    content: 'Activa el modo selección y haz click en cualquier elemento de la página. CUBE detecta automáticamente el selector CSS óptimo.',
    category: 'contacts',
    targetSelector: '[data-tour="select-mode-btn"]',
    position: 'bottom',
    highlightType: 'pulse',
    tips: [
      'Click: Seleccionar elemento',
      'Hover: Preview del selector',
      'Shift+Click: Seleccionar múltiples'
    ],
    competitiveAdvantage: 'AI genera selectores robustos que no se rompen con cambios del sitio.'
  },
  {
    id: 'extractor-field-creation',
    title: '📝 Crear Campos',
    content: 'Cada elemento seleccionado se convierte en un campo de tu schema. Nombra el campo y CUBE extraerá ese dato de cada item.',
    category: 'contacts',
    targetSelector: '[data-tour="field-panel"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'Nombres claros: "price", "title", "rating"',
      'Tipos: texto, número, URL, imagen',
      'Transformaciones disponibles'
    ]
  },
  {
    id: 'extractor-selector-refine',
    title: '🔧 Refinar Selectores',
    content: 'Si el selector automático no es perfecto, refinalo manualmente. Ve el selector CSS y ajústalo para capturar exactamente lo que necesitas.',
    category: 'contacts',
    targetSelector: '[data-tour="selector-editor"]',
    position: 'left',
    highlightType: 'border',
    tips: [
      'Selector visual o código CSS',
      'Test en tiempo real',
      'AI sugiere alternativas'
    ]
  },
  {
    id: 'extractor-multiple-items',
    title: '📦 Extraer Múltiples Items',
    content: 'Para listas (productos, artículos, etc), CUBE detecta automáticamente el patrón repetitivo y extrae todos los items similares.',
    category: 'contacts',
    targetSelector: '[data-tour="items-detected"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'Selecciona UN item, CUBE encuentra todos',
      'Ajusta el contenedor si es necesario',
      'Preview muestra todos los items'
    ],
    competitiveAdvantage: 'Detección de patrones con AI. Más preciso que competidores.'
  },
  {
    id: 'extractor-nested-data',
    title: '🌳 Datos Anidados',
    content: 'Extrae estructuras complejas: productos con variantes, artículos con comentarios, perfiles con historial. Datos jerárquicos sin problema.',
    category: 'contacts',
    targetSelector: '[data-tour="nested-fields"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'Crea campos dentro de campos',
      'Arrays de objetos soportados',
      'Relaciones parent-child'
    ]
  }
];

export const selectorSection: TourSection = {
  id: 'extractor-selector',
  title: 'Selector Visual',
  description: 'Selecciona datos point-and-click',
  icon: '🎯',
  category: 'contacts',
  steps: selectorSteps,
  estimatedTime: 8,
  difficulty: 'intermediate'
};

// ============================================================================
// SECTION 4: DATA PREVIEW & TRANSFORMATION
// ============================================================================

export const previewSteps: TourStep[] = [
  {
    id: 'extractor-preview-panel',
    title: '👁️ Panel de Preview',
    content: 'Ve los datos extraídos en tiempo real antes de ejecutar la extracción completa. Verifica que todo esté correcto.',
    category: 'campaigns',
    targetSelector: '[data-tour="preview-panel"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'Actualización en tiempo real',
      'Ve la estructura JSON',
      'Identifica problemas rápido'
    ]
  },
  {
    id: 'extractor-data-transform',
    title: '🔄 Transformaciones',
    content: 'Limpia y transforma datos: quitar espacios, convertir a número, extraer con regex, formatear fechas, y más.',
    category: 'campaigns',
    targetSelector: '[data-tour="transformations"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'Trim: Quita espacios',
      'Replace: Reemplaza texto',
      'Regex: Extrae patrones'
    ],
    competitiveAdvantage: 'Transformaciones ilimitadas incluidas. Otros cobran extra.'
  },
  {
    id: 'extractor-data-types',
    title: '📊 Tipos de Datos',
    content: 'Especifica el tipo de cada campo: texto, número, fecha, URL, email, booleano. CUBE valida y convierte automáticamente.',
    category: 'campaigns',
    targetSelector: '[data-tour="data-types"]',
    position: 'left',
    highlightType: 'border',
    tips: [
      'Auto-detect disponible',
      'Validación automática',
      'Conversión de formatos'
    ]
  },
  {
    id: 'extractor-computed-fields',
    title: '🧮 Campos Calculados',
    content: 'Crea campos que se calculan a partir de otros: concatenar, sumar, comparar. Lógica personalizada sin código.',
    category: 'campaigns',
    targetSelector: '[data-tour="computed-fields"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'fullName = firstName + lastName',
      'totalPrice = price * quantity',
      'isOnSale = salePrice < originalPrice'
    ]
  }
];

export const previewSection: TourSection = {
  id: 'extractor-preview',
  title: 'Preview y Transformación',
  description: 'Visualiza y transforma datos',
  icon: '👁️',
  category: 'campaigns',
  steps: previewSteps,
  estimatedTime: 5,
  difficulty: 'intermediate'
};

// ============================================================================
// SECTION 5: EXTRACTION & EXPORT
// ============================================================================

export const exportSteps: TourStep[] = [
  {
    id: 'extractor-run-extraction',
    title: '▶️ Ejecutar Extracción',
    content: 'Una vez configurado el schema, ejecuta la extracción. CUBE navega todas las URLs y extrae los datos definidos.',
    category: 'analytics',
    targetSelector: '[data-tour="run-extraction-btn"]',
    position: 'bottom',
    highlightType: 'pulse',
    tips: [
      'Test primero con pocas páginas',
      'Ve progreso en tiempo real',
      'Pausa/resume disponible'
    ]
  },
  {
    id: 'extractor-progress',
    title: '📈 Progreso de Extracción',
    content: 'Monitorea el progreso: páginas procesadas, items extraídos, errores encontrados. Todo en tiempo real.',
    category: 'analytics',
    targetSelector: '[data-tour="extraction-progress"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'Barra de progreso visual',
      'Contador de items',
      'Log de errores expandible'
    ]
  },
  {
    id: 'extractor-export-formats',
    title: '📤 Formatos de Exportación',
    content: 'Exporta tus datos: JSON, CSV, Excel, Google Sheets, o envía directamente a una API. El formato que necesites.',
    category: 'analytics',
    targetSelector: '[data-tour="export-button"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'JSON: Para desarrolladores',
      'CSV/Excel: Para análisis',
      'API: Integración directa'
    ],
    competitiveAdvantage: 'Todos los formatos incluidos. ParseHub cobra por exportación.'
  },
  {
    id: 'extractor-scheduling',
    title: '⏰ Programar Extracciones',
    content: 'Configura extracciones automáticas: cada hora, diariamente, semanalmente. Recibe los datos actualizados sin esfuerzo.',
    category: 'analytics',
    targetSelector: '[data-tour="schedule-extraction"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'Frecuencia personalizable',
      'Notificación al completar',
      'Detecta cambios vs extracción anterior'
    ],
    competitiveAdvantage: 'Scheduling ilimitado. Competidores limitan por plan.'
  },
  {
    id: 'extractor-webhooks',
    title: '🔗 Webhooks & Integraciones',
    content: 'Envía datos automáticamente a tu sistema: webhook a tu servidor, Google Sheets, Airtable, Notion, cualquier destino.',
    category: 'analytics',
    targetSelector: '[data-tour="webhooks"]',
    position: 'left',
    highlightType: 'border',
    tips: [
      'Webhook: POST a cualquier URL',
      'Sheets: Append automático',
      'Zapier/Make: Miles de integraciones'
    ]
  }
];

export const exportSection: TourSection = {
  id: 'extractor-export',
  title: 'Extracción y Exportación',
  description: 'Ejecuta y exporta tus datos',
  icon: '📤',
  category: 'analytics',
  steps: exportSteps,
  estimatedTime: 6,
  difficulty: 'intermediate'
};

// ============================================================================
// SECTION 6: AI FEATURES & ADVANCED
// ============================================================================

export const advancedSteps: TourStep[] = [
  {
    id: 'extractor-ai-assistant',
    title: '🤖 AI Assistant',
    content: 'Describe qué datos quieres en lenguaje natural: "Extrae nombre, precio y rating de todos los productos". AI configura el schema.',
    category: 'advanced',
    targetSelector: '[data-tour="ai-assistant-btn"]',
    position: 'bottom',
    highlightType: 'pulse',
    tips: [
      'Describe en español o inglés',
      'AI identifica los campos',
      'Refina con conversación'
    ],
    competitiveAdvantage: 'AI scraping exclusivo de CUBE. No existe en otros.'
  },
  {
    id: 'extractor-ai-suggestions',
    title: '💡 Sugerencias de AI',
    content: 'AI analiza la página y sugiere campos comunes para extraer. Un click para agregar campos sugeridos.',
    category: 'advanced',
    targetSelector: '[data-tour="ai-suggestions"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'Detecta: precios, títulos, imágenes',
      'Identifica tablas automáticamente',
      'Sugiere paginación'
    ]
  },
  {
    id: 'extractor-anti-block',
    title: '🛡️ Anti-Bloqueo',
    content: 'CUBE incluye técnicas anti-detección: rotación de proxies, user agents, delays aleatorios, captcha solving.',
    category: 'advanced',
    targetSelector: '[data-tour="anti-block-settings"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'Proxies rotativos incluidos',
      'Fingerprint randomization',
      'Rate limiting inteligente'
    ],
    competitiveAdvantage: 'Anti-bloqueo enterprise incluido. Otros cobran $200+/mes extra.'
  },
  {
    id: 'extractor-login-handling',
    title: '🔐 Sitios con Login',
    content: 'Extrae datos de sitios que requieren login: CUBE guarda sesiones y maneja autenticación automáticamente.',
    category: 'advanced',
    targetSelector: '[data-tour="auth-settings"]',
    position: 'left',
    highlightType: 'border',
    tips: [
      'Guarda cookies de sesión',
      'OAuth soportado',
      '2FA manejable'
    ]
  },
  {
    id: 'extractor-javascript-pages',
    title: '⚡ Páginas JavaScript/SPA',
    content: 'CUBE usa un navegador real que ejecuta JavaScript. React, Vue, Angular, páginas dinámicas - todo funciona.',
    category: 'advanced',
    targetSelector: '[data-tour="js-settings"]',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Espera a que cargue el contenido',
      'Infinite scroll soportado',
      'Click para cargar más'
    ],
    competitiveAdvantage: 'Rendering JavaScript completo incluido.'
  },
  {
    id: 'extractor-complete',
    title: '🎉 ¡Eres un Extractor Pro!',
    content: 'Ahora puedes extraer datos de cualquier sitio web. Empieza simple, ve los resultados, y escala tus extracciones.',
    category: 'advanced',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Empieza con un sitio simple',
      'Prueba con pocas páginas',
      'Verifica los datos antes de escalar'
    ]
  }
];

export const advancedSection: TourSection = {
  id: 'extractor-advanced',
  title: 'AI y Features Avanzadas',
  description: 'Capacidades enterprise del extractor',
  icon: '🚀',
  category: 'advanced',
  steps: advancedSteps,
  estimatedTime: 6,
  difficulty: 'advanced'
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const allExtractorTourSections: TourSection[] = [
  welcomeSection,
  schemaSection,
  selectorSection,
  previewSection,
  exportSection,
  advancedSection
];

export const allExtractorTourSteps: TourStep[] = allExtractorTourSections.flatMap(
  section => section.steps
);

export const extractorTourStats = {
  totalSections: allExtractorTourSections.length,
  totalSteps: allExtractorTourSteps.length,
  totalEstimatedTime: allExtractorTourSections.reduce<number>(
    (total, section) => total + (section.estimatedTime ?? section.estimatedMinutes ?? 0),
    0
  )
};
