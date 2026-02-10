/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: "standalone",
  images: {
    unoptimized: true,
  },
  turbopack: {},
  // Exclude large client-only packages from server bundles
  serverExternalPackages: [
    "@imgly/background-removal",
    "onnxruntime-web",
  ],
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@swc/core-linux-x64-gnu",
      "node_modules/@swc/core-linux-x64-musl",
      "node_modules/@esbuild/linux-x64",
      "node_modules/@imgly/**",
      "node_modules/onnxruntime-web/**",
    ],
  },
  // Experimental performance options
  experimental: {
    // Optimize package imports to reduce bundle size by tree-shaking barrel files
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "recharts",
      "date-fns",
      "three",
      "@react-three/drei",
    ],
  },
  webpack: (config, { isServer }) => {
    // Optimize GLB/GLTF file loading
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: "asset/resource",
      generator: {
        filename: "static/models/[hash][ext][query]",
      },
    });

    // Exclude Three.js and heavy client-only packages from server bundle
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "three",
        "@imgly/background-removal",
        "onnxruntime-web",
      ];
    }

    // Optimize client bundle splitting for better caching
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        // Enable module concatenation for smaller bundles
        concatenateModules: true,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            // Separate Three.js into its own chunk (large, rarely changes)
            three: {
              test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
              name: 'three-vendor',
              chunks: 'all',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Separate UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|framer-motion)[\\/]/,
              name: 'ui-vendor',
              chunks: 'all',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Separate Supabase & data libraries (auth, API calls)
            data: {
              test: /[\\/]node_modules[\\/](@supabase|@tanstack)[\\/]/,
              name: 'data-vendor',
              chunks: 'all',
              priority: 12,
              reuseExistingChunk: true,
            },
            // Common vendor chunk for remaining node_modules
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 5,
              minSize: 20000,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },
  // Enable compression for static assets
  compress: true,

  // Add headers for better caching and compression
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/:path*.(jpg|jpeg|png|webp|svg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache JS/CSS chunks (hashed filenames) for long-term caching
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache font files
      {
        source: "/:path*.(woff|woff2|ttf|otf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache GLB/GLTF 3D model files
      {
        source: "/:path*.(glb|gltf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
