'use client';

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitBranch, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConditionNodeData {
  label: string;
  config?: Record<string, string | number | boolean | null>;
}

interface ConditionNodeProps {
  data: ConditionNodeData;
  selected: boolean;
}

export const ConditionNode: React.FC<ConditionNodeProps> = ({ data, selected }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [field, setField] = useState(String(data.config?.field ?? ''));
  const [operator, setOperator] = useState(String(data.config?.operator ?? 'equals'));
  const [value, setValue] = useState(String(data.config?.value ?? ''));

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

      <CardHeader className="p-3 pb-2 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-sm text-orange-800">Condition</span>
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
          If {operator}
        </Badge>
      </CardHeader>

      {showConfig && (
        <CardContent className="p-3 space-y-3 text-xs">
          <div className="space-y-1">
            <Label className="text-xs">Field</Label>
            <Input
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="data.count"
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Operator</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="greaterThan">Greater Than</SelectItem>
                <SelectItem value="lessThan">Less Than</SelectItem>
                <SelectItem value="isEmpty">Is Empty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Value</Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Expected value"
              className="h-8 text-xs"
            />
          </div>
        </CardContent>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!bg-green-500 !w-3 !h-3"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!bg-red-500 !w-3 !h-3"
        style={{ left: '70%' }}
      />
    </Card>
  );
};
