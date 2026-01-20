'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';

interface StartNodeData {
  label?: string;
  description?: string;
}

interface StartNodeProps {
  data: StartNodeData;
  selected: boolean;
}

export const StartNode: React.FC<StartNodeProps> = ({ selected }) => {
  return (
    <Card
      className={`
        px-4 py-3 min-w-[150px] border-2
        ${selected ? 'border-green-500 shadow-lg' : 'border-green-300'}
        bg-gradient-to-r from-green-50 to-emerald-50
      `}
    >
      <div className="flex items-center gap-2">
        <Play className="w-5 h-5 text-green-600" />
        <span className="font-semibold text-green-800">Start</span>
        <Badge className="bg-green-500 text-white text-xs">Entry</Badge>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !w-3 !h-3"
      />
    </Card>
  );
};
