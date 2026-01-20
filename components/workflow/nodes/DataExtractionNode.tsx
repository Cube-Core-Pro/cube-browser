'use client';

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface DataExtractionNodeData {
  label: string;
  config?: Record<string, string | number | boolean | null>;
}

interface DataExtractionNodeProps {
  data: DataExtractionNodeData;
  selected: boolean;
}

export const DataExtractionNode: React.FC<DataExtractionNodeProps> = ({ data, selected }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [selector, setSelector] = useState(String(data.config?.selector ?? ''));
  const [attribute, setAttribute] = useState(String(data.config?.attribute ?? 'text'));

  return (
    <Card
      className={`
        min-w-[250px] border-2
        ${selected ? 'border-green-500 shadow-lg' : 'border-green-300'}
        bg-card
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-green-500 !w-3 !h-3"
      />

      <CardHeader className="p-3 pb-2 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-sm text-green-800">Extract Data</span>
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
        <Badge variant="outline" className="text-xs w-fit">
          {attribute}
        </Badge>
      </CardHeader>

      {showConfig && (
        <CardContent className="p-3 space-y-3 text-xs">
          <div className="space-y-1">
            <Label className="text-xs">CSS Selector</Label>
            <Textarea
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder=".product-title"
              className="h-16 text-xs font-mono resize-none"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Extract</Label>
            <Input
              value={attribute}
              onChange={(e) => setAttribute(e.target.value)}
              placeholder="text, href, src, etc."
              className="h-8 text-xs"
            />
          </div>
        </CardContent>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !w-3 !h-3"
      />
    </Card>
  );
};
