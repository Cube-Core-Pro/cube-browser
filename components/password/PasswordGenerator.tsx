"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PasswordGeneratorService, PasswordStrength } from '@/lib/services/password-service';
import { useToast } from '@/hooks/use-toast';
import { 
  Copy, RefreshCw, Shield, AlertTriangle, CheckCircle,
  Key, Hash, AtSign, Percent
} from 'lucide-react';

export const PasswordGenerator: React.FC = () => {
  const { toast } = useToast();
  
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [loading, setLoading] = useState(false);

  // Generator options
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);

  const generatePassword = async () => {
    try {
      setLoading(true);

      const password: string = await PasswordGeneratorService.generate({
        length,
        include_lowercase: includeLowercase,
        include_uppercase: includeUppercase,
        include_numbers: includeNumbers,
        include_symbols: includeSymbols,
        exclude_ambiguous: excludeAmbiguous
      });

      setGeneratedPassword(password);

      // Check strength
      const strengthResult = await PasswordGeneratorService.checkStrength(password);
      setStrength(strengthResult);

      toast({
        title: "Password Generated",
        description: `Crack time: ${strengthResult.estimated_crack_time}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedPassword) return;
    
    try {
      await navigator.clipboard.writeText(generatedPassword);
      toast({
        title: "Copied",
        description: "Password copied to clipboard",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive",
      });
    }
  };

  const getStrengthColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <Shield className="h-5 w-5 text-blue-600" />;
    if (score >= 40) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Generated Password Display */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Password</CardTitle>
          <CardDescription>
            Your secure password is ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={generatedPassword}
              readOnly
              placeholder="Click 'Generate' to create a password"
              className="font-mono text-lg"
            />
            <Button
              variant="outline"
              onClick={copyToClipboard}
              disabled={!generatedPassword}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              onClick={generatePassword}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Strength Indicator */}
          {strength && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStrengthIcon(strength.score * 25)}
                  <span className={`font-semibold ${getStrengthColor(strength.score * 25)}`}>
                    {strength.estimated_crack_time}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {strength.score * 25}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 progress-dynamic ${
                    strength.score >= 3 ? 'bg-green-600' :
                    strength.score >= 2 ? 'bg-blue-600' :
                    strength.score >= 1 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  ref={(el) => { if (el) el.style.width = `${strength.score * 25}%`; }}
                />
              </div>

              {/* Suggestions */}
              {strength.feedback.length > 0 && (
                <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">Suggestions:</p>
                  <ul className="text-xs text-yellow-600/80 dark:text-yellow-400/80 space-y-1">
                    {strength.feedback.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generator Options */}
      <Card>
        <CardHeader>
          <CardTitle>Password Options</CardTitle>
          <CardDescription>
            Customize your password requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Length Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Password Length</label>
              <span className="text-sm text-muted-foreground">{length} characters</span>
            </div>
            <Slider
              value={[length]}
              onValueChange={(value) => setLength(value[0])}
              min={8}
              max={64}
              step={1}
              className="w-full"
            />
          </div>

          {/* Character Type Toggles */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Character Types</label>
            
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                 onClick={() => setIncludeUppercase(!includeUppercase)}>
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm" id="uppercase-label">Uppercase Letters (A-Z)</span>
              </div>
              <input
                type="checkbox"
                checked={includeUppercase}
                onChange={(e) => setIncludeUppercase(e.target.checked)}
                className="h-4 w-4"
                aria-labelledby="uppercase-label"
                title="Include uppercase letters"
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                 onClick={() => setIncludeLowercase(!includeLowercase)}>
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm" id="lowercase-label">Lowercase Letters (a-z)</span>
              </div>
              <input
                type="checkbox"
                checked={includeLowercase}
                onChange={(e) => setIncludeLowercase(e.target.checked)}
                className="h-4 w-4"
                aria-labelledby="lowercase-label"
                title="Include lowercase letters"
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                 onClick={() => setIncludeNumbers(!includeNumbers)}>
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm" id="numbers-label">Numbers (0-9)</span>
              </div>
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="h-4 w-4"
                aria-labelledby="numbers-label"
                title="Include numbers"
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                 onClick={() => setIncludeSymbols(!includeSymbols)}>
              <div className="flex items-center gap-3">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm" id="symbols-label">Symbols (!@#$%^&*)</span>
              </div>
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="h-4 w-4"
                aria-labelledby="symbols-label"
                title="Include symbols"
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Advanced Options</label>
            
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                 onClick={() => setExcludeAmbiguous(!excludeAmbiguous)}>
              <div className="flex items-center gap-3">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm" id="ambiguous-label">Exclude Ambiguous Characters</div>
                  <div className="text-xs text-muted-foreground">
                    Avoids characters like 0, O, l, 1, I
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={excludeAmbiguous}
                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                className="h-4 w-4"
                aria-labelledby="ambiguous-label"
                title="Exclude ambiguous characters"
              />
            </div>
          </div>

          {/* Info Card */}
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p className="font-semibold mb-1">Security Tips:</p>
                  <ul className="space-y-1 text-xs opacity-90">
                    <li>• Use at least 12 characters for strong passwords</li>
                    <li>• Enable all character types for maximum security</li>
                    <li>• Never reuse passwords across different accounts</li>
                    <li>• Change passwords regularly (every 3-6 months)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
