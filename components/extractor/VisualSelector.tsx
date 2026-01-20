/**
 * Visual Selector - Interactive element picker overlay
 */

import React, { useEffect, useState } from 'react';
import { VisualSelection } from '@/types/extractor';
import './VisualSelector.css';

interface VisualSelectorProps {
  onSelect: (selection: VisualSelection) => void;
  onClose: () => void;
}

export const VisualSelector: React.FC<VisualSelectorProps> = ({ onSelect, onClose }) => {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const element = e.target as HTMLElement;
      if (element && element !== hoveredElement) {
        setHoveredElement(element);
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const element = e.target as HTMLElement;
      setSelectedElement(element);

      // Generate selector
      const selector = generateCSSSelector(element);
      const xpath = generateXPath(element);

      const selection: VisualSelection = {
        element,
        selector,
        xpath,
        text: element.textContent || '',
        attributes: getElementAttributes(element),
        boundingBox: element.getBoundingClientRect(),
      };

      onSelect(selection);
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hoveredElement, onSelect, onClose]);

  // Generate CSS selector for element
  const generateCSSSelector = (element: HTMLElement): string => {
    if (element.id) {
      return `#${element.id}`;
    }

    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.tagName) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c);
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(' > ');
  };

  // Generate XPath for element
  const generateXPath = (element: HTMLElement): string => {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.tagName) {
      let index = 1;
      let sibling = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }

      const tagName = current.tagName.toLowerCase();
      path.unshift(`${tagName}[${index}]`);
      current = current.parentElement;
    }

    return '/' + path.join('/');
  };

  // Get all attributes of element
  const getElementAttributes = (element: HTMLElement): Record<string, string> => {
    const attrs: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  };

  return (
    <div className="visual-selector-overlay" data-testid="visual-selector-overlay">
      <div className="selector-toolbar" data-testid="visual-selector-toolbar">
        <div className="toolbar-info">
          <span>🎯 Click an element to select it</span>
          {hoveredElement && (
            <span className="element-info" data-testid="hovered-element-info">
              {hoveredElement.tagName.toLowerCase()}
              {hoveredElement.className && `.${hoveredElement.className.split(' ')[0]}`}
            </span>
          )}
        </div>
        <button 
          className="btn-close" 
          onClick={onClose}
          data-testid="visual-selector-close-button"
          aria-label="Close visual selector"
        >
          ✕ Close (ESC)
        </button>
      </div>

      {/* Highlight overlay */}
      {hoveredElement && (
        <div
          className="element-highlight"
          data-testid="element-highlight"
          style={{
            '--highlight-top': `${hoveredElement.getBoundingClientRect().top}px`,
            '--highlight-left': `${hoveredElement.getBoundingClientRect().left}px`,
            '--highlight-width': `${hoveredElement.getBoundingClientRect().width}px`,
            '--highlight-height': `${hoveredElement.getBoundingClientRect().height}px`,
          } as React.CSSProperties}
        />
      )}
    </div>
  );
};
