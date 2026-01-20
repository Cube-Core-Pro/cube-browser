import { Metadata } from 'next';
import { AppLayout } from '@/components/layout';
import SocialCommandCenter from '@/components/social/SocialCommandCenter';

export const metadata: Metadata = {
  title: 'Social Command Center - CUBE Elite',
  description: 'AI-powered social media management, content creation, and viral growth platform. Control all your social networks from one place.',
  keywords: ['social media management', 'content creation', 'viral marketing', 'AI content', 'shorts', 'reels', 'tiktok'],
};

export default function SocialPage() {
  return (
    <AppLayout>
      <SocialCommandCenter />
    </AppLayout>
  );
}
