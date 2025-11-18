/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'products': require('path').resolve(__dirname, 'products.js'),
    };
    return config;
  },
};

module.exports = nextConfig;
