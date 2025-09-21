'use client'

import { useEffect } from 'react'
import { useBrowserExtensionSafe } from '@/hooks/use-hydration-safe'

/**
 * Component that handles browser extension compatibility issues
 * Specifically addresses hydration mismatches caused by extensions
 * that modify the DOM after SSR but before React hydration
 */
export function BrowserExtensionHandler() {
  const { isHydrated, extensionsDetected, hasExtensions } = useBrowserExtensionSafe()

  useEffect(() => {
    if (!isHydrated) return

    // Handle post-hydration extension detection
    if (hasExtensions && process.env.NODE_ENV === 'development') {
      console.log('[Browser Extension Handler] Extensions detected after hydration:', extensionsDetected)

      // Provide helpful development information
      console.log('[Browser Extension Handler] If you see hydration warnings, they may be caused by these browser extensions.')
      console.log('[Browser Extension Handler] This is normal and should not affect production builds.')
    }

    // Set up a global flag to indicate that hydration is complete
    // This can be used by other parts of the application
    if (typeof window !== 'undefined') {
      (window as any).__WEBILL_HYDRATED__ = true
    }

    // Dispatch a custom event to notify other components that hydration is complete
    const hydrationCompleteEvent = new CustomEvent('webill:hydration-complete', {
      detail: {
        extensionsDetected,
        hasExtensions
      }
    })

    window.dispatchEvent(hydrationCompleteEvent)

  }, [isHydrated, hasExtensions, extensionsDetected])

  // This component doesn't render anything visible
  return null
}
