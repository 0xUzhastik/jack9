/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['solana.com', 'www.mysmiley.net']
  },
  // Webpack config - only used when not using Turbopack
  webpack: (config, { isServer }) => {
    // Fix for crypto and buffer polyfills
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        process: require.resolve('process/browser'),
        zlib: require.resolve('browserify-zlib'),
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          solana: {
            test: /[\\/]node_modules[\\/]@solana[\\/]/,
            name: 'solana',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };

    return config;
  },
  transpilePackages: ['@solana/web3.js', '@solana/spl-token'],
};

module.exports = nextConfig;