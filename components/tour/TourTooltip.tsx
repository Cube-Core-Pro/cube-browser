'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Play,
  Pause,
  Lightbulb,
  Trophy,
  Zap,
  HelpCircle,
  Settings,
  Check,
  Star,
  Target,
  Info,
} from 'lucide-react';
import { useTour, useTourStep } from './TourContext';
import './Tour.css';

/**
 * TourTooltip - The main tooltip component that displays tour step content
 */
export const TourTooltip: React.FC = () => {
  const {
    isActive,
    isPaused,
    settings,
    nextStep,
    prevStep,
    skipStep,
    endTour,
    pauseTour,
    resumeTour,
  } = useTour();
  
  const {
    currentStep,
    currentSection,
    globalStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
  } = useTourStep();

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Calculate tooltip position based on target element
  const calculatePosition = useCallback(() => {
    if (!currentStep?.targetSelector) {
      // Center position for steps without target
      setPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200,
      });
      return;
    }

    const targetElement = document.querySelector(currentStep.targetSelector);
    const tooltip = tooltipRef.current;
    
    if (!targetElement || !tooltip) {
      setPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200,
      });
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 16;
    const arrowSize = 12;

    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case 'top':
      case 'top-start':
      case 'top-end':
        top = targetRect.top - tooltipRect.height - padding - arrowSize;
        if (currentStep.position === 'top-start') {
          left = targetRect.left;
        } else if (currentStep.position === 'top-end') {
          left = targetRect.right - tooltipRect.width;
        } else {
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        }
        break;

      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        top = targetRect.bottom + padding + arrowSize;
        if (currentStep.position === 'bottom-start') {
          left = targetRect.left;
        } else if (currentStep.position === 'bottom-end') {
          left = targetRect.right - tooltipRect.width;
        } else {
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        }
        break;

      case 'left':
      case 'left-start':
      case 'left-end':
        left = targetRect.left - tooltipRect.width - padding - arrowSize;
        if (currentStep.position === 'left-start') {
          top = targetRect.top;
        } else if (currentStep.position === 'left-end') {
          top = targetRect.bottom - tooltipRect.height;
        } else {
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        }
        break;

      case 'right':
      case 'right-start':
      case 'right-end':
        left = targetRect.right + padding + arrowSize;
        if (currentStep.position === 'right-start') {
          top = targetRect.top;
        } else if (currentStep.position === 'right-end') {
          top = targetRect.bottom - tooltipRect.height;
        } else {
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        }
        break;

      case 'center':
      default:
        top = window.innerHeight / 2 - tooltipRect.height / 2;
        left = window.innerWidth / 2 - tooltipRect.width / 2;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

    setPosition({ top, left });
  }, [currentStep]);

  // Recalculate position when step changes or window resizes
  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Small delay to allow DOM updates
    const timer = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, currentStep.delay || 100);

    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      setIsVisible(false);
    };
  }, [isActive, currentStep, calculatePosition]);

  // Scroll target element into view
  useEffect(() => {
    if (!isActive || !currentStep?.targetSelector) return;

    const targetElement = document.querySelector(currentStep.targetSelector);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [isActive, currentStep]);

  // Apply tooltip positioning
  useEffect(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.top = `${position.top}px`;
      tooltipRef.current.style.left = `${position.left}px`;
    }
  }, [position]);

  if (!isActive || !currentStep) return null;

  const progressPercent = ((globalStepIndex + 1) / totalSteps) * 100;

  return createPortal(
    <div
      ref={tooltipRef}
      className={`tour-tooltip ${isVisible ? 'visible' : ''} ${isPaused ? 'paused' : ''}`}
      data-position={currentStep.position}
    >
      {/* Header */}
      <div className="tour-tooltip-header">
        <div className="tour-tooltip-category">
          <span className={`category-badge ${currentStep.category}`}>
            {getCategoryIcon(currentStep.category)}
            {getCategoryLabel(currentStep.category)}
          </span>
          {currentStep.isOptional && (
            <span className="optional-badge">Opcional</span>
          )}
        </div>
        <div className="tour-tooltip-controls">
          <button
            className="tour-control-btn"
            onClick={isPaused ? resumeTour : pauseTour}
            title={isPaused ? 'Continuar' : 'Pausar'}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            className="tour-control-btn close"
            onClick={endTour}
            title="Cerrar tour"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="tour-progress-bar">
        <div
          className="tour-progress-fill"
          ref={(el) => { if (el) el.style.width = `${progressPercent}%`; }}
        />
      </div>

      {/* Content */}
      <div className="tour-tooltip-content">
        <h3 className="tour-tooltip-title">{currentStep.title}</h3>
        <p className="tour-tooltip-description">{currentStep.content}</p>

        {/* Image or Video */}
        {currentStep.imageUrl && (
          <div className="tour-tooltip-media">
            <Image 
              src={currentStep.imageUrl} 
              alt={currentStep.title} 
              width={400}
              height={225}
              className="object-cover"
            />
          </div>
        )}

        {/* Tips section */}
        {settings.showTips && currentStep.tips && currentStep.tips.length > 0 && (
          <div className="tour-tooltip-tips">
            <button
              className="tips-toggle"
              onClick={() => setShowTips(!showTips)}
            >
              <Lightbulb size={14} />
              Tips útiles ({currentStep.tips.length})
              <ChevronRight size={14} className={showTips ? 'rotated' : ''} />
            </button>
            {showTips && (
              <ul className="tips-list">
                {currentStep.tips.map((tip, index) => (
                  <li key={index}>
                    <Check size={12} />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Competitive advantage */}
        {settings.showCompetitiveAdvantages && currentStep.competitiveAdvantage && (
          <div className="tour-tooltip-advantage">
            <Trophy size={14} />
            <span><strong>Ventaja CUBE:</strong> {currentStep.competitiveAdvantage}</span>
          </div>
        )}

        {/* Action button */}
        {currentStep.action && currentStep.action.type !== 'none' && (
          <button
            className="tour-action-btn"
            onClick={currentStep.action.handler}
          >
            <Zap size={14} />
            {currentStep.action.label || 'Probar ahora'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="tour-tooltip-footer">
        <div className="tour-step-info">
          <span className="step-counter">
            Paso {globalStepIndex + 1} de {totalSteps}
          </span>
          {currentSection && (
            <span className="section-name">
              • {currentSection.title}
            </span>
          )}
        </div>
        <div className="tour-navigation">
          <button
            className="tour-nav-btn prev"
            onClick={prevStep}
            disabled={isFirstStep}
            title="Paso anterior (←)"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          {currentStep.isOptional && (
            <button
              className="tour-nav-btn skip"
              onClick={skipStep}
              title="Omitir paso"
            >
              <SkipForward size={16} />
              Omitir
            </button>
          )}
          <button
            className="tour-nav-btn next"
            onClick={nextStep}
            title={isLastStep ? 'Finalizar tour' : 'Siguiente paso (→)'}
          >
            {isLastStep ? (
              <>
                Finalizar
                <Trophy size={16} />
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Keyboard hint */}
      {settings.enableKeyboardNavigation && (
        <div className="tour-keyboard-hint">
          <span>← → para navegar</span>
          <span>ESC para cerrar</span>
          <span>ESPACIO para pausar</span>
        </div>
      )}
    </div>,
    document.body
  );
};

/**
 * TourOverlay - Highlights the target element with a spotlight effect
 */
export const TourOverlay: React.FC = () => {
  const { isActive, settings } = useTour();
  const { currentStep } = useTourStep();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive || !currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(currentStep.targetSelector!);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    // Initial update with delay
    const timer = setTimeout(updateRect, 50);

    // Update on scroll and resize
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [isActive, currentStep]);

  if (!isActive) return null;

  const highlightType = currentStep?.highlightType || 'spotlight';
  const padding = 8;

  return createPortal(
    <div className={`tour-overlay ${highlightType} ${settings.highlightIntensity}`}>
      {targetRect && highlightType !== 'none' && (
        <>
          {/* Spotlight cutout */}
          <svg className="tour-overlay-svg" width="100%" height="100%">
            <defs>
              <mask id="tour-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - padding}
                  y={targetRect.top - padding}
                  width={targetRect.width + padding * 2}
                  height={targetRect.height + padding * 2}
                  rx="8"
                  ry="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.75)"
              mask="url(#tour-spotlight-mask)"
            />
          </svg>

          {/* Highlight border/glow */}
          <div
            className={`tour-highlight ${highlightType}`}
            ref={(el) => {
              if (el) {
                el.style.top = `${targetRect.top - padding}px`;
                el.style.left = `${targetRect.left - padding}px`;
                el.style.width = `${targetRect.width + padding * 2}px`;
                el.style.height = `${targetRect.height + padding * 2}px`;
              }
            }}
          />
        </>
      )}
    </div>,
    document.body
  );
};

// Helper functions
function getCategoryIcon(category: string) {
  switch (category) {
    case 'welcome': return <Star size={12} />;
    case 'settings': return <Settings size={12} />;
    case 'contacts': return <Target size={12} />;
    case 'campaigns': return <Zap size={12} />;
    case 'analytics': return <Trophy size={12} />;
    case 'advanced': return <Info size={12} />;
    case 'tips': return <Lightbulb size={12} />;
    default: return <HelpCircle size={12} />;
  }
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    welcome: 'Bienvenida',
    settings: 'Configuración',
    contacts: 'Contactos',
    campaigns: 'Campañas',
    analytics: 'Analíticas',
    advanced: 'Avanzado',
    tips: 'Consejos',
  };
  return labels[category] || category;
}

export default TourTooltip;
