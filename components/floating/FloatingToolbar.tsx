"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Video,
  Pipette,
  MousePointer2,
  Ruler,
  Layers,
  ChevronDown,
  ChevronUp,
  GripVertical,
  FileSearch,
  FileText,
  FormInput,
  Home,
  Zap,
  Download,
  Share2,
  Monitor,
  Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('FloatingToolbar');

export const FloatingToolbar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Initialize position on the right side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updatePosition = () => {
      setPosition({ x: window.innerWidth - 80, y: 80 });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const handleMouseDown = (event: React.MouseEvent) => {
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      setDragOffset({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const newX = event.clientX - dragOffset.x;
        const newY = event.clientY - dragOffset.y;
        
        // Keep within viewport bounds
        const maxX = window.innerWidth - (toolbarRef.current?.offsetWidth || 0);
        const maxY = window.innerHeight - (toolbarRef.current?.offsetHeight || 0);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleScreenshot = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const path = await invoke<string>('toolbar_take_screenshot', { 
          format: 'png' 
        });
        log.debug('📸 Screenshot guardado en:', path);
      } else {
        log.debug('📸 Screenshot only available in Tauri app');
      }
    } catch (error) {
      log.error('❌ Error al capturar screenshot:', error);
    }
  };

  const handleRecording = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        
        if (!isRecording) {
          await invoke('toolbar_start_recording', { format: 'mp4' });
          log.debug('🔴 Grabación iniciada');
          setIsRecording(true);
        } else {
          const path = await invoke<string>('toolbar_stop_recording');
          log.debug('⏹️ Grabación guardada en:', path);
          setIsRecording(false);
        }
      } else {
        log.debug('🎥 Recording only available in Tauri app');
      }
    } catch (error) {
      log.error('❌ Error en grabación:', error);
    }
  };

  const handleColorPicker = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const color = await invoke<string>('toolbar_pick_color', { x: 0, y: 0 });
        log.debug('🎨 Color seleccionado:', color);
      } else {
        log.debug('🎨 Color Picker only available in Tauri app');
      }
    } catch (error) {
      log.error('❌ Error en selector de color:', error);
    }
  };

  const handleInspector = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('toolbar_inspect_element', { tabId: 'current' });
        log.debug('🔍 Inspector de elementos activado');
      } else {
        log.debug('🔍 Inspector only available in Tauri app');
      }
    } catch (error) {
      log.error('❌ Error en inspector:', error);
    }
  };

  const handleRuler = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const distance = await invoke<number>('toolbar_measure_distance', {
          x1: 0, y1: 0, x2: 100, y2: 100
        });
        log.debug(`📏 Distancia medida: ${distance}px`);
      }
    } catch (error) {
      log.error('❌ Error en herramienta de medición:', error);
    }
  };

  const handleLayers = () => {
    // Navigate to automation page with layers view
    if (typeof window !== 'undefined') {
      window.location.href = '/automation?view=layers';
      log.debug('🗂️ Panel de capas abierto');
    }
  };

  const handleFileDetection = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const files = await invoke<string[]>('toolbar_detect_files', { 
          url: window.location.href 
        });
        log.debug('📂 Archivos detectados:', files.length);
      }
    } catch (error) {
      log.error('❌ Error en detección de archivos:', error);
    }
  };

  const handleParser = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const content = await invoke<string>('toolbar_parse_page', {
          url: window.location.href,
          selector: 'body'
        });
        log.debug('📄 Contenido parseado:', content.substring(0, 100) + '...');
      }
    } catch (error) {
      log.error('❌ Error en parser:', error);
    }
  };

  const handleAutofill = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/autofill';
      log.debug('⚡ Abriendo gestor de autofill...');
    }
  };

  const handleLendingpad = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/lendingpad';
      log.debug('🏠 Abriendo integración de Lendingpad...');
    }
  };

  const handleQuickAction = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('toolbar_execute_quick_action', { actionId: 'default' });
        log.debug('⚡ Acción rápida ejecutada');
      }
    } catch (error) {
      log.error('❌ Error en acción rápida:', error);
    }
  };

  const handleDownloader = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('toolbar_download_file', {
          url: window.location.href,
          destination: '/tmp'
        });
        log.debug('📥 Descarga iniciada');
      }
    } catch (error) {
      log.error('❌ Error en downloader:', error);
    }
  };

  const handleScreenShare = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const sessionId = await invoke<string>('toolbar_start_screen_share');
        log.debug('📺 Compartir pantalla iniciado:', sessionId);
      }
    } catch (error) {
      log.error('❌ Error en compartir pantalla:', error);
    }
  };

  const handleRemoteDesktop = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/collaboration';
      log.debug('🖥️ Abriendo escritorio remoto...');
    }
  };

  const handleMacros = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/automation?view=macros';
      log.debug('🎬 Abriendo gestor de macros...');
    }
  };

  return (
    <div 
      ref={toolbarRef}
      className="fixed z-40"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      <div className={cn(
        "bg-background border rounded-lg shadow-lg transition-all",
        isExpanded ? "p-2" : "p-1"
      )}>
        <TooltipProvider>
          {/* Drag Handle */}
          <div 
            className="flex justify-center items-center mb-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded transition-colors py-1"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Toggle Button */}
          <div className="flex justify-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-full"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>

          {isExpanded && (
            <div className="space-y-2">
              {/* Screenshot */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleScreenshot}
                    className="w-full"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">📸 Capturar Pantalla</div>
                  <p className="text-xs">
                    Toma una captura de tu pantalla actual.
                    Se guarda en: ~/Documentos/CUBE_Screenshots
                  </p>
                  <p className="text-xs mt-1 opacity-70">Atajo: Ctrl+Shift+S</p>
                </TooltipContent>
              </Tooltip>

              {/* Screen Recording */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isRecording ? "destructive" : "ghost"}
                    size="icon"
                    onClick={handleRecording}
                    className="w-full"
                  >
                    <Video className={cn(
                      "h-5 w-5",
                      isRecording && "animate-pulse"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">
                    {isRecording ? '⏹️ Detener Grabación' : '🔴 Grabar Pantalla'}
                  </div>
                  <p className="text-xs">
                    {isRecording 
                      ? 'Guardando en: ~/Documentos/CUBE_Recordings'
                      : 'Graba video de tu pantalla con audio. Formatos: MP4, WebM'}
                  </p>
                  <p className="text-xs mt-1 opacity-70">Calidad: 1080p @ 30fps</p>
                </TooltipContent>
              </Tooltip>

              <div className="border-t my-2" />

              {/* Screen Share */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleScreenShare}
                    className="w-full"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">📺 Compartir Pantalla</div>
                  <p className="text-xs">
                    Comparte tu pantalla en tiempo real con tu equipo.
                    Conexión P2P encriptada de extremo a extremo.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Latencia: ~100ms</p>
                </TooltipContent>
              </Tooltip>

              {/* Remote Desktop */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoteDesktop}
                    className="w-full"
                  >
                    <Monitor className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">🖥️ Escritorio Remoto</div>
                  <p className="text-xs">
                    Control remoto completo de otra computadora.
                    Ideal para soporte técnico y colaboración.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Mejor que: AnyViewer, TeamViewer</p>
                </TooltipContent>
              </Tooltip>

              <div className="border-t my-2" />

              {/* Color Picker */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleColorPicker}
                    className="w-full"
                  >
                    <Pipette className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">🎨 Selector de Color</div>
                  <p className="text-xs">
                    Captura el color de cualquier píxel en pantalla.
                    Copia HEX, RGB, HSL automáticamente al portapapeles.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Atajo: Ctrl+Shift+C</p>
                </TooltipContent>
              </Tooltip>

              {/* Element Inspector */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleInspector}
                    className="w-full"
                  >
                    <MousePointer2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">🔍 Inspector de Elementos</div>
                  <p className="text-xs">
                    Inspecciona HTML, CSS y JavaScript de páginas web.
                    Encuentra selectores para automatización.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Atajo: F12 o Ctrl+Shift+I</p>
                </TooltipContent>
              </Tooltip>

              {/* Ruler */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRuler}
                    className="w-full"
                  >
                    <Ruler className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">📏 Herramienta de Medición</div>
                  <p className="text-xs">
                    Mide distancias, tamaños y posiciones en pantalla.
                    Unidades: píxeles, porcentajes, rem, em.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Clic + Arrastrar para medir</p>
                </TooltipContent>
              </Tooltip>

              <div className="border-t my-2" />

              {/* File Detection */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFileDetection}
                    className="w-full"
                  >
                    <FileSearch className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">📂 Detección de Archivos</div>
                  <p className="text-xs">
                    Encuentra automáticamente todos los campos de carga de archivos,
                    formularios, y elementos de upload en la página actual.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Detecta: input[type=file], drag&drop zones</p>
                </TooltipContent>
              </Tooltip>

              {/* Parser */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleParser}
                    className="w-full"
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">📄 Parser de Estructura</div>
                  <p className="text-xs">
                    Analiza y extrae la estructura completa de la página:
                    tablas, listas, formularios, datos estructurados.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Exporta: JSON, CSV, XML</p>
                </TooltipContent>
              </Tooltip>

              {/* Autofill */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAutofill}
                    className="w-full"
                  >
                    <FormInput className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">⚡ Autocompletado Inteligente</div>
                  <p className="text-xs">
                    Rellena formularios automáticamente con datos guardados.
                    Detecta campos por nombre, tipo, placeholder, y contexto.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Soporta: 50+ tipos de campos</p>
                </TooltipContent>
              </Tooltip>

              <div className="border-t my-2" />

              {/* Lendingpad */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLendingpad}
                    className="w-full"
                  >
                    <Home className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">🏠 Integración Lendingpad</div>
                  <p className="text-xs">
                    Acceso directo a herramientas de Lendingpad.
                    Sincroniza datos de préstamos y gestiona documentos.
                  </p>
                  <p className="text-xs mt-1 opacity-70">API conectada y lista</p>
                </TooltipContent>
              </Tooltip>

              {/* Quick Action */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleQuickAction}
                    className="w-full"
                  >
                    <Zap className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">⚡ Acciones Rápidas</div>
                  <p className="text-xs">
                    Ejecuta tus macros y automatizaciones favoritas con un clic.
                    Click, Fill, Navigate, Extract, Submit.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Configura en: Automation → Macros</p>
                </TooltipContent>
              </Tooltip>

              {/* Macros */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMacros}
                    className="w-full"
                  >
                    <Workflow className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">🎬 Gestor de Macros</div>
                  <p className="text-xs">
                    Graba, edita y ejecuta secuencias de acciones.
                    Soporta: clicks, teclado, esperas, condiciones, loops.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Grabación con IA incorporada</p>
                </TooltipContent>
              </Tooltip>

              {/* Downloader */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownloader}
                    className="w-full"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">📥 Gestor de Descargas</div>
                  <p className="text-xs">
                    Descarga recursos de la página: imágenes, videos, PDFs, CSS, JS.
                    Soporta descargas en lote y scraping avanzado.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Ubicación: ~/Descargas/CUBE</p>
                </TooltipContent>
              </Tooltip>

              <div className="border-t my-2" />

              {/* Layers */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLayers}
                    className="w-full"
                  >
                    <Layers className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="font-semibold mb-1">🗂️ Panel de Capas</div>
                  <p className="text-xs">
                    Visualiza y organiza todos los elementos de tu workflow en capas.
                    Drag & drop, agrupación, y gestión visual completa.
                  </p>
                  <p className="text-xs mt-1 opacity-70">Abre en: Automation → Layers</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};
