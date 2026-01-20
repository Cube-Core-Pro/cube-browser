"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PasswordVaultService, PasswordGeneratorService, PasswordEntry } from '@/lib/services/password-service';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, EyeOff, Copy, Edit, Trash2, Save, X,
  Globe, User, Lock, Calendar, Clock,
  ExternalLink
} from 'lucide-react';

interface PasswordItemProps {
  password: PasswordEntry;
  masterPassword: string;
  onDelete: () => void;
  onCopy: () => void;
  onUpdate: () => void;
}

export const PasswordItem: React.FC<PasswordItemProps> = ({ 
  password, 
  masterPassword,
  onDelete, 
  onCopy,
  onUpdate 
}) => {
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [strength, setStrength] = useState<{ score: number; label: string } | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: password.name,
    username: password.username,
    password: '',
    url: password.url || '',
    notes: password.notes || '',
    category: password.category
  });

  const handleRevealPassword = async () => {
    if (showPassword) {
      setShowPassword(false);
      setDecryptedPassword(null);
      return;
    }

    try {
      const decrypted: string = await PasswordVaultService.getPassword(
        password.id, 
        masterPassword
      );
      setDecryptedPassword(decrypted);
      setShowPassword(true);

      // Check strength
      const strengthResult = await PasswordGeneratorService.checkStrength(decrypted);
      setStrength({ score: strengthResult.score * 25, label: strengthResult.estimated_crack_time });

      // Update last used
      await PasswordVaultService.markUsed(password.id);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to decrypt password",
        variant: "destructive",
      });
    }
  };

  const handleCopyUsername = async () => {
    try {
      await navigator.clipboard.writeText(password.username);
      toast({
        title: "Copied",
        description: "Username copied to clipboard",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy username",
        variant: "destructive",
      });
    }
  };

  const handleAutoFill = async () => {
    try {
      const decrypted: string = await PasswordVaultService.getPassword(
        password.id, 
        masterPassword
      );

      // Auto-fill would be done through browser automation
      // For now, just copy to clipboard
      await navigator.clipboard.writeText(decrypted);

      toast({
        title: "Copied",
        description: "Password copied to clipboard for manual entry",
      });

      await PasswordVaultService.markUsed(password.id);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to auto-fill",
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      await PasswordVaultService.update({
        entryId: password.id,
        name: editForm.name,
        username: editForm.username,
        password: editForm.password || undefined,
        url: editForm.url || undefined,
        notes: editForm.notes || undefined,
        category: editForm.category,
        masterPassword
      });

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStrengthColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (isEditing) {
    return (
      <Card className="border-2 border-primary">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Name"
                className="mb-2 font-semibold"
              />
              <Badge variant="outline">{editForm.category}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Username</label>
            <Input
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              placeholder="Username or email"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">New Password (leave empty to keep current)</label>
            <Input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Website URL</label>
            <Input
              value={editForm.url}
              onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground" id="edit-category-label">Category</label>
            <select
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              aria-labelledby="edit-category-label"
              title="Select category"
            >
              <option>Social Media</option>
              <option>Banking</option>
              <option>Work</option>
              <option>Shopping</option>
              <option>Email</option>
              <option>Entertainment</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Notes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full px-3 py-2 border rounded-md h-20 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveEdit}
              size="sm"
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              size="sm"
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{password.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{password.category}</Badge>
              {strength && showPassword && (
                <Badge className={getStrengthColor(strength.score)}>
                  {strength.label}
                </Badge>
              )}
            </div>
          </div>
          {password.url && (
            <a
              href={password.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary"
              title={`Open ${password.name} website`}
              aria-label={`Open ${password.name} website in new tab`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Username */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{password.username}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyUsername}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {/* Password */}
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1 font-mono">
            {showPassword && decryptedPassword ? decryptedPassword : '••••••••••••'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRevealPassword}
          >
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>

        {/* Website URL */}
        {password.url && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground flex-1 truncate">
              {password.url}
            </span>
          </div>
        )}

        {/* Notes */}
        {password.notes && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            {password.notes}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Created: {formatDate(password.date_created)}</span>
          </div>
          {password.last_used && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Used: {formatDate(password.last_used)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoFill}
            className="flex-1"
          >
            Auto-Fill
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
