'use client'

import { useEffect, useState } from 'react'

/**
 * Custom hook to handle hydration mismatches caused by browser extensions
 * Returns true only after the component has hydrated on the client side
 * 
 * This prevents hydration mismatches by ensuring that any dynamic content
 * that might be affected by browser extensions is only rendered after hydration
 */
export function useHydrationSafe() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Set to true after the component has mounted (hydrated)
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Hook specifically for handling browser extension attributes
 * Provides utilities for detecting and handling common browser extension modifications
 */
export function useBrowserExtensionSafe() {
  const [extensionsDetected, setExtensionsDetected] = useState<string[]>([])
  const isHydrated = useHydrationSafe()

  useEffect(() => {
    if (!isHydrated) return

    // List of known browser extension attributes
    const knownExtensionAttributes = [
      'data-new-gr-c-s-check-loaded', // Grammarly
      'data-gr-ext-installed',        // Grammarly
      'data-gr-c-s-loaded',          // Grammarly
      'data-lastpass-icon-root',      // LastPass
      'data-lastpass-root',           // LastPass
      'data-adblockkey',              // AdBlock
      'data-translated',              // Translation extensions
      'data-translate',               // Translation extensions
      'data-extension-id',            // Generic extension
      'data-ext-installed',           // Generic extension
    ]

    // Check for existing extension attributes
    const detectExtensions = () => {
      const detected: string[] = []
      const body = document.body

      knownExtensionAttributes.forEach(attr => {
        if (body.hasAttribute(attr)) {
          detected.push(attr)
        }
      })

      if (detected.length > 0) {
        setExtensionsDetected(detected)
        if (process.env.NODE_ENV === 'development') {
          console.log('[Hydration Safe] Browser extensions detected:', detected)
        }
      }
    }

    // Initial detection
    detectExtensions()

    // Set up mutation observer to detect when extensions modify the DOM
    const observer = new MutationObserver((mutations) => {
      let hasExtensionChanges = false

      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === document.body) {
          const attributeName = mutation.attributeName
          if (attributeName && knownExtensionAttributes.includes(attributeName)) {
            hasExtensionChanges = true
          }
        }
      })

      if (hasExtensionChanges) {
        detectExtensions()
      }
    })

    // Observe changes to the body element
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: knownExtensionAttributes,
      subtree: false
    })

    return () => {
      observer.disconnect()
    }
  }, [isHydrated])

  return {
    isHydrated,
    extensionsDetected,
    hasExtensions: extensionsDetected.length > 0
  }
}
