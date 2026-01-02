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
    ];
  },
};

export default nextConfig;
