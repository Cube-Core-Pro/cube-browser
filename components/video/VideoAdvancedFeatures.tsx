"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles,
  Image as ImageIcon,
  Mic,
  MicOff,
  Users,
  MessageSquare,
  Check,
  X,
  Upload,
  RefreshCw,
  Wand2,
  Brain,
  ChevronRight,
  Clock,
  Plus,
  Move,
  Trash2
} from "lucide-react";

// ==================== Types ====================

export interface AICompanionSummary {
  id: string;
  meetingId: string;
  meetingTitle: string;
  date: Date;
  duration: number; // minutes
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  participants: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  dueDate?: Date;
  completed: boolean;
}

export interface VirtualBackground {
  id: string;
  name: string;
  type: 'image' | 'blur' | 'video' | 'ai-generated';
  url?: string;
  blurIntensity?: number;
  isDefault?: boolean;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  participants: Participant[];
  duration?: number; // minutes
  status: 'pending' | 'active' | 'closed';
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: 'host' | 'co-host' | 'participant';
  isMuted: boolean;
  hasVideo: boolean;
}

export interface NoiseSuppressionSettings {
  enabled: boolean;
  level: 'low' | 'medium' | 'high' | 'auto';
  keyboardSuppression: boolean;
  backgroundVoiceSuppression: boolean;
  echoCancellation: boolean;
}

// ==================== AI Companion Component ====================

interface AICompanionProps {
  meetingSummaries: AICompanionSummary[];
  isLive: boolean;
  onGenerateSummary: () => Promise<AICompanionSummary>;
  onAskQuestion: (question: string) => Promise<string>;
}

