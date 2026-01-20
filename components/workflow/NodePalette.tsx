'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  Database,
  Brain,
  GitBranch,
  Repeat,
  MousePointer,
  Download,
  Upload,
  Mail,
  Image as ImageIcon,
  Webhook,
  Clock,
  Zap,
} from 'lucide-react';

interface NodeTypeData {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'action' | 'data' | 'logic' | 'ai';
  color: string;
}

const nodeTypes: NodeTypeData[] = [
  // Browser Actions
  {
    type: 'browserAction',
    label: 'Browser Action',
    description: 'Navigate, click, type, scroll',
    icon: <Globe className="w-5 h-5" />,
    category: 'action',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    type: 'mouseAction',
    label: 'Mouse Action',
    description: 'Click, hover, drag & drop',
    icon: <MousePointer className="w-5 h-5" />,
    category: 'action',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },

  // Data Operations
  {
    type: 'dataExtraction',
    label: 'Extract Data',
    description: 'Scrape text, tables, images',
    icon: <Database className="w-5 h-5" />,
    category: 'data',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    type: 'fileDownload',
    label: 'Download File',
    description: 'Save files from web',
    icon: <Download className="w-5 h-5" />,
    category: 'data',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  {
    type: 'fileUpload',
    label: 'Upload File',
    description: 'Upload files to forms',
    icon: <Upload className="w-5 h-5" />,
    category: 'data',
    color: 'bg-green-100 text-green-800 border-green-300',
  },

  // AI Processing
  {
    type: 'aiProcessing',
    label: 'AI Processing',
    description: 'GPT analysis, transformation',
    icon: <Brain className="w-5 h-5" />,
    category: 'ai',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    type: 'aiVision',
    label: 'AI Vision',
    description: 'Image/screenshot analysis',
    icon: <ImageIcon className="w-5 h-5" />,
    category: 'ai',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
  },

  // Logic & Control Flow
  {
    type: 'condition',
    label: 'Condition',
    description: 'If/else branching',
    icon: <GitBranch className="w-5 h-5" />,
    category: 'logic',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    type: 'loop',
    label: 'Loop',
    description: 'Repeat actions',
    icon: <Repeat className="w-5 h-5" />,
    category: 'logic',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    type: 'delay',
    label: 'Delay',
    description: 'Wait before next action',
    icon: <Clock className="w-5 h-5" />,
    category: 'logic',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },

  // Integrations
  {
    type: 'webhook',
    label: 'Webhook',
    description: 'Send HTTP requests',
    icon: <Webhook className="w-5 h-5" />,
    category: 'action',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    type: 'email',
    label: 'Send Email',
    description: 'Send notifications',
    icon: <Mail className="w-5 h-5" />,
    category: 'action',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
];

const categoryNames = {
  action: 'Browser Actions',
  data: 'Data Operations',
  logic: 'Logic & Control',
  ai: 'AI Processing',
};

export const NodePalette: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = Object.keys(categoryNames) as Array<keyof typeof categoryNames>;

  return (
    <Card className="w-80 border-r rounded-none h-full">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          <CardTitle>Node Palette</CardTitle>
        </div>
        <CardDescription>Drag nodes to canvas to build workflow</CardDescription>
      </CardHeader>

      <ScrollArea className="h-[calc(100vh-120px)]">
        <CardContent className="p-4 space-y-6">
          {categories.map((category) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {categoryNames[category]}
              </h3>

              <div className="space-y-2">
                {nodeTypes
                  .filter((node) => node.category === category)
                  .map((node) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type)}
                      className={`
                        p-3 rounded-lg border-2 cursor-move
                        hover:shadow-lg hover:scale-105 transition-all
                        ${node.color}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{node.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{node.label}</h4>
                          <p className="text-xs opacity-75 mt-0.5">{node.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              15+ Node Types
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              More node types available than Zapier
            </p>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
};
