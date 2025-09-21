import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Experimental features for better hydration handling
  experimental: {
    // Enable optimized hydration for better performance
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },

  // Compiler options
  compiler: {
    // Remove console logs in production but keep hydration warnings in development
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Custom webpack configuration to handle hydration issues
  webpack: (config, { dev, isServer }) => {
    // In development, add better error handling for hydration mismatches
    if (dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Ensure consistent React version across all components
        'react': require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
      };
    }

    return config;
  },

  // Headers to prevent browser extension interference
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent some browser extensions from modifying the page
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
