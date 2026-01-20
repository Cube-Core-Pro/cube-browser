/**
 * Chat Tour Steps
 * CUBE Elite v7.0.0 - Team Chat & Messaging
 * 
 * Comprehensive guided tour for chat features
 * Standards: Fortune 500, Zero Omissions, Elite Quality
 */

import type { TourStep } from '../../tour/types';

/**
 * Complete tour steps for Chat module
 * Covers: Rooms, Messages, Typing, AI Chat
 */
export const chatTourSteps: TourStep[] = [
  // ============================================================================
  // SECTION 1: Welcome & Overview
  // ============================================================================
  {
    id: 'chat-welcome',
    target: '[data-tour="chat-module"]',
    title: '💬 Team Chat',
    content: `Welcome to CUBE Chat!

**Key Features:**
• Real-time messaging
• Chat rooms
• Typing indicators
• AI assistant integration
• Message history

Collaborate with your team.`,
    placement: 'center',
    position: 'center',
    category: 'welcome',
    isRequired: true,
    showProgress: true
  },

  // ============================================================================
  // SECTION 2: Chat Rooms
  // ============================================================================
  {
    id: 'chat-rooms',
    target: '[data-tour="chat-rooms"]',
    title: '🏠 Chat Rooms',
    content: `Organize conversations:

**Room Types:**
• Team channels
• Project rooms
• Direct messages
• AI assistant

Click room to enter.`,
    placement: 'right',
    position: 'right',
    category: 'rooms',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'chat-create-room',
    target: '[data-tour="create-room"]',
    title: '➕ Create Room',
    content: `Start new conversation:

**Room Settings:**
• Room name
• Description
• Privacy (public/private)
• Members

Create focused spaces.`,
    placement: 'bottom',
    position: 'bottom',
    category: 'rooms',
    showProgress: true,
    highlightClicks: true
  },

  // ============================================================================
  // SECTION 3: Messages
  // ============================================================================
  {
    id: 'chat-messages',
    target: '[data-tour="message-list"]',
    title: '📝 Messages',
    content: `View conversation:

**Message Display:**
• Sender name
• Timestamp
• Message content
• Read status

Auto-scrolls to newest.`,
    placement: 'left',
    position: 'left',
    category: 'messages',
    isRequired: true,
    showProgress: true
  },
  {
    id: 'chat-send',
    target: '[data-tour="message-input"]',
    title: '✉️ Send Message',
    content: `Compose messages:

**How to Send:**
• Type message
• Press Enter or click Send

**Features:**
• Typing indicator shown
• Real-time delivery

Keep conversations flowing!`,
    placement: 'top',
    position: 'top',
    category: 'messages',
    showProgress: true
  },
  {
    id: 'chat-typing',
    target: '[data-tour="typing-indicator"]',
    title: '⌨️ Typing Indicator',
    content: `See who's typing:

**Shows When:**
• Someone is composing
• Updates in real-time

**Visual:**
"User is typing..."

Know when to wait for response.`,
    placement: 'top',
    position: 'top',
    category: 'messages',
    showProgress: true
  },

  // ============================================================================
  // SECTION 4: AI Chat
  // ============================================================================
  {
    id: 'chat-ai',
    target: '[data-tour="ai-chat"]',
    title: '🤖 AI Assistant',
    content: `Chat with AI:

**AI Capabilities:**
• Answer questions
• Generate content
• Help with code
• Explain concepts

Your AI-powered helper.`,
    placement: 'right',
    position: 'right',
    category: 'ai',
    showProgress: true
  },
  {
    id: 'chat-ai-copilot',
    target: '[data-tour="ai-copilot"]',
    title: '✨ AI Copilot',
    content: `Floating AI assistant:

**Access Anywhere:**
• Click floating button
• Ask anything
• Get instant help

**Use Cases:**
• Quick questions
• Workflow help
• Troubleshooting`,
    placement: 'left',
    position: 'left',
    category: 'ai',
    showProgress: true
  },

  // ============================================================================
  // SECTION 5: Tour Completion
  // ============================================================================
  {
    id: 'chat-complete',
    target: '[data-tour="chat-module"]',
    title: '✅ Chat Tour Complete!',
    content: `You've mastered CUBE Chat!

**Topics Covered:**
✓ Chat rooms
✓ Sending messages
✓ Typing indicators
✓ AI assistant

**Pro Tips:**
• Create rooms for projects
• Use AI for quick help
• Check typing indicators
• Keep messages concise

**Quick Reference:**
• Send: Enter key
• New room: + button
• AI help: Floating button

Start chatting!`,
    placement: 'center',
    position: 'center',
    category: 'complete',
    isRequired: true,
    showProgress: true
  }
];

/**
 * Tour sections for Chat
 */
export const chatTourSections = [
  { id: 'welcome', title: 'Welcome', icon: '💬' },
  { id: 'rooms', title: 'Rooms', icon: '🏠' },
  { id: 'messages', title: 'Messages', icon: '📝' },
  { id: 'ai', title: 'AI Assistant', icon: '🤖' },
  { id: 'complete', title: 'Complete', icon: '✅' }
];

/**
 * Get steps by section
 */
export const getChatStepsBySection = (sectionId: string): TourStep[] => {
  return chatTourSteps.filter(step => step.category === sectionId);
};

/**
 * Get required steps only
 */
export const getChatRequiredSteps = (): TourStep[] => {
  return chatTourSteps.filter(step => step.isRequired);
};

/**
 * Tour configuration
 */
export const chatTourConfig = {
  id: 'chat-tour',
  name: 'Chat Tour',
  description: 'Team messaging and AI assistant',
  version: '1.0.0',
  totalSteps: chatTourSteps.length,
  estimatedTime: '3 minutes',
  sections: chatTourSections,
  features: [
    'Real-time messaging',
    'Chat rooms',
    'Typing indicators',
    'AI assistant',
    'Message history'
  ]
};

export default chatTourSteps;
