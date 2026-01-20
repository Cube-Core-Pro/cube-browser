/**
 * Web Speech API Type Declarations
 * 
 * These types extend the DOM types for the Web Speech API,
 * providing full support for SpeechRecognition and related interfaces.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
 */

// ============================================================================
// SpeechRecognition API Types
// ============================================================================

/**
 * The SpeechRecognitionResult interface represents a single recognition result.
 */
export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

/**
 * The SpeechRecognitionAlternative interface represents a single word or phrase.
 */
export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

/**
 * The SpeechRecognitionResultList interface represents a list of results.
 */
export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

/**
 * The SpeechRecognitionEvent interface represents the event from speech recognition.
 */
export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

/**
 * The SpeechRecognitionErrorEvent interface represents an error from speech recognition.
 */
export interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

/**
 * Possible error codes from speech recognition.
 */
export type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported";

/**
 * The SpeechGrammar interface represents a grammar for speech recognition.
 */
export interface SpeechGrammar {
  src: string;
  weight: number;
}

/**
 * The SpeechGrammarList interface represents a list of grammars.
 */
export interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
  [index: number]: SpeechGrammar;
}

/**
 * The SpeechRecognition interface provides the ability to recognize speech.
 */
export interface SpeechRecognition extends EventTarget {
  // Properties
  grammars: SpeechGrammarList;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI: string;

  // Methods
  start(): void;
  stop(): void;
  abort(): void;

  // Event handlers
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
}

/**
 * Constructor for SpeechRecognition.
 */
export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

// ============================================================================
// SpeechSynthesis API Types
// ============================================================================

/**
 * The SpeechSynthesisVoice interface represents a voice.
 */
export interface SpeechSynthesisVoice {
  readonly default: boolean;
  readonly lang: string;
  readonly localService: boolean;
  readonly name: string;
  readonly voiceURI: string;
}

/**
 * The SpeechSynthesisUtterance interface represents a speech request.
 */
export interface SpeechSynthesisUtterance extends EventTarget {
  lang: string;
  pitch: number;
  rate: number;
  text: string;
  voice: SpeechSynthesisVoice | null;
  volume: number;

  onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => void) | null;
  onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
  onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
  onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
}

/**
 * The SpeechSynthesisEvent interface represents events from speech synthesis.
 */
export interface SpeechSynthesisEvent extends Event {
  readonly charIndex: number;
  readonly charLength: number;
  readonly elapsedTime: number;
  readonly name: string;
  readonly utterance: SpeechSynthesisUtterance;
}

/**
 * The SpeechSynthesisErrorEvent interface represents an error.
 */
export interface SpeechSynthesisErrorEvent extends SpeechSynthesisEvent {
  readonly error: SpeechSynthesisErrorCode;
}

/**
 * Possible error codes from speech synthesis.
 */
export type SpeechSynthesisErrorCode =
  | "canceled"
  | "interrupted"
  | "audio-busy"
  | "audio-hardware"
  | "network"
  | "synthesis-unavailable"
  | "synthesis-failed"
  | "language-unavailable"
  | "voice-unavailable"
  | "text-too-long"
  | "invalid-argument"
  | "not-allowed";

// ============================================================================
// Global Window Extensions
// ============================================================================

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechGrammarList?: new () => SpeechGrammarList;
    webkitSpeechGrammarList?: new () => SpeechGrammarList;
  }

  // Make SpeechRecognition available as a global type
  var SpeechRecognition: SpeechRecognitionConstructor | undefined;
  var webkitSpeechRecognition: SpeechRecognitionConstructor | undefined;
}

// ============================================================================
// Type Aliases for Convenience
// ============================================================================

/**
 * Type alias for SpeechRecognition API that works with both standard and webkit prefixed versions.
 */
export type SpeechRecognitionAPI = SpeechRecognition;

/**
 * Helper type for getting the SpeechRecognition constructor.
 */
export type SpeechRecognitionCtor = SpeechRecognitionConstructor;

// ============================================================================
// Utility Functions Type Guards
// ============================================================================

/**
 * Check if SpeechRecognition is supported in the current environment.
 */
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && 
    (typeof window.SpeechRecognition !== 'undefined' || 
     typeof window.webkitSpeechRecognition !== 'undefined');
}

/**
 * Get the SpeechRecognition constructor for the current environment.
 */
export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Create a new SpeechRecognition instance.
 */
export function createSpeechRecognition(): SpeechRecognition | null {
  const Constructor = getSpeechRecognitionConstructor();
  return Constructor ? new Constructor() : null;
}
