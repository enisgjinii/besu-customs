/** @type {import('next').NextConfig} */
const modelUrlAliases = [
  { source: "/models/Backpack.glb", destination: "/models/backpack.glb" },
  {
    source: "/models/Baseball-Jersey.glb",
    destination: "/models/baseball-jersey.glb",
  },
  { source: "/models/Hoodie.glb", destination: "/models/hoodie.glb" },
  {
    source: "/models/baseball-caps_UV_FIX.glb",
    destination: "/models/baseball-caps.glb",
  },
  {
    source: "/models/baseball-caps-uv-fix.glb",
    destination: "/models/baseball-caps.glb",
  },
  {
    source: "/models/flag-football-top-with-hoodie_UV_MAP_v2.glb",
    destination: "/models/flag-football-top-with-hoodie-v2.glb",
  },
  {
    source: "/models/flag-football-top-with-hoodie-uv-map-v2.glb",
    destination: "/models/flag-football-top-with-hoodie-v2.glb",
  },
  {
    source: "/models/polo-shirts-long-sleeve_FIXED.glb",
    destination: "/models/polo-shirts-long-sleeve.glb",
  },
  {
    source: "/models/polo-shirts-long-sleeve-fixed.glb",
    destination: "/models/polo-shirts-long-sleeve.glb",
  },
  {
    source: "/models/polo-shirts-short-sleeve_FIXED.glb",
    destination: "/models/polo-shirts-short-sleeve.glb",
  },
  {
    source: "/models/polo-shirts-short-sleeve-fixed.glb",
    destination: "/models/polo-shirts-short-sleeve.glb",
  },
  {
    source: "/models/soccer-jersey-crew-neck_FIXED.glb",
    destination: "/models/soccer-jersey-crew-neck.glb",
  },
  {
    source: "/models/soccer-jersey-crew-neck-fixed.glb",
    destination: "/models/soccer-jersey-crew-neck.glb",
  },
  {
    source: "/models/soccer_jersey_v_neck_COMBINED_FIXED.glb",
    destination: "/models/soccer-jersey-v-neck.glb",
  },
  {
    source: "/models/soccer-jersey-v-neck-combined-fixed.glb",
    destination: "/models/soccer-jersey-v-neck.glb",
  },
  {
    source: "/models/track-and-field-top-crop-top_FIXED.glb",
    destination: "/models/track-and-field-top-crop-top.glb",
  },
  {
    source: "/models/track-and-field-top-crop-top-fixed.glb",
    destination: "/models/track-and-field-top-crop-top.glb",
  },
  {
    source: "/models/track-and-field-top-tank-top_FIXED.glb",
    destination: "/models/track-and-field-top-tank-top.glb",
  },
  {
    source: "/models/track-and-field-top-tank-top-fixed.glb",
    destination: "/models/track-and-field-top-tank-top.glb",
  },
  {
    source: "/models/volleyball-shorts-spandex_FIXED.glb",
    destination: "/models/volleyball-shorts-spandex.glb",
  },
  {
    source: "/models/volleyball-shorts-spandex-fixed.glb",
    destination: "/models/volleyball-shorts-spandex.glb",
  },
  {
    source: "/models/volleyball-shorts-spandex_v2_FIXED.glb",
    destination: "/models/volleyball-shorts-spandex-v2.glb",
  },
  {
    source: "/models/volleyball-shorts-spandex-v2-fixed.glb",
    destination: "/models/volleyball-shorts-spandex-v2.glb",
  },
];

const nextConfig = {
  reactStrictMode: false,
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },
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
  async rewrites() {
    return modelUrlAliases;
  },

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