export function AICompanion({ 
  meetingSummaries, 
  isLive,
  onGenerateSummary,
  onAskQuestion 
}: AICompanionProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [liveTranscript, _setLiveTranscript] = useState<string[]>([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [askingAI, setAskingAI] = useState(false);

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      await onGenerateSummary();
      toast({
        title: "Summary Generated",
        description: "AI has created a meeting summary with action items"
      });
    } catch (_error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate summary",
        variant: "destructive"
      });
    }
    setGenerating(false);
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    
    setAskingAI(true);
    try {
      const response = await onAskQuestion(aiQuestion);
      setAiResponse(response);
    } catch (_error) {
      setAiResponse("Sorry, I couldn't process your question. Please try again.");
    }
    setAskingAI(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              AI Companion
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Powered by GPT-5.2
              </Badge>
            </CardTitle>
            <CardDescription>Intelligent meeting assistant</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live Features */}
        {isLive && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="font-medium">Live Transcription Active</span>
              </div>
              <Button size="sm" onClick={handleGenerateSummary} disabled={generating}>
                {generating ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Summary
              </Button>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 h-24 overflow-y-auto">
              {liveTranscript.length > 0 ? (
                liveTranscript.map((line, i) => (
                  <p key={i} className="text-sm">{line}</p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Waiting for speech...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Ask AI */}
        <div className="space-y-3">
          <Label>Ask AI Companion</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., What were the key decisions from the last meeting?"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            />
            <Button onClick={handleAskAI} disabled={askingAI || !aiQuestion.trim()}>
              {askingAI ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {aiResponse && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm">{aiResponse}</p>
            </div>
          )}
        </div>

        {/* Recent Summaries */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Recent Meeting Summaries</h4>
          
          {meetingSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No summaries yet. Start a meeting to generate AI summaries.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {meetingSummaries.map(summary => (
                <div 
                  key={summary.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{summary.meetingTitle}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{summary.date.toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{summary.duration} min</span>
                        <span>•</span>
                        <span>{summary.actionItems.length} action items</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {summary.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Virtual Backgrounds Component ====================

interface VirtualBackgroundsProps {
  backgrounds: VirtualBackground[];
  activeBackground: VirtualBackground | null;
  onSelectBackground: (background: VirtualBackground | null) => void;
  onAddBackground: (file: File) => Promise<VirtualBackground>;
  onDeleteBackground: (id: string) => void;
}

export function VirtualBackgrounds({
  backgrounds,
  activeBackground,
  onSelectBackground,
  onAddBackground,
  onDeleteBackground
}: VirtualBackgroundsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blurIntensity, setBlurIntensity] = useState(5);
  const [uploading, setUploading] = useState(false);

  const defaultBackgrounds: VirtualBackground[] = [
    { id: 'none', name: 'None', type: 'image', isDefault: true },
    { id: 'blur', name: 'Blur', type: 'blur', blurIntensity: 5, isDefault: true },
    { id: 'office', name: 'Modern Office', type: 'image', url: '/backgrounds/office.jpg', isDefault: true },
    { id: 'nature', name: 'Nature', type: 'image', url: '/backgrounds/nature.jpg', isDefault: true },
    { id: 'space', name: 'Space', type: 'image', url: '/backgrounds/space.jpg', isDefault: true },
    { id: 'ai-abstract', name: 'AI Abstract', type: 'ai-generated', url: '/backgrounds/ai-abstract.jpg', isDefault: true }
  ];

  const allBackgrounds = [...defaultBackgrounds, ...backgrounds];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      await onAddBackground(file);
      toast({
        title: "Background Added",
        description: "Your custom background has been saved"
      });
    } catch (_error) {
      toast({
        title: "Upload Failed",
        description: "Could not upload background",
        variant: "destructive"
      });
    }
    setUploading(false);
  };

  const handleBlurChange = (value: number[]) => {
    setBlurIntensity(value[0]);
    if (activeBackground?.type === 'blur') {
      onSelectBackground({
        ...activeBackground,
        blurIntensity: value[0]
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Virtual Backgrounds</CardTitle>
              <CardDescription>Replace or blur your background</CardDescription>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            title="Upload background image"
            onChange={handleFileUpload}
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Background Grid */}
        <div className="grid grid-cols-4 gap-2">
          {allBackgrounds.map(bg => (
            <div
              key={bg.id}
              className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                activeBackground?.id === bg.id 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => onSelectBackground(bg.id === 'none' ? null : bg)}
            >
              {bg.type === 'blur' ? (
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-xs font-medium">Blur</span>
                </div>
              ) : bg.url ? (
                <Image 
                  src={bg.url} 
                  alt={bg.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <X className="h-6 w-6 text-gray-400" />
                </div>
              )}
              
              {activeBackground?.id === bg.id && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-500 py-0.5 text-center">
                  <Check className="h-3 w-3 text-white mx-auto" />
                </div>
              )}
              
              {!bg.isDefault && (
                <button
                  type="button"
                  title="Delete background"
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBackground(bg.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Blur Intensity Slider */}
        {activeBackground?.type === 'blur' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Blur Intensity</Label>
              <span className="text-sm text-muted-foreground">{blurIntensity}</span>
            </div>
            <Slider
              value={[blurIntensity]}
              onValueChange={handleBlurChange}
              min={1}
              max={10}
              step={1}
            />
          </div>
        )}

        {/* AI Background Generator */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium text-sm">AI Background Generator</p>
                <p className="text-xs text-muted-foreground">Create custom backgrounds with AI</p>
              </div>
            </div>
            <Button size="sm" variant="outline">
              <Wand2 className="mr-2 h-4 w-4" />
              Generate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Noise Suppression Component ====================

interface NoiseSuppressionProps {
  settings: NoiseSuppressionSettings;
  onSettingsChange: (settings: NoiseSuppressionSettings) => void;
  audioLevel: number;
}

export function NoiseSuppression({
  settings,
  onSettingsChange,
  audioLevel
}: NoiseSuppressionProps) {
  const [testingMic, setTestingMic] = useState(false);

  const handleToggle = (key: keyof NoiseSuppressionSettings, value: boolean) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleLevelChange = (level: NoiseSuppressionSettings['level']) => {
    onSettingsChange({
      ...settings,
      level
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Noise Suppression</CardTitle>
              <CardDescription>Crystal clear audio with AI noise removal</CardDescription>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => handleToggle('enabled', checked)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.enabled && (
          <>
            {/* Audio Level Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Microphone Level</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTestingMic(!testingMic)}
                >
                  {testingMic ? (
                    <>
                      <MicOff className="mr-2 h-4 w-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Test Mic
                    </>
                  )}
                </Button>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-100 ${
                    audioLevel > 80 ? 'bg-red-500' : 
                    audioLevel > 50 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  } w-[${audioLevel}%]`}
                />
              </div>
            </div>

            {/* Suppression Level */}
            <div className="space-y-2">
              <Label>Suppression Level</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'auto'] as const).map(level => (
                  <Button
                    key={level}
                    variant={settings.level === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLevelChange(level)}
                    className="capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.level === 'auto' 
                  ? 'AI automatically adjusts based on your environment'
                  : settings.level === 'high'
                  ? 'Maximum suppression - may affect voice quality'
                  : settings.level === 'medium'
                  ? 'Balanced suppression for most environments'
                  : 'Light suppression - preserves natural sound'}
              </p>
            </div>

            {/* Additional Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Keyboard Noise Suppression</p>
                  <p className="text-xs text-muted-foreground">Remove typing sounds</p>
                </div>
                <Switch
                  checked={settings.keyboardSuppression}
                  onCheckedChange={(checked) => handleToggle('keyboardSuppression', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Background Voice Filter</p>
                  <p className="text-xs text-muted-foreground">Filter out other voices nearby</p>
                </div>
                <Switch
                  checked={settings.backgroundVoiceSuppression}
                  onCheckedChange={(checked) => handleToggle('backgroundVoiceSuppression', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">Echo Cancellation</p>
                  <p className="text-xs text-muted-foreground">Remove audio feedback</p>
                </div>
                <Switch
                  checked={settings.echoCancellation}
                  onCheckedChange={(checked) => handleToggle('echoCancellation', checked)}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Breakout Rooms Component ====================

interface BreakoutRoomsProps {
  rooms: BreakoutRoom[];
  participants: Participant[];
  isHost: boolean;
  onCreateRoom: (name: string) => void;
  onDeleteRoom: (id: string) => void;
  onAssignParticipant: (roomId: string, participantId: string) => void;
  onStartRooms: () => void;
  onCloseRooms: () => void;
  onBroadcastMessage: (message: string) => void;
}

export function BreakoutRooms({
  rooms,
  participants,
  isHost,
  onCreateRoom,
  onDeleteRoom,
  onAssignParticipant,
  onStartRooms,
  onCloseRooms,
  onBroadcastMessage
}: BreakoutRoomsProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [draggedParticipant, setDraggedParticipant] = useState<string | null>(null);

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    
    onCreateRoom(newRoomName);
    setNewRoomName('');
    setShowCreateDialog(false);
    
    toast({
      title: "Room Created",
      description: `"${newRoomName}" has been created`
    });
  };

  const handleBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    
    onBroadcastMessage(broadcastMessage);
    setBroadcastMessage('');
    setShowBroadcastDialog(false);
    
    toast({
      title: "Message Broadcasted",
      description: "Your message has been sent to all rooms"
    });
  };

  const unassignedParticipants = participants.filter(
    p => !rooms.some(r => r.participants.some(rp => rp.id === p.id))
  );

  const roomsActive = rooms.some(r => r.status === 'active');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Breakout Rooms</CardTitle>
              <CardDescription>Split meeting into smaller groups</CardDescription>
            </div>
          </div>
          {isHost && (
            <div className="flex gap-2">
              <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!roomsActive}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Broadcast
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Broadcast Message</DialogTitle>
                    <DialogDescription>
                      Send a message to all breakout rooms
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    placeholder="Enter your message..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />
                  <DialogFooter>
                    <Button onClick={handleBroadcast} disabled={!broadcastMessage.trim()}>
                      Send to All Rooms
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {roomsActive ? (
                <Button variant="destructive" size="sm" onClick={onCloseRooms}>
                  Close All Rooms
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  onClick={onStartRooms}
                  disabled={rooms.length === 0}
                >
                  Start Rooms
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isHost && (
          <>
            {/* Unassigned Participants */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Unassigned ({unassignedParticipants.length})</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Room
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {unassignedParticipants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-full bg-white dark:bg-gray-800 border cursor-move"
                    draggable
                    onDragStart={() => setDraggedParticipant(participant.id)}
                    onDragEnd={() => setDraggedParticipant(null)}
                  >
                    <Move className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{participant.name}</span>
                  </div>
                ))}
                {unassignedParticipants.length === 0 && (
                  <p className="text-sm text-muted-foreground">All participants assigned</p>
                )}
              </div>
            </div>

            {/* Rooms */}
            <div className="grid grid-cols-2 gap-3">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    room.status === 'active' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedParticipant) {
                      onAssignParticipant(room.id, draggedParticipant);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      {room.name}
                      {room.status === 'active' && (
                        <Badge className="bg-green-500">Active</Badge>
                      )}
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteRoom(room.id)}
                      disabled={room.status === 'active'}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {room.participants.map(p => (
                      <Badge key={p.id} variant="outline" className="text-xs">
                        {p.name}
                      </Badge>
                    ))}
                    {room.participants.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        Drag participants here
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No breakout rooms</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Room
                </Button>
              </div>
            )}
          </>
        )}

        {/* Create Room Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Breakout Room</DialogTitle>
              <DialogDescription>
                Enter a name for the new room
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="e.g., Team A, Discussion Group 1"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRoom} disabled={!newRoomName.trim()}>
                Create Room
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ==================== Main Video Advanced Features Component ====================

export interface VideoAdvancedFeaturesProps {
  // AI Companion
  meetingSummaries: AICompanionSummary[];
  isLiveMeeting: boolean;
  onGenerateSummary: () => Promise<AICompanionSummary>;
  onAskAI: (question: string) => Promise<string>;
  
  // Virtual Backgrounds
  backgrounds: VirtualBackground[];
  activeBackground: VirtualBackground | null;
  onSelectBackground: (background: VirtualBackground | null) => void;
  onAddBackground: (file: File) => Promise<VirtualBackground>;
  onDeleteBackground: (id: string) => void;
  
  // Noise Suppression
  noiseSettings: NoiseSuppressionSettings;
  onNoiseSettingsChange: (settings: NoiseSuppressionSettings) => void;
  currentAudioLevel: number;
  
  // Breakout Rooms
  breakoutRooms: BreakoutRoom[];
  meetingParticipants: Participant[];
  isHost: boolean;
  onCreateBreakoutRoom: (name: string) => void;
  onDeleteBreakoutRoom: (id: string) => void;
  onAssignToRoom: (roomId: string, participantId: string) => void;
  onStartBreakoutRooms: () => void;
  onCloseBreakoutRooms: () => void;
  onBroadcastToRooms: (message: string) => void;
}

export function VideoAdvancedFeatures({
  meetingSummaries,
  isLiveMeeting,
  onGenerateSummary,
  onAskAI,
  backgrounds,
  activeBackground,
  onSelectBackground,
  onAddBackground,
  onDeleteBackground,
  noiseSettings,
  onNoiseSettingsChange,
  currentAudioLevel,
  breakoutRooms,
  meetingParticipants,
  isHost,
  onCreateBreakoutRoom,
  onDeleteBreakoutRoom,
  onAssignToRoom,
  onStartBreakoutRooms,
  onCloseBreakoutRooms,
  onBroadcastToRooms
}: VideoAdvancedFeaturesProps) {
  return (
    <Tabs defaultValue="ai" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">AI Companion</span>
        </TabsTrigger>
        <TabsTrigger value="backgrounds" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Backgrounds</span>
        </TabsTrigger>
        <TabsTrigger value="audio" className="flex items-center gap-2">
          <Mic className="h-4 w-4" />
          <span className="hidden sm:inline">Audio</span>
        </TabsTrigger>
        <TabsTrigger value="breakout" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Breakout</span>
        </TabsTrigger>
      </TabsList>
      
      <div className="mt-4">
        <TabsContent value="ai">
          <AICompanion
            meetingSummaries={meetingSummaries}
            isLive={isLiveMeeting}
            onGenerateSummary={onGenerateSummary}
            onAskQuestion={onAskAI}
          />
        </TabsContent>
        
        <TabsContent value="backgrounds">
          <VirtualBackgrounds
            backgrounds={backgrounds}
            activeBackground={activeBackground}
            onSelectBackground={onSelectBackground}
            onAddBackground={onAddBackground}
            onDeleteBackground={onDeleteBackground}
          />
        </TabsContent>
        
        <TabsContent value="audio">
          <NoiseSuppression
            settings={noiseSettings}
            onSettingsChange={onNoiseSettingsChange}
            audioLevel={currentAudioLevel}
          />
        </TabsContent>
        
        <TabsContent value="breakout">
          <BreakoutRooms
            rooms={breakoutRooms}
            participants={meetingParticipants}
            isHost={isHost}
            onCreateRoom={onCreateBreakoutRoom}
            onDeleteRoom={onDeleteBreakoutRoom}
            onAssignParticipant={onAssignToRoom}
            onStartRooms={onStartBreakoutRooms}
            onCloseRooms={onCloseBreakoutRooms}
            onBroadcastMessage={onBroadcastToRooms}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}

export default VideoAdvancedFeatures;
