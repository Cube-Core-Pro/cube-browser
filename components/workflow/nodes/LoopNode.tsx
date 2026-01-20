'use client';

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Repeat, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoopNodeData {
  label: string;
  config?: Record<string, string | number | boolean | null>;
}

interface LoopNodeProps {
  data: LoopNodeData;
  selected: boolean;
}

export const LoopNode: React.FC<LoopNodeProps> = ({ data, selected }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [iterations, setIterations] = useState(Number(data.config?.iterations ?? 3));
  const [items, setItems] = useState(String(data.config?.items ?? ''));

  return (
    <Card
      className={`
        min-w-[250px] border-2
        ${selected ? 'border-orange-500 shadow-lg' : 'border-orange-300'}
        bg-card
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-orange-500 !w-3 !h-3"
      />

      <CardHeader className="p-3 pb-2 bg-gradient-to-r from-orange-50 to-yellow-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-sm text-orange-800">Loop</span>
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
          {iterations}x iterations
        </Badge>
      </CardHeader>

      {showConfig && (
        <CardContent className="p-3 space-y-3 text-xs">
          <div className="space-y-1">
            <Label className="text-xs">Iterations</Label>
            <Input
              type="number"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              placeholder="3"
              className="h-8 text-xs"
              min={1}
              max={100}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Items Array (optional)</Label>
            <Input
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="data.items"
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="text-xs text-muted-foreground bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
            💡 Loop will iterate over array or run N times
          </div>
        </CardContent>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-orange-500 !w-3 !h-3"
      />
    </Card>
  );
};
