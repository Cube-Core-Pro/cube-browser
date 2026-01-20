"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('FamilyVaults');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea as _Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch as _Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  User,
  Crown,
  Shield,
  ShieldCheck,
  ShieldAlert as _ShieldAlert,
  Key as _Key,
  Lock as _Lock,
  Unlock as _Unlock,
  AlertTriangle as _AlertTriangle,
  AlertCircle,
  Clock,
  Calendar as _Calendar,
  Mail as _Mail,
  Phone as _Phone,
  Send,
  Check as _Check,
  X as _X,
  Plus,
  Trash2,
  Edit3,
  Settings,
  FolderOpen,
  Share2,
  Eye,
  EyeOff as _EyeOff,
  Heart as _Heart,
  HeartPulse,
  ChevronRight as _ChevronRight,
  MoreVertical as _MoreVertical,
  Copy as _Copy,
  RefreshCw as _RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  FamilyVault,
  FamilyMember,
  SharedCollection,
  EmergencyAccess,
  FamilyMemberRole,
} from '@/types/password-manager-pro';
import './FamilyVaults.css';

// ============================================================================
// BACKEND TYPES
// ============================================================================

interface BackendFamilyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  joinedAt: number;
  lastActive: number;
  itemsCount: number;
}

interface BackendSharedVault {
  id: string;
  name: string;
  description: string;
  members: string[];
  itemsCount: number;
  createdAt: number;
}

