"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PasswordVaultService, PasswordEntry } from '@/lib/services/password-service';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus } from 'lucide-react';

// Tour imports
import { TourProvider, TourTooltip, TourOverlay, TourLauncher, TourWelcomeModal, TourCompletionModal } from '@/components/tour';
import { allPasswordTourSteps, allPasswordTourSections } from './tour';
import { PasswordItem } from './PasswordItem';

interface PasswordVaultProps {
  masterPassword: string;
  onStatsUpdate?: () => void;
}

const CATEGORIES = [
  'All',
  'Social Media',
  'Banking',
  'Work',
  'Shopping',
  'Email',
  'Entertainment',
  'Other'
];

export const PasswordVault: React.FC<PasswordVaultProps> = ({ 
  masterPassword,
  onStatsUpdate 
}) => {
  const { toast } = useToast();
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showNewPasswordDialog, setShowNewPasswordDialog] = useState(false);

  // Tour states
  const [showTourWelcome, setShowTourWelcome] = useState(false);
  const [showTourCompletion, setShowTourCompletion] = useState(false);

  // New password form
  const [newPassword, setNewPassword] = useState({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: 'Other'
  });

  useEffect(() => {
    loadPasswords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterPasswords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwords, searchQuery, selectedCategory]);

  // Tour welcome check
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('cube-password-tour-seen');
    if (!hasSeenTour) {
      const timer = setTimeout(() => setShowTourWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Tour handlers
  const handleStartTour = () => {
    setShowTourWelcome(false);
    localStorage.setItem('cube-password-tour-seen', 'true');
  };

  const handleSkipTour = () => {
    setShowTourWelcome(false);
    localStorage.setItem('cube-password-tour-seen', 'true');
  };

  const handleRestartTour = () => {
    setShowTourCompletion(false);
  };

  const loadPasswords = async () => {
    try {
      setLoading(true);
      const allPasswords: PasswordEntry[] = await PasswordVaultService.getAll();
      setPasswords(allPasswords);
      onStatsUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load passwords",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPasswords = () => {
    let filtered = passwords;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query) ||
        p.url?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    setFilteredPasswords(filtered);
  };

  const handleAddPassword = async () => {
    try {
      await PasswordVaultService.save({
        name: newPassword.name,
        username: newPassword.username,
        password: newPassword.password,
        url: newPassword.url || undefined,
        notes: newPassword.notes || undefined,
        category: newPassword.category,
        masterPassword
      });

      toast({
        title: "Success",
        description: "Password added successfully",
      });

      setShowNewPasswordDialog(false);
      setNewPassword({
        name: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        category: 'Other'
      });
      loadPasswords();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add password",
        variant: "destructive",
      });
    }
  };

  const handleDeletePassword = async (id: string) => {
    if (!confirm('Are you sure you want to delete this password?')) return;

    try {
      await PasswordVaultService.delete(id);
      toast({
        title: "Success",
        description: "Password deleted successfully",
      });
      loadPasswords();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete password",
        variant: "destructive",
      });
    }
  };

  const handleCopyPassword = async (id: string) => {
    try {
      const decrypted: string = await PasswordVaultService.getPassword(id, masterPassword);
      await navigator.clipboard.writeText(decrypted);
      toast({
        title: "Copied",
        description: "Password copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to copy password",
        variant: "destructive",
      });
    }
  };

  return (
    <TourProvider
      steps={allPasswordTourSteps}
      sections={allPasswordTourSections}
      onComplete={() => setShowTourCompletion(true)}
    >
    <div className="space-y-4" data-tour="vault-container">
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative" data-tour="search-bar">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search passwords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap" data-tour="category-filters">
              {CATEGORIES.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>

            {/* Add Button */}
            <Button
              onClick={() => setShowNewPasswordDialog(true)}
              className="whitespace-nowrap"
              data-tour="add-password-btn"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password List */}
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Loading passwords...
          </CardContent>
        </Card>
      ) : filteredPasswords.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No passwords found. Click &quot;Add Password&quot; to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-tour="password-list">
          {filteredPasswords.map(password => (
            <PasswordItem
              key={password.id}
              password={password}
              masterPassword={masterPassword}
              onDelete={() => handleDeletePassword(password.id)}
              onCopy={() => handleCopyPassword(password.id)}
              onUpdate={loadPasswords}
            />
          ))}
        </div>
      )}

      {/* New Password Dialog */}
      {showNewPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-tour="password-dialog">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Password</CardTitle>
              <CardDescription>
                Enter the details for your new password entry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="e.g., Facebook Account"
                  value={newPassword.name}
                  onChange={(e) => setNewPassword({ ...newPassword, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Username *</label>
                <Input
                  placeholder="e.g., user@example.com"
                  value={newPassword.username}
                  onChange={(e) => setNewPassword({ ...newPassword, username: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password *</label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={newPassword.password}
                  onChange={(e) => setNewPassword({ ...newPassword, password: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Website URL</label>
                <Input
                  placeholder="https://example.com"
                  value={newPassword.url}
                  onChange={(e) => setNewPassword({ ...newPassword, url: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium" id="category-label">Category</label>
                <select
                  value={newPassword.category}
                  onChange={(e) => setNewPassword({ ...newPassword, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  aria-labelledby="category-label"
                  title="Select password category"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  placeholder="Additional notes..."
                  value={newPassword.notes}
                  onChange={(e) => setNewPassword({ ...newPassword, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md h-20 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddPassword}
                  disabled={!newPassword.name || !newPassword.username || !newPassword.password}
                  className="flex-1"
                >
                  Save Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewPasswordDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tour Components */}
      <TourTooltip />
      <TourOverlay />
      <TourLauncher />
      
      <TourWelcomeModal
        isOpen={showTourWelcome}
        onClose={handleSkipTour}
        onStartTour={handleStartTour}
        onSkip={handleSkipTour}
        title="Welcome to Password Vault!"
        subtitle="Your secure enterprise-grade password manager with military-level encryption. This tour will guide you through all the features to help you manage your credentials safely."
      />

      <TourCompletionModal
        isOpen={showTourCompletion}
        onClose={() => setShowTourCompletion(false)}
        onRestart={handleRestartTour}
        title="Password Vault Mastered!"
        subtitle="You've completed the Password Vault tour!"
        nextSteps={[
          { text: 'Security Philosophy Understood' },
          { text: 'Password Management Expert' },
          { text: 'Security Features Learned' },
          { text: 'Autofill Integration Mastered' },
          { text: 'Advanced Features Unlocked' }
        ]}
      />
    </div>
    </TourProvider>
  );
};
