/**
 * Automation Studio Tour Steps
 * Tour completo para enseñar el constructor visual de workflows
 */

import { TourSection, TourStep } from '../../tour/types';

// ============================================================================
// SECTION 1: WELCOME & OVERVIEW
// ============================================================================

export const welcomeSteps: TourStep[] = [
  {
    id: 'auto-welcome',
    title: '¡Bienvenido a Automation Studio! 🤖',
    content: 'El constructor visual de automatizaciones más potente del mercado. Crea flujos de trabajo complejos sin escribir código, como Zapier pero 10x más potente.',
    category: 'welcome',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Drag & drop para crear flujos',
      'Conecta con +500 aplicaciones',
      'AI te ayuda a construir automatizaciones'
    ],
    competitiveAdvantage: 'Zapier cobra $750/mes por features que CUBE incluye gratis. Sin límites de tareas.'
  },
  {
    id: 'auto-interface-overview',
    title: 'Vista General de la Interfaz',
    content: 'Tres áreas principales: Paleta de nodos (izquierda), Canvas (centro), y Panel de ejecución (derecha). Todo lo que necesitas para crear automatizaciones visuales.',
    category: 'welcome',
    targetSelector: '[data-tour="automation-container"]',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Paleta: Todos los nodos disponibles',
      'Canvas: Donde construyes tu flujo',
      'Panel: Monitorea ejecuciones en tiempo real'
    ]
  },
  {
    id: 'auto-canvas-intro',
    title: '🎨 El Canvas - Tu Área de Trabajo',
    content: 'El canvas es donde la magia sucede. Arrastra nodos desde la paleta, conéctalos con cables, y crea flujos de trabajo visuales potentes.',
    category: 'welcome',
    targetSelector: '[data-tour="automation-canvas"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'Zoom con scroll del mouse o trackpad',
      'Pan arrastrando el fondo vacío',
      'Selecciona múltiples nodos con Shift+Click'
    ],
    competitiveAdvantage: 'Canvas infinito con zoom suave. Otros limitan el tamaño del workflow.'
  }
];

export const welcomeSection: TourSection = {
  id: 'automation-welcome',
  title: 'Bienvenida',
  description: 'Introducción al Automation Studio',
  icon: '👋',
  category: 'welcome',
  steps: welcomeSteps,
  estimatedTime: 3,
  difficulty: 'beginner'
};

// ============================================================================
// SECTION 2: NODE PALETTE
// ============================================================================

export const paletteSteps: TourStep[] = [
  {
    id: 'auto-palette-intro',
    title: '📦 Paleta de Nodos',
    content: 'Aquí encontrarás todos los bloques para construir tu automatización. Organizados por categoría para fácil acceso.',
    category: 'settings',
    targetSelector: '[data-tour="node-palette"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'Busca nodos por nombre o función',
      'Favoritos aparecen al inicio',
      'Arrastra cualquier nodo al canvas'
    ]
  },
  {
    id: 'auto-triggers',
    title: '⚡ Triggers - Inician tu Flujo',
    content: 'Los triggers son el punto de inicio de toda automatización. Pueden ser: horarios, webhooks, cambios en archivos, nuevos emails, etc.',
    category: 'settings',
    targetSelector: '[data-tour="triggers-category"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'Schedule: Ejecuta en horarios específicos',
      'Webhook: Recibe datos externos',
      'Watch: Monitorea cambios en tiempo real'
    ],
    competitiveAdvantage: 'Triggers ilimitados. Zapier cobra extra por cada trigger adicional.'
  },
  {
    id: 'auto-actions',
    title: '🎯 Actions - Hacen el Trabajo',
    content: 'Las actions son las tareas que tu automatización ejecuta: enviar emails, crear registros, llamar APIs, procesar datos, etc.',
    category: 'settings',
    targetSelector: '[data-tour="actions-category"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'HTTP Request: Conecta con cualquier API',
      'Email: Envía emails automáticos',
      'Database: CRUD operations'
    ]
  },
  {
    id: 'auto-logic',
    title: '🧠 Logic - Control de Flujo',
    content: 'Nodos de lógica te permiten crear flujos inteligentes: condicionales (if/else), loops, filtros, switches, y más.',
    category: 'settings',
    targetSelector: '[data-tour="logic-category"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'Condition: Bifurca según condiciones',
      'Loop: Itera sobre arrays de datos',
      'Filter: Filtra datos que pasan'
    ],
    competitiveAdvantage: 'Lógica ilimitada sin costo extra. Competidores cobran por operaciones lógicas.'
  },
  {
    id: 'auto-integrations',
    title: '🔌 Integrations - Apps Conectadas',
    content: '+500 integraciones pre-construidas: Slack, Google Sheets, Salesforce, HubSpot, Stripe, y más. Conecta todo tu stack.',
    category: 'settings',
    targetSelector: '[data-tour="integrations-category"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'OAuth automático para la mayoría',
      'Custom integrations con HTTP Request',
      'Webhooks para apps sin integración'
    ],
    competitiveAdvantage: '+500 integraciones incluidas. Sin costo por app como Make.com.'
  },
  {
    id: 'auto-ai-nodes',
    title: '🤖 AI Nodes - Inteligencia Artificial',
    content: 'Nodos de AI para: clasificar texto, analizar sentimiento, extraer entidades, generar contenido, y más. Powered by GPT-4.',
    category: 'settings',
    targetSelector: '[data-tour="ai-category"]',
    position: 'right',
    highlightType: 'pulse',
    tips: [
      'AI Classify: Categoriza datos automáticamente',
      'AI Generate: Crea contenido con AI',
      'AI Extract: Extrae información estructurada'
    ],
    competitiveAdvantage: 'AI nativo incluido. Zapier cobra $50+/mes extra por AI.'
  }
];

