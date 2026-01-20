"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { voipService } from '../../../lib/services/voipService';
import {
  VoIPConfig,
  CallState,
  Contact,
  CallHistoryEntry,
  AudioDevice,
  CallSession,
  VoIPEvent,
  getDefaultVoIPConfig,
  CallType,
  CallDirection,
  CallQuality,
  EndReason
} from '../../../types/voip';
import { ContactList } from '../../../components/voip/ContactList';
import { CallControls } from '../../../components/voip/CallControls';
import { CallHistory } from '../../../components/voip/CallHistory';
import { AudioSettings } from '../../../components/voip/AudioSettings';
import { AppLayout } from '@/components/layout';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTranslation } from '@/hooks/useTranslation';
import './voip.css';

type ViewTab = 'contacts' | 'call' | 'history' | 'settings';

export default function VoIPPage() {
  const { t } = useTranslation();
  
  // State
  const [activeView, setActiveView] = useState<ViewTab>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
  const [callState, setCallState] = useState<CallState | null>(null);
  const [voipConfig, setVoipConfig] = useState<VoIPConfig>(getDefaultVoIPConfig());
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize VoIP service
  const initializeVoIP = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize VoIP service
      const result = await invoke<string>('voip_initialize', {
        config: voipConfig
      });

      log.debug('VoIP initialized:', result);
      setIsInitialized(true);

      // Load initial data
      await Promise.all([
        loadContacts(),
        loadCallHistory(),
        loadAudioDevices()
      ]);

    } catch (err) {
      log.error('Failed to initialize VoIP:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize VoIP service');
    } finally {
      setLoading(false);
    }
  }, [voipConfig]);

  // Load contacts
  const loadContacts = async () => {
    try {
      const serviceContacts = await voipService.getContacts();
      
      // Map service contacts to local Contact type
      const mappedContacts: Contact[] = serviceContacts.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatar: c.avatar,
        status: c.status,
        favorite: c.favorite,
        tags: c.tags
      }));
      
      setContacts(mappedContacts);
    } catch (err) {
      log.error('Failed to load contacts:', err);
      // Set empty array on error - no mock data
      setContacts([]);
    }
  };

  // Load call history
  const loadCallHistory = async () => {
    try {
      const serviceHistory = await voipService.getCallHistory(50);
      
      // Map service history to local CallHistoryEntry type
      const mappedHistory: CallHistoryEntry[] = serviceHistory.map(h => ({
        id: h.id,
        contact_id: h.contactId || '',  // Provide default empty string for undefined
        contact_name: h.contactName,
        type: h.isVideo ? 'video' : 'audio' as CallType,
        direction: (h.type === 'outgoing' ? 'outgoing' : 'incoming') as CallDirection,
        duration: h.duration,
        timestamp: new Date(h.startTime),
        quality: 'good' as CallQuality,
        has_video: h.isVideo,
        ended_reason: (h.status === 'completed' ? 'completed' : h.status === 'missed' ? 'missed' : 'declined') as EndReason
      }));
      
      setCallHistory(mappedHistory);
    } catch (err) {
      log.error('Failed to load call history:', err);
      // Set empty array on error - no mock data
      setCallHistory([]);
    }
  };

  // Load audio devices
  const loadAudioDevices = async () => {
    try {
      const serviceDevices = await voipService.getAudioDevices();
      
      // Map service devices to local AudioDevice type
      const mappedDevices: AudioDevice[] = serviceDevices.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        is_default: d.isDefault
      }));
      
      setAudioDevices(mappedDevices);
    } catch (err) {
      log.error('Failed to load audio devices:', err);
      // Set empty array on error - no mock data
      setAudioDevices([]);
    }
  };

  // Start call
  const handleStartCall = async (contact: Contact, withVideo: boolean) => {
    try {
      setError(null);

      // Create call session
      const session: CallSession = {
        id: Date.now().toString(),
        contact,
        type: withVideo ? 'video' : 'audio',
        direction: 'outgoing',
        start_time: new Date(),
        duration: 0,
        state: {
          is_active: true,
          is_muted: false,
          is_video_enabled: withVideo,
          connection_state: 'connecting',
          ice_connection_state: 'new',
          remote_peer_id: contact.id
        },
        statistics: null
      };

      setCurrentCall(session);
      setActiveView('call');

      // Create WebRTC offer
      const offer = await invoke<string>('voip_create_offer');
      log.debug('Created offer:', offer);

      // In real implementation, send offer to remote peer via signaling server
      // For now, simulate connection
      setTimeout(async () => {
        const state = await invoke<CallState>('voip_get_call_state');
        setCallState(state);
      }, 1000);

    } catch (err) {
      log.error('Failed to start call:', err);
      setError(err instanceof Error ? err.message : 'Failed to start call');
      setCurrentCall(null);
    }
  };

  // End call
  const handleEndCall = async () => {
    try {
      if (!currentCall) return;

      await invoke('voip_close');

      // Save to call history
      const historyEntry: CallHistoryEntry = {
        id: Date.now().toString(),
        contact_id: currentCall.contact.id,
        contact_name: currentCall.contact.name,
        type: currentCall.type,
        direction: currentCall.direction,
        duration: currentCall.duration,
        timestamp: currentCall.start_time,
        quality: 'good',
        has_video: currentCall.type === 'video',
        ended_reason: 'completed'
      };

      setCallHistory(prev => [historyEntry, ...prev]);
      setCurrentCall(null);
      setCallState(null);
      setActiveView('contacts');

    } catch (err) {
      log.error('Failed to end call:', err);
      setError(err instanceof Error ? err.message : 'Failed to end call');
    }
  };

  // Toggle mute
  const handleToggleMute = async () => {
    try {
      if (!callState) return;

      const newMutedState = !callState.is_muted;
      await invoke('voip_set_audio_muted', { muted: newMutedState });

      setCallState(prev => prev ? { ...prev, is_muted: newMutedState } : null);

      if (currentCall) {
        setCurrentCall(prev => prev ? {
          ...prev,
          state: { ...prev.state, is_muted: newMutedState }
        } : null);
      }

    } catch (err) {
      log.error('Failed to toggle mute:', err);
    }
  };

  // Toggle video
  const handleToggleVideo = async () => {
    try {
      if (!callState) return;

      const newVideoState = !callState.is_video_enabled;
      await invoke('voip_set_video_enabled', { enabled: newVideoState });

      setCallState(prev => prev ? { ...prev, is_video_enabled: newVideoState } : null);

      if (currentCall) {
        setCurrentCall(prev => prev ? {
          ...prev,
          state: { ...prev.state, is_video_enabled: newVideoState }
        } : null);
      }

    } catch (err) {
      log.error('Failed to toggle video:', err);
    }
  };

  // Update call duration
  useEffect(() => {
    if (!currentCall) return;

    const interval = setInterval(() => {
      setCurrentCall(prev => {
        if (!prev) return null;
        const duration = Math.floor((Date.now() - prev.start_time.getTime()) / 1000);
        return { ...prev, duration };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentCall]);

  // Update config
  const handleUpdateConfig = async (newConfig: Partial<VoIPConfig>) => {
    try {
      const updatedConfig = { ...voipConfig, ...newConfig };
      setVoipConfig(updatedConfig);

      // Reinitialize if needed
      if (isInitialized) {
        await invoke('voip_close');
        setIsInitialized(false);
        await initializeVoIP();
      }

    } catch (err) {
      log.error('Failed to update config:', err);
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    }
  };

  // Event listeners
  useEffect(() => {
    const unlistenPromises: Promise<() => void>[] = [];

    // Listen for VoIP events
    unlistenPromises.push(
      listen<VoIPEvent>('voip:event', (event) => {
        log.debug('VoIP event:', event.payload);
        const { type, data } = event.payload;

        switch (type) {
          case 'call:incoming':
            // Handle incoming call
            break;
          case 'call:answered':
            // Handle call answered
            break;
          case 'call:ended':
            handleEndCall();
            break;
          case 'connection:state_changed':
            if (data.state) {
              setCallState(prev => prev ? { ...prev, connection_state: data.state } : null);
            }
            break;
        }
      })
    );

    return () => {
      unlistenPromises.forEach(async (promise) => {
        const unlisten = await promise;
        unlisten();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeVoIP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <AppLayout tier="elite">
        <div className="voip-page">
          <LoadingState
            title={t('communications.voip.loading.service')}
            description={t('communications.voip.loading.description')}
          />
        </div>
      </AppLayout>
    );
  }

  if (error && !isInitialized) {
    return (
      <AppLayout tier="elite">
        <div className="voip-page">
          <ErrorState
            title={t('communications.voip.errors.title')}
            description={error}
            onRetry={initializeVoIP}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout tier="elite">
      <div className="voip-page">
      <header className="voip-header">
        <div className="header-content">
          <div className="header-title">
            <span className="title-icon">📞</span>
            <div>
              <h1>{t('communications.voip.title')}</h1>
              <p>{t('communications.voip.subtitle')}</p>
            </div>
          </div>
          <div className="header-actions">
            {isInitialized && (
              <span className="status-badge status-online">
                <span className="status-dot"></span>
                {t('common.connected')}
              </span>
            )}
          </div>
        </div>

        <div className="view-tabs">
          <button
            className={`tab ${activeView === 'contacts' ? 'active' : ''}`}
            onClick={() => setActiveView('contacts')}
          >
            <span className="tab-icon">👥</span>
            {t('communications.voip.tabs.contacts')}
          </button>
          <button
            className={`tab ${activeView === 'call' ? 'active' : ''}`}
            onClick={() => currentCall && setActiveView('call')}
            disabled={!currentCall}
          >
            <span className="tab-icon">📞</span>
            {currentCall ? t('communications.voip.tabs.activeCall') : t('communications.voip.tabs.call')}
          </button>
          <button
            className={`tab ${activeView === 'history' ? 'active' : ''}`}
            onClick={() => setActiveView('history')}
          >
            <span className="tab-icon">📋</span>
            {t('communications.voip.tabs.history')}
          </button>
          <button
            className={`tab ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <span className="tab-icon">⚙️</span>
            {t('communications.voip.tabs.settings')}
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button className="error-dismiss" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="voip-content">
        {activeView === 'contacts' && (
          <ContactList
            contacts={contacts}
            onCall={handleStartCall}
            onRefresh={loadContacts}
          />
        )}

        {activeView === 'call' && currentCall && (
          <CallControls
            session={currentCall}
            onEndCall={handleEndCall}
            onToggleMute={handleToggleMute}
            onToggleVideo={handleToggleVideo}
          />
        )}

        {activeView === 'history' && (
          <CallHistory
            history={callHistory}
            contacts={contacts}
            onCallBack={(contact) => handleStartCall(contact, false)}
            onRefresh={loadCallHistory}
          />
        )}

        {activeView === 'settings' && (
          <AudioSettings
            config={voipConfig}
            devices={audioDevices}
            onUpdateConfig={handleUpdateConfig}
            onRefreshDevices={loadAudioDevices}
          />
        )}
      </main>
    </div>
    </AppLayout>
  );
}
