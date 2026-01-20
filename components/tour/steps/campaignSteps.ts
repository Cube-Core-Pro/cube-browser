/**
 * Email Marketing Tour Steps - Campaigns
 * Fase 4: Creación y gestión de campañas
 */

import { TourSection, TourStep } from '../types';

// ============================================================================
// SECTION 4: CAMPAIGN CREATION & MANAGEMENT
// ============================================================================

export const campaignSteps: TourStep[] = [
  {
    id: 'campaigns-intro',
    title: 'Campañas de Email - El Corazón del Marketing',
    content: 'Las campañas son los mensajes que envías a tu audiencia. Aquí aprenderás a crear emails profesionales que convierten, desde el diseño hasta el envío.',
    category: 'campaigns',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Planifica tu calendario de emails con anticipación',
      'Menos es más: no bombardees a tus suscriptores',
      '1-4 emails por mes es un buen rango para newsletters'
    ],
    competitiveAdvantage: 'CUBE incluye AI Writer que genera contenido profesional, subject lines optimizados y A/B testing automático incluido.'
  },
  {
    id: 'campaigns-list-view',
    title: 'Lista de Campañas',
    content: 'Esta tabla muestra todas tus campañas: nombre, estado, destinatarios, métricas de rendimiento y fecha. Ordena y filtra según necesites.',
    category: 'campaigns',
    targetSelector: '.campaigns-table',
    position: 'top',
    highlightType: 'spotlight',
    tips: [
      'Estados: Draft, Scheduled, Sending, Sent, Paused',
      'Haz clic en cualquier campaña para ver detalles',
      'Duplica campañas exitosas para reusar'
    ],
    competitiveAdvantage: 'Vista unificada con todas las métricas clave sin navegar a múltiples pantallas.'
  },
  {
    id: 'campaigns-create-button',
    title: 'Crear Nueva Campaña',
    content: 'Haz clic en "New Campaign" para empezar. El wizard te guía paso a paso: Setup, Design, Recipients, Review.',
    category: 'campaigns',
    targetSelector: '[data-tour="new-campaign"]',
    position: 'bottom',
    highlightType: 'pulse',
    action: {
      type: 'click',
      label: 'Crear campaña',
    },
    tips: [
      'Guarda como draft mientras trabajas',
      'Puedes editar en cualquier momento antes de enviar',
      'El preview te muestra cómo se verá en diferentes dispositivos'
    ]
  },
  {
    id: 'campaigns-step-setup',
    title: 'Paso 1: Setup - Detalles Básicos',
    content: 'Nombra tu campaña (interno) y selecciona el tipo: Broadcast (único), Automated (trigger-based), Sequence (drip), o A/B Test.',
    category: 'campaigns',
    targetSelector: '.editor-steps .step:first-child',
    position: 'bottom',
    highlightType: 'glow',
    tips: [
      'Broadcast: Newsletter, anuncios, promociones únicas',
      'Automated: Emails de bienvenida, carrito abandonado',
      'A/B Test: Prueba diferentes versiones para optimizar'
    ]
  },
  {
    id: 'campaigns-campaign-name',
    title: 'Nombre de la Campaña',
    content: 'El nombre es solo para ti (no lo ven los contactos). Usa nombres descriptivos como "Black Friday 2024 - Oferta Principal".',
    category: 'campaigns',
    targetSelector: '[data-tour="campaign-name"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Incluye fecha o evento para fácil búsqueda',
      'Evita nombres genéricos como "Campaña 1"',
      'Usa convenciones consistentes en tu equipo'
    ]
  },
  {
    id: 'campaigns-subject-line',
    title: 'Subject Line - La Primera Impresión',
    content: 'El asunto determina si abren tu email. Tienes ~60 caracteres antes del corte. Sé claro, crea urgencia o curiosidad.',
    category: 'campaigns',
    targetSelector: '[data-tour="subject-line"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'Personaliza: "María, tu oferta especial" funciona mejor',
      'Emojis: Úsalos con moderación, max 1-2',
      'Evita: "GRATIS!!!", todo mayúsculas, muchos signos'
    ],
    competitiveAdvantage: 'CUBE analiza tu subject line y te da score de efectividad con sugerencias específicas en tiempo real.'
  },
  {
    id: 'campaigns-ai-suggest',
    title: '✨ AI Subject Line Generator',
    content: 'Haz clic en "AI Suggest" y CUBE genera 5 variantes de subject lines optimizadas basadas en tu contenido y mejores prácticas.',
    category: 'campaigns',
    targetSelector: '.btn-ai-suggest',
    position: 'left',
    highlightType: 'pulse',
    action: {
      type: 'click',
      label: 'Generar con AI',
    },
    tips: [
      'La AI analiza tu industria y audiencia',
      'Prueba diferentes estilos: urgente, curioso, directo',
      'Puedes editar las sugerencias a tu gusto'
    ],
    competitiveAdvantage: 'AI incluida sin costo. Mailchimp, Constant Contact cobran extra por features de AI.'
  },
  {
    id: 'campaigns-preview-text',
    title: 'Texto de Vista Previa',
    content: 'El texto que aparece después del asunto en la bandeja de entrada. Úsalo para complementar el subject y aumentar aperturas.',
    category: 'campaigns',
    targetSelector: '[data-tour="preview-text"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'No repitas el subject, agrega información nueva',
      'Ideal: 40-130 caracteres',
      'Si lo dejas vacío, se muestra inicio del contenido'
    ]
  },
  {
    id: 'campaigns-step-design',
    title: 'Paso 2: Design - Crea tu Email',
    content: 'Elige una plantilla o empieza desde cero. El editor drag & drop te permite crear emails profesionales sin código.',
    category: 'campaigns',
    targetSelector: '.editor-steps .step:nth-child(3)',
    position: 'bottom',
    highlightType: 'glow',
    tips: [
      'Las plantillas son 100% personalizables',
      'Mobile-responsive automáticamente',
      'Guarda tus diseños como templates para reusar'
    ]
  },
  {
    id: 'campaigns-templates',
    title: 'Galería de Templates',
    content: 'Elige entre templates pre-diseñados: Product Launch, Newsletter, Welcome, Sale, y más. Cada uno optimizado para su propósito.',
    category: 'campaigns',
    targetSelector: '[data-tour="template-gallery"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'Los templates son el punto de partida, personalízalos',
      'Cada template está probado en +50 clientes de email',
      'Custom Template te da un canvas en blanco'
    ],
    competitiveAdvantage: '50+ templates profesionales incluidos. Otros servicios ofrecen 10-15 en planes básicos.'
  },
  {
    id: 'campaigns-editor',
    title: 'Editor Visual',
    content: 'Arrastra elementos: texto, imágenes, botones, divisores. Haz clic para editar. Todo lo que ves es lo que tus contactos recibirán.',
    category: 'campaigns',
    targetSelector: '[data-tour="email-editor"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'Doble clic para editar texto',
      'Arrastra esquinas para redimensionar imágenes',
      'Los botones necesitan URL de destino'
    ]
  },
  {
    id: 'campaigns-ai-writer',
    title: '🤖 AI Writer - Tu Asistente de Contenido',
    content: 'Describe qué quieres comunicar y la AI genera el email completo: cuerpo, CTA, incluso imágenes sugeridas. Funciona en español, inglés y más.',
    category: 'campaigns',
    targetSelector: '.btn-ai',
    position: 'left',
    highlightType: 'glow',
    action: {
      type: 'click',
      label: 'Abrir AI Writer',
    },
    tips: [
      'Sé específico: "Anuncio de oferta 30% en zapatos para navidad"',
      'Puedes elegir tono: profesional, casual, urgente, amigable',
      'Genera solo el subject, solo el body, o ambos'
    ],
    competitiveAdvantage: 'GPT-4 powered AI incluido. Competidores usan modelos inferiores o cobran premium por AI.'
  },
  {
    id: 'campaigns-personalization',
    title: 'Variables de Personalización',
    content: 'Inserta {nombre}, {empresa}, {email} en tu contenido. CUBE los reemplaza con los datos reales de cada contacto.',
    category: 'campaigns',
    targetSelector: '[data-tour="personalization"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Los emails personalizados tienen 26% más apertura',
      'Siempre pon un fallback: {nombre|amigo}',
      'Puedes usar campos personalizados también'
    ]
  },
  {
    id: 'campaigns-images',
    title: 'Imágenes y Media',
    content: 'Sube imágenes o usa URLs. CUBE optimiza automáticamente para carga rápida y muestra alt text en clientes que bloquean imágenes.',
    category: 'campaigns',
    targetSelector: '[data-tour="image-upload"]',
    position: 'right',
    highlightType: 'border',
    tips: [
      'Tamaño ideal: 600px ancho máximo',
      'Formatos: JPG, PNG, GIF (animados funcionan)',
      'Agrega alt text descriptivo siempre'
    ],
    competitiveAdvantage: 'CDN global para imágenes, carga ultrarrápida en todo el mundo. Almacenamiento ilimitado incluido.'
  },
  {
    id: 'campaigns-step-recipients',
    title: 'Paso 3: Recipients - ¿A Quién Enviar?',
    content: 'Selecciona tu audiencia: toda la lista, listas específicas, segmentos, o tags. Entre más específico, mejor engagement.',
    category: 'campaigns',
    targetSelector: '.editor-steps .step:nth-child(5)',
    position: 'bottom',
    highlightType: 'glow',
    tips: [
      'Segmentar mejora open rates hasta 50%',
      'Puedes combinar listas y tags',
      'Excluye contactos específicos si es necesario'
    ]
  },
  {
    id: 'campaigns-segment-builder',
    title: 'Constructor de Segmentos',
    content: 'Crea segmentos dinámicos: "Clientes que compraron hace 30 días" o "Contactos que no abrieron últimos 5 emails".',
    category: 'campaigns',
    targetSelector: '[data-tour="segment-builder"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'Los segmentos se actualizan automáticamente',
      'Combina múltiples condiciones con AND/OR',
      'Guarda segmentos para reusar'
    ],
    competitiveAdvantage: 'Segmentación avanzada incluida. Mailchimp reserva esto para planes de $350+/mes.'
  },
  {
    id: 'campaigns-step-review',
    title: 'Paso 4: Review - Verificación Final',
    content: 'CUBE revisa tu campaña: links rotos, imágenes faltantes, spam score, y más. Asegúrate de que todo esté perfecto antes de enviar.',
    category: 'campaigns',
    targetSelector: '.editor-steps .step:nth-child(7)',
    position: 'bottom',
    highlightType: 'glow',
    tips: [
      'El spam score te dice probabilidad de llegar a inbox',
      'Revisa el preview en móvil y desktop',
      'Envía un test a ti mismo antes del envío real'
    ]
  },
  {
    id: 'campaigns-send-test',
    title: 'Enviar Test Email',
    content: 'Antes de enviar a miles, envía un test. Revisa en tu bandeja de entrada: formato, links, imágenes, cómo se ve en móvil.',
    category: 'campaigns',
    targetSelector: '[data-tour="send-test"]',
    position: 'left',
    highlightType: 'pulse',
    action: {
      type: 'click',
      label: 'Enviar test',
    },
    tips: [
      'Envía a múltiples emails para probar diferentes clientes',
      'Revisa en Gmail, Outlook, y móvil',
      'Haz clic en todos los links para verificar'
    ]
  },
  {
    id: 'campaigns-schedule',
    title: 'Programar Envío',
    content: 'Elige cuándo enviar: ahora mismo, fecha/hora específica, o usa Smart Send para que CUBE elija el mejor momento por contacto.',
    category: 'campaigns',
    targetSelector: '[data-tour="schedule-send"]',
    position: 'left',
    highlightType: 'spotlight',
    tips: [
      'Mejores días: Martes a Jueves',
      'Mejores horas: 9-11am o 2-4pm hora local',
      'Smart Send optimiza individualmente'
    ],
    competitiveAdvantage: 'Send Time Optimization incluido. Esta feature es premium ($$$) en otros servicios.'
  },
  {
    id: 'campaigns-ab-testing',
    title: 'A/B Testing',
    content: 'Prueba dos versiones: diferentes subjects, contenido, o horarios. CUBE envía a un % de tu lista y el ganador al resto.',
    category: 'campaigns',
    targetSelector: '[data-tour="ab-testing"]',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Prueba una variable a la vez para resultados claros',
      'Mínimo 1,000 contactos para A/B significativo',
      'Espera 2-4 horas para declarar ganador'
    ],
    competitiveAdvantage: 'A/B testing ilimitado en todos los planes. Competidores lo limitan o cobran extra.'
  },
  {
    id: 'campaigns-send-final',
    title: '🚀 ¡Enviar Campaña!',
    content: 'Último paso: revisa el resumen y haz clic en "Send" o "Schedule". Una vez enviado, podrás ver estadísticas en tiempo real.',
    category: 'campaigns',
    targetSelector: '[data-tour="send-campaign"]',
    position: 'center',
    highlightType: 'none',
    tips: [
      'No puedes editar después de enviado (solo pausar)',
      'Los primeros resultados llegan en minutos',
      'Las campañas programadas se pueden cancelar'
    ]
  },
  {
    id: 'campaigns-complete',
    title: '¡Campañas Dominadas! 📧',
    content: 'Ya sabes crear campañas profesionales. El siguiente paso es aprender a analizar resultados para mejorar continuamente.',
    category: 'campaigns',
    position: 'center',
    highlightType: 'none',
    tips: [
      'La práctica hace al maestro',
      'Analiza cada campaña para aprender',
      'Itera y mejora con cada envío'
    ]
  }
];

export const campaignsSection: TourSection = {
  id: 'campaigns',
  title: 'Creación de Campañas',
  description: 'Domina el arte de crear emails que convierten',
  icon: '📧',
  category: 'campaigns',
  steps: campaignSteps,
  estimatedTime: 15,
  difficulty: 'intermediate'
};
