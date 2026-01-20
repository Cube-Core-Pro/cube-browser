/**
 * Email Marketing Tour Steps - Welcome & Settings
 * Fase 2: Bienvenida y configuración de email
 */

import type { TourSection, TourStep } from '../types';

// ============================================================================
// SECTION 1: WELCOME
// ============================================================================

export const welcomeSteps: TourStep[] = [
  {
    id: 'welcome-intro',
    title: '¡Bienvenido al Módulo de Email Marketing! 🎉',
    content: 'Este módulo te permite crear, gestionar y enviar campañas de email profesionales a tus contactos. Con CUBE, tendrás acceso a herramientas de nivel empresarial para maximizar tus conversiones.',
    category: 'welcome',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Puedes pausar el tour en cualquier momento y retomarlo después',
      'Usa las flechas del teclado para navegar más rápido',
      'Cada sección tiene un tiempo estimado de aprendizaje'
    ],
    competitiveAdvantage: 'A diferencia de Mailchimp o SendGrid, CUBE integra AI para generar contenido, automatización avanzada y análisis en tiempo real sin costos adicionales.'
  },
  {
    id: 'welcome-overview',
    title: 'Vista General del Dashboard',
    content: 'El dashboard te muestra métricas clave: emails enviados, tasa de apertura, clics y revenue generado. Todo actualizado en tiempo real para que siempre sepas cómo van tus campañas.',
    category: 'welcome',
    targetSelector: '.email-stats',
    position: 'bottom',
    highlightType: 'spotlight',
    tips: [
      'Las estadísticas se actualizan cada 5 minutos automáticamente',
      'Haz clic en cualquier métrica para ver detalles',
      'Puedes exportar reportes en PDF o CSV'
    ],
    competitiveAdvantage: 'Dashboard unificado que muestra ROI real, no solo métricas vanidosas. Integración directa con ventas.'
  },
  {
    id: 'welcome-navigation',
    title: 'Navegación Principal',
    content: 'Desde aquí puedes acceder a: Campañas (crear y gestionar), Contactos (tu audiencia), Templates (diseños listos), Automatizaciones (flujos) y Analytics (reportes detallados).',
    category: 'welcome',
    targetSelector: '.email-header',
    position: 'bottom',
    highlightType: 'border',
    tips: [
      'El botón "AI Writer" te ayuda a crear contenido con inteligencia artificial',
      'El botón "+" crea una nueva campaña rápidamente',
      'Los filtros te ayudan a encontrar campañas específicas'
    ]
  }
];

export const welcomeSection: TourSection = {
  id: 'welcome',
  title: 'Bienvenida',
  description: 'Conoce el módulo de Email Marketing y sus funciones principales',
  icon: '👋',
  category: 'welcome',
  steps: welcomeSteps,
  estimatedTime: 3,
  difficulty: 'beginner'
};

// ============================================================================
// SECTION 2: EMAIL SETTINGS
// ============================================================================

