'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('SmartSelectorPicker');

import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import './SmartSelectorPicker.css';
import { 
  Sparkles, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Code,
  Eye,
  Brain,
  Zap,
  Shield,
  Copy,
  Play
} from 'lucide-react';

interface SelectorStrategy {
  selector_type: string;
  selector: string;
  confidence: number;
  stability_score: number;
  specificity: number;
  reasoning: string;
}

interface SmartSelectorResult {
  primary_selector: SelectorStrategy;
  fallback_chain: SelectorStrategy[];
  visual_hints: string[];
  ai_reasoning: string;
  estimated_reliability: number;
}

interface ElementContext {
  html: string;
  parent_html: string;
  siblings_html: string[];
  computed_styles: Record<string, string>;
  attributes: Record<string, string>;
  text_content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  screenshot_base64?: string;
}

interface ValidationResult {
  is_valid: boolean;
  matches_count: number;
  is_unique: boolean;
  error_message?: string;
  suggestions: string[];
}

export const SmartSelectorPicker: React.FC = () => {
  const { toast } = useToast();
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPickingElement, setIsPickingElement] = useState(false);
  const [selectorResult, setSelectorResult] = useState<SmartSelectorResult | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<SelectorStrategy | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [manualSelector, setManualSelector] = useState('');

  // Demo context for testing
  const demoContext: ElementContext = {
    html: '<button data-testid="submit-btn" class="btn-primary px-4 py-2">Submit</button>',
    parent_html: '<form id="contact-form"></form>',
    siblings_html: ['<input type="text" name="email" />', '<input type="text" name="name" />'],
    computed_styles: {
      'background-color': '#3b82f6',
      'color': '#ffffff',
      'font-size': '16px'
    },
    attributes: {
      'data-testid': 'submit-btn',
      'class': 'btn-primary px-4 py-2',
      'type': 'button'
    },
    text_content: 'Submit',
    position: { x: 100, y: 200, width: 120, height: 40 }
  };

  const handlePickElement = async () => {
    setIsPickingElement(true);
    setLoading(true);

    try {
      // In production, this would capture real element from page
      // For now, use demo context
      toast({
        title: "🎯 Analyzing Element",
        description: "AI is generating optimal selector strategies...",
      });

      const result = await invoke<SmartSelectorResult>('generate_smart_selector', {
        context: demoContext,
        preferences: {}
      });

      setSelectorResult(result);
      setSelectedStrategy(result.primary_selector);
      
      toast({
        title: "✅ Selector Generated",
        description: `Found ${result.fallback_chain.length + 1} strategies with ${Math.round(result.estimated_reliability * 100)}% reliability`,
      });

      // Auto-validate primary selector
      await validateSelector(result.primary_selector.selector, result.primary_selector.selector_type);

    } catch (error) {
      log.error('Failed to generate selector:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : 'Failed to generate selector',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsPickingElement(false);
    }
  };

  const validateSelector = async (selector: string, selectorType: string) => {
    try {
      const result = await invoke<ValidationResult>('validate_selector', {
        selector,
        selectorType,
        pageHtml: '<html><body>' + demoContext.html + '</body></html>'
      });

      setValidation(result);

      if (result.is_valid && result.is_unique) {
        toast({
          title: "✅ Valid Selector",
          description: "Selector is unique and matches exactly one element",
        });
      } else if (result.is_valid && !result.is_unique) {
        toast({
          title: "⚠️ Multiple Matches",
          description: `Selector matches ${result.matches_count} elements`,
          variant: "destructive",
        });
      }
    } catch (error) {
      log.error('Validation failed:', error);
    }
  };

  const handleStrategySelect = (strategy: SelectorStrategy) => {
    setSelectedStrategy(strategy);
    validateSelector(strategy.selector, strategy.selector_type);
  };

  const copySelector = async (selector: string) => {
    try {
      await navigator.clipboard.writeText(selector);
      toast({
        title: "📋 Copied",
        description: "Selector copied to clipboard",
      });
    } catch (error) {
      log.error('Copy failed:', error);
    }
  };

  const testSelector = async () => {
    if (!selectedStrategy) return;

    toast({
      title: "🧪 Testing Selector",
      description: "Executing selector on current page...",
    });

    try {
      // Execute selector test via backend
      const result = await invoke<{ success: boolean; matchCount: number }>('automation_test_selector', {
        selector: selectedStrategy.selector,
        selectorType: selectedStrategy.selector_type
      });

      if (result.success) {
        toast({
          title: "✅ Test Successful",
          description: `Selector matched ${result.matchCount} element(s)`,
        });
      } else {
        toast({
          title: "⚠️ No Match",
          description: "Selector did not match any elements",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to test selector",
        variant: "destructive",
      });
    }
  };

  const getSelectorTypeIcon = (type: string) => {
    switch (type) {
      case 'data-attribute': return <Shield className="w-4 h-4" />;
      case 'aria': return <Eye className="w-4 h-4" />;
      case 'css': return <Code className="w-4 h-4" />;
      case 'xpath': return <Target className="w-4 h-4" />;
      case 'visual': return <Eye className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getSelectorTypeColor = (type: string) => {
    switch (type) {
      case 'data-attribute': return 'bg-green-100 text-green-800 border-green-300';
      case 'aria': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'css': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'xpath': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'visual': return 'bg-pink-100 text-pink-800 border-pink-300';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge className="bg-green-500">Excellent</Badge>;
    if (confidence >= 0.75) return <Badge className="bg-blue-500">Good</Badge>;
    if (confidence >= 0.6) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge className="bg-red-500">Poor</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">AI-Powered Selector Generator</CardTitle>
                <CardDescription className="text-base">
                  Superior to all automation tools - Multi-strategy intelligent selector creation
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2">
              ELITE
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={handlePickElement}
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {loading ? (
                <>
                  <Brain className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 mr-2" />
                  Pick Element from Page
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setSelectorResult(null)}
              disabled={!selectorResult}
            >
              Clear
            </Button>
          </div>

          {/* AI Reasoning */}
          {selectorResult && (
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">AI Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectorResult.ai_reasoning}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {Math.round(selectorResult.estimated_reliability * 100)}% Estimated Reliability
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visual Hints */}
          {selectorResult && selectorResult.visual_hints.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Visual Hints
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectorResult.visual_hints.map((hint, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {hint}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategies Tabs */}
      {selectorResult && (
        <Tabs defaultValue="primary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="primary">Primary Selector</TabsTrigger>
            <TabsTrigger value="fallbacks">
              Fallback Chain ({selectorResult.fallback_chain.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="primary" className="space-y-4">
            <SelectorCard
              strategy={selectorResult.primary_selector}
              isSelected={true}
              validation={validation}
              onCopy={() => copySelector(selectorResult.primary_selector.selector)}
              onTest={testSelector}
              getSelectorTypeIcon={getSelectorTypeIcon}
              getSelectorTypeColor={getSelectorTypeColor}
              getConfidenceBadge={getConfidenceBadge}
            />
          </TabsContent>

          <TabsContent value="fallbacks" className="space-y-4">
            <ScrollArea className="h-[500px] rounded-md border p-4">
              <div className="space-y-4">
                {selectorResult.fallback_chain.map((strategy, idx) => (
                  <SelectorCard
                    key={idx}
                    strategy={strategy}
                    isSelected={selectedStrategy?.selector === strategy.selector}
                    validation={selectedStrategy?.selector === strategy.selector ? validation : null}
                    onSelect={() => handleStrategySelect(strategy)}
                    onCopy={() => copySelector(strategy.selector)}
                    onTest={testSelector}
                    getSelectorTypeIcon={getSelectorTypeIcon}
                    getSelectorTypeColor={getSelectorTypeColor}
                    getConfidenceBadge={getConfidenceBadge}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

interface SelectorCardProps {
  strategy: SelectorStrategy;
  isSelected: boolean;
  validation: ValidationResult | null;
  onSelect?: () => void;
  onCopy: () => void;
  onTest: () => void;
  getSelectorTypeIcon: (type: string) => React.ReactNode;
  getSelectorTypeColor: (type: string) => string;
  getConfidenceBadge: (confidence: number) => React.ReactNode;
}

const SelectorCard: React.FC<SelectorCardProps> = ({
  strategy,
  isSelected,
  validation,
  onSelect,
  onCopy,
  onTest,
  getSelectorTypeIcon,
  getSelectorTypeColor,
  getConfidenceBadge,
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        isSelected ? 'border-2 border-blue-500 shadow-lg' : 'border hover:border-blue-300'
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${getSelectorTypeColor(strategy.selector_type)}`}>
              {getSelectorTypeIcon(strategy.selector_type)}
            </div>
            <div>
              <CardTitle className="text-lg capitalize">
                {strategy.selector_type.replace('-', ' ')}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {strategy.reasoning}
              </CardDescription>
            </div>
          </div>
          {getConfidenceBadge(strategy.confidence)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selector String */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground">Selector</Label>
          <div className="bg-card rounded-lg p-3 font-mono text-sm text-green-400 overflow-x-auto border">
            {strategy.selector}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Confidence</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="selector-progress-bar selector-progress-bar--confidence"
                  ref={(el) => { if (el) el.style.setProperty('--progress-width', `${strategy.confidence * 100}%`); }}
                />
              </div>
              <span className="text-xs font-semibold">{Math.round(strategy.confidence * 100)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Stability</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="selector-progress-bar selector-progress-bar--stability"
                  ref={(el) => { if (el) el.style.setProperty('--progress-width', `${strategy.stability_score * 100}%`); }}
                />
              </div>
              <span className="text-xs font-semibold">{Math.round(strategy.stability_score * 100)}%</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Specificity</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="selector-progress-bar selector-progress-bar--specificity"
                  ref={(el) => { if (el) el.style.setProperty('--progress-width', `${strategy.specificity}%`); }}
                />
              </div>
              <span className="text-xs font-semibold">{strategy.specificity}</span>
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {validation && (
          <div className={`p-3 rounded-lg border ${
            validation.is_valid && validation.is_unique
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {validation.is_valid && validation.is_unique ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Valid & Unique</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-700">
                    {validation.matches_count} matches found
                  </span>
                </>
              )}
            </div>
            {validation.suggestions.length > 0 && (
              <div className="space-y-1 mt-2">
                {validation.suggestions.map((suggestion, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground">• {suggestion}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onCopy(); }}>
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>
        <Button size="sm" onClick={(e) => { e.stopPropagation(); onTest(); }}>
          <Play className="w-4 h-4 mr-2" />
          Test Selector
        </Button>
      </CardFooter>
    </Card>
  );
};
