/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  turbopack: {},
  webpack: (config) => {
    // Optimize GLB/GLTF file loading
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: "asset/resource",
      generator: {
        filename: "static/models/[hash][ext][query]",
      },
    });
    return config;
  },
  // Enable compression for static assets
  compress: true,
  // Add headers for better caching of 3D models
  async headers() {
    return [
      {
        source: "/models/:path*",
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
