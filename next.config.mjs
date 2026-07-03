/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore les erreurs ESLint pendant le déploiement
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore les erreurs de typage TypeScript pendant le déploiement
    ignoreBuildErrors: true,
  },
};

export default nextConfig;