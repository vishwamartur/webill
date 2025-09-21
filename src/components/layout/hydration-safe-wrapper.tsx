'use client'

import { useHydrationSafe } from '@/hooks/use-hydration-safe'

interface HydrationSafeWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

/**
 * A wrapper component that prevents hydration mismatches by only rendering
 * its children after the component has hydrated on the client side.
 * 
 * This is useful for components that might be affected by browser extensions
 * or other client-side modifications that happen after SSR.
 */
export function HydrationSafeWrapper({ 
  children, 
  fallback = null, 
  className 
}: HydrationSafeWrapperProps) {
  const isHydrated = useHydrationSafe()

  if (!isHydrated) {
    return fallback ? <div className={className}>{fallback}</div> : null
  }

  return <div className={className}>{children}</div>
}

/**
 * A more specific wrapper for content that should match between server and client
 * but might be affected by browser extensions
 */
export function ClientOnlyWrapper({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  const isHydrated = useHydrationSafe()

  if (!isHydrated) {
    return null
  }

  return <>{children}</>
}
