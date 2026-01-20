'use client';

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Brain, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIProcessingNodeData {
  label: string;
  config?: Record<string, string | number | boolean | null>;
}

interface AIProcessingNodeProps {
  data: AIProcessingNodeData;
  selected: boolean;
}

export const AIProcessingNode: React.FC<AIProcessingNodeProps> = ({ data, selected }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [prompt, setPrompt] = useState(String(data.config?.prompt || ''));

  return (
    <Card
      className={`
        min-w-[250px] border-2
        ${selected ? 'border-purple-500 shadow-lg' : 'border-purple-300'}
        bg-card
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-500 !w-3 !h-3"
      />

      <CardHeader className="p-3 pb-2 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="font-semibold text-sm text-purple-800">AI Processing</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="w-3 h-3" />
          </Button>
        </div>
        <Badge className="bg-purple-500 text-white text-xs w-fit gap-1">
          <Sparkles className="w-3 h-3" />
          GPT-5.2
        </Badge>
      </CardHeader>

      {showConfig && (
        <CardContent className="p-3 space-y-3 text-xs">
          <div className="space-y-1">
            <Label className="text-xs">AI Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Analyze this data and extract key insights..."
              className="h-24 text-xs resize-none"
            />
          </div>

          <div className="text-xs text-muted-foreground bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
            💡 Use {'{previousData}'} to reference data from previous nodes
          </div>
        </CardContent>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-500 !w-3 !h-3"
      />
    </Card>
  );
};
