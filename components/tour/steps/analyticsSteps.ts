/**
 * Email Marketing Tour Steps - Analytics
 * Fase 5: Análisis y métricas de campañas
 */

import { TourSection, TourStep } from '../types';

// ============================================================================
// SECTION 5: ANALYTICS & METRICS
// ============================================================================

export const analyticsSteps: TourStep[] = [
  {
    id: 'analytics-intro',
    title: 'Analytics - Mide para Mejorar',
    content: 'Los datos son tu mejor amigo. Aprende a interpretar métricas para optimizar cada campaña y maximizar tu ROI.',
    category: 'analytics',
    position: 'center',
    highlightType: 'none',
    tips: [
      'No te obsesiones con una sola métrica',
      'Compara con benchmarks de tu industria',
      'Los trends importan más que números individuales'
    ],
    competitiveAdvantage: 'Dashboard de analytics en tiempo real incluido. Competidores muestran datos con retraso de horas.'
  },
  {
    id: 'analytics-dashboard',
    title: 'Dashboard de Métricas',
    content: 'Vista general de todas tus campañas: enviados, aperturas, clics, bounces, unsubscribes. Todo actualizado en tiempo real.',
    category: 'analytics',
    targetSelector: '[data-tour="analytics-dashboard"]',
    position: 'bottom',
    highlightType: 'spotlight',
    tips: [
      'Actualización automática cada 5 segundos',
      'Haz clic en cualquier métrica para detalles',
      'Filtra por rango de fechas para comparar periodos'
    ]
  },
  {
    id: 'analytics-open-rate',
    title: '📬 Open Rate - Tasa de Apertura',
    content: 'Porcentaje de contactos que abrieron tu email. Benchmark: 15-25% es bueno, +25% es excelente, <15% necesita mejora.',
    category: 'analytics',
    targetSelector: '[data-tour="open-rate"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'Subject line es el factor #1 en open rate',
      'El nombre del remitente también afecta',
      'Horario de envío impacta significativamente'
    ],
    competitiveAdvantage: 'Tracking de aperturas preciso con pixel invisible. Funciona en 95%+ de clientes de email.'
  },
  {
    id: 'analytics-click-rate',
    title: '🖱️ Click Rate - Tasa de Clics',
    content: 'Porcentaje de aperturas que hicieron clic en un link. Benchmark: 2-5% es bueno. Mide qué tan atractivo es tu contenido y CTAs.',
    category: 'analytics',
    targetSelector: '[data-tour="click-rate"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'CTAs claros y visibles aumentan clics',
      'Un solo CTA principal funciona mejor que muchos',
      'Coloca el CTA "above the fold" (sin scroll)'
    ]
  },
  {
    id: 'analytics-click-map',
    title: '🗺️ Mapa de Clics (Heatmap)',
    content: 'Visualiza exactamente dónde hacen clic tus contactos. Los colores indican zonas calientes. Perfecto para optimizar diseño.',
    category: 'analytics',
    targetSelector: '[data-tour="click-map"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'El primer link visible recibe más clics',
      'Imágenes grandes atraen clics aunque no sean links',
      'Los botones reciben más clics que links de texto'
    ],
    competitiveAdvantage: 'Heatmap visual incluido. Feature premium en otros servicios.'
  },
  {
    id: 'analytics-bounce-rate',
    title: '⚠️ Bounce Rate - Rebotes',
    content: 'Emails que no pudieron entregarse. Hard bounces (email inválido) vs Soft bounces (bandeja llena, servidor temporal). Mantén <2%.',
    category: 'analytics',
    targetSelector: '[data-tour="bounce-rate"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'CUBE auto-elimina hard bounces de tu lista',
      'Alto bounce rate daña tu reputación de sender',
      'Limpia tu lista regularmente para prevenir'
    ],
    competitiveAdvantage: 'Limpieza automática de bounces sin intervención. Protege tu reputación de sender.'
  },
  {
    id: 'analytics-unsubscribe-rate',
    title: '👋 Unsubscribe Rate - Bajas',
    content: 'Contactos que se dieron de baja. Normal: 0.1-0.5% por campaña. Mayor indica contenido no relevante o frecuencia excesiva.',
    category: 'analytics',
    targetSelector: '[data-tour="unsubscribe-rate"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Algunos unsubscribes son normales y saludables',
      'Mejor que te dejen que marquen como spam',
      'Ofrece opciones: menos frecuencia en vez de baja total'
    ]
  },
  {
    id: 'analytics-spam-complaints',
    title: '🚫 Spam Complaints',
    content: 'Contactos que marcaron tu email como spam. CRÍTICO mantener <0.1%. Alto spam rate puede bloquear tu dominio.',
    category: 'analytics',
    targetSelector: '[data-tour="spam-rate"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Nunca envíes sin consentimiento explícito',
      'Facilita el unsubscribe para evitar spam reports',
      'Emails relevantes raramente se marcan como spam'
    ],
    competitiveAdvantage: 'Feedback loop con ISPs principales. Te alertamos antes de que afecte tu deliverability.'
  },
  {
    id: 'analytics-delivery-rate',
    title: '📨 Delivery Rate - Tasa de Entrega',
    content: 'Porcentaje de emails que llegaron (no rebotaron). Target: +98%. Menos indica problemas de lista o configuración.',
    category: 'analytics',
    targetSelector: '[data-tour="delivery-rate"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      '+98%: Excelente, tu lista está sana',
      '95-98%: Bueno, limpia algunos bounces',
      '<95%: Urgente, necesitas limpiar la lista'
    ]
  },
  {
    id: 'analytics-revenue-tracking',
    title: '💰 Revenue Attribution',
    content: 'CUBE rastrea cuánto revenue genera cada campaña. Ve el ROI real de tu email marketing con integración de ventas.',
    category: 'analytics',
    targetSelector: '[data-tour="revenue-tracking"]',
    position: 'left',
    highlightType: 'glow',
    tips: [
      'Conecta tu e-commerce para tracking automático',
      'Atribución de 30 días por defecto',
      'Ve revenue por campaña, producto y segmento'
    ],
    competitiveAdvantage: 'Revenue attribution incluido. Mailchimp cobra $350+/mes por esta feature.'
  },
  {
    id: 'analytics-by-device',
    title: '📱 Métricas por Dispositivo',
    content: 'Ve qué % abre en móvil vs desktop. Importante para optimizar diseño. Típicamente 60%+ es móvil.',
    category: 'analytics',
    targetSelector: '[data-tour="device-stats"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Siempre diseña mobile-first',
      'Botones grandes para dedos en móvil',
      'Texto legible sin zoom'
    ]
  },
  {
    id: 'analytics-by-location',
    title: '🌍 Métricas por Ubicación',
    content: 'Mapa de dónde están tus contactos que abren emails. Útil para optimizar horarios de envío por timezone.',
    category: 'analytics',
    targetSelector: '[data-tour="location-stats"]',
    position: 'left',
    highlightType: 'border',
    tips: [
      'Envía cuando tu audiencia está despierta',
      'Considera segmentar por timezone',
      'Eventos locales pueden afectar engagement'
    ]
  },
  {
    id: 'analytics-by-email-client',
    title: '📧 Métricas por Cliente de Email',
    content: 'Gmail, Outlook, Apple Mail, etc. Saber qué usan tus contactos te ayuda a optimizar el diseño para esos clientes.',
    category: 'analytics',
    targetSelector: '[data-tour="client-stats"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Gmail tiene reglas estrictas de inbox',
      'Outlook renderiza diferente algunos CSS',
      'Apple Mail tiene buen soporte para diseños modernos'
    ]
  },
  {
    id: 'analytics-engagement-over-time',
    title: '📈 Engagement Over Time',
    content: 'Gráfico de cuándo abren tus emails: por hora del día y día de la semana. Identifica patrones para optimizar send times.',
    category: 'analytics',
    targetSelector: '[data-tour="engagement-timeline"]',
    position: 'bottom',
    highlightType: 'spotlight',
    tips: [
      'Los picos muestran mejores momentos para enviar',
      'Considera timezone de tu audiencia principal',
      'Prueba diferentes horarios con A/B testing'
    ],
    competitiveAdvantage: 'Análisis temporal detallado por hora. Otros muestran solo días.'
  },
  {
    id: 'analytics-compare-campaigns',
    title: '📊 Comparar Campañas',
    content: 'Compara métricas entre campañas lado a lado. Identifica qué funcionó y qué no para mejorar continuamente.',
    category: 'analytics',
    targetSelector: '[data-tour="compare-campaigns"]',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Compara campañas similares para insights válidos',
      'Busca patterns en tus mejores performers',
      'Replica lo que funciona, elimina lo que no'
    ]
  },
  {
    id: 'analytics-export-reports',
    title: '📄 Exportar Reportes',
    content: 'Genera reportes en PDF o CSV para compartir con tu equipo, clientes, o para análisis externo.',
    category: 'analytics',
    targetSelector: '[data-tour="export-report"]',
    position: 'left',
    highlightType: 'border',
    tips: [
      'PDF: Perfecto para presentaciones ejecutivas',
      'CSV: Para análisis en Excel o BI tools',
      'Programa reportes automáticos semanales/mensuales'
    ],
    competitiveAdvantage: 'Reportes white-label para agencias. Otros cobran extra por esta feature.'
  },
  {
    id: 'analytics-benchmarks',
    title: '🎯 Benchmarks de Industria',
    content: 'CUBE te muestra cómo te comparas con otros de tu industria. Saber si estás arriba o abajo del promedio.',
    category: 'analytics',
    targetSelector: '[data-tour="industry-benchmarks"]',
    position: 'center',
    highlightType: 'none',
    tips: [
      'E-commerce: Open 15-20%, Click 2-3%',
      'B2B: Open 20-25%, Click 2-4%',
      'Media/Publisher: Open 25-30%, Click 3-5%'
    ],
    competitiveAdvantage: 'Benchmarks en tiempo real de millones de emails. Datos más precisos que reportes anuales.'
  },
  {
    id: 'analytics-complete',
    title: '¡Eres un Pro de Analytics! 📊',
    content: 'Ahora entiendes cada métrica y cómo usarla para mejorar. Recuerda: los datos solo valen si tomas acción con ellos.',
    category: 'analytics',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Revisa analytics después de cada campaña',
      'Documenta lo que aprendes',
      'Optimiza continuamente basado en datos'
    ]
  }
];

