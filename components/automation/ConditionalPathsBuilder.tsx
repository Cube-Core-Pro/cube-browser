/**
 * ConditionalPathsBuilder - CUBE Elite v6
 * Constructor visual de rutas condicionales y branching para workflows
 */

import React, { useState, useCallback } from 'react';
import {
  ConditionalPath,
  ConditionOperator,
  ConditionGroup,
  PathAction,
} from '../../types/automation-advanced';
import './ConditionalPathsBuilder.css';

// ============================================================================
// INTERFACES
// ============================================================================

interface ConditionalPathsBuilderProps {
  paths?: ConditionalPath[];
  availableVariables: Array<{ name: string; type: string; sample?: string }>;
  onSave: (paths: ConditionalPath[]) => void;
  onClose: () => void;
}

interface ConditionGroupState extends Omit<ConditionGroup, 'conditions'> {
  conditions: ConditionState[];
}

interface ConditionState {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'variable';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OPERATORS: { value: ConditionOperator; label: string; types: string[] }[] = [
  { value: 'equals', label: '= Equals', types: ['string', 'number', 'boolean'] },
  { value: 'not_equals', label: '≠ Not Equals', types: ['string', 'number', 'boolean'] },
  { value: 'greater_than', label: '> Greater Than', types: ['number'] },
  { value: 'less_than', label: '< Less Than', types: ['number'] },
  { value: 'greater_or_equal', label: '≥ Greater or Equal', types: ['number'] },
  { value: 'less_or_equal', label: '≤ Less or Equal', types: ['number'] },
  { value: 'contains', label: '⊃ Contains', types: ['string', 'array'] },
  { value: 'not_contains', label: '⊅ Not Contains', types: ['string', 'array'] },
  { value: 'starts_with', label: '^ Starts With', types: ['string'] },
  { value: 'ends_with', label: '$ Ends With', types: ['string'] },
  { value: 'is_empty', label: '∅ Is Empty', types: ['string', 'array', 'object'] },
  { value: 'is_not_empty', label: '∃ Is Not Empty', types: ['string', 'array', 'object'] },
  { value: 'matches_regex', label: '⁓ Matches Regex', types: ['string'] },
  { value: 'in_array', label: '∈ In Array', types: ['string', 'number'] },
  { value: 'not_in_array', label: '∉ Not In Array', types: ['string', 'number'] },
  { value: 'is_null', label: '∅ Is Null', types: ['any'] },
  { value: 'is_not_null', label: '∃ Is Not Null', types: ['any'] },
];

const ACTION_TYPES: PathAction['type'][] = [
  'continue',
  'branch',
  'stop',
  'goto',
  'loop',
  'wait',
  'error',
];

const ACTION_ICONS: Record<PathAction['type'], string> = {
  continue: '➡️',
  branch: '🔀',
  stop: '⏹️',
  goto: '↪️',
  loop: '🔄',
  wait: '⏳',
  error: '❌',
  retry: '🔁',
  skip: '⏭️',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ConditionalPathsBuilder: React.FC<ConditionalPathsBuilderProps> = ({
  paths = [],
  availableVariables,
  onSave,
  onClose,
}) => {
  const [currentPaths, setCurrentPaths] = useState<ConditionalPath[]>(
    paths.length > 0 ? paths : [createDefaultPath()]
  );
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);
  const [testMode, setTestMode] = useState(false);
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<{ pathId: string; matched: boolean }[]>([]);

  // Helpers
  function createDefaultPath(): ConditionalPath {
    return {
      id: `path-${Date.now()}`,
      name: 'New Path',
      priority: currentPaths.length + 1,
      conditionGroups: [
        {
          id: `group-${Date.now()}`,
          logic: 'and',
          conditions: [],
        },
      ],
      action: {
        type: 'continue',
        targetNodeId: '',
      },
      enabled: true,
    };
  }

  function createDefaultCondition(): ConditionState {
    return {
      id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      field: availableVariables[0]?.name || '',
      operator: 'equals',
      value: '',
      valueType: 'string',
    };
  }

  function createDefaultGroup(): ConditionGroupState {
    return {
      id: `group-${Date.now()}`,
      logic: 'and',
      conditions: [createDefaultCondition()],
    };
  }

  function getDefaultAction(): PathAction {
    return { type: 'continue', targetNodeId: '' };
  }

  const selectedPath = currentPaths[selectedPathIndex];
  const selectedAction = selectedPath.action || getDefaultAction();

  // Handlers
  const handleAddPath = useCallback(() => {
    setCurrentPaths([...currentPaths, createDefaultPath()]);
    setSelectedPathIndex(currentPaths.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPaths]);

  const handleDeletePath = useCallback((index: number) => {
    if (currentPaths.length <= 1) return;
    const newPaths = currentPaths.filter((_, i) => i !== index);
    setCurrentPaths(newPaths);
    setSelectedPathIndex(Math.min(selectedPathIndex, newPaths.length - 1));
  }, [currentPaths, selectedPathIndex]);

  const handleDuplicatePath = useCallback((index: number) => {
    const pathToDupe = currentPaths[index];
    const newPath: ConditionalPath = {
      ...JSON.parse(JSON.stringify(pathToDupe)),
      id: `path-${Date.now()}`,
      name: `${pathToDupe.name} (Copy)`,
      priority: currentPaths.length + 1,
    };
    setCurrentPaths([...currentPaths, newPath]);
    setSelectedPathIndex(currentPaths.length);
  }, [currentPaths]);

  const handleUpdatePath = useCallback((field: string, value: unknown) => {
    const newPaths = [...currentPaths];
    newPaths[selectedPathIndex] = {
      ...newPaths[selectedPathIndex],
      [field]: value,
    };
    setCurrentPaths(newPaths);
  }, [currentPaths, selectedPathIndex]);

  const handleAddGroup = useCallback(() => {
    const newGroups = [...(selectedPath.conditionGroups || []), createDefaultGroup()];
    handleUpdatePath('conditionGroups', newGroups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, handleUpdatePath]);

  const handleDeleteGroup = useCallback((groupIndex: number) => {
    const newGroups = (selectedPath.conditionGroups || []).filter((_, i) => i !== groupIndex);
    handleUpdatePath('conditionGroups', newGroups);
  }, [selectedPath, handleUpdatePath]);

  const handleUpdateGroup = useCallback((groupIndex: number, field: string, value: unknown) => {
    const newGroups = [...(selectedPath.conditionGroups || [])];
    newGroups[groupIndex] = {
      ...newGroups[groupIndex],
      [field]: value,
    };
    handleUpdatePath('conditionGroups', newGroups);
  }, [selectedPath, handleUpdatePath]);

  const handleAddCondition = useCallback((groupIndex: number) => {
    const newGroups = [...(selectedPath.conditionGroups || [])];
    const conditions = (newGroups[groupIndex]?.conditions as ConditionState[]) || [];
    newGroups[groupIndex] = {
      ...newGroups[groupIndex],
      conditions: [...conditions, createDefaultCondition()],
    };
    handleUpdatePath('conditionGroups', newGroups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, handleUpdatePath, availableVariables]);

  const handleDeleteCondition = useCallback((groupIndex: number, condIndex: number) => {
    const newGroups = [...(selectedPath.conditionGroups || [])];
    const conditions = (newGroups[groupIndex]?.conditions as ConditionState[]) || [];
    newGroups[groupIndex] = {
      ...newGroups[groupIndex],
      conditions: conditions.filter((_, i) => i !== condIndex),
    };
    handleUpdatePath('conditionGroups', newGroups);
  }, [selectedPath, handleUpdatePath]);

  const handleUpdateCondition = useCallback(
    (groupIndex: number, condIndex: number, field: string, value: string) => {
      const newGroups = [...(selectedPath.conditionGroups || [])];
      const conditions = [...((newGroups[groupIndex]?.conditions as ConditionState[]) || [])];
      conditions[condIndex] = {
        ...conditions[condIndex],
        [field]: value,
      };
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        conditions,
      };
      handleUpdatePath('conditionGroups', newGroups);
    },
    [selectedPath, handleUpdatePath]
  );

  const handleReorderPaths = useCallback((fromIndex: number, toIndex: number) => {
    const newPaths = [...currentPaths];
    const [movedPath] = newPaths.splice(fromIndex, 1);
    newPaths.splice(toIndex, 0, movedPath);
    // Update priorities
    newPaths.forEach((p, i) => (p.priority = i + 1));
    setCurrentPaths(newPaths);
    setSelectedPathIndex(toIndex);
  }, [currentPaths]);

  // Test evaluation
  const evaluateCondition = useCallback((cond: ConditionState, value: string): boolean => {
    const fieldValue = value;
    const compareValue = cond.value;

    switch (cond.operator) {
      case 'equals':
        return fieldValue === compareValue;
      case 'not_equals':
        return fieldValue !== compareValue;
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(compareValue);
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(compareValue);
      case 'greater_or_equal':
        return parseFloat(fieldValue) >= parseFloat(compareValue);
      case 'less_or_equal':
        return parseFloat(fieldValue) <= parseFloat(compareValue);
      case 'contains':
        return fieldValue.includes(compareValue);
      case 'not_contains':
        return !fieldValue.includes(compareValue);
      case 'starts_with':
        return fieldValue.startsWith(compareValue);
      case 'ends_with':
        return fieldValue.endsWith(compareValue);
      case 'is_empty':
        return !fieldValue || fieldValue.length === 0;
      case 'is_not_empty':
        return !!fieldValue && fieldValue.length > 0;
      case 'matches_regex':
        try {
          return new RegExp(compareValue).test(fieldValue);
        } catch {
          return false;
        }
      case 'is_null':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      default:
        return false;
    }
  }, []);

  const runTest = useCallback(() => {
    const results: { pathId: string; matched: boolean }[] = [];

    for (const path of currentPaths) {
      if (!path.enabled) {
        results.push({ pathId: path.id, matched: false });
        continue;
      }

      let pathMatched = true;

      for (const group of (path.conditionGroups || [])) {
        const conditions = (group.conditions as ConditionState[]) || [];
        if (conditions.length === 0) continue;

        let groupMatched = group.logic === 'and';

        for (const cond of conditions) {
          const testValue = testValues[cond.field] || '';
          const condResult = evaluateCondition(cond, testValue);

          if (group.logic === 'and') {
            groupMatched = groupMatched && condResult;
          } else {
            groupMatched = groupMatched || condResult;
          }
        }

        pathMatched = pathMatched && groupMatched;
      }

      results.push({ pathId: path.id, matched: pathMatched });
    }

    setTestResults(results);
  }, [currentPaths, testValues, evaluateCondition]);

  const handleSave = useCallback(() => {
    onSave(currentPaths);
    onClose();
  }, [currentPaths, onSave, onClose]);

  // Get variable type
  const getVariableType = useCallback((fieldName: string): string => {
    const variable = availableVariables.find(v => v.name === fieldName);
    return variable?.type || 'string';
  }, [availableVariables]);

  // Filter operators by variable type
  const getAvailableOperators = useCallback((fieldName: string) => {
    const varType = getVariableType(fieldName);
    return OPERATORS.filter(op => op.types.includes(varType) || op.types.includes('any'));
  }, [getVariableType]);

  return (
    <div className="conditional-paths-builder">
      <div className="builder-header">
        <div className="header-content">
          <h3>🔀 Conditional Paths Builder</h3>
          <p>Create branching logic for your workflow</p>
        </div>
        <div className="header-actions">
          <button
            className={`test-mode-btn ${testMode ? 'active' : ''}`}
            onClick={() => setTestMode(!testMode)}
          >
            🧪 {testMode ? 'Exit Test' : 'Test Mode'}
          </button>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="builder-body">
        {/* Paths List */}
        <div className="paths-list">
          <div className="paths-header">
            <h4>Paths ({currentPaths.length})</h4>
            <button className="add-path-btn" onClick={handleAddPath}>+ Add Path</button>
          </div>
          <div className="paths-items">
            {currentPaths.map((path, index) => {
              const testResult = testResults.find(r => r.pathId === path.id);
              return (
                <div
                  key={path.id}
                  className={`path-item ${selectedPathIndex === index ? 'selected' : ''} ${!path.enabled ? 'disabled' : ''} ${testResult?.matched ? 'matched' : ''}`}
                  onClick={() => setSelectedPathIndex(index)}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('pathIndex', index.toString())}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const fromIndex = parseInt(e.dataTransfer.getData('pathIndex'));
                    handleReorderPaths(fromIndex, index);
                  }}
                >
                  <div className="path-priority">#{path.priority}</div>
                  <div className="path-info">
                    <span className="path-name">{path.name}</span>
                    <span className="path-conditions">
                      {(path.conditionGroups || []).reduce((sum, g) => sum + (g.conditions?.length || 0), 0)} conditions
                    </span>
                  </div>
                  <div className="path-action-icon">{path.action ? ACTION_ICONS[path.action.type] : '➡️'}</div>
                  {testResult && (
                    <span className={`test-badge ${testResult.matched ? 'pass' : 'fail'}`}>
                      {testResult.matched ? '✓' : '✗'}
                    </span>
                  )}
                  <div className="path-actions">
                    <button onClick={(e) => { e.stopPropagation(); handleDuplicatePath(index); }}>📋</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePath(index); }}
                      disabled={currentPaths.length <= 1}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {currentPaths.length > 1 && (
            <p className="paths-hint">Drag to reorder priority</p>
          )}
        </div>

        {/* Path Editor */}
        <div className="path-editor">
          {testMode ? (
            <div className="test-panel">
              <h4>🧪 Test Variables</h4>
              <p className="test-description">Enter test values for your variables to see which path matches</p>
              <div className="test-variables">
                {availableVariables.map(variable => (
                  <div key={variable.name} className="test-variable">
                    <label>
                      <span className="var-name">{variable.name}</span>
                      <span className="var-type">({variable.type})</span>
                    </label>
                    <input
                      type={variable.type === 'number' ? 'number' : 'text'}
                      value={testValues[variable.name] || ''}
                      onChange={(e) => setTestValues({ ...testValues, [variable.name]: e.target.value })}
                      placeholder={variable.sample || `Enter ${variable.type}`}
                    />
                  </div>
                ))}
              </div>
              <button className="run-test-btn" onClick={runTest}>
                ▶️ Run Test
              </button>
              {testResults.length > 0 && (
                <div className="test-results">
                  <h5>Results</h5>
                  {testResults.map((result, i) => {
                    const path = currentPaths.find(p => p.id === result.pathId);
                    return (
                      <div key={result.pathId} className={`test-result ${result.matched ? 'matched' : ''}`}>
                        <span className="result-icon">{result.matched ? '✅' : '❌'}</span>
                        <span className="result-path">#{i + 1} {path?.name}</span>
                        {result.matched && <span className="result-action">→ {path?.action?.type || 'continue'}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : selectedPath ? (
            <>
              <div className="path-config">
                <div className="config-row">
                  <div className="config-field">
                    <label>Path Name</label>
                    <input
                      type="text"
                      value={selectedPath.name}
                      onChange={(e) => handleUpdatePath('name', e.target.value)}
                      placeholder="Name this path"
                    />
                  </div>
                  <div className="config-field">
                    <label>Enabled</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={selectedPath.enabled}
                        onChange={(e) => handleUpdatePath('enabled', e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="condition-groups">
                <h4>Conditions</h4>
                {(selectedPath.conditionGroups || []).map((group, groupIndex) => (
                  <div key={group.id} className="condition-group">
                    <div className="group-header">
                      <select
                        value={group.logic}
                        onChange={(e) => handleUpdateGroup(groupIndex, 'logic', e.target.value as 'and' | 'or')}
                      >
                        <option value="and">ALL (AND)</option>
                        <option value="or">ANY (OR)</option>
                      </select>
                      <span className="group-label">of these conditions must match</span>
                      {(selectedPath.conditionGroups || []).length > 1 && (
                        <button className="delete-group-btn" onClick={() => handleDeleteGroup(groupIndex)}>
                          🗑️
                        </button>
                      )}
                    </div>

                    <div className="conditions-list">
                      {((group.conditions as ConditionState[]) || []).map((cond, condIndex) => (
                        <div key={cond.id} className="condition-row">
                          {condIndex > 0 && (
                            <span className="condition-logic">{group.logic.toUpperCase()}</span>
                          )}
                          <select
                            className="field-select"
                            value={cond.field}
                            onChange={(e) => handleUpdateCondition(groupIndex, condIndex, 'field', e.target.value)}
                          >
                            <option value="">Select variable...</option>
                            {availableVariables.map(v => (
                              <option key={v.name} value={v.name}>{v.name} ({v.type})</option>
                            ))}
                          </select>

                          <select
                            className="operator-select"
                            value={cond.operator}
                            onChange={(e) => handleUpdateCondition(groupIndex, condIndex, 'operator', e.target.value)}
                          >
                            {getAvailableOperators(cond.field).map(op => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                          </select>

                          {!['is_empty', 'is_not_empty', 'is_null', 'is_not_null'].includes(cond.operator) && (
                            <input
                              type="text"
                              className="value-input"
                              value={cond.value}
                              onChange={(e) => handleUpdateCondition(groupIndex, condIndex, 'value', e.target.value)}
                              placeholder="Value"
                            />
                          )}

                          <button
                            className="delete-condition-btn"
                            onClick={() => handleDeleteCondition(groupIndex, condIndex)}
                            disabled={(group.conditions as ConditionState[]).length <= 1}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <button className="add-condition-btn" onClick={() => handleAddCondition(groupIndex)}>
                      + Add Condition
                    </button>
                  </div>
                ))}

                <button className="add-group-btn" onClick={handleAddGroup}>
                  + Add Condition Group
                </button>
              </div>

              <div className="path-action-config">
                <h4>Then...</h4>
                <div className="action-grid">
                  {ACTION_TYPES.map(type => (
                    <button
                      key={type}
                      className={`action-btn ${selectedAction.type === type ? 'selected' : ''}`}
                      onClick={() => handleUpdatePath('action', { ...selectedAction, type })}
                    >
                      <span className="action-icon">{ACTION_ICONS[type]}</span>
                      <span className="action-label">{type}</span>
                    </button>
                  ))}
                </div>

                {['goto', 'branch'].includes(selectedAction.type) && (
                  <div className="action-target">
                    <label>Target Node ID</label>
                    <input
                      type="text"
                      value={selectedAction.targetNodeId || ''}
                      onChange={(e) => handleUpdatePath('action', { ...selectedAction, targetNodeId: e.target.value })}
                      placeholder="Enter node ID to jump to"
                    />
                  </div>
                )}

                {selectedAction.type === 'wait' && (
                  <div className="action-target">
                    <label>Wait Duration (ms)</label>
                    <input
                      type="number"
                      value={selectedAction.delay || 0}
                      onChange={(e) => handleUpdatePath('action', { ...selectedAction, delay: parseInt(e.target.value) })}
                      min={0}
                      step={1000}
                    />
                  </div>
                )}

                {selectedAction.type === 'loop' && (
                  <div className="action-target">
                    <label>Max Iterations</label>
                    <input
                      type="number"
                      value={selectedAction.maxIterations || 10}
                      onChange={(e) => handleUpdatePath('action', { ...selectedAction, maxIterations: parseInt(e.target.value) })}
                      min={1}
                      max={1000}
                    />
                  </div>
                )}

                {selectedAction.type === 'error' && (
                  <div className="action-target">
                    <label>Error Message</label>
                    <input
                      type="text"
                      value={selectedAction.errorMessage || ''}
                      onChange={(e) => handleUpdatePath('action', { ...selectedAction, errorMessage: e.target.value })}
                      placeholder="Error message to display"
                    />
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="builder-footer">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSave}>
          💾 Save Paths
        </button>
      </div>
    </div>
  );
};

export default ConditionalPathsBuilder;