export const paletteSection: TourSection = {
  id: 'automation-palette',
  title: 'Paleta de Nodos',
  description: 'Todos los bloques para construir automatizaciones',
  icon: '📦',
  category: 'settings',
  steps: paletteSteps,
  estimatedTime: 6,
  difficulty: 'beginner'
};

// ============================================================================
// SECTION 3: BUILDING WORKFLOWS
// ============================================================================

export const buildingSteps: TourStep[] = [
  {
    id: 'auto-drag-drop',
    title: '🖱️ Arrastra y Suelta',
    content: 'Para agregar un nodo: simplemente arrástralo desde la paleta al canvas. Suéltalo donde quieras.',
    category: 'contacts',
    targetSelector: '[data-tour="automation-canvas"]',
    position: 'left',
    highlightType: 'border',
    tips: [
      'Click derecho para menú contextual',
      'Doble click en canvas: búsqueda rápida',
      'Delete: Eliminar nodo seleccionado'
    ]
  },
  {
    id: 'auto-connect-nodes',
    title: '🔗 Conectar Nodos',
    content: 'Arrastra desde el punto de salida (derecha) de un nodo al punto de entrada (izquierda) del siguiente. Las conexiones definen el flujo de datos.',
    category: 'contacts',
    targetSelector: '[data-tour="automation-canvas"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'Salida → Entrada siempre',
      'Un nodo puede tener múltiples conexiones',
      'Click en cable para eliminarlo'
    ],
    competitiveAdvantage: 'Conexiones visuales claras. Sin límite de nodos ni conexiones.'
  },
  {
    id: 'auto-configure-node',
    title: '⚙️ Configurar Nodos',
    content: 'Click en un nodo para abrir su panel de configuración. Cada tipo de nodo tiene opciones específicas para su función.',
    category: 'contacts',
    targetSelector: '[data-tour="node-config-panel"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'Campos requeridos marcados con *',
      'Variables dinámicas con {{variable}}',
      'Test individual con botón "Test"'
    ]
  },
  {
    id: 'auto-data-mapping',
    title: '📊 Data Mapping',
    content: 'Usa el selector de datos para mapear información entre nodos. Click en {{}} para ver datos disponibles de nodos anteriores.',
    category: 'contacts',
    targetSelector: '[data-tour="data-mapper"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      '{{node.field}} - Accede a datos específicos',
      '{{$json}} - Todo el objeto JSON',
      'Fórmulas con {{$func.uppercase(x)}}'
    ],
    competitiveAdvantage: 'Data mapping visual intuitivo. Sin necesidad de código.'
  },
  {
    id: 'auto-branching',
    title: '🌿 Ramificación (Branching)',
    content: 'Crea flujos condicionales que se bifurcan según condiciones. Perfecto para lógica compleja como: "Si lead es caliente → notificar sales, sino → nurture email".',
    category: 'contacts',
    targetSelector: '[data-tour="condition-node"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'Múltiples ramas desde un nodo',
      'Condiciones AND/OR combinables',
      'Default branch para casos no cubiertos'
    ]
  },
  {
    id: 'auto-error-handling',
    title: '🛡️ Manejo de Errores',
    content: 'Configura qué hacer cuando algo falla: reintentar, notificar, ejecutar ruta alternativa. Los flujos robustos manejan errores elegantemente.',
    category: 'contacts',
    targetSelector: '[data-tour="error-handler"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Retry: Reintentar X veces',
      'Continue: Ignorar error y seguir',
      'Stop: Detener ejecución completa'
    ],
    competitiveAdvantage: 'Error handling avanzado incluido. Feature premium en otros.'
  }
];

