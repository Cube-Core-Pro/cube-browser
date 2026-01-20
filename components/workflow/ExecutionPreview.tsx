'use client';

import React from 'react';
import { Node } from 'reactflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Loader2, AlertCircle, Eye } from 'lucide-react';

interface ExecutionState {
  isRunning: boolean;
  currentNodeId: string | null;
  results: Record<string, unknown>;
  error: string | null;
}

interface ExecutionPreviewProps {
  executionState: ExecutionState;
  selectedNode: Node | null;
  onClose: () => void;
}

export const ExecutionPreview: React.FC<ExecutionPreviewProps> = ({
  executionState,
  selectedNode,
  onClose,
}) => {
  const { isRunning, currentNodeId, results, error } = executionState;

  const renderResults = (): JSX.Element | null => {
    if (Object.keys(results).length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Results</h3>
        <div className="space-y-2">
          {Object.keys(results).map((nodeId) => {
            const result = results[nodeId];
            const displayResult: string = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            return (
              <div
                key={nodeId}
                className="p-3 bg-muted/50 border rounded-lg space-y-1"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {nodeId}
                  </Badge>
                  {nodeId === currentNodeId && (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  )}
                </div>
                <pre className="text-xs text-muted-foreground font-mono overflow-x-auto max-h-32">
                  {displayResult}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-96 border-l rounded-none h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <CardTitle>Execution Preview</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          {isRunning ? 'Workflow is running...' : 'Ready to execute'}
        </CardDescription>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-4 space-y-4">
          {/* Execution Status */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Status</h3>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm">Running...</span>
                  <Badge className="bg-blue-500">{currentNodeId}</Badge>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">Failed</span>
                </>
              ) : Object.keys(results).length > 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Complete</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Not started</span>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-semibold text-red-800 mb-1">Error</h4>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {renderResults()}

          {/* Selected Node Details */}
          {selectedNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Selected Node</h3>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <div>
                  <span className="text-xs font-semibold text-blue-800">ID:</span>
                  <span className="text-xs text-blue-600 ml-2">{selectedNode.id}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-blue-800">Type:</span>
                  <span className="text-xs text-blue-600 ml-2">{selectedNode.type}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-blue-800">Config:</span>
                  <pre className="text-xs text-blue-600 mt-1 font-mono overflow-x-auto">
                    {JSON.stringify((selectedNode.data as { config?: unknown })?.config, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Live Data Preview */}
          {isRunning && currentNodeId && currentNodeId in results && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Live Data
              </h3>
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <pre className="text-xs text-muted-foreground font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(results[currentNodeId], null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Tips */}
          {!isRunning && Object.keys(results).length === 0 && (
            <div className="p-3 bg-muted/50 border rounded-lg space-y-2">
              <h4 className="text-sm font-semibold text-foreground">💡 Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Add nodes from the left palette</li>
                <li>Connect nodes with edges</li>
                <li>Click nodes to configure</li>
                <li>Press Execute to run</li>
              </ul>
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};
