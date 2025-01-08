/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'pay.podcasts.geoffvrijmoet.com',
          },
        ],
        destination: '/pay',
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'pay.podcasts.geoffvrijmoet.com',
          },
        ],
        destination: '/pay/:path*',
      },
    ];
  },
};

export default nextConfig;