export const analyticsSection: TourSection = {
  id: 'analytics',
  title: 'Analytics y Métricas',
  description: 'Domina el análisis de datos para optimizar tus campañas',
  icon: '📊',
  category: 'analytics',
  steps: analyticsSteps,
  estimatedTime: 10,
  difficulty: 'intermediate'
};

// ============================================================================
// SECTION 6: ADVANCED TIPS
// ============================================================================

export const advancedTipsSteps: TourStep[] = [
  {
    id: 'tips-deliverability',
    title: '💡 Deliverability - Llega al Inbox',
    content: 'La deliverability es el % de emails que llegan al inbox (no spam). CUBE optimiza esto automáticamente, pero hay cosas que puedes hacer.',
    category: 'tips',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Autentica tu dominio: SPF, DKIM, DMARC',
      'Mantén engagement alto (emails que se abren)',
      'Limpia tu lista de inactivos regularmente'
    ],
    competitiveAdvantage: 'CUBE monitorea tu deliverability 24/7 y te alerta antes de problemas.'
  },
  {
    id: 'tips-list-hygiene',
    title: '🧹 Limpieza de Lista',
    content: 'Una lista limpia = mejor deliverability. Elimina bounces, inactivos (+6 meses sin abrir), y spam traps.',
    category: 'tips',
    position: 'center',
    highlightType: 'none',
    tips: [
      'CUBE auto-elimina hard bounces',
      'Re-engagement campaign antes de eliminar inactivos',
      'Nunca compres listas, solo daña tu reputación'
    ],
    competitiveAdvantage: 'Limpieza automatizada incluida. Algunos servicios cobran por "list cleaning".'
  },
  {
    id: 'tips-segmentation',
    title: '🎯 Segmentación Avanzada',
    content: 'No envíes lo mismo a todos. Segmenta por: comportamiento, compras, engagement, ubicación, preferencias.',
    category: 'tips',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Emails segmentados generan 760% más revenue',
      'Empieza simple: activos vs inactivos',
      'Personalización ≠ solo usar {nombre}'
    ],
    competitiveAdvantage: 'Segmentación ilimitada y predictiva con AI incluida.'
  },
  {
    id: 'tips-automation',
    title: '⚡ Automatización que Convierte',
    content: 'Los emails automáticos (welcome, abandoned cart, birthday) generan 320% más revenue que broadcasts.',
    category: 'tips',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Welcome series: 3-5 emails en 2 semanas',
      'Abandoned cart: 1h, 24h, 72h después',
      'Re-engagement: a los 30, 60, 90 días de inactividad'
    ],
    competitiveAdvantage: 'Automatizaciones pre-construidas listas para usar. Setup en 5 minutos.'
  },
  {
    id: 'tips-content',
    title: '✍️ Contenido que Convierte',
    content: 'El mejor diseño no salva mal contenido. Enfócate en valor, claridad, y un solo CTA principal por email.',
    category: 'tips',
    position: 'center',
    highlightType: 'none',
    tips: [
      '1 email = 1 objetivo = 1 CTA',
      'Escribe para escanear, no para leer',
      'El botón de CTA debe ser obvio y atractivo'
    ],
    competitiveAdvantage: 'AI Writer genera contenido optimizado para conversión basado en tu industria.'
  },
  {
    id: 'tips-testing',
    title: '🧪 Testing Continuo',
    content: 'Nunca asumas, siempre prueba. A/B test subjects, CTAs, horarios, diseños. Los datos no mienten.',
    category: 'tips',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Prueba una variable a la vez',
      'Necesitas mínimo 1,000 contactos para resultados significativos',
      'Documenta resultados para aprender'
    ],
    competitiveAdvantage: 'A/B testing multivariado incluido. Test hasta 5 variantes simultáneamente.'
  },
  {
    id: 'tips-complete',
    title: '🏆 ¡Tour Completado!',
    content: 'Felicidades, ahora dominas CUBE Email Marketing. Tienes todo para crear campañas exitosas. ¿Preguntas? Nuestro soporte está 24/7.',
    category: 'tips',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Practica lo aprendido con tu primera campaña',
      'Revisa este tour cuando necesites refrescar',
      'Únete a nuestra comunidad para más tips'
    ],
    competitiveAdvantage: 'Soporte en español 24/7 incluido. No chatbots, personas reales.'
  }
];

export const advancedTipsSection: TourSection = {
  id: 'advanced',
  title: 'Tips Avanzados',
  description: 'Secretos de expertos para maximizar resultados',
  icon: '🚀',
  category: 'advanced',
  steps: advancedTipsSteps,
  estimatedTime: 8,
  difficulty: 'advanced'
};