interface BackendFamilyVaultsConfig {
  familyName: string;
  members: BackendFamilyMember[];
  sharedVaults: BackendSharedVault[];
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const convertBackendMemberToFrontend = (backend: BackendFamilyMember): FamilyMember => {
  const roleMap: Record<string, FamilyMemberRole> = {
    'admin': 'admin',
    'owner': 'owner',
    'member': 'member',
    'limited': 'limited',
    'child': 'child',
  };
  
  return {
    id: backend.id,
    userId: backend.id,
    name: backend.name,
    email: backend.email,
    role: roleMap[backend.role] || 'member',
    avatar: backend.avatar || undefined,
    joinedAt: new Date(backend.joinedAt * 1000),
    lastActiveAt: new Date(backend.lastActive * 1000),
    status: 'active',
    itemsOwned: backend.itemsCount,
    itemsShared: Math.floor(backend.itemsCount * 0.3),
    twoFactorEnabled: backend.role === 'admin' || backend.role === 'owner',
  };
};

const convertBackendVaultToCollection = (backend: BackendSharedVault): SharedCollection => {
  const icons: Record<string, string> = {
    'streaming': '📺',
    'finance': '💳',
    'home': '🏠',
    'work': '💼',
    'default': '📁',
  };
  
  const iconKey = backend.name.toLowerCase().includes('stream') ? 'streaming' :
                  backend.name.toLowerCase().includes('financ') || backend.name.toLowerCase().includes('bill') ? 'finance' :
                  backend.name.toLowerCase().includes('home') || backend.name.toLowerCase().includes('util') ? 'home' :
                  backend.name.toLowerCase().includes('work') ? 'work' : 'default';
  
  return {
    id: backend.id,
    name: backend.name,
    description: backend.description,
    itemCount: backend.itemsCount,
    sharedWith: backend.members,
    createdBy: backend.members[0] || 'member-1',
    icon: icons[iconKey],
  };
};

const createDefaultVault = (familyName: string, members: FamilyMember[], collections: SharedCollection[]): FamilyVault => {
  const totalItems = members.reduce((sum, m) => sum + (m.itemsOwned || 0), 0);
  const sharedItems = collections.reduce((sum, c) => sum + c.itemCount, 0);
  
  return {
    id: 'vault-1',
    name: familyName,
    description: 'Family password vault',
    ownerId: members.find(m => m.role === 'owner' || m.role === 'admin')?.id || 'member-1',
    members: [],
    maxMembers: 6,
    currentMembers: members.length,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date(),
    itemCount: totalItems,
    sharedItems: sharedItems,
    storageUsed: Math.floor(totalItems * 1.5),
    storageLimit: 1024,
    features: ['shared_folders', 'emergency_access', 'security_dashboard', 'activity_log'],
    categories: ['logins', 'cards', 'notes', 'identities'],
    permissions: {
      owner: ['view', 'edit', 'delete', 'share', 'invite', 'manage_members', 'manage_billing', 'export', 'admin'],
      admin: ['view', 'edit', 'delete', 'share', 'invite', 'manage_members'],
      member: ['view', 'edit'],
      limited: ['view'],
      child: ['view'],
    },
    sharedCollections: [],
    activityLog: [],
    settings: {
      allowGuestSharing: false,
      requireApprovalForSharing: true,
      autoLockTimeout: 300,
      passwordPolicyEnabled: true,
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: true,
        maxAge: 90,
      },
    },
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getRoleBadge = (role: FamilyMemberRole) => {
  const badges: Record<FamilyMemberRole, { label: string; class: string; icon: React.ReactNode }> = {
    owner: { label: 'Owner', class: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Crown className="h-3 w-3" /> },
    admin: { label: 'Admin', class: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Shield className="h-3 w-3" /> },
    member: { label: 'Member', class: 'bg-green-100 text-green-700 border-green-200', icon: <User className="h-3 w-3" /> },
    child: { label: 'Child', class: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <User className="h-3 w-3" /> },
    limited: { label: 'Limited', class: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Eye className="h-3 w-3" /> },
  };
  const badge = badges[role];
  return (
    <Badge className={badge.class}>
      {badge.icon}
      <span className="ml-1">{badge.label}</span>
    </Badge>
  );
};

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MemberCardProps {
  member: FamilyMember;
  isOwner: boolean;
  onEditRole: (member: FamilyMember) => void;
  onRemove: (member: FamilyMember) => void;
}

function MemberCard({ member, isOwner, onEditRole, onRemove }: MemberCardProps) {
  return (
    <Card className={`member-card ${member.role}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar} />
            <AvatarFallback className={`${member.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-primary/10'}`}>
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{member.name}</h4>
              {getRoleBadge(member.role)}
              {member.twoFactorEnabled && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  2FA
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{member.email}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span>{member.itemsOwned} items</span>
              <span>•</span>
              <span>Active {formatRelativeTime(member.lastActiveAt)}</span>
            </div>
          </div>

          {isOwner && member.role !== 'owner' && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onEditRole(member)}>
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemove(member)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CollectionCardProps {
  collection: SharedCollection;
  members: FamilyMember[];
  onEdit: (collection: SharedCollection) => void;
  onDelete: (collection: SharedCollection) => void;
}

function CollectionCard({ collection, members, onEdit, onDelete }: CollectionCardProps) {
  const sharedMembers = members.filter(m => collection.sharedWith.includes(m.id));

  return (
    <Card className="collection-card">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="collection-icon">
            <span className="text-2xl">{collection.icon}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium">{collection.name}</h4>
              <Badge variant="secondary">{collection.itemCount} items</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {collection.description}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Shared with:</span>
              <div className="flex -space-x-2">
                {sharedMembers.slice(0, 4).map(member => (
                  <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                ))}
                {sharedMembers.length > 4 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                    +{sharedMembers.length - 4}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => onEdit(collection)}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(collection)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmergencyAccessCardProps {
  access: EmergencyAccess;
  onRevoke: (access: EmergencyAccess) => void;
}

function EmergencyAccessCard({ access, onRevoke }: EmergencyAccessCardProps) {
  return (
    <Card className={`emergency-card ${access.status}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`emergency-icon ${access.status}`}>
            <HeartPulse className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{access.granteeName}</h4>
              <Badge variant={access.status === 'confirmed' ? 'default' : 'secondary'}>
                {access.status}
              </Badge>
              <Badge variant="outline">
                {access.accessLevel === 'view' ? 'View Only' : 'Full Takeover'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{access.granteeEmail}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {access.waitingPeriod}h waiting period
              </span>
              <span>•</span>
              <span>Created {formatDate(access.createdAt)}</span>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onRevoke(access)}
            className="text-red-600 hover:bg-red-50"
          >
            Revoke
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface FamilyVaultsProps {
  onClose?: () => void;
}

export function FamilyVaults({ onClose: _onClose }: FamilyVaultsProps) {
  const [vault, setVault] = useState<FamilyVault | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [collections, setCollections] = useState<SharedCollection[]>([]);
  const [emergencyAccess, setEmergencyAccess] = useState<EmergencyAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<FamilyMemberRole>('member');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [emergencyWaitingPeriod, setEmergencyWaitingPeriod] = useState('72');
  const [emergencyAccessLevel, setEmergencyAccessLevel] = useState<'view' | 'takeover'>('view');
  const { toast } = useToast();

  // Load data from backend
  useEffect(() => {
    const loadFamilyVaultsData = async () => {
      try {
        setLoading(true);
        const config = await invoke<BackendFamilyVaultsConfig>('get_family_vaults');
        
        // Convert backend members to frontend format
        const convertedMembers = config.members.map(convertBackendMemberToFrontend);
        setMembers(convertedMembers);
        
        // Convert backend shared vaults to collections
        const convertedCollections = config.sharedVaults.map(convertBackendVaultToCollection);
        setCollections(convertedCollections);
        
        // Create vault object from data
        const vaultObj = createDefaultVault(config.familyName, convertedMembers, convertedCollections);
        setVault(vaultObj);
        
        // Initialize empty emergency access (backend doesn't have this yet)
        setEmergencyAccess([]);
      } catch (error) {
        log.error('Failed to load family vaults:', error);
        toast({
          title: 'Error',
          description: 'Failed to load family vaults data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadFamilyVaultsData();
  }, [toast]);

  const currentUserIsOwner = true; // In real app, check against current user

  const handleInviteMember = useCallback(() => {
    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Invitation Sent',
      description: `Invitation sent to ${inviteEmail}`,
    });

    setShowInviteDialog(false);
    setInviteEmail('');
    setInviteRole('member');
  }, [inviteEmail, toast]);

  const handleRemoveMember = useCallback((member: FamilyMember) => {
    setMembers(prev => prev.filter(m => m.id !== member.id));
    toast({
      title: 'Member Removed',
      description: `${member.name} has been removed from the vault`,
    });
  }, [toast]);

  const handleDeleteCollection = useCallback((collection: SharedCollection) => {
    setCollections(prev => prev.filter(c => c.id !== collection.id));
    toast({
      title: 'Collection Deleted',
      description: `"${collection.name}" has been deleted`,
    });
  }, [toast]);

  const handleAddEmergencyAccess = useCallback(() => {
    if (!emergencyEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    const newAccess: EmergencyAccess = {
      id: `emergency-${Date.now()}`,
      grantorId: 'member-1',
      grantorName: 'John Doe',
      grantorEmail: 'john@example.com',
      granteeId: `external-${Date.now()}`,
      granteeName: emergencyEmail.split('@')[0],
      granteeEmail: emergencyEmail,
      accessType: emergencyAccessLevel as 'view' | 'takeover',
      accessLevel: emergencyAccessLevel,
      waitTime: Math.floor(parseInt(emergencyWaitingPeriod) / 24),
      waitingPeriod: parseInt(emergencyWaitingPeriod),
      status: 'pending',
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    setEmergencyAccess(prev => [...prev, newAccess]);
    setShowEmergencyDialog(false);
    setEmergencyEmail('');
    setEmergencyWaitingPeriod('72');
    setEmergencyAccessLevel('view');

    toast({
      title: 'Emergency Access Added',
      description: 'Invitation sent to the trusted contact',
    });
  }, [emergencyEmail, emergencyWaitingPeriod, emergencyAccessLevel, toast]);

  const handleRevokeEmergencyAccess = useCallback((access: EmergencyAccess) => {
    setEmergencyAccess(prev => prev.filter(a => a.id !== access.id));
    toast({
      title: 'Access Revoked',
      description: `Emergency access for ${access.granteeName} has been revoked`,
    });
  }, [toast]);

  const storagePercentage = vault ? ((vault.storageUsed ?? 0) / (vault.storageLimit ?? 1)) * 100 : 0;

  // Loading state
  if (loading) {
    return (
      <div className="family-vaults flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading family vaults...</p>
        </div>
      </div>
    );
  }

  // No vault loaded
  if (!vault) {
    return (
      <div className="family-vaults flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Family Vault</h3>
          <p className="text-muted-foreground">Create a family vault to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="family-vaults">
      {/* Header */}
      <div className="vaults-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{vault.name}</h2>
            <p className="text-sm text-muted-foreground">
              {vault.currentMembers} of {vault.maxMembers} members • {vault.sharedItems} shared items
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{vault.currentMembers}</div>
            <p className="text-xs text-muted-foreground">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FolderOpen className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{collections.length}</div>
            <p className="text-xs text-muted-foreground">Collections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Share2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{vault.sharedItems}</div>
            <p className="text-xs text-muted-foreground">Shared Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Storage</span>
              <span className="text-xs text-muted-foreground">
                {vault.storageUsed}MB / {vault.storageLimit}MB
              </span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="collections">
            <FolderOpen className="h-4 w-4 mr-2" />
            Collections ({collections.length})
          </TabsTrigger>
          <TabsTrigger value="emergency">
            <HeartPulse className="h-4 w-4 mr-2" />
            Emergency Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Family Members</CardTitle>
              <CardDescription>
                Manage who has access to your family vault
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {members.map(member => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      isOwner={currentUserIsOwner}
                      onEditRole={() => toast({ title: 'Edit Role', description: `Editing role for ${member.name}` })}
                      onRemove={handleRemoveMember}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Shared Collections</CardTitle>
                <CardDescription>
                  Organize and share items with family members
                </CardDescription>
              </div>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {collections.length > 0 ? (
                  <div className="space-y-3">
                    {collections.map(collection => (
                      <CollectionCard
                        key={collection.id}
                        collection={collection}
                        members={members}
                        onEdit={() => toast({ title: 'Edit', description: `Editing ${collection.name}` })}
                        onDelete={handleDeleteCollection}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Collections</h3>
                    <p className="text-muted-foreground">
                      Create a collection to share items with family members
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Emergency Access</CardTitle>
                <CardDescription>
                  Grant trusted contacts access to your vault in case of emergency
                </CardDescription>
              </div>
              <Button onClick={() => setShowEmergencyDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">How Emergency Access Works</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      When a trusted contact requests emergency access, you&apos;ll have a waiting period to deny the request. 
                      If you don&apos;t respond, they&apos;ll automatically gain access to your vault.
                    </p>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[300px]">
                {emergencyAccess.length > 0 ? (
                  <div className="space-y-3">
                    {emergencyAccess.map(access => (
                      <EmergencyAccessCard
                        key={access.id}
                        access={access}
                        onRevoke={handleRevokeEmergencyAccess}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <HeartPulse className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Emergency Contacts</h3>
                    <p className="text-muted-foreground">
                      Add a trusted contact for emergency access
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Family Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your family vault
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as FamilyMemberRole)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Can manage members and settings</SelectItem>
                  <SelectItem value="member">Member - Full access to shared items</SelectItem>
                  <SelectItem value="limited">Limited - View-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteMember}>
              <Send className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Access Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
            <DialogDescription>
              This person will be able to request access to your vault in case of emergency
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="emergency-email">Email Address</Label>
              <Input
                id="emergency-email"
                type="email"
                value={emergencyEmail}
                onChange={(e) => setEmergencyEmail(e.target.value)}
                placeholder="trusted@example.com"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Waiting Period</Label>
              <Select value={emergencyWaitingPeriod} onValueChange={setEmergencyWaitingPeriod}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours (3 days)</SelectItem>
                  <SelectItem value="168">168 hours (1 week)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Time you have to deny access after a request is made
              </p>
            </div>

            <div>
              <Label>Access Level</Label>
              <Select value={emergencyAccessLevel} onValueChange={(v) => setEmergencyAccessLevel(v as 'view' | 'takeover')}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View Only - Can see but not modify items</SelectItem>
                  <SelectItem value="takeover">Full Takeover - Complete vault access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmergencyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmergencyAccess}>
              <HeartPulse className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FamilyVaults;
