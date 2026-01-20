'use client';

import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrowserActionNodeData {
  label: string;
  config?: Record<string, string | number | boolean | null>;
}

interface BrowserActionNodeProps {
  data: BrowserActionNodeData;
  selected: boolean;
}

export const BrowserActionNode: React.FC<BrowserActionNodeProps> = ({ data, selected }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [action, setAction] = useState(String(data.config?.action ?? 'navigate'));
  const [url, setUrl] = useState(String(data.config?.url ?? ''));
  const [selector, setSelector] = useState(String(data.config?.selector ?? ''));

  return (
    <Card
      className={`
        min-w-[250px] border-2
        ${selected ? 'border-blue-500 shadow-lg' : 'border-blue-300'}
        bg-card
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-3 !h-3"
      />

      <CardHeader className="p-3 pb-2 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm text-blue-800">Browser Action</span>
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
          {action}
        </Badge>
      </CardHeader>

      {showConfig && (
        <CardContent className="p-3 space-y-3 text-xs">
          <div className="space-y-1">
            <Label className="text-xs">Action Type</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="navigate">Navigate to URL</SelectItem>
                <SelectItem value="click">Click Element</SelectItem>
                <SelectItem value="type">Type Text</SelectItem>
                <SelectItem value="scroll">Scroll Page</SelectItem>
                <SelectItem value="screenshot">Take Screenshot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(action === 'navigate') && (
            <div className="space-y-1">
              <Label className="text-xs">URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-8 text-xs"
              />
            </div>
          )}

          {(action === 'click' || action === 'type') && (
            <div className="space-y-1">
              <Label className="text-xs">Selector</Label>
              <Input
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="#element or .class"
                className="h-8 text-xs font-mono"
              />
            </div>
          )}
        </CardContent>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500 !w-3 !h-3"
      />
    </Card>
  );
};
