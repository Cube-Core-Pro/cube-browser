/**
 * CUBE Extension Internationalization (i18n) System
 * Supports 12 languages with dynamic text loading
 */

const ExtensionI18n = {
  currentLocale: 'en',
  translations: {},
  supportedLocales: ['en', 'es', 'pt', 'it', 'de', 'fr', 'tr', 'zh', 'ja', 'ko', 'ar', 'ru'],
  
  // Full translation strings for sidepanel and extension UI
  strings: {
    en: {
      // Header
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: 'Active',
      toggleTheme: 'Toggle theme',
      startTour: 'Start Interactive Tour',
      tours: 'Tours',
      
      // Stats
      forms: 'Forms',
      macros: 'Macros',
      captures: 'Captures',
      saved: 'Saved',
      
      // AI Search Tab
      aiSearch: 'CUBE AI Search',
      beta: 'BETA',
      aiPoweredSearch: 'AI-powered search that understands context',
      askAnything: 'Ask anything...',
      voiceSearch: 'Voice search',
      search: 'Search',
      instant: 'Instant',
      deep: 'Deep',
      creative: 'Creative',
      code: 'Code',
      explain: 'Explain',
      summarize: 'Summarize',
      compare: 'Compare',
      analyze: 'Analyze',
      readyToSearch: 'Ready to Search',
      readyToSearchDesc: 'Ask any question and get AI-powered answers with verified sources',
      trending: 'Trending',
      
      // Intelligence Tab
      intelligenceCenter: 'Intelligence Center',
      osintInvestigations: 'OSINT & Due Diligence Investigations',
      person: 'Person',
      company: 'Company',
      domain: 'Domain',
      email: 'Email',
      phone: 'Phone',
      
      // Automation Tab
      automation: 'Automation',
      macroRecorder: 'Macro Recorder',
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      savedMacros: 'Saved Macros',
      noMacros: 'No macros saved yet',
      createFirst: 'Record your first automation',
      
      // Autofill Tab
      autofill: 'Smart Autofill',
      detectForms: 'Detect Forms',
      autoFillAll: 'Auto-fill All',
      formsDetected: 'forms detected',
      noForms: 'No forms detected on this page',
      fieldName: 'Field Name',
      fieldValue: 'Field Value',
      
      // Tools Tab
      tools: 'Tools',
      screenCapture: 'Screen Capture',
      captureVisible: 'Capture Visible',
      captureArea: 'Capture Area',
      captureFull: 'Capture Full Page',
      documentScanner: 'Document Scanner',
      scanPage: 'Scan Page',
      extractText: 'Extract Text',
      downloadPDF: 'Download PDF',
      
      // Downloads Tab
      downloads: 'Downloads',
      activeDownloads: 'Active Downloads',
      completedDownloads: 'Completed',
      noDownloads: 'No active downloads',
      pause: 'Pause',
      resume: 'Resume',
      cancel: 'Cancel',
      
      // Settings Tab
      settings: 'Settings',
      general: 'General',
      appearance: 'Appearance',
      theme: 'Theme',
      darkTheme: 'Dark',
      lightTheme: 'Light',
      elitePurple: 'Elite Purple',
      midnight: 'Midnight',
      language: 'Language',
      notifications: 'Notifications',
      enableNotifications: 'Enable Notifications',
      
      // Updates Section
      updates: 'Updates',
      checkForUpdates: 'Check for Updates',
      currentVersion: 'Current Version',
      updateAvailable: 'Update Available',
      upToDate: 'Up to Date',
      downloadUpdate: 'Download Update',
      lastChecked: 'Last checked',
      autoUpdate: 'Auto-update',
      
      // Cloud Sync
      cloudSync: 'Cloud Sync',
      connected: 'Connected',
      disconnected: 'Disconnected',
      syncNow: 'Sync Now',
      syncing: 'Syncing...',
      lastSync: 'Last sync',
      connectAccount: 'Connect Account',
      
      // Account
      account: 'Account',
      signIn: 'Sign In',
      signOut: 'Sign Out',
      manageAccount: 'Manage Account',
      subscription: 'Subscription',
      upgradePlan: 'Upgrade Plan',
      
      // Common
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      retry: 'Retry',
      
      // Footer
      helpCenter: 'Help Center',
      keyboardShortcuts: 'Keyboard Shortcuts',
      reportBug: 'Report Bug'
    },
    
    es: {
      // Header
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: 'Activo',
      toggleTheme: 'Cambiar tema',
      startTour: 'Iniciar Tour Interactivo',
      tours: 'Tours',
      
      // Stats
      forms: 'Formularios',
      macros: 'Macros',
      captures: 'Capturas',
      saved: 'Ahorrado',
      
      // AI Search Tab
      aiSearch: 'CUBE AI Search',
      beta: 'BETA',
      aiPoweredSearch: 'Búsqueda con IA que entiende el contexto',
      askAnything: 'Pregunta lo que quieras...',
      voiceSearch: 'Búsqueda por voz',
      search: 'Buscar',
      instant: 'Instantáneo',
      deep: 'Profundo',
      creative: 'Creativo',
      code: 'Código',
      explain: 'Explicar',
      summarize: 'Resumir',
      compare: 'Comparar',
      analyze: 'Analizar',
      readyToSearch: 'Listo para Buscar',
      readyToSearchDesc: 'Haz cualquier pregunta y obtén respuestas con fuentes verificadas',
      trending: 'Tendencias',
      
      // Intelligence Tab
      intelligenceCenter: 'Centro de Inteligencia',
      osintInvestigations: 'Investigaciones OSINT y Due Diligence',
      person: 'Persona',
      company: 'Empresa',
      domain: 'Dominio',
      email: 'Email',
      phone: 'Teléfono',
      
      // Automation Tab
      automation: 'Automatización',
      macroRecorder: 'Grabador de Macros',
      startRecording: 'Iniciar Grabación',
      stopRecording: 'Detener Grabación',
      savedMacros: 'Macros Guardados',
      noMacros: 'No hay macros guardados',
      createFirst: 'Graba tu primera automatización',
      
      // Autofill Tab
      autofill: 'Auto-rellenado Inteligente',
      detectForms: 'Detectar Formularios',
      autoFillAll: 'Rellenar Todo',
      formsDetected: 'formularios detectados',
      noForms: 'No se detectaron formularios en esta página',
      fieldName: 'Nombre del Campo',
      fieldValue: 'Valor del Campo',
      
      // Tools Tab
      tools: 'Herramientas',
      screenCapture: 'Captura de Pantalla',
      captureVisible: 'Capturar Visible',
      captureArea: 'Capturar Área',
      captureFull: 'Capturar Página Completa',
      documentScanner: 'Escáner de Documentos',
      scanPage: 'Escanear Página',
      extractText: 'Extraer Texto',
      downloadPDF: 'Descargar PDF',
      
      // Downloads Tab
      downloads: 'Descargas',
      activeDownloads: 'Descargas Activas',
      completedDownloads: 'Completadas',
      noDownloads: 'No hay descargas activas',
      pause: 'Pausar',
      resume: 'Reanudar',
      cancel: 'Cancelar',
      
      // Settings Tab
      settings: 'Configuración',
      general: 'General',
      appearance: 'Apariencia',
      theme: 'Tema',
      darkTheme: 'Oscuro',
      lightTheme: 'Claro',
      elitePurple: 'Púrpura Elite',
      midnight: 'Medianoche',
      language: 'Idioma',
      notifications: 'Notificaciones',
      enableNotifications: 'Activar Notificaciones',
      
      // Updates Section
      updates: 'Actualizaciones',
      checkForUpdates: 'Buscar Actualizaciones',
      currentVersion: 'Versión Actual',
      updateAvailable: 'Actualización Disponible',
      upToDate: 'Al Día',
      downloadUpdate: 'Descargar Actualización',
      lastChecked: 'Última comprobación',
      autoUpdate: 'Actualización automática',
      
      // Cloud Sync
      cloudSync: 'Sincronización en la Nube',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      syncNow: 'Sincronizar Ahora',
      syncing: 'Sincronizando...',
      lastSync: 'Última sincronización',
      connectAccount: 'Conectar Cuenta',
      
      // Account
      account: 'Cuenta',
      signIn: 'Iniciar Sesión',
      signOut: 'Cerrar Sesión',
      manageAccount: 'Administrar Cuenta',
      subscription: 'Suscripción',
      upgradePlan: 'Mejorar Plan',
      
      // Common
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      done: 'Listo',
      retry: 'Reintentar',
      
      // Footer
      helpCenter: 'Centro de Ayuda',
      keyboardShortcuts: 'Atajos de Teclado',
      reportBug: 'Reportar Error'
    },
    
    pt: {
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: 'Ativo',
      toggleTheme: 'Alternar tema',
      startTour: 'Iniciar Tour Interativo',
      tours: 'Tours',
      forms: 'Formulários',
      macros: 'Macros',
      captures: 'Capturas',
      saved: 'Economizado',
      aiSearch: 'CUBE AI Search',
      beta: 'BETA',
      aiPoweredSearch: 'Busca com IA que entende o contexto',
      askAnything: 'Pergunte qualquer coisa...',
      voiceSearch: 'Busca por voz',
      search: 'Buscar',
      instant: 'Instantâneo',
      deep: 'Profundo',
      creative: 'Criativo',
      code: 'Código',
      explain: 'Explicar',
      summarize: 'Resumir',
      compare: 'Comparar',
      analyze: 'Analisar',
      readyToSearch: 'Pronto para Buscar',
      readyToSearchDesc: 'Faça qualquer pergunta e obtenha respostas com fontes verificadas',
      trending: 'Tendências',
      intelligenceCenter: 'Centro de Inteligência',
      osintInvestigations: 'Investigações OSINT e Due Diligence',
      person: 'Pessoa',
      company: 'Empresa',
      domain: 'Domínio',
      email: 'Email',
      phone: 'Telefone',
      automation: 'Automação',
      macroRecorder: 'Gravador de Macros',
      startRecording: 'Iniciar Gravação',
      stopRecording: 'Parar Gravação',
      savedMacros: 'Macros Salvos',
      noMacros: 'Nenhum macro salvo ainda',
      createFirst: 'Grave sua primeira automação',
      autofill: 'Preenchimento Automático Inteligente',
      detectForms: 'Detectar Formulários',
      autoFillAll: 'Preencher Tudo',
      formsDetected: 'formulários detectados',
      noForms: 'Nenhum formulário detectado nesta página',
      fieldName: 'Nome do Campo',
      fieldValue: 'Valor do Campo',
      tools: 'Ferramentas',
      screenCapture: 'Captura de Tela',
      captureVisible: 'Capturar Visível',
      captureArea: 'Capturar Área',
      captureFull: 'Capturar Página Inteira',
      documentScanner: 'Scanner de Documentos',
      scanPage: 'Escanear Página',
      extractText: 'Extrair Texto',
      downloadPDF: 'Baixar PDF',
      downloads: 'Downloads',
      activeDownloads: 'Downloads Ativos',
      completedDownloads: 'Concluídos',
      noDownloads: 'Nenhum download ativo',
      pause: 'Pausar',
      resume: 'Retomar',
      cancel: 'Cancelar',
      settings: 'Configurações',
      general: 'Geral',
      appearance: 'Aparência',
      theme: 'Tema',
      darkTheme: 'Escuro',
      lightTheme: 'Claro',
      elitePurple: 'Roxo Elite',
      midnight: 'Meia-noite',
      language: 'Idioma',
      notifications: 'Notificações',
      enableNotifications: 'Ativar Notificações',
      updates: 'Atualizações',
      checkForUpdates: 'Verificar Atualizações',
      currentVersion: 'Versão Atual',
      updateAvailable: 'Atualização Disponível',
      upToDate: 'Atualizado',
      downloadUpdate: 'Baixar Atualização',
      lastChecked: 'Última verificação',
      autoUpdate: 'Atualização automática',
      cloudSync: 'Sincronização na Nuvem',
      connected: 'Conectado',
      disconnected: 'Desconectado',
      syncNow: 'Sincronizar Agora',
      syncing: 'Sincronizando...',
      lastSync: 'Última sincronização',
      connectAccount: 'Conectar Conta',
      account: 'Conta',
      signIn: 'Entrar',
      signOut: 'Sair',
      manageAccount: 'Gerenciar Conta',
      subscription: 'Assinatura',
      upgradePlan: 'Atualizar Plano',
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      save: 'Salvar',
      delete: 'Excluir',
      edit: 'Editar',
      close: 'Fechar',
      back: 'Voltar',
      next: 'Próximo',
      done: 'Concluído',
      retry: 'Tentar Novamente',
      helpCenter: 'Central de Ajuda',
      keyboardShortcuts: 'Atalhos de Teclado',
      reportBug: 'Reportar Bug'
    },
    
    de: {
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: 'Aktiv',
      toggleTheme: 'Design wechseln',
      startTour: 'Interaktive Tour starten',
      tours: 'Touren',
      forms: 'Formulare',
      macros: 'Makros',
      captures: 'Aufnahmen',
      saved: 'Gespart',
      aiSearch: 'CUBE AI Suche',
      beta: 'BETA',
      aiPoweredSearch: 'KI-gestützte Suche mit Kontextverständnis',
      askAnything: 'Frag einfach...',
      voiceSearch: 'Sprachsuche',
      search: 'Suchen',
      instant: 'Sofort',
      deep: 'Tief',
      creative: 'Kreativ',
      code: 'Code',
      explain: 'Erklären',
      summarize: 'Zusammenfassen',
      compare: 'Vergleichen',
      analyze: 'Analysieren',
      readyToSearch: 'Bereit zum Suchen',
      readyToSearchDesc: 'Stelle jede Frage und erhalte Antworten mit verifizierten Quellen',
      trending: 'Trends',
      intelligenceCenter: 'Intelligence Center',
      osintInvestigations: 'OSINT & Due-Diligence-Untersuchungen',
      person: 'Person',
      company: 'Unternehmen',
      domain: 'Domain',
      email: 'E-Mail',
      phone: 'Telefon',
      automation: 'Automatisierung',
      macroRecorder: 'Makro-Rekorder',
      startRecording: 'Aufnahme starten',
      stopRecording: 'Aufnahme stoppen',
      savedMacros: 'Gespeicherte Makros',
      noMacros: 'Noch keine Makros gespeichert',
      createFirst: 'Erstelle deine erste Automatisierung',
      autofill: 'Intelligentes Autofill',
      detectForms: 'Formulare erkennen',
      autoFillAll: 'Alles ausfüllen',
      formsDetected: 'Formulare erkannt',
      noForms: 'Keine Formulare auf dieser Seite erkannt',
      fieldName: 'Feldname',
      fieldValue: 'Feldwert',
      tools: 'Werkzeuge',
      screenCapture: 'Bildschirmaufnahme',
      captureVisible: 'Sichtbares aufnehmen',
      captureArea: 'Bereich aufnehmen',
      captureFull: 'Ganze Seite aufnehmen',
      documentScanner: 'Dokumentenscanner',
      scanPage: 'Seite scannen',
      extractText: 'Text extrahieren',
      downloadPDF: 'PDF herunterladen',
      downloads: 'Downloads',
      activeDownloads: 'Aktive Downloads',
      completedDownloads: 'Abgeschlossen',
      noDownloads: 'Keine aktiven Downloads',
      pause: 'Pause',
      resume: 'Fortsetzen',
      cancel: 'Abbrechen',
      settings: 'Einstellungen',
      general: 'Allgemein',
      appearance: 'Aussehen',
      theme: 'Design',
      darkTheme: 'Dunkel',
      lightTheme: 'Hell',
      elitePurple: 'Elite Lila',
      midnight: 'Mitternacht',
      language: 'Sprache',
      notifications: 'Benachrichtigungen',
      enableNotifications: 'Benachrichtigungen aktivieren',
      updates: 'Updates',
      checkForUpdates: 'Nach Updates suchen',
      currentVersion: 'Aktuelle Version',
      updateAvailable: 'Update verfügbar',
      upToDate: 'Aktuell',
      downloadUpdate: 'Update herunterladen',
      lastChecked: 'Zuletzt geprüft',
      autoUpdate: 'Automatische Updates',
      cloudSync: 'Cloud-Synchronisierung',
      connected: 'Verbunden',
      disconnected: 'Getrennt',
      syncNow: 'Jetzt synchronisieren',
      syncing: 'Synchronisiere...',
      lastSync: 'Letzte Synchronisierung',
      connectAccount: 'Konto verbinden',
      account: 'Konto',
      signIn: 'Anmelden',
      signOut: 'Abmelden',
      manageAccount: 'Konto verwalten',
      subscription: 'Abonnement',
      upgradePlan: 'Plan upgraden',
      loading: 'Laden...',
      error: 'Fehler',
      success: 'Erfolg',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      close: 'Schließen',
      back: 'Zurück',
      next: 'Weiter',
      done: 'Fertig',
      retry: 'Wiederholen',
      helpCenter: 'Hilfecenter',
      keyboardShortcuts: 'Tastenkürzel',
      reportBug: 'Fehler melden'
    },
    
    fr: {
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: 'Actif',
      toggleTheme: 'Changer de thème',
      startTour: 'Démarrer la visite interactive',
      tours: 'Visites',
      forms: 'Formulaires',
      macros: 'Macros',
      captures: 'Captures',
      saved: 'Économisé',
      aiSearch: 'CUBE AI Search',
      beta: 'BÊTA',
      aiPoweredSearch: 'Recherche IA qui comprend le contexte',
      askAnything: 'Posez n\'importe quelle question...',
      voiceSearch: 'Recherche vocale',
      search: 'Rechercher',
      instant: 'Instantané',
      deep: 'Approfondi',
      creative: 'Créatif',
      code: 'Code',
      explain: 'Expliquer',
      summarize: 'Résumer',
      compare: 'Comparer',
      analyze: 'Analyser',
      readyToSearch: 'Prêt à rechercher',
      readyToSearchDesc: 'Posez n\'importe quelle question et obtenez des réponses avec sources vérifiées',
      trending: 'Tendances',
      intelligenceCenter: 'Centre de Renseignement',
      osintInvestigations: 'Investigations OSINT & Due Diligence',
      person: 'Personne',
      company: 'Entreprise',
      domain: 'Domaine',
      email: 'Email',
      phone: 'Téléphone',
      automation: 'Automatisation',
      macroRecorder: 'Enregistreur de Macros',
      startRecording: 'Démarrer l\'enregistrement',
      stopRecording: 'Arrêter l\'enregistrement',
      savedMacros: 'Macros enregistrées',
      noMacros: 'Aucune macro enregistrée',
      createFirst: 'Enregistrez votre première automatisation',
      autofill: 'Remplissage automatique intelligent',
      detectForms: 'Détecter les formulaires',
      autoFillAll: 'Tout remplir',
      formsDetected: 'formulaires détectés',
      noForms: 'Aucun formulaire détecté sur cette page',
      fieldName: 'Nom du champ',
      fieldValue: 'Valeur du champ',
      tools: 'Outils',
      screenCapture: 'Capture d\'écran',
      captureVisible: 'Capturer la zone visible',
      captureArea: 'Capturer une zone',
      captureFull: 'Capturer la page entière',
      documentScanner: 'Scanner de documents',
      scanPage: 'Scanner la page',
      extractText: 'Extraire le texte',
      downloadPDF: 'Télécharger PDF',
      downloads: 'Téléchargements',
      activeDownloads: 'Téléchargements actifs',
      completedDownloads: 'Terminés',
      noDownloads: 'Aucun téléchargement actif',
      pause: 'Pause',
      resume: 'Reprendre',
      cancel: 'Annuler',
      settings: 'Paramètres',
      general: 'Général',
      appearance: 'Apparence',
      theme: 'Thème',
      darkTheme: 'Sombre',
      lightTheme: 'Clair',
      elitePurple: 'Violet Elite',
      midnight: 'Minuit',
      language: 'Langue',
      notifications: 'Notifications',
      enableNotifications: 'Activer les notifications',
      updates: 'Mises à jour',
      checkForUpdates: 'Vérifier les mises à jour',
      currentVersion: 'Version actuelle',
      updateAvailable: 'Mise à jour disponible',
      upToDate: 'À jour',
      downloadUpdate: 'Télécharger la mise à jour',
      lastChecked: 'Dernière vérification',
      autoUpdate: 'Mise à jour automatique',
      cloudSync: 'Synchronisation cloud',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      syncNow: 'Synchroniser maintenant',
      syncing: 'Synchronisation...',
      lastSync: 'Dernière synchronisation',
      connectAccount: 'Connecter le compte',
      account: 'Compte',
      signIn: 'Se connecter',
      signOut: 'Se déconnecter',
      manageAccount: 'Gérer le compte',
      subscription: 'Abonnement',
      upgradePlan: 'Mettre à niveau',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      close: 'Fermer',
      back: 'Retour',
      next: 'Suivant',
      done: 'Terminé',
      retry: 'Réessayer',
      helpCenter: 'Centre d\'aide',
      keyboardShortcuts: 'Raccourcis clavier',
      reportBug: 'Signaler un bug'
    },
    
    it: {
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: 'Attivo',
      toggleTheme: 'Cambia tema',
      startTour: 'Avvia Tour Interattivo',
      tours: 'Tour',
      forms: 'Moduli',
      macros: 'Macro',
      captures: 'Catture',
      saved: 'Risparmiato',
      aiSearch: 'CUBE AI Search',
      beta: 'BETA',
      aiPoweredSearch: 'Ricerca AI che comprende il contesto',
      askAnything: 'Chiedi qualsiasi cosa...',
      voiceSearch: 'Ricerca vocale',
      search: 'Cerca',
      instant: 'Istantaneo',
      deep: 'Profondo',
      creative: 'Creativo',
      code: 'Codice',
      explain: 'Spiega',
      summarize: 'Riassumi',
      compare: 'Confronta',
      analyze: 'Analizza',
      readyToSearch: 'Pronto per cercare',
      readyToSearchDesc: 'Fai qualsiasi domanda e ottieni risposte con fonti verificate',
      trending: 'Tendenze',
      automation: 'Automazione',
      settings: 'Impostazioni',
      updates: 'Aggiornamenti',
      cloudSync: 'Sincronizzazione Cloud',
      account: 'Account',
      loading: 'Caricamento...',
      error: 'Errore',
      success: 'Successo',
      save: 'Salva',
      cancel: 'Annulla'
    },
    
    tr: {
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: 'Aktif',
      toggleTheme: 'Temayı değiştir',
      forms: 'Formlar',
      macros: 'Makrolar',
      captures: 'Yakalamalılar',
      saved: 'Kaydedildi',
      aiSearch: 'CUBE AI Arama',
      beta: 'BETA',
      search: 'Ara',
      automation: 'Otomasyon',
      settings: 'Ayarlar',
      updates: 'Güncellemeler',
      cloudSync: 'Bulut Senkronizasyonu',
      account: 'Hesap',
      loading: 'Yükleniyor...',
      error: 'Hata',
      success: 'Başarılı',
      save: 'Kaydet',
      cancel: 'İptal'
    },
    
    zh: {
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 企业版',
      active: '活跃',
      toggleTheme: '切换主题',
      forms: '表单',
      macros: '宏',
      captures: '截图',
      saved: '已保存',
      aiSearch: 'CUBE AI 搜索',
      beta: '测试版',
      search: '搜索',
      automation: '自动化',
      settings: '设置',
      updates: '更新',
      cloudSync: '云同步',
      account: '账户',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      save: '保存',
      cancel: '取消'
    },
    
    ja: {
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: 'アクティブ',
      toggleTheme: 'テーマを切り替え',
      forms: 'フォーム',
      macros: 'マクロ',
      captures: 'キャプチャ',
      saved: '保存済み',
      aiSearch: 'CUBE AI 検索',
      beta: 'ベータ',
      search: '検索',
      automation: '自動化',
      settings: '設定',
      updates: '更新',
      cloudSync: 'クラウド同期',
      account: 'アカウント',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      save: '保存',
      cancel: 'キャンセル'
    },
    
    ko: {
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: '활성',
      toggleTheme: '테마 전환',
      forms: '양식',
      macros: '매크로',
      captures: '캡처',
      saved: '저장됨',
      aiSearch: 'CUBE AI 검색',
      beta: '베타',
      search: '검색',
      automation: '자동화',
      settings: '설정',
      updates: '업데이트',
      cloudSync: '클라우드 동기화',
      account: '계정',
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
      save: '저장',
      cancel: '취소'
    },
    
    ar: {
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: 'نشط',
      toggleTheme: 'تبديل السمة',
      forms: 'النماذج',
      macros: 'الماكرو',
      captures: 'اللقطات',
      saved: 'محفوظ',
      aiSearch: 'بحث CUBE AI',
      beta: 'تجريبي',
      search: 'بحث',
      automation: 'الأتمتة',
      settings: 'الإعدادات',
      updates: 'التحديثات',
      cloudSync: 'المزامنة السحابية',
      account: 'الحساب',
      loading: 'جارٍ التحميل...',
      error: 'خطأ',
      success: 'نجاح',
      save: 'حفظ',
      cancel: 'إلغاء'
    },
    
    ru: {
      appTitle: 'CUBE Nexum',
      version: 'v7.0.0 Enterprise',
      active: 'Активен',
      toggleTheme: 'Сменить тему',
      forms: 'Формы',
      macros: 'Макросы',
      captures: 'Снимки',
      saved: 'Сохранено',
      aiSearch: 'CUBE AI Поиск',
      beta: 'БЕТА',
      search: 'Поиск',
      automation: 'Автоматизация',
      settings: 'Настройки',
      updates: 'Обновления',
      cloudSync: 'Облачная синхронизация',
      account: 'Аккаунт',
      loading: 'Загрузка...',
      error: 'Ошибка',
      success: 'Успех',
      save: 'Сохранить',
      cancel: 'Отмена'
    }
  },
  
  async init() {
    // Get stored language preference
    const stored = await chrome.storage.local.get('language');
    if (stored.language && this.supportedLocales.includes(stored.language)) {
      this.currentLocale = stored.language;
    } else {
      // Try to detect browser language (only available in DOM context, not service worker)
      if (typeof navigator !== 'undefined' && navigator.language) {
        const browserLang = navigator.language.split('-')[0];
        if (this.supportedLocales.includes(browserLang)) {
          this.currentLocale = browserLang;
        }
      }
    }
    
    this.translations = this.strings[this.currentLocale] || this.strings.en;
    console.log('[CUBE i18n] Initialized with locale:', this.currentLocale);
  },
  
  t(key) {
    return this.translations[key] || this.strings.en[key] || key;
  },
  
  async setLocale(locale) {
    if (!this.supportedLocales.includes(locale)) {
      console.error('[CUBE i18n] Unsupported locale:', locale);
      return false;
    }
    
    this.currentLocale = locale;
    this.translations = this.strings[locale] || this.strings.en;
    
    await chrome.storage.local.set({ language: locale });
    
    // Trigger UI update
    this.applyTranslations();
    
    console.log('[CUBE i18n] Locale changed to:', locale);
    return true;
  },
  
  applyTranslations() {
    // Skip if running in service worker (no document)
    if (typeof document === 'undefined') {
      return;
    }
    
    // Apply translations to all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (el.hasAttribute('data-i18n-attr')) {
        const attr = el.getAttribute('data-i18n-attr');
        el.setAttribute(attr, translation);
      } else {
        el.textContent = translation;
      }
    });
    
    // Apply to placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
    
    // Apply to titles/tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
  },
  
  getLocale() {
    return this.currentLocale;
  },
  
  getSupportedLocales() {
    return this.supportedLocales;
  },
  
  getLocaleNames() {
    return {
      en: 'English',
      es: 'Español',
      pt: 'Português',
      it: 'Italiano',
      de: 'Deutsch',
      fr: 'Français',
      tr: 'Türkçe',
      zh: '中文',
      ja: '日本語',
      ko: '한국어',
      ar: 'العربية',
      ru: 'Русский'
    };
  }
};

// Initialize on load (only in DOM context, not service worker)
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ExtensionI18n.init());
  } else {
    ExtensionI18n.init();
  }
} else {
  // Service worker context - initialize without DOM
  ExtensionI18n.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExtensionI18n;
}
