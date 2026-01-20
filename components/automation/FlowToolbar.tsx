/**
 * Flow Toolbar - Barra de herramientas superior
 */

import React from 'react';
import './FlowToolbar.css';
import { 
  Palette,
  Circle,
  Square,
  Play,
  Save,
  Bot,
  BarChart3,
  Settings,
  ChevronRight
} from 'lucide-react';

interface FlowToolbarProps {
  flowName: string;
  onFlowNameChange: (name: string) => void;
  onRun: () => void;
  onSave: () => void;
  onToggleRecorder: () => void;
  isRecording: boolean;
  onTogglePalette: () => void;
  onToggleExecution: () => void;
  onToggleAI?: () => void;
}

export const FlowToolbar: React.FC<FlowToolbarProps> = ({
  flowName,
  onFlowNameChange,
  onRun,
  onSave,
  onToggleRecorder,
  isRecording,
  onTogglePalette,
  onToggleExecution,
  onToggleAI,
}) => {
  return (
    <header className="flow-toolbar">
      {/* Left: Breadcrumbs + Flow Name */}
      <div className="toolbar-left">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <span className="breadcrumb-item">Automation</span>
          <ChevronRight size={16} className="breadcrumb-separator" />
          <span className="breadcrumb-item active">Flow Builder</span>
        </nav>
        
        <div className="flow-name-input">
          <input
            type="text"
            value={flowName}
            onChange={(e) => onFlowNameChange(e.target.value)}
            placeholder="Untitled Flow"
            aria-label="Flow name"
          />
        </div>
      </div>

      {/* Center: Primary Actions */}
      <div className="toolbar-center">
        <button 
          className="toolbar-btn btn-ghost"
          onClick={onTogglePalette}
          title="Toggle node palette (N)"
        >
          <Palette size={16} />
          <span className="btn-label">Nodes</span>
        </button>

        <div className="toolbar-divider" />

        <button 
          className={`toolbar-btn ${isRecording ? 'btn-recording' : 'btn-ghost'}`}
          onClick={onToggleRecorder}
          title={isRecording ? 'Stop recording (Shift+R)' : 'Start recording (Shift+R)'}
        >
          {isRecording ? <Square size={16} /> : <Circle size={16} />}
          <span className="btn-label">{isRecording ? 'Stop' : 'Record'}</span>
        </button>

        {onToggleAI && (
          <button 
            className="toolbar-btn btn-ghost" 
            onClick={onToggleAI} 
            title="AI Assistant (Cmd+K)"
          >
            <Bot size={16} />
            <span className="btn-label">AI</span>
          </button>
        )}

        <div className="toolbar-divider" />

        <button 
          className="toolbar-btn btn-primary" 
          onClick={onRun} 
          title="Run flow (Cmd+Enter)"
        >
          <Play size={16} />
          <span className="btn-label">Run</span>
        </button>

        <button 
          className="toolbar-btn btn-secondary" 
          onClick={onSave} 
          title="Save flow (Cmd+S)"
        >
          <Save size={16} />
          <span className="btn-label">Save</span>
        </button>
      </div>

      {/* Right: View Toggles + Settings */}
      <div className="toolbar-right">
        <button 
          className="toolbar-btn btn-icon" 
          onClick={onToggleExecution} 
          title="Execution logs"
        >
          <BarChart3 size={18} />
        </button>

        <button 
          className="toolbar-btn btn-icon" 
          title="Flow settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