export const buildingSection: TourSection = {
  id: 'automation-building',
  title: 'Construir Workflows',
  description: 'Cómo crear y conectar automatizaciones',
  icon: '🔨',
  category: 'contacts',
  steps: buildingSteps,
  estimatedTime: 8,
  difficulty: 'intermediate'
};

// ============================================================================
// SECTION 4: TOOLBAR & CONTROLS
// ============================================================================

export const toolbarSteps: TourStep[] = [
  {
    id: 'auto-toolbar-overview',
    title: '🛠️ Toolbar - Controles Principales',
    content: 'El toolbar tiene todas las acciones principales: guardar, ejecutar, configurar, y más.',
    category: 'campaigns',
    targetSelector: '[data-tour="flow-toolbar"]',
    position: 'bottom',
    highlightType: 'spotlight',
    tips: [
      'Atajos de teclado para todo',
      'Ctrl+S: Guardar',
      'Ctrl+Enter: Ejecutar'
    ]
  },
  {
    id: 'auto-save-flow',
    title: '💾 Guardar Flow',
    content: 'Guarda tu flujo en cualquier momento. CUBE auto-guarda cada 30 segundos, pero siempre puedes guardar manualmente.',
    category: 'campaigns',
    targetSelector: '[data-tour="save-button"]',
    position: 'bottom',
    highlightType: 'glow',
    tips: [
      'Auto-save cada 30 segundos',
      'Historial de versiones automático',
      'Restaurar versiones anteriores'
    ],
    competitiveAdvantage: 'Versionado automático ilimitado incluido.'
  },
  {
    id: 'auto-run-flow',
    title: '▶️ Ejecutar Flow',
    content: 'Ejecuta tu flujo manualmente para probarlo. Verás los resultados en tiempo real en el panel de ejecución.',
    category: 'campaigns',
    targetSelector: '[data-tour="run-button"]',
    position: 'bottom',
    highlightType: 'pulse',
    tips: [
      'Run once: Ejecución única',
      'Run with data: Prueba con datos específicos',
      'Ver logs en tiempo real'
    ]
  },
  {
    id: 'auto-schedule',
    title: '⏰ Programar Ejecución',
    content: 'Configura cuándo se ejecuta tu flujo automáticamente: cada hora, diariamente, semanalmente, o con expresiones cron avanzadas.',
    category: 'campaigns',
    targetSelector: '[data-tour="schedule-button"]',
    position: 'bottom',
    highlightType: 'glow',
    tips: [
      'Simple: Cada X minutos/horas',
      'Avanzado: Expresiones cron',
      'Timezone configurable'
    ],
    competitiveAdvantage: 'Scheduling granular sin límites. Zapier limita frecuencia en planes bajos.'
  },
  {
    id: 'auto-ai-assistant',
    title: '🤖 AI Assistant',
    content: 'Describe lo que quieres automatizar en lenguaje natural y el AI te ayuda a construir el flujo. "Cuando reciba un email de cliente, crear ticket en Zendesk".',
    category: 'campaigns',
    targetSelector: '[data-tour="ai-assistant-button"]',
    position: 'bottom',
    highlightType: 'pulse',
    tips: [
      'Describe tu automatización en español',
      'AI sugiere nodos y conexiones',
      'Refina con preguntas de seguimiento'
    ],
    competitiveAdvantage: 'AI workflow builder incluido. Feature exclusiva de CUBE.'
  },
  {
    id: 'auto-minimap',
    title: '🗺️ Minimap',
    content: 'Vista miniatura de todo tu flujo. Útil para navegar workflows grandes. Click para ir a esa área del canvas.',
    category: 'campaigns',
    targetSelector: '[data-tour="minimap"]',
    position: 'top',
    highlightType: 'border',
    tips: [
      'Click para navegar rápido',
      'Drag para mover la vista',
      'Toggle con M'
    ]
  }
];

