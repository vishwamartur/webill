'use client'

import { useHydrationSafe, useBrowserExtensionSafe } from '@/hooks/use-hydration-safe'
import { HydrationSafeWrapper } from '@/components/layout/hydration-safe-wrapper'

/**
 * Test component to verify hydration fix is working
 * This component can be temporarily added to any page to test hydration behavior
 */
export function HydrationTest() {
  const isHydrated = useHydrationSafe()
  const { hasExtensions, extensionsDetected } = useBrowserExtensionSafe()

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 m-4">
      <h3 className="text-lg font-semibold mb-2">Hydration Test Component</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Hydration Status:</strong> 
          <span className={`ml-2 px-2 py-1 rounded ${isHydrated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {isHydrated ? 'Hydrated ✅' : 'Not Hydrated ⏳'}
          </span>
        </div>
        
        <div>
          <strong>Browser Extensions:</strong>
          <span className={`ml-2 px-2 py-1 rounded ${hasExtensions ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
            {hasExtensions ? `${extensionsDetected.length} detected` : 'None detected'}
          </span>
        </div>
        
        {hasExtensions && (
          <div className="mt-2">
            <strong>Detected Extensions:</strong>
            <ul className="list-disc list-inside ml-4 text-xs">
              {extensionsDetected.map((ext, index) => (
                <li key={index} className="text-gray-600">{ext}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <HydrationSafeWrapper 
        fallback={<div className="text-gray-500 text-sm mt-2">Loading hydration-safe content...</div>}
        className="mt-3 p-2 bg-white rounded border"
      >
        <div className="text-sm text-green-700">
          ✅ This content is rendered only after hydration is complete
        </div>
      </HydrationSafeWrapper>

      <div className="mt-3 text-xs text-gray-500">
        This test component can be removed in production
      </div>
    </div>
  )
}
