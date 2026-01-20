/**
 * Data Extractor - Visual Web Scraping Tool
 * Point-and-click interface for extracting data from web pages
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ExtractionSchema,
  ExtractionField,
  ExtractorState,
  ExtractionJob,
  VisualSelection,
  SelectorSuggestion,
} from '@/types/extractor';
import { SchemaBuilder, VisualSelector, PreviewPanel, ExportDialog } from './extractor';
import { AIAssistant } from './ai/AIAssistant';
import './DataExtractor.css';
import {
  SchemaService,
  ExtractionService,
  AISuggestionService,
  ExtractionSchema as ServiceSchema,
  ExtractedData,
} from '@/lib/services/extractor-service';
import {
  TourProvider,
  TourTooltip,
  TourOverlay,
  TourLauncher,
  TourWelcomeModal,
  TourCompletionModal
} from '@/components/tour';
import { allExtractorTourSections, allExtractorTourSteps } from './extractor/tour';
import { logger } from '@/lib/services/logger-service';
import {
  Bot,
  Eye,
  Zap,
  Plus,
  Trash2,
  ChevronRight,
  Search,
  Sparkles,
  BarChart2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const log = logger.scope('DataExtractor');

export const DataExtractor: React.FC = () => {
  // State
  const [state, setState] = useState<ExtractorState>({
    mode: 'idle',
    jobs: [],
  });

  // Tour state
  const [showTourWelcome, setShowTourWelcome] = useState(false);
  const [showTourCompletion, setShowTourCompletion] = useState(false);
  const [schemas, setSchemas] = useState<ExtractionSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<ExtractionSchema | null>(null);
  const [previewData, setPreviewData] = useState<ExtractedData[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SelectorSuggestion[]>([]);
  const [schemaLoadError, setSchemaLoadError] = useState<string | null>(null);
  const [schemasLoading, setSchemasLoading] = useState(true);

  // Refs
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const browserRef = useRef<HTMLIFrameElement>(null);

  // Load saved schemas on mount
  useEffect(() => {
    loadSchemas();
  }, []);

  // Check if user should see tour welcome
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('cube-extractor-tour-seen');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setShowTourWelcome(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Tour handlers
  const handleStartTour = useCallback(() => {
    localStorage.setItem('cube-extractor-tour-seen', 'true');
    setShowTourWelcome(false);
  }, []);

  const handleSkipTour = useCallback(() => {
    localStorage.setItem('cube-extractor-tour-seen', 'true');
    setShowTourWelcome(false);
  }, []);

  const handleRestartTour = useCallback(() => {
    localStorage.removeItem('cube-extractor-tour-progress');
    setShowTourCompletion(false);
  }, []);

  const loadSchemas = async () => {
    setSchemasLoading(true);
    setSchemaLoadError(null);
    try {
      const result = await SchemaService.loadSchemas();
      // Convert service schema type to component schema type
      const convertedSchemas: ExtractionSchema[] = result.map(s => ({
        ...s,
        fields: s.fields.map(f => ({
          id: f.id,
          name: f.name,
          selector: {
            id: f.selector.id,
            type: f.selector.type as 'css' | 'xpath' | 'text' | 'attribute' | 'smart',
            value: f.selector.value,
            strategy: f.selector.strategy as 'single' | 'multiple' | 'table' | 'list' | 'nested',
            label: f.selector.label || f.name,
          },
        })),
      }));
      setSchemas(convertedSchemas);
    } catch (err) {
      log.error('Failed to load schemas:', err);
      setSchemaLoadError(err instanceof Error ? err.message : 'Failed to load schemas. Please try again.');
    } finally {
      setSchemasLoading(false);
    }
  };

  // Create new schema
  const handleCreateSchema = () => {
    const newSchema: ExtractionSchema = {
      id: `schema_${Date.now()}`,
      name: 'New Schema',
      url: '',
      fields: [],
      created: new Date(),
      modified: new Date(),
      version: 1,
    };
    setSelectedSchema(newSchema);
    setState(prev => ({ ...prev, mode: 'editing', currentSchema: newSchema }));
  };

  // Save schema
  const handleSaveSchema = async () => {
    if (!selectedSchema) return;

    try {
      // Convert to service schema type
      const serviceSchema: ServiceSchema = {
        id: selectedSchema.id,
        name: selectedSchema.name,
        url: selectedSchema.url,
        fields: selectedSchema.fields.map(f => ({
          id: f.id,
          name: f.name,
          selector: {
            id: f.selector.id,
            type: f.selector.type as 'css' | 'xpath' | 'regex',
            value: f.selector.value,
            strategy: f.selector.strategy as 'single' | 'multiple' | 'first' | 'last',
            label: f.selector.label,
          },
        })),
        created: selectedSchema.created,
        modified: selectedSchema.modified,
        version: selectedSchema.version,
      };
      await SchemaService.saveSchema(serviceSchema);
      await loadSchemas();
      setState(prev => ({ ...prev, mode: 'idle' }));
    } catch (error) {
      log.error('Failed to save schema:', error);
    }
  };

  // Delete schema
  const handleDeleteSchema = async (schemaId: string) => {
    try {
      await SchemaService.deleteSchema(schemaId);
      await loadSchemas();
      if (selectedSchema?.id === schemaId) {
        setSelectedSchema(null);
        setState(prev => ({ ...prev, mode: 'idle', currentSchema: undefined }));
      }
    } catch (error) {
      log.error('Failed to delete schema:', error);
    }
  };

  // Start visual selection mode
  const handleStartSelection = () => {
    setState(prev => ({ ...prev, mode: 'selecting' }));
  };

  // Handle element selection
  const handleElementSelected = (selection: VisualSelection) => {
    setState(prev => ({ ...prev, currentSelection: selection }));
    
    // Get AI suggestions for the selected element
    getAISuggestions(selection);
  };

  // Get AI-powered selector suggestions
  const getAISuggestions = async (selection: VisualSelection) => {
    try {
      const suggestions = await AISuggestionService.suggestSelectors({
        selector: selection.selector,
        xpath: selection.xpath,
        text: selection.text,
        attributes: selection.attributes,
      });
      // Convert service suggestions to component suggestions
      const convertedSuggestions: SelectorSuggestion[] = suggestions.map(s => ({
        selector: {
          id: `selector_${Date.now()}`,
          type: s.type as 'css' | 'xpath' | 'text' | 'attribute' | 'smart',
          value: s.selector,
          strategy: 'single' as const,
          label: s.description,
        },
        reasoning: s.description,
        examples: [],
        alternatives: [],
        score: s.confidence * 100,
      }));
      setAiSuggestions(convertedSuggestions);
    } catch (error) {
      log.error('Failed to get AI suggestions:', error);
    }
  };

  // Add field to schema
  const handleAddField = (field: ExtractionField) => {
    if (!selectedSchema) return;

    const updatedSchema = {
      ...selectedSchema,
      fields: [...selectedSchema.fields, field],
      modified: new Date(),
    };
    setSelectedSchema(updatedSchema);
    setState(prev => ({ ...prev, currentSchema: updatedSchema }));
  };

  // Remove field from schema
  const handleRemoveField = (fieldId: string) => {
    if (!selectedSchema) return;

    const updatedSchema = {
      ...selectedSchema,
      fields: selectedSchema.fields.filter(f => f.id !== fieldId),
      modified: new Date(),
    };
    setSelectedSchema(updatedSchema);
    setState(prev => ({ ...prev, currentSchema: updatedSchema }));
  };

  // Update field
  const handleUpdateField = (fieldId: string, updates: Partial<ExtractionField>) => {
    if (!selectedSchema) return;

    const updatedSchema = {
      ...selectedSchema,
      fields: selectedSchema.fields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
      modified: new Date(),
    };
    setSelectedSchema(updatedSchema);
    setState(prev => ({ ...prev, currentSchema: updatedSchema }));
  };

  // Run extraction preview
  const handlePreview = async () => {
    if (!selectedSchema) return;

    setState(prev => ({ ...prev, mode: 'previewing' }));
    
    try {
      // Convert to service schema
      const serviceSchema: ServiceSchema = {
        id: selectedSchema.id,
        name: selectedSchema.name,
        url: selectedSchema.url,
        fields: selectedSchema.fields.map(f => ({
          id: f.id,
          name: f.name,
          selector: {
            id: f.selector.id,
            type: f.selector.type as 'css' | 'xpath' | 'regex',
            value: f.selector.value,
            strategy: f.selector.strategy as 'single' | 'multiple' | 'first' | 'last',
            label: f.selector.label,
          },
        })),
        created: selectedSchema.created,
        modified: selectedSchema.modified,
        version: selectedSchema.version,
      };
      const result = await ExtractionService.preview(serviceSchema);
      // Convert service data to component data
      const convertedData: ExtractedData[] = result.map(d => d as ExtractedData);
      setPreviewData(convertedData);
    } catch (error) {
      log.error('Preview failed:', error);
    }
  };

  // Run full extraction
  const handleExtract = async () => {
    if (!selectedSchema) return;

    setState(prev => ({ ...prev, mode: 'extracting' }));

    const job: ExtractionJob = {
      id: `job_${Date.now()}`,
      schemaId: selectedSchema.id,
      status: 'running',
      startedAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      jobs: [...prev.jobs, job],
    }));

    try {
      // Convert to service schema
      const serviceSchema: ServiceSchema = {
        id: selectedSchema.id,
        name: selectedSchema.name,
        url: selectedSchema.url,
        fields: selectedSchema.fields.map(f => ({
          id: f.id,
          name: f.name,
          selector: {
            id: f.selector.id,
            type: f.selector.type as 'css' | 'xpath' | 'regex',
            value: f.selector.value,
            strategy: f.selector.strategy as 'single' | 'multiple' | 'first' | 'last',
            label: f.selector.label,
          },
        })),
        created: selectedSchema.created,
        modified: selectedSchema.modified,
        version: selectedSchema.version,
      };
      const result = await ExtractionService.extract(serviceSchema);
      
      // Update job status
      setState(prev => ({
        ...prev,
        mode: 'idle' as const,
        jobs: prev.jobs.map(j =>
          j.id === job.id
            ? { ...j, status: 'completed' as const, completedAt: new Date() }
            : j
        ),
      }));

      // Show results - convert service data to component data
      const convertedData: ExtractedData[] = result.data.map(d => d as ExtractedData);
      setPreviewData(convertedData);
    } catch (error) {
      log.error('Extraction failed:', error);
      
      setState(prev => ({
        ...prev,
        mode: 'idle' as const,
        jobs: prev.jobs.map(j =>
          j.id === job.id
            ? {
                ...j,
                status: 'failed' as const,
                completedAt: new Date(),
                error: {
                  code: 'EXTRACTION_FAILED',
                  message: String(error),
                },
              }
            : j
        ),
      }));
    }
  };

  // Export data
  const handleExport = () => {
    setShowExportDialog(true);
  };

  // Handle selector selection from AI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSelectSelector = (selector: string) => {
    if (!selectedSchema || !state.currentSelection) return;

    // Create a new field with the AI-suggested selector
    const newField: ExtractionField = {
      id: `field_${Date.now()}`,
      name: state.currentSelection.text || 'New Field',
      selector: {
        id: `selector_${Date.now()}`,
        type: 'css',
        value: selector,
        strategy: 'single',
        label: 'AI Suggested Selector',
      },
    };

    handleAddField(newField);
    setShowAI(false);
  };

  // Handle schema generation from AI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSchemaGenerated = (schemaJson: string) => {
    try {
      const generatedFields = JSON.parse(schemaJson);
      
      if (!selectedSchema) {
        // Create a new schema with the generated fields
        const newSchema: ExtractionSchema = {
          id: `schema_${Date.now()}`,
          name: 'AI Generated Schema',
          url: '',
          fields: generatedFields,
          created: new Date(),
          modified: new Date(),
          version: 1,
        };
        setSelectedSchema(newSchema);
        setState(prev => ({ ...prev, mode: 'editing', currentSchema: newSchema }));
      } else {
        // Add fields to existing schema
        const updatedSchema = {
          ...selectedSchema,
          fields: [...selectedSchema.fields, ...generatedFields],
          modified: new Date(),
        };
        setSelectedSchema(updatedSchema);
        setState(prev => ({ ...prev, currentSchema: updatedSchema }));
      }
      
      setShowAI(false);
    } catch (error) {
      log.error('Failed to parse generated schema:', error);
    }
  };

  // Analyze page with AI
  const handleAnalyzePage = async () => {
    try {
      const analysis = await AISuggestionService.analyzePage(selectedSchema?.url || '');
      
      log.debug('Page analysis:', analysis);
    } catch (error) {
      log.error('Page analysis failed:', error);
    }
  };

  return (
    <TourProvider
      tourId="data-extractor"
      steps={allExtractorTourSteps}
      sections={allExtractorTourSections}
      onComplete={() => setShowTourCompletion(true)}
    >
      <div className="data-extractor" data-tour="extractor-container">
        {/* Header with Breadcrumbs and Clear CTA Hierarchy */}
        <header className="extractor-header">
          {/* Breadcrumbs */}
          <div className="header-left">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <span className="breadcrumb-item">Automation</span>
              <ChevronRight size={16} className="breadcrumb-separator" />
              <span className="breadcrumb-item active">Data Extractor</span>
            </nav>
            <p className="header-subtitle">Visual web scraping tool</p>
          </div>

          {/* Action Buttons with Clear Hierarchy */}
          <div className="header-right">
            {/* Secondary: AI Assistant */}
            <button
              className="btn-ghost"
              onClick={() => setShowAI(!showAI)}
              title="AI Assistant for selector suggestions"
              data-tour="ai-assistant-btn"
            >
              <Bot size={16} />
              <span>AI Assistant</span>
            </button>

            {/* Secondary Group: Analysis Actions */}
            <div className="button-group">
              <button
                className="btn-secondary"
                onClick={handleAnalyzePage}
                disabled={!selectedSchema?.url}
                title="AI analyze page structure"
              >
                <Search size={16} />
                <span>Analyze</span>
              </button>
              <button
                className="btn-secondary"
                onClick={handlePreview}
              disabled={!selectedSchema || selectedSchema.fields.length === 0}
              title="Preview extraction results"
            >
              <Eye size={16} />
              <span>Preview</span>
            </button>
          </div>

          {/* Primary CTA: Extract Data */}
          <button
            className="btn-primary"
            onClick={handleExtract}
            disabled={!selectedSchema || selectedSchema.fields.length === 0}
            title="Extract data from current page"
          >
            <Zap size={16} />
            <span>Extract Data</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="extractor-content">
        {/* Left Sidebar - Schema List */}
        <div className="schema-list" data-tour="schema-list">
          <div className="schema-list-header">
            <h3>Schemas</h3>
            <button 
              className="btn-icon" 
              onClick={handleCreateSchema}
              title="Create new schema"
              data-tour="new-schema-btn"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="schema-items">
            {schemasLoading && (
              <div className="schema-loading">
                <RefreshCw size={24} className="spinning" />
                <span>Loading schemas...</span>
              </div>
            )}
            {schemaLoadError && !schemasLoading && (
              <div className="schema-error">
                <AlertCircle size={32} />
                <p>Failed to load schemas</p>
                <span className="error-detail">{schemaLoadError}</span>
                <button className="btn-secondary" onClick={loadSchemas}>
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            )}
            {!schemasLoading && !schemaLoadError && schemas.map(schema => (
              <div
                key={schema.id}
                className={`schema-item ${selectedSchema?.id === schema.id ? 'active' : ''}`}
                onClick={() => setSelectedSchema(schema)}
              >
                <div className="schema-info">
                  <div className="schema-name">{schema.name}</div>
                  <div className="schema-url">{schema.url}</div>
                  <div className="schema-meta">
                    {schema.fields.length} fields
                  </div>
                </div>
                <button
                  className="btn-icon-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSchema(schema.id);
                  }}
                  title="Delete schema"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {!schemasLoading && !schemaLoadError && schemas.length === 0 && (
              <div className="empty-state">
                <Sparkles size={48} className="empty-icon" />
                <h4>No schemas yet</h4>
                <p>Create your first extraction schema to start scraping data from websites.</p>
                <button className="btn-primary" onClick={handleCreateSchema}>
                  <Plus size={16} />
                  <span>Create Schema</span>
                </button>
                <a 
                  href="#" 
                  className="btn-link"
                  onClick={(e) => {
                    e.preventDefault();
                    log.debug('Opening documentation');
                  }}
                >
                  Learn how to use Data Extractor
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Center - Schema Builder */}
        <div className="schema-builder-container">
          {selectedSchema ? (
            <SchemaBuilder
              schema={selectedSchema}
              onUpdateSchema={setSelectedSchema}
              onAddField={handleAddField}
              onRemoveField={handleRemoveField}
              onUpdateField={handleUpdateField}
              onStartSelection={handleStartSelection}
              onSave={handleSaveSchema}
              suggestions={aiSuggestions}
            />
          ) : (
            <div className="empty-state-center">
              <div className="empty-icon">
                <BarChart2 size={64} strokeWidth={1.5} />
              </div>
              <h2>Welcome to Data Extractor</h2>
              <p>Create a new schema or select an existing one to start extracting data</p>
              <button className="btn-primary" onClick={handleCreateSchema}>
                <Plus size={18} /> Create New Schema
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Preview */}
        {previewData.length > 0 && (
          <PreviewPanel
            data={previewData}
            schema={selectedSchema}
            onExport={handleExport}
            onClose={() => setPreviewData([])}
          />
        )}
      </div>

      {/* Visual Selector Overlay */}
      {state.mode === 'selecting' && (
        <VisualSelector
          onSelect={handleElementSelected}
          onClose={() => setState(prev => ({ ...prev, mode: 'editing' }))}
        />
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          data={previewData}
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {/* AI Assistant */}
      {showAI && (
        <AIAssistant
          onClose={() => setShowAI(false)}
        />
      )}

      {/* Tour Components */}
      <TourTooltip />
      <TourOverlay />
      <TourLauncher variant="fab" showProgress />
      
      <TourWelcomeModal
        isOpen={showTourWelcome}
        onClose={() => setShowTourWelcome(false)}
        onStartTour={handleStartTour}
        onSkip={handleSkipTour}
      />
      
      <TourCompletionModal
        isOpen={showTourCompletion}
        onClose={() => setShowTourCompletion(false)}
        onRestart={handleRestartTour}
      />
    </div>
    </TourProvider>
  );
};

export default DataExtractor;
