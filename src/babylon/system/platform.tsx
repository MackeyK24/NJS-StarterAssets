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
const NAV_STATE_KEY = 'njs_navigation_state';

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
    // Store state in session storage if provided (client-side only)
    if (typeof window !== 'undefined') {
      if (options?.state) {
        try {
          sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify(options.state));
        } catch (e) {
          console.warn('Failed to store navigation state:', e);
        }
      } else {
        // Clear state if no state is provided
        try {
          sessionStorage.removeItem(NAV_STATE_KEY);
        } catch (e) {
          console.warn('Failed to clear navigation state:', e);
        }
      }
    }

    // Navigate using Next.js router without state in URL
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [router]);

  const location: LocationState = useMemo(() => {
    // Retrieve state from session storage (client-side only)
    let state: NavigationState | undefined;
    if (typeof window !== 'undefined') {
      try {
        const storedState = sessionStorage.getItem(NAV_STATE_KEY);
        if (storedState) {
          state = JSON.parse(storedState);
        }
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
