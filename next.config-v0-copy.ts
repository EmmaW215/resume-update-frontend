const nextConfig: import('next').NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-backend.com'], // add domains if using <Image> with external sources
  },
  experimental: {
    serverActions: true, // optional depending on your Next.js version
  },
  output: 'standalone', // useful for serverless/Vercel deployments
};

export default nextConfig;
