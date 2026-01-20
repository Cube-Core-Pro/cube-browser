/**
 * Audio Player Component - Audio playback with visualizer
 * CUBE Nexum Platform v2.0
 */

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AudioPlayer');

import React, { forwardRef, useEffect, useRef } from 'react';
import {
  MediaItem,
  PlaybackInfo,
  VisualizerSettings,
} from '../../types/media';
import './AudioPlayer.css';

interface AudioPlayerProps {
  item: MediaItem | null;
  playback: PlaybackInfo;
  visualizer: VisualizerSettings;
  showVisualizer: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onEnded: () => void;
  onError: (error: string) => void;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ item, playback, visualizer, showVisualizer, onTimeUpdate, onDurationChange, onEnded, onError }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
      if (ref && 'current' in ref && ref.current && showVisualizer) {
        setupVisualizer();
      }

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref, showVisualizer]);

    const setupVisualizer = () => {
      if (!ref || !('current' in ref) || !ref.current) return;

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;

          sourceRef.current = audioContextRef.current.createMediaElementSource(ref.current);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }

        if (visualizer.enabled) {
          drawVisualizer();
        }
      } catch (err) {
        log.error('Failed to setup visualizer:', err);
      }
    };

    const drawVisualizer = () => {
      if (!canvasRef.current || !analyserRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);

        analyserRef.current!.getByteFrequencyData(dataArray);

        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        switch (visualizer.type) {
          case 'bars':
            drawBars(ctx, dataArray, canvas.width, canvas.height);
            break;
          case 'wave':
            drawWave(ctx, dataArray, canvas.width, canvas.height);
            break;
          case 'circular':
            drawCircular(ctx, dataArray, canvas.width, canvas.height);
            break;
          default:
            drawBars(ctx, dataArray, canvas.width, canvas.height);
        }
      };

      draw();
    };

    const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      const barWidth = (width / dataArray.length) * 2.5;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height * visualizer.intensity;

        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, visualizer.colors[0] || '#a855f7');
        gradient.addColorStop(0.5, visualizer.colors[1] || '#ec4899');
        gradient.addColorStop(1, visualizer.colors[2] || '#3b82f6');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    const drawWave = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      ctx.lineWidth = 2;
      ctx.strokeStyle = visualizer.colors[0] || '#a855f7';
      ctx.beginPath();

      const sliceWidth = width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 255;
        const y = v * height * visualizer.intensity;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    const drawCircular = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 4;

      for (let i = 0; i < dataArray.length; i++) {
        const angle = (i / dataArray.length) * Math.PI * 2;
        const barHeight = (dataArray[i] / 255) * radius * visualizer.intensity;

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, visualizer.colors[0] || '#a855f7');
        gradient.addColorStop(1, visualizer.colors[1] || '#ec4899');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    return (
      <div className="audio-player">
        {item && item.thumbnail && (
          <div className="album-art">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.thumbnail} alt={item.title} />
          </div>
        )}

        {showVisualizer && visualizer.enabled && (
          <canvas
            ref={canvasRef}
            className="visualizer-canvas"
            width={800}
            height={400}
          />
        )}

        <audio
          ref={ref}
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onDurationChange={(e) => onDurationChange(e.currentTarget.duration)}
          onEnded={onEnded}
          onError={() => onError('Failed to load audio')}
        />

        {item && (
          <div className="track-info">
            <h2 className="track-title">{item.title}</h2>
            {item.artist && <p className="track-artist">{item.artist}</p>}
            {item.album && <p className="track-album">{item.album}</p>}
          </div>
        )}
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';
