'use client';

import React, { useState, useEffect } from 'react';
import { automationService } from '../../lib/services/automationService';
import type { Macro } from '../../lib/services/automationService';

export const MacroRecorder: React.FC = () => {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [showNewMacro, setShowNewMacro] = useState(false);
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroDescription, setNewMacroDescription] = useState('');
  const [selectedMacro, setSelectedMacro] = useState<Macro | null>(null);
  const [executing, setExecuting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMacros();
  }, []);

  const loadMacros = async () => {
    try {
      const macroList = await automationService.getMacros();
      setMacros(macroList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load macros');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    if (!newMacroName.trim()) {
      setError('Please enter a macro name first');
      return;
    }

    try {
      const recordingId = await automationService.recordMacro(newMacroName);
      setRecording(true);
      setRecordingId(recordingId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    if (!recordingId) return;
    
    try {
      await automationService.stopMacroRecording(newMacroName, newMacroDescription);
      setRecording(false);
      setRecordingId(null);
      setNewMacroName('');
      setNewMacroDescription('');
      setShowNewMacro(false);
      await loadMacros();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  };

  const handleExecuteMacro = async (macroId: string) => {
    setExecuting(true);
    setError(null);
    
    try {
      await automationService.executeMacro(macroId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute macro');
    } finally {
      setExecuting(false);
    }
  };

  const handleDeleteMacro = async (macroId: string) => {
    if (!confirm('Are you sure you want to delete this macro?')) return;

    try {
      await automationService.deleteMacro(macroId);
      if (selectedMacro?.id === macroId) {
        setSelectedMacro(null);
      }
      await loadMacros();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete macro');
    }
  };

  const getStepIcon = (action: string) => {
    switch (action) {
      case 'click': return '🖱️';
      case 'type': return '⌨️';
      case 'navigate': return '🔗';
      case 'wait': return '⏱️';
      case 'scroll': return '📜';
      case 'select': return '☑️';
      default: return '•';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading macros...</div>;
  }

  return (
    <div className="h-full bg-background flex">
      {/* Macro List */}
      <div className="w-80 border-r border-border overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">Macros</h2>
          
          {recording ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-700 dark:text-red-400 font-medium">Recording...</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Perform actions in the browser to record them
              </p>
              <button
                onClick={handleStopRecording}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Stop Recording
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewMacro(!showNewMacro)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + New Macro
            </button>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {showNewMacro && !recording && (
          <div className="p-4 bg-muted border-b border-border">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Macro Name
                </label>
                <input
                  type="text"
                  value={newMacroName}
                  onChange={(e) => setNewMacroName(e.target.value)}
                  placeholder="e.g., Login Flow"
                  className="w-full px-3 py-2 text-sm border border-input rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newMacroDescription}
                  onChange={(e) => setNewMacroDescription(e.target.value)}
                  placeholder="Describe what this macro does"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-input rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleStartRecording}
                  disabled={!newMacroName.trim()}
                  className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                >
                  Start Recording
                </button>
                <button
                  onClick={() => setShowNewMacro(false)}
                  className="px-3 py-2 bg-muted text-muted-foreground text-sm rounded hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 space-y-2">
          {macros.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No macros yet. Create your first macro to automate repetitive tasks!
            </div>
          ) : (
            macros.map((macro) => (
              <div
                key={macro.id}
                onClick={() => setSelectedMacro(macro)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedMacro?.id === macro.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500'
                    : 'bg-muted hover:bg-accent'
                }`}
              >
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {macro.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {macro.steps.length} step(s)
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Macro Detail */}
      <div className="flex-1 overflow-y-auto">
        {selectedMacro ? (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">
                  {selectedMacro.name}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExecuteMacro(selectedMacro.id)}
                    disabled={executing}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                  >
                    {executing ? 'Executing...' : 'Execute'}
                  </button>
                  <button
                    onClick={() => handleDeleteMacro(selectedMacro.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {selectedMacro.description && (
                <p className="text-muted-foreground mb-2">
                  {selectedMacro.description}
                </p>
              )}

              <p className="text-sm text-muted-foreground">
                Created: {new Date(selectedMacro.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Steps ({selectedMacro.steps.length})
              </h3>

              {selectedMacro.steps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No steps recorded yet
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMacro.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{getStepIcon(step.action)}</span>
                            <span className="font-semibold text-foreground capitalize">
                              {step.action}
                            </span>
                          </div>
                          
                          {step.target && (
                            <p className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium">Target:</span> {step.target}
                            </p>
                          )}
                          
                          {step.value && (
                            <p className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium">Value:</span> {step.value}
                            </p>
                          )}
                          
                          {step.timestamp && (
                            <p className="text-sm text-muted-foreground">
                              Timestamp: {formatDuration(step.timestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a macro to view details
          </div>
        )}
      </div>
    </div>
  );
};
