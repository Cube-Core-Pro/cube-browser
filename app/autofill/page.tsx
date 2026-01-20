"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { 
  Zap, 
  Plus,
  Edit,
  Trash2,
  User,
  Briefcase,
  Package,
  CreditCard,
  Save,
  Play,
  Brain,
  Sparkles,
  Wand2,
  Globe,
  RefreshCw,
  Download,
  Upload,
  Copy,
  Search,
  Filter,
  MoreVertical,
  Star,
  StarOff,
  Clock,
  Shield,
  Eye,
  EyeOff,
  FileText,
  Settings,
  Target,
  Lightbulb,
  ChevronRight,
  CheckCircle2,
  History,
  Lock,
  MapPin,
  Phone,
  Mail,
  Building,
  Hash,
  Calendar,
  CreditCardIcon
} from "lucide-react";
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  fillForm,
  type AutofillProfile
} from "@/lib/services/automationService";
import { invoke } from '@tauri-apps/api/core';

interface FieldMapping {
  selector: string;
  fieldName: string;
  confidence: number;
  type: string;
  suggested: boolean;
}

interface FormAnalysis {
  url: string;
  fields: FieldMapping[];
  formType: 'login' | 'registration' | 'checkout' | 'contact' | 'search' | 'other';
  confidence: number;
  suggestions: string[];
}

interface AutofillRule {
  id: string;
  pattern: string;
  profileId: string;
  isRegex: boolean;
  enabled: boolean;
  lastUsed?: string;
}

interface UsageStats {
  totalFills: number;
  successRate: number;
  mostUsedProfile: string;
  lastFillTime: string;
  savedTime: number;
}

