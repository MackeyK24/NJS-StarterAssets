'use client';

/*
 * =================================================================
 * ES6 React Framework Platform Services
 * =================================================================
 * Cross-platform navigation via React Context injection (A2).
 *
 * The babylon/ folder is router-agnostic. Host apps provide an
 * adapter that wraps their router's hooks and supplies the value
 * to <NavigationProvider>. Works with react-router-dom,
 * @tanstack/react-router, next/navigation, etc.
 * =================================================================
 */

import { createContext, createElement, useContext, ReactNode } from "react";

// Type definitions for unified navigation
export type NavigationState = {
  fromApp?: boolean;
  gameMode?: string;
  rootPath?: string;
  sceneFile?: string;
  assetFiles?: string[];
  importMeshes?: string[];
  auxiliaryData?: string;
  hideSplashScreen?: boolean;
  [key: string]: any;
};

export type LocationState = {
  pathname: string;
  search: string;
  state?: NavigationState;
};

export type UnifiedNavigateFunction = (path: string, options?: { state?: NavigationState; replace?: boolean }) => void;

export type UnifiedNavigation = {
  navigate: UnifiedNavigateFunction;
  location: LocationState;
};

const NavigationContext = createContext<UnifiedNavigation | null>(null);

/**
 * Host apps wrap their tree with <NavigationProvider value={...}>.
 * The value is supplied by a tiny per-host adapter that bridges the
 * host router (react-router-dom, @tanstack/react-router, next, ...)
 * to the UnifiedNavigation shape.
 */
export function NavigationProvider({ value, children }: { value: UnifiedNavigation; children?: ReactNode }) {
  return createElement(NavigationContext.Provider, { value }, children);
}

/**
 * Consumer hook used everywhere inside babylon/.
 * Throws if no <NavigationProvider> is mounted above.
 */
export function useUnifiedNavigation(): UnifiedNavigation {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error(
      "useUnifiedNavigation: missing <NavigationProvider>. " +
      "Wrap your app with a host-specific navigation adapter."
    );
  }
  return ctx;
}