export const toolbarSection: TourSection = {
  id: 'automation-toolbar',
  title: 'Toolbar y Controles',
  description: 'Domina las herramientas principales',
  icon: '🛠️',
  category: 'campaigns',
  steps: toolbarSteps,
  estimatedTime: 5,
  difficulty: 'beginner'
};

// ============================================================================
// SECTION 5: EXECUTION & MONITORING
// ============================================================================

export const executionSteps: TourStep[] = [
  {
    id: 'auto-execution-panel',
    title: '📊 Panel de Ejecución',
    content: 'Monitorea todas las ejecuciones de tu flujo en tiempo real. Ve éxitos, errores, duración, y datos procesados.',
    category: 'analytics',
    targetSelector: '[data-tour="execution-panel"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'Verde: Éxito',
      'Rojo: Error (click para detalles)',
      'Amarillo: En progreso'
    ]
  },
  {
    id: 'auto-execution-logs',
    title: '📋 Logs de Ejecución',
    content: 'Cada ejecución tiene logs detallados: qué datos entraron, qué procesó cada nodo, y qué salió. Perfecto para debugging.',
    category: 'analytics',
    targetSelector: '[data-tour="execution-logs"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'Click en ejecución para expandir',
      'Ve input/output de cada nodo',
      'Exporta logs para análisis'
    ],
    competitiveAdvantage: 'Logs completos sin límite de retención. Otros borran después de 7 días.'
  },
  {
    id: 'auto-execution-stats',
    title: '📈 Estadísticas',
    content: 'Métricas de tus automatizaciones: total de ejecuciones, tasa de éxito, tiempo promedio, datos procesados.',
    category: 'analytics',
    targetSelector: '[data-tour="execution-stats"]',
    position: 'left',
    highlightType: 'border',
    tips: [
      'Filtra por rango de fechas',
      'Compara períodos',
      'Identifica cuellos de botella'
    ]
  },
  {
    id: 'auto-debug-mode',
    title: '🔍 Modo Debug',
    content: 'Ejecuta paso a paso viendo exactamente qué hace cada nodo. Perfecto para encontrar problemas en flujos complejos.',
    category: 'analytics',
    targetSelector: '[data-tour="debug-button"]',
    position: 'bottom',
    highlightType: 'pulse',
    tips: [
      'Step: Avanza un nodo',
      'Continue: Sigue hasta breakpoint',
      'Inspect: Ve variables en cualquier punto'
    ],
    competitiveAdvantage: 'Debugger visual incluido. Feature que no existe en Zapier.'
  },
  {
    id: 'auto-alerts',
    title: '🔔 Alertas y Notificaciones',
    content: 'Configura alertas cuando algo falla, cuando un flujo tarda demasiado, o cuando se alcanza un umbral.',
    category: 'analytics',
    targetSelector: '[data-tour="alerts-config"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'Email alerts para errores críticos',
      'Slack notifications en tiempo real',
      'SMS para emergencias'
    ]
  }
];

export const executionSection: TourSection = {
  id: 'automation-execution',
  title: 'Ejecución y Monitoreo',
  description: 'Monitorea y debuggea tus automatizaciones',
  icon: '📊',
  category: 'analytics',
  steps: executionSteps,
  estimatedTime: 6,
  difficulty: 'intermediate'
};

