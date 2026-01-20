"use client";

import React, { useState, useCallback, useMemo as _useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  UserCircle,
  AtSign,
  RefreshCw,
  Copy,
  Check,
  Star,
  StarOff,
  History,
  Trash2,
  Settings as _Settings,
  Shuffle,
  Hash,
  Type as _Type,
  Sparkles,
  Zap,
  Globe as _Globe,
  Mail,
  Lock as _Lock,
  Eye as _Eye,
  EyeOff,
  Shield as _Shield,
  Palette as _Palette,
  Wand2,
  ArrowRight as _ArrowRight,
  Plus,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  UsernameGenerator as _UsernameGeneratorType,
  GeneratedUsername as _GeneratedUsername,
  UsernameStyle,
  UsernameHistory,
} from '@/types/password-manager-pro';
import { logger } from '@/lib/services/logger-service';
import './UsernameGenerator.css';

const log = logger.scope('UsernameGenerator');

// ============================================================================
// BACKEND TYPES
// ============================================================================

interface BackendUsernameGeneratorConfig {
  wordList: string[];
  separators: string[];
  includeNumbers: boolean;
  capitalize: boolean;
}

// ============================================================================
// LOCAL DATA (Email aliases - no backend support yet)
// ============================================================================

const initialEmailAliases = [
  {
    id: 'alias-1',
    alias: 'shopping.2kx9m@cube.pm',
    target: 'john@gmail.com',
    createdAt: new Date('2025-01-20'),
    forwardCount: 45,
    isActive: true,
    label: 'Shopping Sites',
  },
  {
    id: 'alias-2',
    alias: 'social.9xnq2@cube.pm',
    target: 'john@gmail.com',
    createdAt: new Date('2025-01-18'),
    forwardCount: 128,
    isActive: true,
    label: 'Social Media',
  },
  {
    id: 'alias-3',
    alias: 'news.4prt7@cube.pm',
    target: 'john@gmail.com',
    createdAt: new Date('2025-01-15'),
    forwardCount: 67,
    isActive: false,
    label: 'Newsletters',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const _getRandomElement = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const _getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Fallback generators for local use when backend unavailable
const generateAlphanumericLocal = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface GeneratedUsernameCardProps {
  username: string;
  index: number;
  onCopy: (username: string) => void;
  onSave: (username: string) => void;
  copiedUsername: string | null;
}

function GeneratedUsernameCard({ 
  username, 
  index, 
  onCopy, 
  onSave, 
  copiedUsername 
}: GeneratedUsernameCardProps) {
  const isCopied = copiedUsername === username;

  return (
    <div className="generated-username-card">
      <div className="flex items-center gap-3">
        <div className="username-index">{index + 1}</div>
        <span className="font-mono text-lg">{username}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onCopy(username)}
          className={isCopied ? 'text-green-600' : ''}
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onSave(username)}>
          <Star className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface HistoryItemProps {
  item: UsernameHistory;
  onCopy: (username: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  copiedUsername: string | null;
}

function HistoryItem({ 
  item, 
  onCopy, 
  onToggleFavorite, 
  onDelete, 
  copiedUsername 
}: HistoryItemProps) {
  const isCopied = copiedUsername === item.username;

  return (
    <div className={`history-item ${item.isFavorite ? 'favorite' : ''}`}>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleFavorite(item.id)}
          className={item.isFavorite ? 'text-yellow-500' : 'text-muted-foreground'}
        >
          {item.isFavorite ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
        </Button>
        <div>
          <p className="font-mono font-medium">{item.username}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="text-xs capitalize">
              {(item.style ?? 'random').replace(/_/g, ' ')}
            </Badge>
            {item.usedFor && <span>• {item.usedFor}</span>}
            {item.createdAt && <span>• {formatDate(item.createdAt)}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onCopy(item.username)}
          className={isCopied ? 'text-green-600' : ''}
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => onDelete(item.id)}
          className="text-muted-foreground hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface EmailAlias {
  id: string;
  alias: string;
  target: string;
  createdAt: Date;
  forwardCount: number;
  isActive: boolean;
  label: string;
}

interface EmailAliasCardProps {
  alias: EmailAlias;
  onToggle: (id: string) => void;
  onCopy: (alias: string) => void;
  onDelete: (id: string) => void;
  copiedAlias: string | null;
}

function EmailAliasCard({ alias, onToggle, onCopy, onDelete, copiedAlias }: EmailAliasCardProps) {
  const isCopied = copiedAlias === alias.alias;

  return (
    <Card className={`email-alias-card ${!alias.isActive ? 'disabled' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`alias-icon ${alias.isActive ? 'active' : 'inactive'}`}>
            <Mail className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-mono text-sm">{alias.alias}</p>
              {!alias.isActive && (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{alias.label}</span>
              <span>•</span>
              <span>{alias.forwardCount} emails forwarded</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={alias.isActive} onCheckedChange={() => onToggle(alias.id)} />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(alias.alias)}
              className={isCopied ? 'text-green-600' : ''}
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(alias.id)}
              className="text-muted-foreground hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface UsernameGeneratorProps {
  onClose?: () => void;
}

export function UsernameGenerator({ onClose: _onClose }: UsernameGeneratorProps) {
  const [style, setStyle] = useState<UsernameStyle>('random_words');
  const [generatedUsernames, setGeneratedUsernames] = useState<string[]>([]);
  const [history, setHistory] = useState<UsernameHistory[]>([]);
  const [emailAliases, setEmailAliases] = useState<EmailAlias[]>(initialEmailAliases);
  const [copiedUsername, setCopiedUsername] = useState<string | null>(null);
  const [copiedAlias, setCopiedAlias] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Settings
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [separator, setSeparator] = useState('_');
  const [length, setLength] = useState(12);
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');

  const { toast } = useToast();

  // Load config from backend on mount
  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        setLoading(true);
        const config = await invoke<BackendUsernameGeneratorConfig>('get_username_generator_config');
        
        if (mounted) {
          setIncludeNumbers(config.includeNumbers);
          if (config.separators.length > 0) {
            setSeparator(config.separators[0]);
          }
        }
      } catch (error) {
        if (mounted) {
          log.error('Failed to load username generator config:', error);
          // Don't show error toast - use defaults
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadConfig();
    return () => { mounted = false; };
  }, []);

  const generateUsernames = useCallback(async () => {
    setIsGenerating(true);
    const usernames: string[] = [];
    const count = 5;

    try {
      for (let i = 0; i < count; i++) {
        // Use backend for random_words style
        if (style === 'random_words') {
          try {
            const username = await invoke<string>('generate_username');
            usernames.push(username);
          } catch (error) {
            // Fallback to local generation if backend fails
            log.error('Backend generation failed, using fallback:', error);
            usernames.push(`user_${generateAlphanumericLocal(8)}`);
          }
        } else {
          // For other styles, generate locally as backend only supports random_words
          let username: string;
          switch (style) {
            case 'alphanumeric':
              username = generateAlphanumericLocal(length);
              break;
            case 'professional':
              const professions = ['dev', 'coder', 'hacker', 'maker', 'builder', 'creator', 'designer', 'pro', 'expert'];
              const styles = [
                `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
                `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
                `${firstName[0]?.toLowerCase() || 'j'}${lastName.toLowerCase()}`,
                `${firstName.toLowerCase()}${lastName[0]?.toLowerCase() || 'd'}`,
                `${firstName.toLowerCase()}_${professions[Math.floor(Math.random() * professions.length)]}`,
              ];
              username = styles[Math.floor(Math.random() * styles.length)];
              break;
            case 'gamer_tag': {
              const adjectives = ['swift', 'cosmic', 'digital', 'quantum', 'cyber', 'neon', 'shadow', 'phantom'];
              const nouns = ['ninja', 'wolf', 'dragon', 'phoenix', 'tiger', 'hawk', 'storm', 'blade'];
              const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
              const noun = nouns[Math.floor(Math.random() * nouns.length)];
              const num = Math.floor(Math.random() * 999);
              username = `x${adj}${noun}${num}x`;
              break;
            }
            case 'anonymous':
              username = `user_${generateAlphanumericLocal(8)}`;
              break;
            default:
              username = `user_${generateAlphanumericLocal(8)}`;
          }
          usernames.push(username);
        }
      }

      setGeneratedUsernames(usernames);
    } catch (error) {
      log.error('Failed to generate usernames:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate usernames',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [style, length, firstName, lastName, toast]);

  const handleCopy = useCallback((username: string) => {
    navigator.clipboard.writeText(username);
    setCopiedUsername(username);
    setTimeout(() => setCopiedUsername(null), 2000);
    toast({
      title: 'Copied!',
      description: 'Username copied to clipboard',
    });
  }, [toast]);

  const handleSave = useCallback((username: string) => {
    const newHistoryItem: UsernameHistory = {
      id: `hist-${Date.now()}`,
      username,
      style,
      createdAt: new Date(),
      isFavorite: false,
    };
    setHistory(prev => [newHistoryItem, ...prev]);
    toast({
      title: 'Saved!',
      description: 'Username saved to history',
    });
  }, [style, toast]);

  const handleToggleFavorite = useCallback((id: string) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleCopyAlias = useCallback((alias: string) => {
    navigator.clipboard.writeText(alias);
    setCopiedAlias(alias);
    setTimeout(() => setCopiedAlias(null), 2000);
    toast({
      title: 'Copied!',
      description: 'Email alias copied to clipboard',
    });
  }, [toast]);

  const handleToggleAlias = useCallback((id: string) => {
    setEmailAliases(prev => prev.map(alias => 
      alias.id === id ? { ...alias, isActive: !alias.isActive } : alias
    ));
  }, []);

  const handleDeleteAlias = useCallback((id: string) => {
    setEmailAliases(prev => prev.filter(alias => alias.id !== id));
    toast({
      title: 'Deleted',
      description: 'Email alias has been removed',
    });
  }, [toast]);

  const handleCreateAlias = useCallback(() => {
    const randomSuffix = generateAlphanumericLocal(5).toLowerCase();
    const newAlias: EmailAlias = {
      id: `alias-${Date.now()}`,
      alias: `new.${randomSuffix}@cube.pm`,
      target: 'john@gmail.com',
      createdAt: new Date(),
      forwardCount: 0,
      isActive: true,
      label: 'New Alias',
    };
    setEmailAliases(prev => [newAlias, ...prev]);
    toast({
      title: 'Alias Created',
      description: 'New email alias has been created',
    });
  }, [toast]);

  const styleOptions = [
    { value: 'random_words', label: 'Random Words', icon: <Shuffle className="h-4 w-4" />, description: 'Combine random adjectives and nouns' },
    { value: 'alphanumeric', label: 'Alphanumeric', icon: <Hash className="h-4 w-4" />, description: 'Random letters and numbers' },
    { value: 'professional', label: 'Professional', icon: <User className="h-4 w-4" />, description: 'Based on your name' },
    { value: 'gamer_tag', label: 'Gamer Tag', icon: <Zap className="h-4 w-4" />, description: 'Gaming-style usernames' },
    { value: 'anonymous', label: 'Anonymous', icon: <EyeOff className="h-4 w-4" />, description: 'Privacy-focused usernames' },
  ];

  if (loading) {
    return (
      <div className="username-generator flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading username generator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="username-generator">
      {/* Header */}
      <div className="generator-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Username Generator</h2>
            <p className="text-sm text-muted-foreground">
              Generate unique usernames and email aliases
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="generator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generator">
            <Wand2 className="h-4 w-4 mr-2" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="aliases">
            <AtSign className="h-4 w-4 mr-2" />
            Email Aliases
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <div className="grid grid-cols-3 gap-6">
            {/* Style Selection */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Style</CardTitle>
                <CardDescription>Choose a username style</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {styleOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setStyle(option.value as UsernameStyle)}
                      className={`style-option w-full ${style === option.value ? 'selected' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="style-icon">{option.icon}</div>
                        <div className="text-left">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
                <CardDescription>Customize your username</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {style === 'random_words' && (
                  <>
                    <div>
                      <Label>Separator</Label>
                      <Select value={separator} onValueChange={setSeparator}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_">Underscore (_)</SelectItem>
                          <SelectItem value=".">Dot (.)</SelectItem>
                          <SelectItem value="-">Dash (-)</SelectItem>
                          <SelectItem value="">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Include Numbers</Label>
                      <Switch checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                    </div>
                  </>
                )}

                {style === 'alphanumeric' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Length</Label>
                      <span className="text-sm font-mono">{length}</span>
                    </div>
                    <Slider
                      value={[length]}
                      onValueChange={([value]) => setLength(value)}
                      min={6}
                      max={20}
                      step={1}
                    />
                  </div>
                )}

                {style === 'professional' && (
                  <>
                    <div>
                      <Label>First Name</Label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-2"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-2"
                        placeholder="Doe"
                      />
                    </div>
                  </>
                )}

                {(style === 'gamer_tag' || style === 'anonymous') && (
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      No additional settings needed for this style
                    </p>
                  </div>
                )}

                <Button className="w-full" onClick={generateUsernames} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Usernames'}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Generated</CardTitle>
                <CardDescription>Click to copy or save</CardDescription>
              </CardHeader>
              <CardContent>
                {generatedUsernames.length > 0 ? (
                  <div className="space-y-2">
                    {generatedUsernames.map((username, index) => (
                      <GeneratedUsernameCard
                        key={`${username}-${index}`}
                        username={username}
                        index={index}
                        onCopy={handleCopy}
                        onSave={handleSave}
                        copiedUsername={copiedUsername}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Click &quot;Generate Usernames&quot; to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="aliases">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Email Aliases</CardTitle>
                <CardDescription>
                  Create disposable email addresses that forward to your real email
                </CardDescription>
              </div>
              <Button onClick={handleCreateAlias}>
                <Plus className="h-4 w-4 mr-2" />
                Create Alias
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {emailAliases.length > 0 ? (
                  <div className="space-y-3">
                    {emailAliases.map(alias => (
                      <EmailAliasCard
                        key={alias.id}
                        alias={alias}
                        onToggle={handleToggleAlias}
                        onCopy={handleCopyAlias}
                        onDelete={handleDeleteAlias}
                        copiedAlias={copiedAlias}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AtSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Email Aliases</h3>
                    <p className="text-muted-foreground mb-4">
                      Create an alias to protect your real email address
                    </p>
                    <Button onClick={handleCreateAlias}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Alias
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Username History</CardTitle>
              <CardDescription>
                Previously generated and saved usernames
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {history.length > 0 ? (
                  <div className="space-y-2">
                    {history
                      .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
                      .map(item => (
                        <HistoryItem
                          key={item.id}
                          item={item}
                          onCopy={handleCopy}
                          onToggleFavorite={handleToggleFavorite}
                          onDelete={handleDeleteHistory}
                          copiedUsername={copiedUsername}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No History</h3>
                    <p className="text-muted-foreground">
                      Generated usernames will appear here
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UsernameGenerator;
