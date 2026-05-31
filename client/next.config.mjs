// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   eslint: {
//     // Disable ESLint during builds for easier Vercel deployment
//     ignoreDuringBuilds: true,
//   },
//   typescript: {
//     // Disable TypeScript errors during builds
//     ignoreBuildErrors: true,
//   },
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'ik.imagekit.io',
//         pathname: '/**',
//       },
//     ],
//   },
// };

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },

      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
      },
    ],
  },
};

export default nextConfig;