export const settingsSteps: TourStep[] = [
  {
    id: 'settings-intro',
    title: 'Configuración de Email - El Primer Paso',
    content: 'Antes de enviar campañas, necesitas configurar tu proveedor de email. CUBE soporta SMTP tradicional y SendGrid, dándote flexibilidad total.',
    category: 'settings',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Puedes cambiar de proveedor en cualquier momento sin perder datos',
      'Recomendamos SendGrid para volúmenes altos (+10,000 emails/mes)',
      'SMTP es ideal si ya tienes un servidor de correo'
    ],
    competitiveAdvantage: 'Otros servicios te obligan a usar su infraestructura. CUBE te da libertad de usar tu propio servidor o integrarte con cualquier proveedor.'
  },
  {
    id: 'settings-provider-selection',
    title: 'Selección de Proveedor',
    content: 'Elige entre SMTP (servidor propio), SendGrid (servicio cloud), o Ninguno si solo quieres probar. Cada opción tiene sus ventajas.',
    category: 'settings',
    targetSelector: '[data-tour="provider-select"]',
    position: 'right',
    highlightType: 'glow',
    tips: [
      'SMTP: Control total, sin límites de tu servidor',
      'SendGrid: Alta deliverability, fácil setup, analytics avanzados',
      'Puedes probar con emails de test antes de configurar'
    ]
  },
  {
    id: 'settings-smtp-config',
    title: 'Configuración SMTP',
    content: 'Si eliges SMTP, necesitarás: Host del servidor, Puerto (generalmente 587 o 465), Usuario y Contraseña. Activa TLS/SSL para seguridad.',
    category: 'settings',
    targetSelector: '[data-tour="smtp-config"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'Puerto 587 usa STARTTLS (recomendado)',
      'Puerto 465 usa SSL/TLS implícito',
      'Algunos servidores requieren autenticación de app específica'
    ],
    competitiveAdvantage: 'CUBE detecta automáticamente la mejor configuración para tu servidor y te sugiere valores óptimos.'
  },
  {
    id: 'settings-sendgrid-config',
    title: 'Configuración SendGrid',
    content: 'SendGrid solo requiere tu API Key. Ve a sendgrid.com, crea una cuenta gratuita (100 emails/día), genera una API Key y pégala aquí.',
    category: 'settings',
    targetSelector: '[data-tour="sendgrid-config"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'SendGrid Free: 100 emails/día, suficiente para empezar',
      'La API Key debe tener permisos de "Mail Send"',
      'Guarda la API Key en un lugar seguro, solo se muestra una vez'
    ],
    competitiveAdvantage: 'Setup en 2 minutos. Otros servicios requieren verificaciones complejas de dominio antes de enviar.'
  },
  {
    id: 'settings-test-connection',
    title: 'Probar Conexión',
    content: 'El botón "Test Connection" verifica que tu configuración es correcta. Si todo está bien, verás ✓ verde. Si hay error, te mostramos qué revisar.',
    category: 'settings',
    targetSelector: '[data-tour="test-connection"]',
    position: 'left',
    highlightType: 'pulse',
    action: {
      type: 'click',
      label: 'Probar conexión',
    },
    tips: [
      'Errores comunes: credenciales incorrectas, puerto bloqueado, SSL requerido',
      'Si falla, verifica que tu firewall permita conexiones salientes',
      'El test no envía emails reales, solo verifica la conexión'
    ]
  },
  {
    id: 'settings-test-email',
    title: 'Enviar Email de Prueba',
    content: 'Una vez conectado, envía un email de prueba a ti mismo. Esto confirma que todo funciona y te muestra cómo se ven tus emails.',
    category: 'settings',
    targetSelector: '[data-tour="send-test"]',
    position: 'left',
    highlightType: 'pulse',
    action: {
      type: 'click',
      label: 'Enviar email de prueba',
    },
    tips: [
      'Revisa también la carpeta de spam',
      'El email de prueba incluye información de diagnóstico',
      'Si no llega en 5 minutos, revisa la configuración'
    ]
  },
  {
    id: 'settings-rate-limiting',
    title: 'Límites de Envío (Rate Limiting)',
    content: 'Configura cuántos emails puedes enviar por minuto y por hora. Esto evita que tu servidor sea marcado como spam y protege tu reputación.',
    category: 'settings',
    targetSelector: '[data-tour="rate-limits"]',
    position: 'top',
    highlightType: 'border',
    tips: [
      'Empieza con límites bajos (60/min) y aumenta gradualmente',
      'Servidores nuevos: máximo 500/hora las primeras semanas',
      'SendGrid gestiona esto automáticamente en sus planes pagos'
    ],
    competitiveAdvantage: 'CUBE gestiona automáticamente el throttling para mantener tu reputación de sender sin intervención manual.'
  },
  {
    id: 'settings-sender-info',
    title: 'Información del Remitente',
    content: 'Configura el nombre y email que aparecerán como remitente. Usa un email profesional con tu dominio para mejor deliverability.',
    category: 'settings',
    targetSelector: '[data-tour="sender-info"]',
    position: 'right',
    highlightType: 'spotlight',
    tips: [
      'Usa tu dominio real (ejemplo@tuempresa.com), no Gmail/Hotmail',
      'El nombre debe ser reconocible para tus contactos',
      'Configura SPF, DKIM y DMARC en tu DNS para máxima entrega'
    ],
    competitiveAdvantage: 'CUBE te guía paso a paso para configurar autenticación de email (SPF/DKIM), algo que otros servicios cobran extra.'
  },
  {
    id: 'settings-complete',
    title: '¡Configuración Completa! ✅',
    content: 'Tu proveedor de email está configurado. Ahora puedes enviar campañas a tus contactos. El siguiente paso es importar o crear tu lista de contactos.',
    category: 'settings',
    position: 'center',
    highlightType: 'none',
    tips: [
      'Puedes volver a configuración en cualquier momento',
      'Los cambios de configuración son inmediatos',
      'Recomendamos revisar la configuración mensualmente'
    ],
    competitiveAdvantage: 'Configuración completa en menos de 5 minutos. Con otros servicios, este proceso puede tomar horas o días.'
  }
];

export const settingsSection: TourSection = {
  id: 'settings',
  title: 'Configuración de Email',
  description: 'Aprende a configurar SMTP o SendGrid para enviar campañas',
  icon: '⚙️',
  category: 'settings',
  steps: settingsSteps,
  estimatedTime: 8,
  difficulty: 'beginner'
};
