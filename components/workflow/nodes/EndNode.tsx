'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Square } from 'lucide-react';

interface EndNodeData {
  label?: string;
  description?: string;
}

interface EndNodeProps {
  data: EndNodeData;
  selected: boolean;
}

export const EndNode: React.FC<EndNodeProps> = ({ selected }) => {
  return (
    <Card
      className={`
        px-4 py-3 min-w-[150px] border-2
        ${selected ? 'border-red-500 shadow-lg' : 'border-red-300'}
        bg-gradient-to-r from-red-50 to-rose-50
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-red-500 !w-3 !h-3"
      />

      <div className="flex items-center gap-2">
        <Square className="w-5 h-5 text-red-600" />
        <span className="font-semibold text-red-800">End</span>
        <Badge className="bg-red-500 text-white text-xs">Exit</Badge>
      </div>
    </Card>
  );
};
