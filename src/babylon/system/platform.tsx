'use client';

/*
 * =================================================================
 * NJS React Framework Platform Services
 * =================================================================
 * Unified navigation hook for React Router
 * This is the default implementation for Next.js applications
 * =================================================================
 */

import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Type definitions for unified navigation
export type NavigationState = {
  fromApp?: boolean;
  rootPath?: string;
  sceneFile?: string;
  auxiliaryData?: string;
  [key: string]: any;
};

export type LocationState = {
  pathname: string;
  search: string;
  state?: NavigationState;
};

export type UnifiedNavigateFunction = (path: string, options?: { state?: NavigationState; replace?: boolean }) => void;

// Session storage key for navigation state
const NAV_STATE_KEY = 'state';

/**
 * Unified navigation hook for Next.js
 * Drop-in replacement for React Router navigation with state support
 */
export function useUnifiedNavigation(): {
  navigate: UnifiedNavigateFunction;
  location: LocationState;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate: UnifiedNavigateFunction = useCallback((path: string, options?: { state?: NavigationState; replace?: boolean }) => {
    let fullPath = path;
    if (options?.state) {
      const stateParam = encodeURIComponent(JSON.stringify(options.state));
      fullPath = `${path}?${NAV_STATE_KEY}=${stateParam}`;
    }

    // Navigate using Next.js router
    if (options?.replace) {
      router.replace(fullPath);
    } else {
      router.push(fullPath);
    }
  }, [router]);

  const location: LocationState = useMemo(() => {
    // Retrieve state from query params
    let state: NavigationState | undefined;
    const stateParam = searchParams?.get(NAV_STATE_KEY);
    if (stateParam) {
      try {
        state = JSON.parse(decodeURIComponent(stateParam));
      } catch (e) {
        console.warn('Failed to parse navigation state:', e);
      }
    }

    return {
      pathname: pathname || '/',
      search: searchParams?.toString() ? `?${searchParams.toString()}` : '',
      state
    };
  }, [pathname, searchParams]);

  return { navigate, location };
}

/**
 * Hook for Next.js - use this in Next.js apps
 * This is an alias for useUnifiedNavigation for explicit usage
 */
export function useNextNavigation() {
  return useUnifiedNavigation();
}
