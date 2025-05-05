/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Desactivar la comprobación de ESLint durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desactivar la comprobación de TypeScript durante el build
    ignoreBuildErrors: true,
  },
  output: 'export', // Necesario para GitHub Pages
};

module.exports = nextConfig;