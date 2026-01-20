/**
 * Tour Launcher Component
 * Botón flotante para iniciar el tour - Enterprise-grade with smart positioning
 * Uses the same positioning system as AIFloatingChatComplete for consistency
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTour, useTourProgress } from './TourContext';
import { TourSection } from './types';

/**
 * Feature item for welcome modal
 */
export interface TourFeature {
  icon: string;
  label: string;
}

/**
 * Next step item for completion modal
 */
export interface TourNextStep {
  text: string;
}

interface TourLauncherProps {
  variant?: 'button' | 'fab' | 'minimal';
  showProgress?: boolean;
  /** Module title for menu header */
  moduleTitle?: string;
}

export const TourLauncher: React.FC<TourLauncherProps> = ({
  variant = 'fab',
  showProgress = true,
  moduleTitle
}) => {
  const { startTour, isActive, progress, sections: contextSections, tourStats: contextStats } = useTour();
  const tourProgress = useTourProgress();
  const [showMenu, setShowMenu] = useState(false);
  
  // Position state - uses absolute left/top like the chat (not right/bottom offsets)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 });
  const dragFrameRef = useRef<number | null>(null);

  // Use sections from context
  const allTourSections = contextSections || [];
  const tourStats = contextStats || { totalSections: 0, totalSteps: 0, totalEstimatedTime: 0 };

  // Initialize position on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Default position: bottom-right corner
    const defaultPos = { 
      x: window.innerWidth - 64, 
      y: window.innerHeight - 64 
    };
    
    // Try to load saved position
    try {
      const saved = localStorage.getItem('cube-tour-fab-position-v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Validate position is within bounds
          const maxX = window.innerWidth - 40;
          const maxY = window.innerHeight - 40;
          setPosition({
            x: Math.max(0, Math.min(parsed.x, maxX)),
            y: Math.max(0, Math.min(parsed.y, maxY))
          });
          return;
        }
      }
    } catch {
      // Ignore errors
    }
    
    setPosition(defaultPos);
  }, []);

  // Save position when it changes
  useEffect(() => {
    if (position && !isDragging) {
      try {
        localStorage.setItem('cube-tour-fab-position-v2', JSON.stringify(position));
      } catch {
        // Ignore errors
      }
    }
  }, [position, isDragging]);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || !position) return;
    e.preventDefault();
    
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elemX: position.x,
      elemY: position.y
    };
    setIsDragging(true);
    document.body.style.userSelect = 'none';
  }, [position]);

  // Handle drag move with requestAnimationFrame for smooth performance
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragFrameRef.current) {
        cancelAnimationFrame(dragFrameRef.current);
      }
      
      dragFrameRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - dragStartRef.current.mouseX;
        const deltaY = e.clientY - dragStartRef.current.mouseY;
        
        const newX = dragStartRef.current.elemX + deltaX;
        const newY = dragStartRef.current.elemY + deltaY;
        
        const maxX = window.innerWidth - 40;
        const maxY = window.innerHeight - 40;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      });
    };

    const handleMouseUp = () => {
      if (dragFrameRef.current) {
        cancelAnimationFrame(dragFrameRef.current);
      }
      setIsDragging(false);
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (dragFrameRef.current) {
        cancelAnimationFrame(dragFrameRef.current);
      }
    };
  }, [isDragging]);

  // Calculate menu position based on FAB location
  const getMenuStyle = useCallback((): React.CSSProperties => {
    if (!position) return {};
    
    const fabSize = 40;
    const menuWidth = 320;
    const menuHeight = 420; // Approximate
    const padding = 12;
    
    // FAB center position
    const fabCenterX = position.x + fabSize / 2;
    const fabCenterY = position.y + fabSize / 2;
    
    // Calculate available space in each direction
    const spaceAbove = position.y;
    const spaceBelow = window.innerHeight - position.y - fabSize;
    const spaceLeft = position.x;
    const spaceRight = window.innerWidth - position.x - fabSize;
    
    let menuX: number;
    let menuY: number;
    
    // Horizontal positioning
    if (spaceRight >= menuWidth + padding) {
      // Open to the right
      menuX = position.x + fabSize + padding;
    } else if (spaceLeft >= menuWidth + padding) {
      // Open to the left
      menuX = position.x - menuWidth - padding;
    } else {
      // Center horizontally, clamp to screen
      menuX = Math.max(padding, Math.min(window.innerWidth - menuWidth - padding, fabCenterX - menuWidth / 2));
    }
    
    // Vertical positioning
    if (spaceAbove >= menuHeight + padding) {
      // Open above
      menuY = position.y - menuHeight - padding;
    } else if (spaceBelow >= menuHeight + padding) {
      // Open below
      menuY = position.y + fabSize + padding;
    } else {
      // Center vertically, clamp to screen
      menuY = Math.max(padding, Math.min(window.innerHeight - menuHeight - padding, fabCenterY - menuHeight / 2));
    }
    
    // Return CSS custom properties to avoid inline style warnings
    return {
      '--menu-pos-x': `${menuX}px`,
      '--menu-pos-y': `${menuY}px`,
      '--menu-width': `${menuWidth}px`,
      '--menu-max-height': `${Math.min(menuHeight, window.innerHeight - 2 * padding)}px`
    } as React.CSSProperties;
  }, [position]);

  if (isActive) return null;
  if (!position) return null; // Wait for position to be initialized

  const handleStartFull = () => {
    startTour();
    setShowMenu(false);
  };

  const handleStartSection = (sectionId: string) => {
    startTour(sectionId);
    setShowMenu(false);
  };

  const progressPercent = tourProgress.progressPercentage;

  if (variant === 'minimal') {
    return (
      <button
        className="tour-launcher-minimal"
        onClick={handleStartFull}
        title="Iniciar Tour"
      >
        <span className="tour-launcher-icon">❓</span>
        {showProgress && progressPercent > 0 && progressPercent < 100 && (
          <span className="tour-launcher-badge">{progressPercent}%</span>
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        className="tour-launcher-button"
        onClick={handleStartFull}
      >
        <span className="tour-launcher-icon">🎓</span>
        <span className="tour-launcher-text">
          {progressPercent === 0 ? 'Iniciar Tour' : 
           progressPercent === 100 ? 'Repetir Tour' : 
           `Continuar Tour (${progressPercent}%)`}
        </span>
      </button>
    );
  }

  // FAB variant (default) - Enterprise-grade with smart menu positioning
  return (
    <>
      {/* FAB Button - Fixed position using CSS custom properties for draggable positioning */}
      {/* eslint-disable-next-line react/forbid-component-props */}
      <button
        ref={fabRef}
        className={`tour-launcher-fab-v2 ${isDragging ? 'dragging' : ''}`}
        style={{
          '--fab-pos-x': `${position.x}px`,
          '--fab-pos-y': `${position.y}px`,
        } as React.CSSProperties}
        onMouseDown={handleMouseDown}
        onClick={() => {
          if (!isDragging) {
            setShowMenu(!showMenu);
          }
        }}
        aria-label="Tour de ayuda"
        title="Arrastra para mover · Click para menú"
      >
        <span className="tour-launcher-icon">🎓</span>
        {showProgress && progressPercent > 0 && progressPercent < 100 && (
          <div className="tour-launcher-progress">
            <svg className="tour-launcher-progress-ring" viewBox="0 0 36 36">
              <path
                className="tour-launcher-progress-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="tour-launcher-progress-fill"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${progressPercent}, 100`}
              />
            </svg>
          </div>
        )}
      </button>

      {/* Menu - Fixed position, calculated dynamically for smart positioning */}
      {showMenu && (
        <>
          <div 
            className="tour-launcher-backdrop-v2"
            onClick={() => setShowMenu(false)}
          />
          {/* eslint-disable-next-line react/forbid-component-props */}
          <div 
            ref={menuRef}
            className="tour-launcher-menu-v2"
            style={getMenuStyle()}
          >
            <div className="tour-launcher-menu-header">
              <h3>{moduleTitle || 'Tour Interactivo'}</h3>
              <p>~{tourStats.totalEstimatedTime} min · {tourStats.totalSteps} pasos</p>
            </div>

            <button
              className="tour-launcher-menu-item tour-launcher-menu-main"
              onClick={handleStartFull}
            >
              <span className="tour-launcher-menu-icon">▶️</span>
              <div className="tour-launcher-menu-content">
                <span className="tour-launcher-menu-title">
                  {progressPercent === 0 ? 'Comenzar Tour Completo' :
                   progressPercent === 100 ? 'Repetir Tour' :
                   'Continuar donde lo dejaste'}
                </span>
                {progressPercent > 0 && progressPercent < 100 && (
                  <span className="tour-launcher-menu-subtitle">
                    {progressPercent}% completado
                  </span>
                )}
              </div>
            </button>

            <div className="tour-launcher-menu-divider">
              <span>O elige una sección</span>
            </div>

            <div className="tour-launcher-sections">
              {allTourSections.map((section: TourSection) => {
                const sectionComplete = section.steps.every(
                  step => progress.completedSteps.includes(step.id)
                );
                const sectionProgressCount = section.steps.filter(
                  step => progress.completedSteps.includes(step.id)
                ).length;

                return (
                  <button
                    key={section.id}
                    className={`tour-launcher-menu-item ${sectionComplete ? 'completed' : ''}`}
                    onClick={() => handleStartSection(section.id)}
                  >
                    <span className="tour-launcher-menu-icon">{section.icon}</span>
                    <div className="tour-launcher-menu-content">
                      <span className="tour-launcher-menu-title">{section.title}</span>
                      <span className="tour-launcher-menu-subtitle">
                        {sectionComplete ? '✓ Completado' : 
                         `${section.steps.length} pasos · ${section.estimatedTime} min`}
                      </span>
                    </div>
                    {!sectionComplete && sectionProgressCount > 0 && (
                      <span className="tour-launcher-section-progress">
                        {sectionProgressCount}/{section.steps.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="tour-launcher-menu-footer">
              <button
                className="tour-launcher-menu-reset"
                onClick={() => {
                  if (confirm('¿Reiniciar todo el progreso del tour?')) {
                    localStorage.removeItem('cube-tour-progress');
                    window.location.reload();
                  }
                }}
              >
                Reiniciar Progreso
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

/**
 * Tour Welcome Modal - Now fully dynamic with customizable content
 */
interface TourWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  onSkip: () => void;
  /** Module title (e.g., "Automation Studio", "Email Marketing") */
  title?: string;
  /** Subtitle description */
  subtitle?: string;
  /** Feature list to display */
  features?: TourFeature[];
  /** Tour statistics (overrides context stats) */
  stats?: {
    totalSections: number;
    totalSteps: number;
    totalEstimatedTime: number;
  };
}

export const TourWelcomeModal: React.FC<TourWelcomeModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  onSkip,
  title,
  subtitle,
  features,
  stats
}) => {
  const { tourStats: contextStats } = useTour();
  
  // Use provided stats or fall back to context
  const tourStats = stats || contextStats || { totalSections: 6, totalSteps: 35, totalEstimatedTime: 35 };
  
  // Default features if not provided
  const defaultFeatures: TourFeature[] = [
    { icon: '⚙️', label: 'Configuración paso a paso' },
    { icon: '🔧', label: 'Herramientas avanzadas' },
    { icon: '📊', label: 'Análisis y métricas' },
    { icon: '🚀', label: 'Tips profesionales' }
  ];
  
  const displayFeatures = features || defaultFeatures;
  const displayTitle = title || '¡Bienvenido al Tour!';
  const displaySubtitle = subtitle || `Domina todas las herramientas en solo ~${tourStats.totalEstimatedTime} minutos`;

  if (!isOpen) return null;

  return (
    <div className="tour-modal-overlay" onClick={onClose}>
      <div className="tour-modal tour-welcome-modal" onClick={e => e.stopPropagation()}>
        <button className="tour-modal-close" onClick={onClose}>×</button>
        
        <div className="tour-welcome-icon">🎓</div>
        
        <h2 className="tour-welcome-title">
          {displayTitle}
        </h2>
        
        <p className="tour-welcome-subtitle">
          {displaySubtitle}
        </p>
        
        <div className="tour-welcome-features">
          {displayFeatures.map((feature, index) => (
            <div key={index} className="tour-welcome-feature">
              <span className="tour-welcome-feature-icon">{feature.icon}</span>
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
        
        <div className="tour-welcome-stats">
          <div className="tour-welcome-stat">
            <span className="tour-welcome-stat-value">{tourStats.totalSections}</span>
            <span className="tour-welcome-stat-label">Secciones</span>
          </div>
          <div className="tour-welcome-stat">
            <span className="tour-welcome-stat-value">{tourStats.totalSteps}</span>
            <span className="tour-welcome-stat-label">Pasos</span>
          </div>
          <div className="tour-welcome-stat">
            <span className="tour-welcome-stat-value">~{tourStats.totalEstimatedTime}</span>
            <span className="tour-welcome-stat-label">Minutos</span>
          </div>
        </div>
        
        <div className="tour-welcome-actions">
          <button 
            className="tour-welcome-btn tour-welcome-btn-primary"
            onClick={onStartTour}
          >
            ¡Comenzar Tour! 🚀
          </button>
          <button 
            className="tour-welcome-btn tour-welcome-btn-secondary"
            onClick={onSkip}
          >
            Lo haré después
          </button>
        </div>
        
        <p className="tour-welcome-tip">
          💡 Tip: Puedes pausar el tour en cualquier momento y continuar después
        </p>
      </div>
    </div>
  );
};

/**
 * Tour Completion Modal - Now fully dynamic with customizable content
 */
interface TourCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  /** Title to show on completion */
  title?: string;
  /** Subtitle/congratulations message */
  subtitle?: string;
  /** Badge/role name the user earned */
  badgeName?: string;
  /** Next steps recommendations */
  nextSteps?: TourNextStep[];
  /** Primary action button text */
  primaryActionText?: string;
}

export const TourCompletionModal: React.FC<TourCompletionModalProps> = ({
  isOpen,
  onClose,
  onRestart,
  title,
  subtitle,
  badgeName,
  nextSteps,
  primaryActionText
}) => {
  const { tourStats: contextStats } = useTour();
  const tourStats = contextStats || { totalSections: 6, totalSteps: 35, totalEstimatedTime: 35 };
  
  // Default next steps
  const defaultNextSteps: TourNextStep[] = [
    { text: 'Explora las funciones principales' },
    { text: 'Crea tu primer proyecto de prueba' },
    { text: 'Revisa la documentación avanzada' },
    { text: 'Contacta soporte si tienes dudas' }
  ];
  
  const displayNextSteps = nextSteps || defaultNextSteps;
  const displayTitle = title || '¡Felicidades, Completaste el Tour!';
  const displaySubtitle = subtitle || 'Ahora eres un experto en esta herramienta';
  const displayBadge = badgeName || 'Pro User';
  const displayPrimaryAction = primaryActionText || '¡Comenzar a Trabajar!';

  if (!isOpen) return null;

  return (
    <div className="tour-modal-overlay" onClick={onClose}>
      <div className="tour-modal tour-completion-modal" onClick={e => e.stopPropagation()}>
        <button className="tour-modal-close" onClick={onClose}>×</button>
        
        <div className="tour-completion-confetti">🎉</div>
        
        <h2 className="tour-completion-title">
          {displayTitle}
        </h2>
        
        <p className="tour-completion-subtitle">
          {displaySubtitle}
        </p>
        
        <div className="tour-completion-achievements">
          <div className="tour-completion-achievement">
            <span className="tour-completion-achievement-icon">🏆</span>
            <span className="tour-completion-achievement-text">Tour Completo</span>
          </div>
          <div className="tour-completion-achievement">
            <span className="tour-completion-achievement-icon">📚</span>
            <span className="tour-completion-achievement-text">{tourStats.totalSteps} Lecciones</span>
          </div>
          <div className="tour-completion-achievement">
            <span className="tour-completion-achievement-icon">⭐</span>
            <span className="tour-completion-achievement-text">{displayBadge}</span>
          </div>
        </div>
        
        <div className="tour-completion-next-steps">
          <h3>Próximos Pasos Recomendados:</h3>
          <ol>
            {displayNextSteps.map((step, index) => (
              <li key={index}>{step.text}</li>
            ))}
          </ol>
        </div>
        
        <div className="tour-completion-actions">
          <button 
            className="tour-completion-btn tour-completion-btn-primary"
            onClick={onClose}
          >
            {displayPrimaryAction}
          </button>
          <button 
            className="tour-completion-btn tour-completion-btn-secondary"
            onClick={onRestart}
          >
            Repetir Tour
          </button>
        </div>
        
        <p className="tour-completion-support">
          ¿Tienes preguntas? Nuestro soporte está disponible 24/7 💬
        </p>
      </div>
    </div>
  );
};
