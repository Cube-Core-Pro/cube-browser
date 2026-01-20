'use client';

import React, { useState, useEffect } from 'react';
import { automationService } from '../../lib/services/automationService';
import type { AutofillProfile, FormField } from '../../lib/services/automationService';

export const AutofillManager: React.FC = () => {
  const [profiles, setProfiles] = useState<AutofillProfile[]>([]);
  const [detectedFields, setDetectedFields] = useState<FormField[]>([]);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const profileList = await automationService.getProfiles();
      setProfiles(profileList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectForm = async () => {
    setDetecting(true);
    setError(null);
    
    try {
      // In a real implementation, you would gather field metadata from the page first
      // For now, we use an empty array which the backend can handle
      const result = await automationService.detectFields([]);
      const fields: FormField[] = result.fields.map(f => ({
        selector: f.id || f.name || '',
        value: '',
        type: f.type || 'text',
      }));
      setDetectedFields(fields);
      
      if (fields.length === 0) {
        setError('No form fields detected on the current page');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect form');
    } finally {
      setDetecting(false);
    }
  };

  const handleFillForm = async (profileId: string) => {
    try {
      await automationService.fillForm(profileId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill form');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    try {
      const formDataObj: Record<string, string> = {};
      detectedFields.forEach((field, index) => {
        formDataObj[field.selector || `field-${index}`] = field.value || '';
      });
      
      await automationService.saveProfile(newProfileName, formDataObj, 'personal');
      setNewProfileName('');
      setShowNewProfile(false);
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      await automationService.deleteProfile(profileId);
      await loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading autofill profiles...</div>;
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Autofill Manager</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDetectForm}
              disabled={detecting}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-muted disabled:text-muted-foreground transition-colors"
            >
              {detecting ? 'Detecting...' : 'Detect Form'}
            </button>
            <button
              onClick={() => setShowNewProfile(!showNewProfile)}
              disabled={detectedFields.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
            >
              Save as Profile
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Save Profile Form */}
      {showNewProfile && detectedFields.length > 0 && (
        <div className="p-6 bg-muted border-b border-border">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Profile Name
              </label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="e.g., Personal Info, Work Address, etc."
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                required
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                This profile will save {detectedFields?.length || 0} field(s):
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {detectedFields?.map((field, idx) => (
                  <li key={idx}>
                    • {field.selector} ({field.type})
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Profile
              </button>
              <button
                type="button"
                onClick={() => setShowNewProfile(false)}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detected Fields */}
      {detectedFields.length > 0 && (
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Detected Form Fields
          </h3>
          
          <div className="space-y-3">
            {detectedFields.map((field, idx) => (
              <div
                key={idx}
                className="p-3 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {field.selector}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Type: {field.type} • Selector: {field.selector}
                    </p>
                  </div>
                  {field.value && (
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {field.value}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profiles List */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Saved Profiles</h3>
        
        {profiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No autofill profiles yet. Detect a form and save it as a profile to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`p-4 border rounded-lg transition-all ${
                  selectedProfile === profile.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-border hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="mb-3">
                  <h4 className="text-lg font-semibold text-foreground mb-1">
                    {profile.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(profile.fields).length || 0} field(s)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Category: {profile.category}
                  </p>
                </div>

                <details className="mb-3">
                  <summary className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                    View fields
                  </summary>
                  <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                    {Object.entries(profile.fields).map(([key, value], idx) => (
                      <li key={idx}>
                        • {key}: {value}
                      </li>
                    ))}
                  </ul>
                </details>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedProfile(profile.id);
                      handleFillForm(profile.id);
                    }}
                    className="flex-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    Fill Form
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