// ============================================================================
// SECTION 6: ADVANCED FEATURES
// ============================================================================

export const advancedSteps: TourStep[] = [
  {
    id: 'auto-templates',
    title: '📋 Templates Pre-construidos',
    content: 'Comienza rápido con +100 templates para casos comunes: lead nurturing, sync de datos, notificaciones, reportes, y más.',
    category: 'advanced',
    targetSelector: '[data-tour="templates-button"]',
    position: 'bottom',
    highlightType: 'glow',
    tips: [
      'Filtra por caso de uso',
      'Personaliza después de importar',
      'Comparte tus propios templates'
    ],
    competitiveAdvantage: 'Templates gratis ilimitados. Make.com cobra por templates premium.'
  },
  {
    id: 'auto-subflows',
    title: '📁 Sub-flows (Reusables)',
    content: 'Crea flujos reutilizables que puedes insertar en otros flujos. Perfecto para lógica que usas frecuentemente.',
    category: 'advanced',
    targetSelector: '[data-tour="subflows"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'DRY: No repitas lógica',
      'Actualiza una vez, aplica en todos',
      'Parámetros configurables'
    ]
  },
  {
    id: 'auto-versioning',
    title: '📚 Versionamiento',
    content: 'CUBE guarda automáticamente cada versión de tu flujo. Compara cambios, revierte a versiones anteriores, y mantén historial completo.',
    category: 'advanced',
    targetSelector: '[data-tour="version-history"]',
    position: 'left',
    highlightType: 'border',
    tips: [
      'Compara versiones side-by-side',
      'Revierte con un click',
      'Comenta cambios importantes'
    ],
    competitiveAdvantage: 'Git-like versioning para workflows. Único en el mercado.'
  },
  {
    id: 'auto-testing',
    title: '🧪 Testing Framework',
    content: 'Escribe tests para tus flujos: define inputs esperados, outputs esperados, y CUBE verifica automáticamente.',
    category: 'advanced',
    targetSelector: '[data-tour="testing-button"]',
    position: 'bottom',
    highlightType: 'pulse',
    tips: [
      'Unit tests por nodo',
      'Integration tests del flujo completo',
      'CI/CD integration disponible'
    ],
    competitiveAdvantage: 'Testing framework integrado. No existe en competidores.'
  },
  {
    id: 'auto-collaboration',
    title: '👥 Colaboración en Equipo',
    content: 'Trabaja en flujos con tu equipo: permisos por usuario, comentarios en nodos, historial de cambios por persona.',
    category: 'advanced',
    targetSelector: '[data-tour="collaboration"]',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Viewer: Solo puede ver',
      'Editor: Puede modificar',
      'Admin: Control total'
    ],
    competitiveAdvantage: 'Colaboración real-time incluida. Otros cobran por usuario.'
  },
  {
    id: 'auto-complete',
    title: '🎉 ¡Eres un Pro de Automatización!',
    content: 'Ahora tienes todo el conocimiento para crear automatizaciones potentes. Empieza simple, itera, y automatiza todo tu negocio.',
    category: 'advanced',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Empieza con un flujo simple',
      'Prueba antes de activar',
      'Monitorea las primeras ejecuciones'
    ]
  }
];

export const advancedSection: TourSection = {
  id: 'automation-advanced',
  title: 'Features Avanzadas',
  description: 'Domina las capacidades avanzadas',
  icon: '🚀',
  category: 'advanced',
  steps: advancedSteps,
  estimatedTime: 7,
  difficulty: 'advanced'
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const allAutomationTourSections: TourSection[] = [
  welcomeSection,
  paletteSection,
  buildingSection,
  toolbarSection,
  executionSection,
  advancedSection
];

export const allAutomationTourSteps: TourStep[] = allAutomationTourSections.flatMap(
  section => section.steps
);

export const automationTourStats = {
  totalSections: allAutomationTourSections.length,
  totalSteps: allAutomationTourSteps.length,
  totalEstimatedTime: allAutomationTourSections.reduce<number>(
    (total, section) => total + (section.estimatedTime ?? section.estimatedMinutes ?? 0),
    0
  )
};
