'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  isDesktop, 
  isWeb, 
  DESKTOP_ONLY_ROUTES, 
  WEB_ONLY_ROUTES,
  getRedirectPath 
} from '@/lib/utils/environment';

interface RouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * RouteGuard Component
 * 
 * Protects routes based on environment:
 * - Desktop-only routes redirect to landing in web
 * - Web-only routes redirect to home in desktop
 * 
 * Usage:
 * Wrap your app layout with this component
 */
export function RouteGuard({ children, fallback }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(true);

  useEffect(() => {
    const checkRoute = () => {
      const redirectPath = getRedirectPath(pathname);
      
      if (redirectPath) {
        // Route not allowed in current environment
        setIsAllowed(false);
        router.replace(redirectPath);
      } else {
        setIsAllowed(true);
      }
      
      setIsChecking(false);
    };

    // Small delay to ensure environment detection is accurate
    const timer = setTimeout(checkRoute, 50);
    return () => clearTimeout(timer);
  }, [pathname, router]);

  // Show fallback while checking
  if (isChecking) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render if redirecting
  if (!isAllowed) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Hook to check if current route is available
 */
export function useRouteAvailability() {
  const pathname = usePathname();
  const [availability, setAvailability] = useState({
    isAvailable: true,
    isDesktopOnly: false,
    isWebOnly: false,
    redirectPath: null as string | null,
  });

  useEffect(() => {
    const checkDesktopOnly = DESKTOP_ONLY_ROUTES.some(route => 
      pathname.startsWith(route)
    );
    const checkWebOnly = WEB_ONLY_ROUTES.some(route => 
      pathname.startsWith(route)
    );
    
    const inDesktop = isDesktop();
    const inWeb = isWeb();
    
    let isAvailable = true;
    let redirectPath: string | null = null;
    
    if (checkDesktopOnly && inWeb) {
      isAvailable = false;
      redirectPath = '/landing';
    } else if (checkWebOnly && inDesktop) {
      isAvailable = false;
      redirectPath = '/';
    }
    
    setAvailability({
      isAvailable,
      isDesktopOnly: checkDesktopOnly,
      isWebOnly: checkWebOnly,
      redirectPath,
    });
  }, [pathname]);

  return availability;
}

/**
 * Component to show content only in Tauri desktop
 */
export function DesktopOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    setShow(isDesktop());
  }, []);
  
  return show ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component to show content only in web browser
 */
export function WebOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    setShow(isWeb());
  }, []);
  
  return show ? <>{children}</> : <>{fallback}</>;
}

/**
 * Desktop-only route wrapper
 * Shows "not available" message in web
 */
export function DesktopOnlyRoute({ 
  children,
  redirectTo = '/landing',
}: { 
  children: ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (isDesktop()) {
      setIsAllowed(true);
    } else {
      setIsAllowed(false);
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);
  
  if (isAllowed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <h1 className="text-2xl font-bold">Desktop App Required</h1>
        <p className="text-muted-foreground">
          This feature is only available in the CUBE Nexum desktop application.
        </p>
        <a 
          href="/landing" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Download Desktop App
        </a>
      </div>
    );
  }
  
  return <>{children}</>;
}

/**
 * Web-only route wrapper
 * Shows "not available" message in desktop
 */
export function WebOnlyRoute({ 
  children,
  redirectTo = '/',
}: { 
  children: ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (isWeb()) {
      setIsAllowed(true);
    } else {
      setIsAllowed(false);
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);
  
  if (isAllowed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAllowed) {
    return null; // Will redirect
  }
  
  return <>{children}</>;
}