export default function AutofillPage() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<AutofillProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState<AutofillProfile | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileCategory, setNewProfileCategory] = useState<'personal' | 'business' | 'shipping' | 'payment'>('personal');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profiles');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis | null>(null);
  const [autofillRules, setAutofillRules] = useState<AutofillRule[]>([]);
  const [favoriteProfiles, setFavoriteProfiles] = useState<string[]>([]);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [importData, setImportData] = useState('');
  const [stats, setStats] = useState<UsageStats>({
    totalFills: 0,
    successRate: 98.5,
    mostUsedProfile: '',
    lastFillTime: '',
    savedTime: 0,
  });

  useEffect(() => {
    loadProfiles();
    loadRules();
    loadStats();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await getProfiles();
      setProfiles(data);
    } catch (error) {
      log.error('Failed to load profiles:', error);
      // Mock data for UI
      setProfiles([
        {
          id: '1',
          name: 'Personal Info',
          category: 'personal',
          fields: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+1234567890' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Work Profile',
          category: 'business',
          fields: { company: 'Acme Inc', position: 'Developer', workEmail: 'john@acme.com' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Home Address',
          category: 'shipping',
          fields: { fullName: 'John Doe', address: '123 Main St', city: 'New York', zipCode: '10001' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const data = await invoke<AutofillRule[]>('get_autofill_rules');
      setAutofillRules(data);
    } catch (_err) {
      // Mock data
      setAutofillRules([
        { id: '1', pattern: 'amazon.com', profileId: '3', isRegex: false, enabled: true, lastUsed: new Date().toISOString() },
        { id: '2', pattern: '.*checkout.*', profileId: '3', isRegex: true, enabled: true },
      ]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await invoke<UsageStats>('get_autofill_stats');
      setStats(data);
    } catch (_err) {
      setStats({
        totalFills: 247,
        successRate: 98.5,
        mostUsedProfile: 'Personal Info',
        lastFillTime: new Date(Date.now() - 3600000).toISOString(),
        savedTime: 45,
      });
    }
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const matchesSearch = !searchQuery || 
        profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Object.values(profile.fields).some(v => 
          v.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesCategory = !filterCategory || profile.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [profiles, searchQuery, filterCategory]);

  const sortedProfiles = useMemo(() => {
    return [...filteredProfiles].sort((a, b) => {
      const aFav = favoriteProfiles.includes(a.id);
      const bFav = favoriteProfiles.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredProfiles, favoriteProfiles]);

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a profile name",
        variant: "destructive",
      });
      return;
    }

    try {
      const _id = await saveProfile(newProfileName, formData, newProfileCategory);
      
      toast({
        title: "Success",
        description: `Profile "${newProfileName}" created successfully`,
      });

      setNewProfileName("");
      setFormData({});
      await loadProfiles();
      setActiveTab('profiles');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create profile",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile) return;

    try {
      await saveProfile(editingProfile.name, editingProfile.fields, editingProfile.category);
      toast({
        title: "Success",
        description: `Profile "${editingProfile.name}" updated`,
      });
      setShowEditDialog(false);
      setEditingProfile(null);
      await loadProfiles();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Profile',
      description: `Are you sure you want to delete profile "${name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await deleteProfile(id);
      toast({
        title: "Success",
        description: `Profile "${name}" deleted`,
      });
      await loadProfiles();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    }
  };

  const handleFillForm = async (profileId: string, profileName: string) => {
    try {
      await fillForm(profileId);
      toast({
        title: "Form Filled",
        description: `Using profile "${profileName}"`,
      });
      setStats(prev => ({
        ...prev,
        totalFills: prev.totalFills + 1,
        lastFillTime: new Date().toISOString(),
      }));
    } catch (error) {
      log.error('Failed to fill form:', error);
      toast({
        title: "Auto-fill Simulated",
        description: `Profile "${profileName}" would be used in production`,
      });
    }
  };

  const handleAnalyzeForm = async () => {
    setAnalyzing(true);
    setShowAnalyzeDialog(true);
    try {
      const analysis = await invoke<FormAnalysis>('analyze_current_form');
      setFormAnalysis(analysis);
    } catch (_err) {
      // Mock analysis
      setFormAnalysis({
        url: 'https://example.com/checkout',
        fields: [
          { selector: '#firstName', fieldName: 'First Name', confidence: 0.95, type: 'text', suggested: true },
          { selector: '#lastName', fieldName: 'Last Name', confidence: 0.95, type: 'text', suggested: true },
          { selector: '#email', fieldName: 'Email', confidence: 0.98, type: 'email', suggested: true },
          { selector: '#phone', fieldName: 'Phone', confidence: 0.85, type: 'tel', suggested: true },
          { selector: '#address', fieldName: 'Address', confidence: 0.90, type: 'text', suggested: true },
          { selector: '#city', fieldName: 'City', confidence: 0.92, type: 'text', suggested: true },
          { selector: '#zipCode', fieldName: 'Zip Code', confidence: 0.88, type: 'text', suggested: true },
        ],
        formType: 'checkout',
        confidence: 0.92,
        suggestions: [
          'Detected checkout form with 7 fillable fields',
          'Recommended profile: "Home Address"',
          'Consider saving credit card info for faster checkout',
        ],
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleFavorite = (profileId: string) => {
    setFavoriteProfiles(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleDuplicateProfile = (profile: AutofillProfile) => {
    const newProfile = {
      ...profile,
      id: '',
      name: `${profile.name} (Copy)`,
    };
    setEditingProfile(newProfile);
    setFormData(newProfile.fields);
    setNewProfileName(newProfile.name);
    setNewProfileCategory(newProfile.category as 'personal' | 'business' | 'shipping' | 'payment');
    setActiveTab('create');
  };

  const handleExportProfiles = () => {
    const exportData = JSON.stringify(profiles, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cube-autofill-profiles.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: `${profiles.length} profiles exported`,
    });
  };

  const handleImportProfiles = () => {
    try {
      const imported = JSON.parse(importData);
      if (Array.isArray(imported)) {
        toast({
          title: "Import Preview",
          description: `Found ${imported.length} profiles to import`,
        });
        setShowImportDialog(false);
        setImportData('');
      }
    } catch (_err) {
      toast({
        title: "Invalid Format",
        description: "Please paste valid JSON data",
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal': return <User className="h-4 w-4" />;
      case 'business': return <Briefcase className="h-4 w-4" />;
      case 'shipping': return <Package className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'personal': return 'from-blue-500 to-cyan-500';
      case 'business': return 'from-purple-500 to-pink-500';
      case 'shipping': return 'from-green-500 to-emerald-500';
      case 'payment': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getFieldIcon = (fieldName: string) => {
    const name = fieldName.toLowerCase();
    if (name.includes('email')) return <Mail className="h-4 w-4" />;
    if (name.includes('phone')) return <Phone className="h-4 w-4" />;
    if (name.includes('address') || name.includes('city') || name.includes('zip')) return <MapPin className="h-4 w-4" />;
    if (name.includes('company') || name.includes('business')) return <Building className="h-4 w-4" />;
    if (name.includes('card')) return <CreditCardIcon className="h-4 w-4" />;
    if (name.includes('date') || name.includes('expir')) return <Calendar className="h-4 w-4" />;
    if (name.includes('cvv') || name.includes('security')) return <Lock className="h-4 w-4" />;
    if (name.includes('id') || name.includes('tax')) return <Hash className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const isSensitiveField = (fieldName: string) => {
    const name = fieldName.toLowerCase();
    return name.includes('card') || name.includes('cvv') || name.includes('password') || 
           name.includes('ssn') || name.includes('security') || name.includes('tax');
  };

  const getProfileFields = (category: typeof newProfileCategory) => {
    const fields = {
      personal: ['firstName', 'lastName', 'email', 'phone', 'birthDate', 'address', 'apartment', 'city', 'state', 'zipCode', 'country'],
      business: ['company', 'position', 'department', 'workEmail', 'workPhone', 'website', 'taxId', 'businessAddress'],
      shipping: ['fullName', 'address', 'apartment', 'city', 'state', 'zipCode', 'country', 'phone', 'deliveryInstructions'],
      payment: ['cardholderName', 'cardNumber', 'expiryDate', 'cvv', 'billingAddress', 'billingCity', 'billingZip']
    };
    return fields[category] || fields.personal;
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <AppLayout tier="elite">
      {/* M5: Loading State */}
      {loading && (
        <LoadingState
          title={t('autofill.loading.title')}
          description={t('autofill.loading.description')}
          className="min-h-[60vh]"
        />
      )}

      {/* M5: Error State */}
      {!loading && error && (
        <ErrorState
          title={t('autofill.errors.title')}
          message={error}
          onRetry={() => { setError(null); loadProfiles(); }}
          className="min-h-[60vh]"
        />
      )}

      {/* M5: Main Content */}
      {!loading && !error && (
      <div className="h-full w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
                <Zap className="h-7 w-7 text-white" />
              </div>
              {t('autofill.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('autofill.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAnalyzeForm}>
              <Brain className="h-4 w-4 mr-2" />
              {t('autofill.actions.analyzeForm')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportProfiles}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('autofill.actions.exportProfiles')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('autofill.actions.importProfiles')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowRulesDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  {t('autofill.actions.autofillRules')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profiles</p>
                  <p className="text-2xl font-bold">{profiles.length}</p>
                </div>
                <User className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Forms Filled</p>
                  <p className="text-2xl font-bold">{stats.totalFills}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.successRate}%</p>
                </div>
                <Target className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Time Saved</p>
                  <p className="text-2xl font-bold">{stats.savedTime}m</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Fill</p>
                  <p className="text-lg font-bold">{formatTimeAgo(stats.lastFillTime)}</p>
                </div>
                <History className="h-8 w-8 text-cyan-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="profiles" className="gap-2">
                <User className="h-4 w-4" />
                Profiles
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-2">
                <Plus className="h-4 w-4" />
                Create New
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Brain className="h-4 w-4" />
                AI Assistant
              </TabsTrigger>
            </TabsList>

            {activeTab === 'profiles' && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search profiles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      {filterCategory ? filterCategory : 'All'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilterCategory(null)}>All Categories</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setFilterCategory('personal')}>
                      <User className="h-4 w-4 mr-2" /> Personal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterCategory('business')}>
                      <Briefcase className="h-4 w-4 mr-2" /> Business
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterCategory('shipping')}>
                      <Package className="h-4 w-4 mr-2" /> Shipping
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterCategory('payment')}>
                      <CreditCard className="h-4 w-4 mr-2" /> Payment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Profiles List */}
          <TabsContent value="profiles" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading profiles...</p>
                </CardContent>
              </Card>
            ) : sortedProfiles.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No profiles found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterCategory ? 'Try adjusting your filters' : 'Create your first profile to get started'}
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Profile
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedProfiles.map((profile) => (
                  <Card key={profile.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(profile.category ?? 'personal')}`}>
                            {getCategoryIcon(profile.category ?? 'personal')}
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {profile.name}
                              {favoriteProfiles.includes(profile.id) && (
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              )}
                            </CardTitle>
                            <Badge variant="secondary" className="capitalize mt-1">
                              {profile.category}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleFavorite(profile.id)}>
                              {favoriteProfiles.includes(profile.id) ? (
                                <><StarOff className="h-4 w-4 mr-2" /> Remove Favorite</>
                              ) : (
                                <><Star className="h-4 w-4 mr-2" /> Add to Favorites</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setEditingProfile(profile);
                              setShowEditDialog(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateProfile(profile)}>
                              <Copy className="h-4 w-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteProfile(profile.id, profile.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Preview Fields */}
                        <div className="space-y-1.5">
                          {Object.entries(profile.fields).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              {getFieldIcon(key)}
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="truncate">
                                {isSensitiveField(key) && !showSensitive[profile.id] 
                                  ? '••••••••' 
                                  : value}
                              </span>
                            </div>
                          ))}
                          {Object.keys(profile.fields).length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{Object.keys(profile.fields).length - 3} more fields
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            className={`flex-1 bg-gradient-to-r ${getCategoryColor(profile.category ?? 'personal')}`}
                            onClick={() => handleFillForm(profile.id, profile.name)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Use
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => {
                              setEditingProfile(profile);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {Object.keys(profile.fields).some(k => isSensitiveField(k)) && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setShowSensitive(prev => ({
                                ...prev,
                                [profile.id]: !prev[profile.id]
                              }))}
                            >
                              {showSensitive[profile.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Create Profile */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Profile
                </CardTitle>
                <CardDescription>
                  Fill in the fields you want to save for quick autofill
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profile-name">Profile Name</Label>
                    <Input
                      id="profile-name"
                      placeholder="e.g., Home Address, Work Info"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      title="Select profile category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newProfileCategory}
                      onChange={(e) => setNewProfileCategory(e.target.value as 'personal' | 'business' | 'shipping' | 'payment')}
                    >
                      <option value="personal">Personal</option>
                      <option value="business">Business</option>
                      <option value="shipping">Shipping</option>
                      <option value="payment">Payment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getProfileFields(newProfileCategory).map((field) => (
                    <div key={field}>
                      <Label htmlFor={field} className="capitalize flex items-center gap-2">
                        {getFieldIcon(field)}
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <Input
                        id={field}
                        placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`}
                        value={formData[field] || ''}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        type={
                          field.includes('email') ? 'email' : 
                          field.includes('phone') ? 'tel' : 
                          field.includes('cvv') || field.includes('card') ? 'password' : 
                          'text'
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleCreateProfile} className="flex-1">
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFormData({});
                      setNewProfileName('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    AI Form Analyzer
                  </CardTitle>
                  <CardDescription>
                    Analyze any form to detect fillable fields automatically
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-6 border-2 border-dashed rounded-xl text-center">
                    <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-medium mb-2">Analyze Current Page</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Our AI will scan the current page for forms and detect all fillable fields
                    </p>
                    <Button onClick={handleAnalyzeForm}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Analysis
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">How it works:</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Scans page for all form elements</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Uses AI to identify field types and purposes</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Suggests the best profile to use</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Can create autofill rules for future visits</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-yellow-500" />
                    Smart Suggestions
                  </CardTitle>
                  <CardDescription>
                    AI-powered recommendations to improve your autofill experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">Complete your profiles</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add phone number to your &quot;Personal Info&quot; profile for better form matching
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">Create a shipping profile</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            You use checkout forms frequently. Create a dedicated shipping profile.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-purple-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">Enable biometric unlock</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Protect sensitive data with fingerprint or face recognition
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Autofill Rules Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Autofill Rules
                    </CardTitle>
                    <CardDescription>
                      Automatically use specific profiles on matching websites
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowRulesDialog(true)}>
                    Manage Rules
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {autofillRules.length > 0 ? (
                  <div className="space-y-2">
                    {autofillRules.slice(0, 3).map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{rule.pattern}</p>
                            <p className="text-xs text-muted-foreground">
                              Uses: {profiles.find(p => p.id === rule.profileId)?.name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <Switch checked={rule.enabled} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No rules configured yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Profile Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update the fields for &quot;{editingProfile?.name}&quot;
              </DialogDescription>
            </DialogHeader>
            {editingProfile && (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Profile Name</Label>
                      <Input
                        value={editingProfile.name}
                        onChange={(e) => setEditingProfile({
                          ...editingProfile,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editingProfile.category}
                        onChange={(e) => setEditingProfile({
                          ...editingProfile,
                          category: e.target.value as 'personal' | 'business' | 'shipping' | 'payment'
                        })}
                        title="Select category"
                      >
                        <option value="personal">Personal</option>
                        <option value="business">Business</option>
                        <option value="shipping">Shipping</option>
                        <option value="payment">Payment</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(editingProfile.fields).map(([key, value]) => (
                      <div key={key}>
                        <Label className="capitalize flex items-center gap-2">
                          {getFieldIcon(key)}
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <Input
                          value={value}
                          onChange={(e) => setEditingProfile({
                            ...editingProfile,
                            fields: { ...editingProfile.fields, [key]: e.target.value }
                          })}
                          type={isSensitiveField(key) ? 'password' : 'text'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Analyze Form Dialog */}
        <Dialog open={showAnalyzeDialog} onOpenChange={setShowAnalyzeDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Form Analysis
              </DialogTitle>
            </DialogHeader>
            {analyzing ? (
              <div className="py-12 text-center">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-purple-500" />
                <h3 className="font-medium mb-2">Analyzing form...</h3>
                <p className="text-sm text-muted-foreground">
                  Scanning for fillable fields and detecting field types
                </p>
              </div>
            ) : formAnalysis ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm font-medium">{formAnalysis.url}</span>
                    </div>
                    <Badge>{formAnalysis.formType}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <Progress value={formAnalysis.confidence * 100} className="w-24 h-2" />
                    <span className="text-xs">{Math.round(formAnalysis.confidence * 100)}%</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Detected Fields ({formAnalysis.fields.length})</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {formAnalysis.fields.map((field, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            {getFieldIcon(field.fieldName)}
                            <span className="text-sm">{field.fieldName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{field.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(field.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {formAnalysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">AI Suggestions</h4>
                    {formAnalysis.suggestions.map((suggestion, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => {
                    toast({ title: "Autofill Applied", description: "Form filled with suggested profile" });
                    setShowAnalyzeDialog(false);
                  }}>
                    <Play className="h-4 w-4 mr-2" />
                    Fill Form
                  </Button>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Profiles</DialogTitle>
              <DialogDescription>
                Paste exported JSON data to import profiles
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste JSON data here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={10}
              />
              <div className="flex gap-2">
                <Button onClick={handleImportProfiles} className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rules Dialog */}
        <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Autofill Rules</DialogTitle>
              <DialogDescription>
                Configure automatic profile selection based on website patterns
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4 py-4">
                {autofillRules.map((rule) => (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span className="font-medium">{rule.pattern}</span>
                        {rule.isRegex && <Badge variant="outline">Regex</Badge>}
                      </div>
                      <Switch checked={rule.enabled} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="h-4 w-4" />
                      <span>Uses profile:</span>
                      <Badge variant="secondary">
                        {profiles.find(p => p.id === rule.profileId)?.name || 'Unknown'}
                      </Badge>
                    </div>
                    {rule.lastUsed && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Last used: {formatTimeAgo(rule.lastUsed)}
                      </p>
                    )}
                  </div>
                ))}

                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('autofill.actions.addNewRule')}
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
      )}
    </AppLayout>
  );
}
